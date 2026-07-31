/**
 * Configuration des régions à importer via Geoapify.
 *
 * `provinceSlug` et `regionSlug` doivent correspondre exactement
 * aux valeurs `slug` déjà présentes en base (voir prisma/seed.ts),
 * afin que l'import rattache chaque lieu à la bonne Province/Region
 * existante plutôt que d'en créer de nouvelles.
 *
 * `latitude` / `longitude` : centre du cercle de recherche Geoapify
 * (approximé sur la ville principale de la région).
 * `rayonMetres` : rayon du cercle de recherche, en mètres.
 * `categories` : catégories Geoapify à interroger pour cette région.
 * `limiteImport` : nombre maximal de résultats à importer pour cette
 *   région (géré via pagination Geoapify, voir GeoapifyService).
 * `estActive` : permet de désactiver une région sans supprimer sa
 *   configuration.
 *
 * Phase de test en cours : seules Capitale-Nationale et
 * Chaudière-Appalaches sont actives. Les 15 autres régions du
 * Québec (+ Est de l'Ontario, Nord-Ouest du Nouveau-Brunswick)
 * sont déjà configurées mais désactivées, prêtes à être activées
 * une par une après validation.
 */

export interface RegionImportConfig {
    provinceSlug: string;
    provinceCode: string;

    regionSlug: string;
    regionNom: string;

    villeCentre: string;
    countryCode: string;

    latitude: number;
    longitude: number;

    rayonMetres: number;

    limiteImport: number;

    categories: string[];

    estActive: boolean;
}

const CATEGORIES_PAR_DEFAUT: string[] = [
    'tourism',
    'entertainment',
    'natural',
    'heritage',
];

export const REGIONS_A_IMPORTER: RegionImportConfig[] = [
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'bas-saint-laurent',
        regionNom: 'Bas-Saint-Laurent',
        villeCentre: 'Rimouski',
        countryCode: 'CA',
        latitude: 48.4489,
        longitude: -68.5233,
        rayonMetres: 80_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'saguenay-lac-saint-jean',
        regionNom: 'Saguenay–Lac-Saint-Jean',
        villeCentre: 'Saguenay',
        countryCode: 'CA',
        latitude: 48.4283,
        longitude: -71.0687,
        rayonMetres: 100_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'capitale-nationale',
        regionNom: 'Capitale-Nationale',
        villeCentre: 'Québec',
        countryCode: 'CA',
        latitude: 46.8139,
        longitude: -71.208,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: true,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'mauricie',
        regionNom: 'Mauricie',
        villeCentre: 'Trois-Rivières',
        countryCode: 'CA',
        latitude: 46.3432,
        longitude: -72.5432,
        rayonMetres: 70_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'estrie',
        regionNom: 'Estrie',
        villeCentre: 'Sherbrooke',
        countryCode: 'CA',
        latitude: 45.4042,
        longitude: -71.8929,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'montreal',
        regionNom: 'Montréal',
        villeCentre: 'Montréal',
        countryCode: 'CA',
        latitude: 45.5019,
        longitude: -73.5674,
        rayonMetres: 40_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'outaouais',
        regionNom: 'Outaouais',
        villeCentre: 'Gatineau',
        countryCode: 'CA',
        latitude: 45.4765,
        longitude: -75.7013,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'abitibi-temiscamingue',
        regionNom: 'Abitibi-Témiscamingue',
        villeCentre: 'Rouyn-Noranda',
        countryCode: 'CA',
        latitude: 48.2381,
        longitude: -79.0205,
        rayonMetres: 100_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'cote-nord',
        regionNom: 'Côte-Nord',
        villeCentre: 'Baie-Comeau',
        countryCode: 'CA',
        latitude: 49.2178,
        longitude: -68.15,
        rayonMetres: 120_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'nord-du-quebec',
        regionNom: 'Nord-du-Québec',
        villeCentre: 'Chibougamau',
        countryCode: 'CA',
        latitude: 49.9168,
        longitude: -74.3695,
        rayonMetres: 150_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'gaspesie-iles-de-la-madeleine',
        regionNom: 'Gaspésie–Îles-de-la-Madeleine',
        villeCentre: 'Gaspé',
        countryCode: 'CA',
        latitude: 48.832,
        longitude: -64.4837,
        rayonMetres: 100_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'chaudiere-appalaches',
        regionNom: 'Chaudière-Appalaches',
        villeCentre: 'Lévis',
        countryCode: 'CA',
        latitude: 46.8039,
        longitude: -71.178,
        rayonMetres: 50_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: true,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'laval',
        regionNom: 'Laval',
        villeCentre: 'Laval',
        countryCode: 'CA',
        latitude: 45.6066,
        longitude: -73.7124,
        rayonMetres: 20_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'lanaudiere',
        regionNom: 'Lanaudière',
        villeCentre: 'Joliette',
        countryCode: 'CA',
        latitude: 46.0184,
        longitude: -73.4438,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'laurentides',
        regionNom: 'Laurentides',
        villeCentre: 'Saint-Jérôme',
        countryCode: 'CA',
        latitude: 45.7799,
        longitude: -74.0033,
        rayonMetres: 70_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'monteregie',
        regionNom: 'Montérégie',
        villeCentre: 'Longueuil',
        countryCode: 'CA',
        latitude: 45.5312,
        longitude: -73.5185,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'quebec',
        provinceCode: 'QC',
        regionSlug: 'centre-du-quebec',
        regionNom: 'Centre-du-Québec',
        villeCentre: 'Drummondville',
        countryCode: 'CA',
        latitude: 45.8835,
        longitude: -72.4816,
        rayonMetres: 50_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'ontario',
        provinceCode: 'ON',
        regionSlug: 'est-ontario',
        regionNom: 'Est de l’Ontario',
        villeCentre: 'Ottawa',
        countryCode: 'CA',
        latitude: 45.4215,
        longitude: -75.6972,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
    {
        provinceSlug: 'nouveau-brunswick',
        provinceCode: 'NB',
        regionSlug: 'nord-ouest-nouveau-brunswick',
        regionNom: 'Nord-Ouest du Nouveau-Brunswick',
        villeCentre: 'Edmundston',
        countryCode: 'CA',
        latitude: 47.3737,
        longitude: -68.3255,
        rayonMetres: 60_000,
        limiteImport: 300,
        categories: [...CATEGORIES_PAR_DEFAUT],
        estActive: false,
    },
];

/**
 * Retourne la configuration d'une région précise, ou undefined
 * si elle n'est pas encore définie dans cette liste.
 */
export function trouverConfigRegion(
    provinceSlug: string,
    regionSlug: string,
): RegionImportConfig | undefined {
    return REGIONS_A_IMPORTER.find(
        (config) =>
            config.provinceSlug === provinceSlug &&
            config.regionSlug === regionSlug,
    );
}

/**
 * Retourne uniquement les régions actives, c'est-à-dire celles
 * qui doivent être prises en compte par l'importateur.
 */
export function listerRegionsActives(): RegionImportConfig[] {
    return REGIONS_A_IMPORTER.filter((config) => config.estActive);
}