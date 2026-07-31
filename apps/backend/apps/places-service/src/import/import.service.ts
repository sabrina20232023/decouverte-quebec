import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
    GeoapifyFeature,
    GeoapifyService,
} from '../geoapify/geoapify.service';
import {
    RegionImportConfig,
    listerRegionsActives,
    trouverConfigRegion,
} from './regions-import.config';

/**
 * Résumé d'un import pour une région donnée.
 */
export interface BilanImportRegion {
    provinceSlug: string;
    regionSlug: string;
    total: number;
    crees: number;
    misAJour: number;
    ignores: number;
    erreurs: Array<{ placeId?: string; nom?: string; message: string }>;
}

/*
 * ------------------------------------------------------------------
 * ASSOMPTIONS PAR DÉFAUT (à ajuster selon les résultats réels de Geoapify) :
 *
 * 1. Mapping catégorie Geoapify -> catégorie interne : basé sur des
 *    mots-clés recherchés dans le tableau `properties.categories`.
 *    Ordre de priorité : parc national > chute/cascade > point de vue
 *    > musée > site historique > (repli) quartier touristique.
 *
 * 2. Activités : heuristique simple par mots-clés. `photographie` est
 *    toujours ajoutée par défaut (activité universelle pour un lieu
 *    touristique), le reste dépend des catégories retournées.
 *
 * Les deux sont isolées dans des fonctions dédiées ci-dessous pour
 * être faciles à corriger sans toucher au reste du service.
 * ------------------------------------------------------------------
 */

const MAPPING_CATEGORIE: Array<{ motsCles: string[]; slug: string }> = [
    { motsCles: ['national_park', 'protected_area'], slug: 'parc-national' },
    { motsCles: ['waterfall'], slug: 'chute-cascade' },
    { motsCles: ['viewpoint'], slug: 'point-de-vue' },
    { motsCles: ['museum'], slug: 'musee' },
    { motsCles: ['beach'], slug: 'plage' },
    { motsCles: ['zoo'], slug: 'zoo' },
    { motsCles: ['aquarium'], slug: 'aquarium' },
    { motsCles: ['botanical_garden'], slug: 'jardin-botanique' },
    { motsCles: ['ski'], slug: 'station-de-ski' },
    { motsCles: ['lighthouse'], slug: 'phare' },
    {
        motsCles: ['heritage', 'historic', 'memorial', 'monument', 'castle'],
        slug: 'site-historique',
    },
];

const CATEGORIE_PAR_DEFAUT = 'quartier-touristique';

/*
 * ------------------------------------------------------------------
 * FILTRE DE PERTINENCE TOURISTIQUE (étape 2)
 *
 * Même en restreignant la recherche Geoapify aux groupes
 * tourism/entertainment/natural/heritage, certains résultats
 * n'ont aucun intérêt touristique réel (parking, banque, station-
 * service, pharmacie...). Ce filtre les écarte avant même la
 * catégorisation interne.
 *
 * Priorité : une correspondance d'INCLUSION l'emporte toujours sur
 * une correspondance d'EXCLUSION, pour éviter qu'un sous-mot ambigu
 * (ex. "office" dans "tourism.information.office", un centre
 * d'accueil touristique légitime) ne fasse rejeter un lieu pertinent
 * à cause du mot-clé d'exclusion "office" (bureaux/professions).
 *
 * Liste volontairement conservatrice pour un premier passage :
 * un lieu qui ne correspond à AUCUN mot-clé (ni inclusion, ni
 * exclusion) est ignoré par défaut, plutôt qu'importé "au cas où".
 * À élargir selon ce que les imports réels remontent comme faux
 * négatifs.
 * ------------------------------------------------------------------
 */

const MOTS_CLES_INCLUSION_TOURISTIQUE: string[] = [
    'park',
    'waterfall',
    'museum',
    'castle',
    'beach',
    'viewpoint',
    'attraction',
    'monument',
    'heritage',
    'information',
    'visitor',
    'natural',
    'national_park',
    'protected_area',
    'camp_site',
    'zoo',
    'aquarium',
    'botanical_garden',
    'theme_park',
    'ski',
    'marina',
    'lighthouse',
    'bridge',
    'cave',
];

const MOTS_CLES_EXCLUSION_TOURISTIQUE: string[] = [
    'parking',
    'bank',
    'atm',
    'fuel',
    'hospital',
    'pharmacy',
    'school',
    'dentist',
    'lawyer',
    'office',
    'supermarket',
];

const MAPPING_ACTIVITE: Array<{ motsCles: string[]; slug: string }> = [
    { motsCles: ['forest', 'wood', 'hiking'], slug: 'randonnee' },
    { motsCles: ['water', 'lake', 'river'], slug: 'kayak' },
    { motsCles: ['park', 'picnic'], slug: 'pique-nique' },
    { motsCles: ['wildlife', 'zoo', 'aquarium'], slug: 'observation-faune' },
    { motsCles: ['bicycle', 'cycling'], slug: 'cyclisme' },
    { motsCles: ['beach'], slug: 'baignade' },
    { motsCles: ['ski'], slug: 'ski' },
    { motsCles: ['camp_site'], slug: 'camping' },
    { motsCles: ['marina'], slug: 'bateau' },
    { motsCles: ['waterfall'], slug: 'photographie' },
    { motsCles: ['whale'], slug: 'observation-baleines' },
    { motsCles: ['climbing'], slug: 'escalade' },
    { motsCles: ['snowshoe'], slug: 'raquette' },
    { motsCles: ['canoe'], slug: 'canot' },
    { motsCles: ['surf'], slug: 'surf' },
    { motsCles: ['fishing'], slug: 'peche' },
    { motsCles: ['cave', 'speleology'], slug: 'speleologie' },
];

const ACTIVITE_PAR_DEFAUT = 'photographie';

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geoapifyService: GeoapifyService,
        private readonly httpService: HttpService,
    ) { }

    /**
     * Importe une région précise identifiée par sa configuration
     * dans REGIONS_A_IMPORTER.
     */
    async importerRegion(
        provinceSlug: string,
        regionSlug: string,
    ): Promise<BilanImportRegion> {
        const config = trouverConfigRegion(provinceSlug, regionSlug);

        if (!config) {
            throw new Error(
                `Aucune configuration d'import trouvée pour ${provinceSlug}/${regionSlug}.`,
            );
        }

        return this.executerImportRegion(config);
    }

    /**
     * Importe toutes les régions actives (estActive: true) une à une.
     */
    async importerRegionsActives(): Promise<BilanImportRegion[]> {
        const bilans: BilanImportRegion[] = [];

        for (const config of listerRegionsActives()) {
            const bilan = await this.executerImportRegion(config);
            bilans.push(bilan);
        }

        return bilans;
    }

    /**
     * Déroule l'import complet pour une configuration de région donnée.
     */
    private async executerImportRegion(
        config: RegionImportConfig,
    ): Promise<BilanImportRegion> {
        const bilan: BilanImportRegion = {
            provinceSlug: config.provinceSlug,
            regionSlug: config.regionSlug,
            total: 0,
            crees: 0,
            misAJour: 0,
            ignores: 0,
            erreurs: [],
        };

        // 2. Vérifier que la province existe en base
        const province = await this.prisma.province.findUnique({
            where: { code: config.provinceCode },
        });

        if (!province) {
            bilan.erreurs.push({
                message: `Province introuvable pour le code "${config.provinceCode}".`,
            });
            return bilan;
        }

        // 3. Vérifier que la région existe dans cette province
        const region = await this.prisma.region.findUnique({
            where: {
                provinceId_slug: {
                    provinceId: province.id,
                    slug: config.regionSlug,
                },
            },
        });

        if (!region) {
            bilan.erreurs.push({
                message: `Région introuvable pour "${config.provinceSlug}/${config.regionSlug}".`,
            });
            return bilan;
        }

        // 4. Appeler Geoapify (avec pagination pour dépasser la limite
        // de 100 résultats par appel imposée par l'API)
        let features: GeoapifyFeature[];

        try {
            features = await this.geoapifyService.rechercherLieuxProchesPagine(
                {
                    latitude: config.latitude,
                    longitude: config.longitude,
                    rayon: config.rayonMetres,
                    categories: config.categories,
                    langue: 'fr',
                    seulementCanada: true,
                    countryCode: config.provinceCode ? 'ca' : undefined,
                    provinceCode: config.provinceCode,
                },
                config.limiteImport,
            );
        } catch (error: unknown) {
            bilan.erreurs.push({
                message: `Échec de l'appel Geoapify : ${error instanceof Error ? error.message : String(error)
                    }`,
            });
            return bilan;
        }

        bilan.total = features.length;

        for (const feature of features) {
            try {
                const resultat = await this.importerUnLieu(
                    feature,
                    region.id,
                );

                if (resultat === 'ignore') {
                    bilan.ignores += 1;
                } else if (resultat === 'cree') {
                    bilan.crees += 1;
                } else {
                    bilan.misAJour += 1;
                }
            } catch (error: unknown) {
                bilan.erreurs.push({
                    placeId: feature.properties?.place_id,
                    nom: feature.properties?.name,
                    message:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }

        const conserves = bilan.crees + bilan.misAJour;
        const rejetes = bilan.ignores + bilan.erreurs.length;

        this.logger.log(
            `\nImport ${config.regionNom}\n` +
            `${bilan.total} reçus\n` +
            `${conserves} conservés (${bilan.crees} créés, ${bilan.misAJour} mis à jour)\n` +
            `${rejetes} rejetés (${bilan.ignores} filtrés/invalides, ${bilan.erreurs.length} erreurs)`,
        );

        return bilan;
    }

    /**
     * 5-9. Transforme et enregistre un seul résultat Geoapify.
     */
    private async importerUnLieu(
        feature: GeoapifyFeature,
        regionId: number,
    ): Promise<'cree' | 'mis_a_jour' | 'ignore'> {
        const properties = feature.properties;

        // 5. Ignorer les résultats sans nom ou sans identifiant
        // (GeoapifyService.estLieuValide filtre déjà la plupart des cas,
        // ce contrôle reste une sécurité supplémentaire ici)
        const nom = properties.name?.trim();
        const placeId = properties.place_id?.trim();

        if (!nom || !placeId) {
            return 'ignore';
        }

        // 5b. Ignorer les lieux qui ne sont pas pertinents pour un
        // usage touristique (parking, banque, pharmacie, etc.)
        if (!this.estLieuTouristique(properties.categories ?? [])) {
            return 'ignore';
        }

        const latitude = Number(
            properties.lat ?? feature.geometry?.coordinates?.[1],
        );
        const longitude = Number(
            properties.lon ?? feature.geometry?.coordinates?.[0],
        );

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return 'ignore';
        }

        // 7. Trouver la catégorie interne correspondante
        const categorySlug = this.determinerCategorieSlug(
            properties.categories ?? [],
        );

        const category = await this.prisma.category.findUnique({
            where: { slug: categorySlug },
        });

        if (!category) {
            throw new Error(
                `Catégorie interne "${categorySlug}" introuvable en base (le seed doit la créer).`,
            );
        }

        // 8. Créer ou mettre à jour le lieu (déduplication via
        // sourceExterne + sourceExterneId, prévus dans le schéma)
        const lieuExistant = await this.prisma.place.findUnique({
            where: {
                sourceExterne_sourceExterneId: {
                    sourceExterne: 'geoapify',
                    sourceExterneId: placeId,
                },
            },
        });

        const slug = lieuExistant
            ? lieuExistant.slug
            : await this.genererSlugUnique(nom);

        const donneesLieu = {
            nom,
            resume: properties.formatted ?? null,
            description: properties.formatted ?? null,
            adresse: properties.address_line1 ?? properties.street ?? null,
            ville: properties.city ?? properties.municipality ?? null,
            codePostal: properties.postcode ?? null,
            latitude,
            longitude,
            telephone: properties.phone ?? properties.contact?.phone ?? null,
            email: properties.email ?? properties.contact?.email ?? null,
            siteWeb: properties.website ?? null,
            estGratuit: false,
            regionId,
            categoryId: category.id,
            sourceExterne: 'geoapify',
            sourceExterneId: placeId,
            estActif: true,
        };

        const place = lieuExistant
            ? await this.prisma.place.update({
                where: { id: lieuExistant.id },
                data: donneesLieu,
            })
            : await this.prisma.place.create({
                data: { ...donneesLieu, slug },
            });

        // 8b. Rechercher une image sur Wikimedia Commons si le lieu n'en
        // a pas encore (création, ou mise à jour d'un lieu jamais enrichi)
        if (!place.thumbnailUrl) {
            const image = await this.rechercherImageWikimedia(
                nom,
                donneesLieu.ville,
            );

            if (image) {
                await this.prisma.place.update({
                    where: { id: place.id },
                    data: { thumbnailUrl: image.url },
                });

                const imageExistante = await this.prisma.placeImage.findFirst({
                    where: { placeId: place.id, url: image.url },
                });

                if (!imageExistante) {
                    await this.prisma.placeImage.create({
                        data: {
                            placeId: place.id,
                            url: image.url,
                            titre: image.titre,
                            altText: nom,
                            ordre: 1,
                            estImagePrincipale: true,
                            source: 'Wikimedia Commons',
                            sourceUrl: image.sourceUrl,
                        },
                    });
                }
            }
        }

        // 9. Ajouter le lien officiel lorsqu'il existe
        // (option B : findFirst + create, en attendant d'ajouter
        // @@unique([placeId, url]) au schéma une fois l'importateur validé)
        if (properties.website) {
            const url = properties.website.trim();

            if (url) {
                const lienExistant = await this.prisma.placeLink.findFirst({
                    where: {
                        placeId: place.id,
                        url,
                    },
                });

                if (!lienExistant) {
                    await this.prisma.placeLink.create({
                        data: {
                            placeId: place.id,
                            titre: 'Site officiel',
                            url,
                            type: 'OFFICIAL',
                            ordre: 1,
                        },
                    });
                }
            }
        }

        // Activités par défaut (heuristique — voir note en haut du fichier)
        const activitySlugs = this.determinerActiviteSlugs(
            properties.categories ?? [],
        );

        await this.rattacherActivites(place.id, activitySlugs);

        return lieuExistant ? 'mis_a_jour' : 'cree';
    }

    /**
     * Détermine si un lieu Geoapify est pertinent pour une application
     * touristique, selon les mots-clés d'inclusion/exclusion définis
     * en haut du fichier. L'inclusion est toujours prioritaire sur
     * l'exclusion (voir commentaire au-dessus des listes).
     */
    private estLieuTouristique(categories: string[]): boolean {
        const categoriesLower = categories.map((c) => c.toLowerCase());

        const correspondInclusion = MOTS_CLES_INCLUSION_TOURISTIQUE.some(
            (motCle) => categoriesLower.some((c) => c.includes(motCle)),
        );

        if (correspondInclusion) {
            return true;
        }

        const correspondExclusion = MOTS_CLES_EXCLUSION_TOURISTIQUE.some(
            (motCle) => categoriesLower.some((c) => c.includes(motCle)),
        );

        if (correspondExclusion) {
            return false;
        }

        // Ni inclusion ni exclusion : approche conservatrice, on ignore
        // par défaut plutôt que d'importer un lieu non qualifié.
        return false;
    }

    private determinerCategorieSlug(categories: string[]): string {
        const categoriesLower = categories.map((c) => c.toLowerCase());

        for (const regle of MAPPING_CATEGORIE) {
            const correspond = regle.motsCles.some((motCle) =>
                categoriesLower.some((c) => c.includes(motCle)),
            );

            if (correspond) {
                return regle.slug;
            }
        }

        return CATEGORIE_PAR_DEFAUT;
    }

    private determinerActiviteSlugs(categories: string[]): string[] {
        const categoriesLower = categories.map((c) => c.toLowerCase());
        const slugs = new Set<string>([ACTIVITE_PAR_DEFAUT]);

        for (const regle of MAPPING_ACTIVITE) {
            const correspond = regle.motsCles.some((motCle) =>
                categoriesLower.some((c) => c.includes(motCle)),
            );

            if (correspond) {
                slugs.add(regle.slug);
            }
        }

        return Array.from(slugs);
    }

    private async rattacherActivites(
        placeId: number,
        activitySlugs: string[],
    ): Promise<void> {
        const activites = await this.prisma.activity.findMany({
            where: { slug: { in: activitySlugs } },
        });

        for (const [index, activite] of activites.entries()) {
            await this.prisma.placeActivity.upsert({
                where: {
                    placeId_activityId: {
                        placeId,
                        activityId: activite.id,
                    },
                },
                update: {},
                create: {
                    placeId,
                    activityId: activite.id,
                    ordre: index + 1,
                },
            });
        }
    }

    /**
     * Recherche une image représentative d'un lieu sur Wikimedia
     * Commons (API publique, sans clé requise). Retourne null si
     * aucune image pertinente n'est trouvée ou si l'appel échoue —
     * l'échec de cette recherche ne doit jamais faire échouer
     * l'import du lieu lui-même.
     */
    private async rechercherImageWikimedia(
        nom: string,
        ville?: string | null,
    ): Promise<{ url: string; titre: string; sourceUrl: string } | null> {
        try {
            const requete = ville ? `${nom} ${ville}` : nom;

            const response = await firstValueFrom(
                this.httpService.get<{
                    query?: {
                        pages?: Record<
                            string,
                            {
                                title?: string;
                                imageinfo?: Array<{
                                    url?: string;
                                    thumburl?: string;
                                    descriptionurl?: string;
                                }>;
                            }
                        >;
                    };
                }>('https://commons.wikimedia.org/w/api.php', {
                    params: {
                        action: 'query',
                        generator: 'search',
                        gsrsearch: requete,
                        gsrlimit: 1,
                        gsrnamespace: 6, // namespace "File:"
                        prop: 'imageinfo',
                        iiprop: 'url',
                        iiurlwidth: 1200,
                        format: 'json',
                    },
                    timeout: 10_000,
                }),
            );

            const pages = response.data?.query?.pages;

            if (!pages) {
                return null;
            }

            const page = Object.values(pages)[0];
            const imageInfo = page?.imageinfo?.[0];

            if (!imageInfo?.url) {
                return null;
            }

            return {
                url: imageInfo.thumburl ?? imageInfo.url,
                titre: page?.title?.replace(/^File:/, '') ?? nom,
                sourceUrl: imageInfo.descriptionurl ?? imageInfo.url,
            };
        } catch (error: unknown) {
            this.logger.warn(
                `Recherche d'image Wikimedia échouée pour "${nom}" : ${error instanceof Error ? error.message : String(error)
                }`,
            );

            return null;
        }
    }

    /**
     * Génère un slug unique à partir du nom du lieu, en ajoutant
     * un suffixe numérique en cas de collision.
     */
    private async genererSlugUnique(nom: string): Promise<string> {
        const base = nom
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        let slug = base || 'lieu';
        let compteur = 1;

        while (
            await this.prisma.place.findUnique({ where: { slug } })
        ) {
            compteur += 1;
            slug = `${base}-${compteur}`;
        }

        return slug;
    }
}