import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
    PlaceLinkType,
    PrismaClient,
} from '../apps/common/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        'La variable DATABASE_URL est absente du fichier .env.',
    );
}

const adapter = new PrismaPg({
    connectionString: databaseUrl,
});

const prisma = new PrismaClient({
    adapter,
});

type ImageSeed = {
    url: string;
    titre?: string;
    altText?: string;
    ordre: number;
    estImagePrincipale: boolean;
    source?: string;
    sourceUrl?: string;
};

type LinkSeed = {
    titre: string;
    url: string;
    type: PlaceLinkType;
    ordre: number;
};

type PlaceSeed = {
    nom: string;
    slug: string;
    resume: string;
    description: string;
    adresse?: string;
    ville: string;
    codePostal?: string;
    latitude: number;
    longitude: number;
    telephone?: string;
    email?: string;
    siteWeb?: string;
    thumbnailUrl?: string;
    horaire?: string;
    prix?: string;
    accessibilite?: string;
    stationnement?: string;
    tempsVisite?: string;
    estGratuit: boolean;
    note?: number;
    nombreAvis?: number;
    estVedette: boolean;
    regionSlug: string;
    provinceCode: string;
    categorySlug: string;
    activitySlugs: string[];
    images: ImageSeed[];
    links: LinkSeed[];
};

async function seedProvinces() {
    console.log('?? Création des provinces...');

    const provinces = [
        {
            nom: 'Québec',
            code: 'QC',
            slug: 'quebec',
            description:
                'Province canadienne reconnue pour ses villes historiques, ses grands espaces et sa culture francophone.',
        },
        {
            nom: 'Ontario',
            code: 'ON',
            slug: 'ontario',
            description:
                'Province canadienne regroupant de grandes villes, des lacs et plusieurs sites naturels.',
        },
        {
            nom: 'Nouveau-Brunswick',
            code: 'NB',
            slug: 'nouveau-brunswick',
            description:
                'Province maritime bilingue connue pour ses côtes, ses forêts et la baie de Fundy.',
        },
    ];

    for (const province of provinces) {
        await prisma.province.upsert({
            where: {
                code: province.code,
            },
            update: {
                nom: province.nom,
                slug: province.slug,
                description: province.description,
                estActive: true,
            },
            create: {
                ...province,
                estActive: true,
            },
        });
    }
}

async function seedRegions() {
    console.log('??? Création des régions...');

    const regions = [
        {
            nom: 'Capitale-Nationale',
            slug: 'capitale-nationale',
            provinceCode: 'QC',
            description:
                'Région comprenant Québec, Charlevoix et plusieurs destinations naturelles et historiques.',
        },
        {
            nom: 'Chaudière-Appalaches',
            slug: 'chaudiere-appalaches',
            provinceCode: 'QC',
            description:
                'Région située sur la rive sud du fleuve Saint-Laurent, face à Québec.',
        },
        {
            nom: 'Montréal',
            slug: 'montreal',
            provinceCode: 'QC',
            description:
                'Grande région urbaine reconnue pour sa culture, sa gastronomie et ses festivals.',
        },
        {
            nom: 'Mauricie',
            slug: 'mauricie',
            provinceCode: 'QC',
            description:
                'Région de lacs, de forêts et de grands espaces située entre Montréal et Québec.',
        },
        {
            nom: 'Outaouais',
            slug: 'outaouais',
            provinceCode: 'QC',
            description:
                'Région de l’ouest du Québec comprenant Gatineau et de nombreux espaces naturels.',
        },
        {
            nom: 'Est de l’Ontario',
            slug: 'est-ontario',
            provinceCode: 'ON',
            description:
                'Région comprenant Ottawa et plusieurs destinations situées près de la frontière québécoise.',
        },
        {
            nom: 'Nord-Ouest du Nouveau-Brunswick',
            slug: 'nord-ouest-nouveau-brunswick',
            provinceCode: 'NB',
            description:
                'Région francophone comprenant Edmundston et la vallée du fleuve Saint-Jean.',
        },
    ];

    for (const region of regions) {
        const province = await prisma.province.findUniqueOrThrow({
            where: {
                code: region.provinceCode,
            },
        });

        await prisma.region.upsert({
            where: {
                provinceId_slug: {
                    provinceId: province.id,
                    slug: region.slug,
                },
            },
            update: {
                nom: region.nom,
                description: region.description,
                estActive: true,
            },
            create: {
                nom: region.nom,
                slug: region.slug,
                description: region.description,
                provinceId: province.id,
                estActive: true,
            },
        });
    }
}

async function seedCategories() {
    console.log('??? Création des catégories...');

    const categories = [
        {
            nom: 'Parc national',
            slug: 'parc-national',
            description:
                'Parcs et territoires naturels protégés accessibles aux visiteurs.',
            icone: 'trees',
        },
        {
            nom: 'Site historique',
            slug: 'site-historique',
            description:
                'Lieux associés à l’histoire et au patrimoine du Canada.',
            icone: 'landmark',
        },
        {
            nom: 'Musée',
            slug: 'musee',
            description:
                'Musées, centres d’interprétation et institutions culturelles.',
            icone: 'museum',
        },
        {
            nom: 'Chute et cascade',
            slug: 'chute-cascade',
            description:
                'Chutes, cascades et sites naturels aménagés près de cours d’eau.',
            icone: 'waves',
        },
        {
            nom: 'Point de vue',
            slug: 'point-de-vue',
            description:
                'Belvédères et endroits offrant une vue panoramique.',
            icone: 'binoculars',
        },
        {
            nom: 'Quartier touristique',
            slug: 'quartier-touristique',
            description:
                'Quartiers urbains reconnus pour leurs attraits et leur ambiance.',
            icone: 'building',
        },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: {
                slug: category.slug,
            },
            update: {
                nom: category.nom,
                description: category.description,
                icone: category.icone,
                estActive: true,
            },
            create: {
                ...category,
                estActive: true,
            },
        });
    }
}

async function seedActivities() {
    console.log('?? Création des activités...');

    const activities = [
        {
            nom: 'Randonnée',
            slug: 'randonnee',
            description: 'Marche sur des sentiers naturels ou aménagés.',
            icone: 'footprints',
        },
        {
            nom: 'Photographie',
            slug: 'photographie',
            description: 'Observation et photographie de paysages ou de monuments.',
            icone: 'camera',
        },
        {
            nom: 'Pique-nique',
            slug: 'pique-nique',
            description: 'Espaces permettant de prendre un repas à l’extérieur.',
            icone: 'sandwich',
        },
        {
            nom: 'Visite guidée',
            slug: 'visite-guidee',
            description: 'Découverte d’un lieu accompagnée par un guide.',
            icone: 'users',
        },
        {
            nom: 'Cyclisme',
            slug: 'cyclisme',
            description: 'Circuits et pistes accessibles à vélo.',
            icone: 'bike',
        },
        {
            nom: 'Observation de la faune',
            slug: 'observation-faune',
            description: 'Observation des animaux dans leur environnement naturel.',
            icone: 'bird',
        },
        {
            nom: 'Activité familiale',
            slug: 'activite-familiale',
            description: 'Activité convenant aux enfants et aux familles.',
            icone: 'family',
        },
        {
            nom: 'Kayak',
            slug: 'kayak',
            description: 'Activité nautique en kayak ou en embarcation légère.',
            icone: 'ship-wheel',
        },
    ];

    for (const activity of activities) {
        await prisma.activity.upsert({
            where: {
                slug: activity.slug,
            },
            update: {
                nom: activity.nom,
                description: activity.description,
                icone: activity.icone,
                estActive: true,
            },
            create: {
                ...activity,
                estActive: true,
            },
        });
    }
}

const places: PlaceSeed[] = [
    {
        nom: 'Chute Montmorency',
        slug: 'chute-montmorency',
        resume:
            'Une chute spectaculaire située à quelques minutes du centre-ville de Québec.',
        description:
            'Le parc de la Chute-Montmorency permet d’observer une chute impressionnante depuis plusieurs belvédères, un pont suspendu et différents sentiers.',
        adresse: '5300 boulevard Sainte-Anne',
        ville: 'Québec',
        codePostal: 'G1C 0M3',
        latitude: 46.8908,
        longitude: -71.1474,
        siteWeb: 'https://www.sepaq.com/destinations/parc-chute-montmorency/',
        thumbnailUrl:
            'https://images.unsplash.com/photo-1519832979-6fa011b87667?auto=format&fit=crop&w=900&q=80',
        horaire: 'Variable selon la saison',
        prix: 'Accès au site payant; certains services sont offerts en supplément.',
        accessibilite:
            'Plusieurs secteurs et belvédères sont accessibles aux personnes à mobilité réduite.',
        stationnement: 'Stationnement payant sur place.',
        tempsVisite: '2 à 4 heures',
        estGratuit: false,
        note: 4.7,
        nombreAvis: 12500,
        estVedette: true,
        regionSlug: 'capitale-nationale',
        provinceCode: 'QC',
        categorySlug: 'chute-cascade',
        activitySlugs: [
            'randonnee',
            'photographie',
            'pique-nique',
            'activite-familiale',
        ],
        images: [
            {
                url: 'https://images.unsplash.com/photo-1519832979-6fa011b87667?auto=format&fit=crop&w=1400&q=80',
                titre: 'Chute Montmorency',
                altText: 'Vue de la chute Montmorency',
                ordre: 1,
                estImagePrincipale: true,
                source: 'Unsplash',
            },
            {
                url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1400&q=80',
                titre: 'Paysage naturel',
                altText: 'Paysage naturel près d’une chute',
                ordre: 2,
                estImagePrincipale: false,
                source: 'Unsplash',
            },
        ],
        links: [
            {
                titre: 'Site officiel',
                url: 'https://www.sepaq.com/destinations/parc-chute-montmorency/',
                type: PlaceLinkType.OFFICIAL,
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Vieux-Québec',
        slug: 'vieux-quebec',
        resume:
            'Quartier historique fortifié inscrit au patrimoine mondial de l’UNESCO.',
        description:
            'Le Vieux-Québec rassemble des rues historiques, des fortifications, des places publiques, des boutiques et plusieurs monuments emblématiques.',
        ville: 'Québec',
        latitude: 46.8139,
        longitude: -71.208,
        siteWeb: 'https://www.quebec-cite.com/',
        thumbnailUrl:
            'https://images.unsplash.com/photo-1519178614-68673b201f36?auto=format&fit=crop&w=900&q=80',
        horaire: 'Accessible toute l’année',
        prix: 'Accès gratuit au quartier; certaines attractions sont payantes.',
        accessibilite:
            'Plusieurs rues sont accessibles, mais certains secteurs comportent des pentes et des escaliers.',
        stationnement:
            'Stationnements municipaux payants disponibles à proximité.',
        tempsVisite: 'Une demi-journée à une journée',
        estGratuit: true,
        note: 4.8,
        nombreAvis: 18000,
        estVedette: true,
        regionSlug: 'capitale-nationale',
        provinceCode: 'QC',
        categorySlug: 'quartier-touristique',
        activitySlugs: [
            'photographie',
            'visite-guidee',
            'activite-familiale',
        ],
        images: [
            {
                url: 'https://images.unsplash.com/photo-1519178614-68673b201f36?auto=format&fit=crop&w=1400&q=80',
                titre: 'Vieux-Québec',
                altText: 'Architecture historique du Vieux-Québec',
                ordre: 1,
                estImagePrincipale: true,
                source: 'Unsplash',
            },
        ],
        links: [
            {
                titre: 'Québec cité',
                url: 'https://www.quebec-cite.com/',
                type: PlaceLinkType.OFFICIAL,
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Parc national de la Mauricie',
        slug: 'parc-national-mauricie',
        resume:
            'Un vaste territoire naturel composé de forêts, de lacs et de sentiers.',
        description:
            'Le parc national de la Mauricie propose de nombreuses activités de plein air, notamment la randonnée, le kayak, le camping et l’observation de la faune.',
        ville: 'Saint-Mathieu-du-Parc',
        latitude: 46.7996,
        longitude: -72.9675,
        siteWeb:
            'https://parks.canada.ca/pn-np/qc/mauricie',
        thumbnailUrl:
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
        horaire: 'Variable selon la saison',
        prix: 'Droits d’entrée applicables.',
        accessibilite:
            'Certains bâtiments, belvédères et secteurs sont accessibles.',
        stationnement: 'Stationnements disponibles dans plusieurs secteurs.',
        tempsVisite: 'Une journée ou plus',
        estGratuit: false,
        note: 4.8,
        nombreAvis: 2400,
        estVedette: true,
        regionSlug: 'mauricie',
        provinceCode: 'QC',
        categorySlug: 'parc-national',
        activitySlugs: [
            'randonnee',
            'kayak',
            'observation-faune',
            'photographie',
            'pique-nique',
        ],
        images: [
            {
                url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
                titre: 'Parc national de la Mauricie',
                altText: 'Forêt et lac dans un parc national',
                ordre: 1,
                estImagePrincipale: true,
                source: 'Unsplash',
            },
        ],
        links: [
            {
                titre: 'Parcs Canada',
                url: 'https://parks.canada.ca/pn-np/qc/mauricie',
                type: PlaceLinkType.OFFICIAL,
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Musée canadien de l’histoire',
        slug: 'musee-canadien-histoire',
        resume:
            'Un musée consacré à l’histoire humaine et culturelle du Canada.',
        description:
            'Situé à Gatineau, le musée présente des expositions permanentes et temporaires sur l’histoire, les peuples et les cultures du Canada.',
        adresse: '100 rue Laurier',
        ville: 'Gatineau',
        codePostal: 'K1A 0M8',
        latitude: 45.4298,
        longitude: -75.7095,
        siteWeb: 'https://www.museedelhistoire.ca/',
        thumbnailUrl:
            'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',
        horaire: 'Horaire variable selon la journée et la saison',
        prix: 'Billet d’entrée requis.',
        accessibilite: 'Bâtiment accessible aux personnes à mobilité réduite.',
        stationnement: 'Stationnement payant disponible.',
        tempsVisite: '3 à 5 heures',
        estGratuit: false,
        note: 4.6,
        nombreAvis: 9200,
        estVedette: false,
        regionSlug: 'outaouais',
        provinceCode: 'QC',
        categorySlug: 'musee',
        activitySlugs: [
            'visite-guidee',
            'photographie',
            'activite-familiale',
        ],
        images: [
            {
                url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1400&q=80',
                titre: 'Musée',
                altText: 'Intérieur d’un musée',
                ordre: 1,
                estImagePrincipale: true,
                source: 'Unsplash',
            },
        ],
        links: [
            {
                titre: 'Site officiel',
                url: 'https://www.museedelhistoire.ca/',
                type: PlaceLinkType.OFFICIAL,
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Terrasse du Chevalier-De Lévis',
        slug: 'terrasse-chevalier-de-levis',
        resume:
            'Un belvédère offrant une vue panoramique sur Québec et le fleuve Saint-Laurent.',
        description:
            'Située dans le Vieux-Lévis, la terrasse permet d’admirer le Château Frontenac, le cap Diamant et le fleuve Saint-Laurent.',
        adresse: '5 rue William-Tremblay',
        ville: 'Lévis',
        latitude: 46.8072,
        longitude: -71.1855,
        thumbnailUrl:
            'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
        horaire: 'Accessible toute l’année',
        prix: 'Gratuit',
        stationnement: 'Stationnement disponible dans les rues avoisinantes.',
        tempsVisite: '30 minutes à 1 heure',
        estGratuit: true,
        note: 4.7,
        nombreAvis: 1300,
        estVedette: false,
        regionSlug: 'chaudiere-appalaches',
        provinceCode: 'QC',
        categorySlug: 'point-de-vue',
        activitySlugs: ['photographie', 'pique-nique'],
        images: [
            {
                url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
                titre: 'Belvédère',
                altText: 'Vue panoramique depuis un belvédère',
                ordre: 1,
                estImagePrincipale: true,
                source: 'Unsplash',
            },
        ],
        links: [],
    },
    {
        nom: 'Canal Rideau',
        slug: 'canal-rideau',
        resume:
            'Un canal historique traversant le centre-ville d’Ottawa.',
        description:
            'Le canal Rideau est un site historique national utilisé pour les promenades et les activités nautiques en été, ainsi que pour le patinage en hiver.',
        ville: 'Ottawa',
        latitude: 45.4215,
        longitude: -75.6972,
        siteWeb:
            'https://parks.canada.ca/lhn-nhs/on/rideau',
        thumbnailUrl:
            'https://images.unsplash.com/photo-1516528387618-afa90b13e000?auto=format&fit=crop&w=900&q=80',
        horaire: 'Accessible toute l’année',
        prix: 'Accès général gratuit; certaines activités sont payantes.',
        stationnement: 'Stationnements urbains payants à proximité.',
        tempsVisite: '1 à 3 heures',
        estGratuit: true,
        note: 4.6,
        nombreAvis: 3500,
        estVedette: false,
        regionSlug: 'est-ontario',
        provinceCode: 'ON',
        categorySlug: 'site-historique',
        activitySlugs: [
            'cyclisme',
            'photographie',
            'activite-familiale',
        ],
        images: [
            {
                url: 'https://images.unsplash.com/photo-1516528387618-afa90b13e000?auto=format&fit=crop&w=1400&q=80',
                titre: 'Canal Rideau',
                altText: 'Canal traversant une ville',
                ordre: 1,
                estImagePrincipale: true,
                source: 'Unsplash',
            },
        ],
        links: [
            {
                titre: 'Parcs Canada',
                url: 'https://parks.canada.ca/lhn-nhs/on/rideau',
                type: PlaceLinkType.OFFICIAL,
                ordre: 1,
            },
        ],
    },
];

async function seedPlaces() {
    console.log('?? Création des destinations...');

    for (const placeData of places) {
        const province = await prisma.province.findUniqueOrThrow({
            where: {
                code: placeData.provinceCode,
            },
        });

        const region = await prisma.region.findUniqueOrThrow({
            where: {
                provinceId_slug: {
                    provinceId: province.id,
                    slug: placeData.regionSlug,
                },
            },
        });

        const category = await prisma.category.findUniqueOrThrow({
            where: {
                slug: placeData.categorySlug,
            },
        });

        const {
            provinceCode,
            regionSlug,
            categorySlug,
            activitySlugs,
            images,
            links,
            ...placeValues
        } = placeData;

        const place = await prisma.place.upsert({
            where: {
                slug: placeValues.slug,
            },
            update: {
                ...placeValues,
                regionId: region.id,
                categoryId: category.id,
                estActif: true,
            },
            create: {
                ...placeValues,
                regionId: region.id,
                categoryId: category.id,
                estActif: true,
            },
        });

        /*
         * Ces données dépendantes sont recréées afin que le seed
         * puisse être relancé sans produire de doublons.
         */
        await prisma.placeActivity.deleteMany({
            where: {
                placeId: place.id,
            },
        });

        await prisma.placeImage.deleteMany({
            where: {
                placeId: place.id,
            },
        });

        await prisma.placeLink.deleteMany({
            where: {
                placeId: place.id,
            },
        });

        const activities = await prisma.activity.findMany({
            where: {
                slug: {
                    in: activitySlugs,
                },
            },
        });

        if (activities.length !== activitySlugs.length) {
            throw new Error(
                `Une activité est introuvable pour le lieu "${place.nom}".`,
            );
        }

        await prisma.placeActivity.createMany({
            data: activities.map((activity, index) => ({
                placeId: place.id,
                activityId: activity.id,
                ordre: index + 1,
            })),
        });

        if (images.length > 0) {
            await prisma.placeImage.createMany({
                data: images.map((image) => ({
                    ...image,
                    placeId: place.id,
                })),
            });
        }

        if (links.length > 0) {
            await prisma.placeLink.createMany({
                data: links.map((link) => ({
                    ...link,
                    placeId: place.id,
                })),
            });
        }
    }
}

function dateUtcDansNombreDeJours(nombreDeJours: number): Date {
    const maintenant = new Date();

    return new Date(
        Date.UTC(
            maintenant.getUTCFullYear(),
            maintenant.getUTCMonth(),
            maintenant.getUTCDate() + nombreDeJours,
        ),
    );
}

async function seedWeatherForecasts() {
    console.log('??? Création de prévisions météo de démonstration...');

    const placesMeteo = await prisma.place.findMany({
        where: {
            slug: {
                in: ['chute-montmorency', 'vieux-quebec'],
            },
        },
    });

    for (const place of placesMeteo) {
        await prisma.weatherForecast.deleteMany({
            where: {
                placeId: place.id,
            },
        });

        await prisma.weatherForecast.createMany({
            data: [
                {
                    placeId: place.id,
                    datePrevision: dateUtcDansNombreDeJours(1),
                    temperatureMin: 14,
                    temperatureMax: 23,
                    temperatureRessentie: 22,
                    humidite: 65,
                    ventKmh: 14,
                    probabilitePrecipitation: 20,
                    condition: 'Clear',
                    description: 'Ciel généralement dégagé',
                    icone: '01d',
                    sourceApi: 'DONNEES_DEMONSTRATION',
                    fetchedAt: new Date(),
                    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
                },
                {
                    placeId: place.id,
                    datePrevision: dateUtcDansNombreDeJours(2),
                    temperatureMin: 13,
                    temperatureMax: 19,
                    temperatureRessentie: 18,
                    humidite: 75,
                    ventKmh: 19,
                    probabilitePrecipitation: 60,
                    condition: 'Rain',
                    description: 'Possibilité d’averses',
                    icone: '10d',
                    sourceApi: 'DONNEES_DEMONSTRATION',
                    fetchedAt: new Date(),
                    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
                },
            ],
        });
    }
}

async function main() {
    console.log('?? Début du peuplement de la base de données...');

    await seedProvinces();
    await seedRegions();
    await seedCategories();
    await seedActivities();
    await seedPlaces();
    await seedWeatherForecasts();

    const [
        provinces,
        regions,
        categories,
        activities,
        placesCount,
        images,
        links,
        forecasts,
    ] = await Promise.all([
        prisma.province.count(),
        prisma.region.count(),
        prisma.category.count(),
        prisma.activity.count(),
        prisma.place.count(),
        prisma.placeImage.count(),
        prisma.placeLink.count(),
        prisma.weatherForecast.count(),
    ]);

    console.log('');
    console.log('? Peuplement terminé avec succès.');
    console.log(`   Provinces : ${provinces}`);
    console.log(`   Régions : ${regions}`);
    console.log(`   Catégories : ${categories}`);
    console.log(`   Activités : ${activities}`);
    console.log(`   Destinations : ${placesCount}`);
    console.log(`   Images : ${images}`);
    console.log(`   Liens : ${links}`);
    console.log(`   Prévisions météo : ${forecasts}`);
}

main()
    .catch((error: unknown) => {
        console.error('? Erreur pendant le seed :', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });