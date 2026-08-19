import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface ImageLieu {
    url: string;
    thumbnailUrl: string;
    titre: string;
    altText: string;
    source: 'Wikimedia Commons';
    sourceUrl: string;
    auteur: string | null;
    licence: string | null;
}

interface WikimediaImageInfo {
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: {
        Artist?: {
            value?: string;
        };
        LicenseShortName?: {
            value?: string;
        };
        ImageDescription?: {
            value?: string;
        };
    };
}

interface WikimediaPage {
    pageid?: number;
    title?: string;
    imageinfo?: WikimediaImageInfo[];
}

interface WikimediaSearchResponse {
    query?: {
        pages?: Record<string, WikimediaPage>;
    };
}

/**
 * Mots génériques à retirer du nom du lieu lors des dernières
 * tentatives de recherche, pour maximiser les chances de trouver
 * une image lorsque les tentatives avec le nom complet échouent.
 */
const MOTS_GENERIQUES_A_RETIRER = [
    'chute',
    'chutes',
    'parc',
    'parc national',
    'riviere',
    'rivière',
    'lac',
    'mont',
    'ile',
    'île',
    'plage',
    'reserve',
    'réserve',
    'falls',
    'fall',
    'waterfall',
    'national park',
];

@Injectable()
export class ImageService {
    private readonly logger = new Logger(
        ImageService.name,
    );

    private readonly commonsApiUrl =
        'https://commons.wikimedia.org/w/api.php';

    constructor(
        private readonly httpService: HttpService,
    ) { }

    async rechercherImagePourLieu(
        nomLieu: string,
        ville?: string | null,
        province?: string | null,
    ): Promise<ImageLieu | null> {
        const nomNormalise = nomLieu.trim();

        if (!nomNormalise) {
            return null;
        }

        const tentatives = this.construireTentativesRecherche(
            nomNormalise,
            ville?.trim(),
            province?.trim(),
        );

        for (const requete of tentatives) {
            const image = await this.executerRecherche(
                requete,
                nomNormalise,
            );

            if (image) {
                return image;
            }
        }

        return null;
    }

    /**
     * Construit une liste ordonnée de requêtes à essayer, de la plus
     * précise (nom + ville + province + Canada) à la plus large
     * (nom seul, débarrassé des mots génériques). Dès qu'une requête
     * retourne un résultat exploitable, les suivantes ne sont pas
     * exécutées.
     */
    private construireTentativesRecherche(
        nom: string,
        ville?: string,
        province?: string,
    ): string[] {
        const tentatives = new Set<string>();

        const ajouter = (
            termes: Array<string | undefined>,
        ) => {
            const requete = termes
                .filter(
                    (valeur): valeur is string =>
                        Boolean(valeur),
                )
                .join(' ')
                .trim();

            if (requete) {
                tentatives.add(requete);
            }
        };

        // 1. Le plus précis : nom + ville + province + Canada
        ajouter([nom, ville, province, 'Canada']);

        // 2. Sans la province
        ajouter([nom, ville, 'Canada']);

        // 3. Sans la ville ni la province
        ajouter([nom, 'Canada']);

        // 4. Le nom seul, sans aucun contexte géographique
        ajouter([nom]);

        // 5. Le nom débarrassé des mots génériques (ex. "Chute
        // Montmorency" -> "Montmorency"), avec le Québec comme
        // dernier repère géographique
        const nomSansMotsGeneriques =
            this.retirerMotsGeneriques(nom);

        if (
            nomSansMotsGeneriques &&
            nomSansMotsGeneriques.toLowerCase() !==
            nom.toLowerCase()
        ) {
            ajouter([nomSansMotsGeneriques, 'Quebec']);
            ajouter([nomSansMotsGeneriques]);
        }

        return Array.from(tentatives);
    }

    private retirerMotsGeneriques(nom: string): string {
        let resultat = nom;

        for (const mot of MOTS_GENERIQUES_A_RETIRER) {
            const motif = new RegExp(
                `\\b${mot}\\b`,
                'gi',
            );

            resultat = resultat.replace(motif, ' ');
        }

        return resultat.replace(/\s+/g, ' ').trim();
    }

    /**
     * Exécute une seule requête de recherche sur Wikimedia Commons
     * et retourne la première image exploitable, ou null si aucune
     * image pertinente n'est trouvée ou si l'appel échoue.
     */
    private async executerRecherche(
        requete: string,
        nomLieu: string,
    ): Promise<ImageLieu | null> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<WikimediaSearchResponse>(
                    this.commonsApiUrl,
                    {
                        params: {
                            action: 'query',
                            format: 'json',
                            formatversion: 2,

                            generator: 'search',
                            gsrsearch: requete,
                            gsrnamespace: 6,
                            gsrlimit: 10,

                            prop: 'imageinfo',
                            iiprop:
                                'url|extmetadata',
                            iiurlwidth: 1200,

                            origin: '*',
                        },
                        timeout: 10_000,
                        headers: {
                            'User-Agent':
                                'DecouverteQuebec/1.0 (projet universitaire)',
                        },
                    },
                ),
            );

            const pages = response.data.query?.pages;

            if (!pages) {
                return null;
            }

            const candidats = Object.values(pages);

            for (const candidat of candidats) {
                const imageInfo =
                    candidat.imageinfo?.[0];

                const urlOriginale =
                    imageInfo?.url;

                const thumbnailUrl =
                    imageInfo?.thumburl ??
                    urlOriginale;

                if (
                    !urlOriginale ||
                    !thumbnailUrl
                ) {
                    continue;
                }

                if (
                    !this.estFormatImageAccepte(
                        urlOriginale,
                    )
                ) {
                    continue;
                }

                const titre =
                    candidat.title
                        ?.replace(/^File:/i, '')
                        .trim() ||
                    nomLieu;

                return {
                    url: urlOriginale,
                    thumbnailUrl,
                    titre,
                    altText:
                        this.nettoyerTexteHtml(
                            imageInfo.extmetadata
                                ?.ImageDescription
                                ?.value,
                        ) || nomLieu,
                    source:
                        'Wikimedia Commons',
                    sourceUrl:
                        imageInfo.descriptionurl ??
                        urlOriginale,
                    auteur:
                        this.nettoyerTexteHtml(
                            imageInfo.extmetadata
                                ?.Artist?.value,
                        ),
                    licence:
                        this.nettoyerTexteHtml(
                            imageInfo.extmetadata
                                ?.LicenseShortName
                                ?.value,
                        ),
                };
            }

            return null;
        } catch (error: unknown) {
            this.logger.warn(
                this.construireMessageErreur(
                    nomLieu,
                    requete,
                    error,
                ),
            );

            return null;
        }
    }

    private estFormatImageAccepte(
        url: string,
    ): boolean {
        const urlSansParametres =
            url.split('?')[0].toLowerCase();

        return [
            '.jpg',
            '.jpeg',
            '.png',
            '.webp',
        ].some((extension) =>
            urlSansParametres.endsWith(extension),
        );
    }

    private nettoyerTexteHtml(
        valeur?: string,
    ): string | null {
        if (!valeur) {
            return null;
        }

        const texte = valeur
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/\s+/g, ' ')
            .trim();

        return texte || null;
    }

    private construireMessageErreur(
        nomLieu: string,
        requete: string,
        error: unknown,
    ): string {
        if (error instanceof AxiosError) {
            return (
                `Recherche Wikimedia échouée pour ` +
                `"${nomLieu}" (requête "${requete}"). ` +
                `Statut HTTP : ` +
                `${error.response?.status ?? 'inconnu'}`
            );
        }

        return (
            `Recherche Wikimedia échouée pour ` +
            `"${nomLieu}" (requête "${requete}") : ` +
            `${error instanceof Error
                ? error.message
                : String(error)
            }`
        );
    }
}