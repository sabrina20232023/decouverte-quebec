import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/common/generated/prisma/client';

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL est manquante.');
    }

    const adapter = new PrismaPg({
        connectionString,
    });

    const prisma = new PrismaClient({
        adapter,
    });

    console.log('Nettoyage de la base...');

    await prisma.place.deleteMany();
    await prisma.category.deleteMany();
    await prisma.region.deleteMany();

    console.log('Insertion des régions...');

    const capitale = await prisma.region.create({
        data: {
            nom: 'Capitale-Nationale',
            slug: 'capitale-nationale',
            description: 'Région de Québec',
        },
    });

    const montreal = await prisma.region.create({
        data: {
            nom: 'Montréal',
            slug: 'montreal',
            description: 'Île de Montréal',
        },
    });

    console.log('Insertion des catégories...');

    const parc = await prisma.category.create({
        data: {
            nom: 'Parc',
            icone: 'park',
        },
    });

    const musee = await prisma.category.create({
        data: {
            nom: 'Musée',
            icone: 'museum',
        },
    });

    console.log('Insertion des lieux...');

    await prisma.place.createMany({
        data: [
            {
                nom: 'Chute Montmorency',
                description: 'Magnifique chute près de Québec.',
                ville: 'Québec',
                latitude: 46.8902,
                longitude: -71.1474,
                regionId: capitale.id,
                categoryId: parc.id,
            },
            {
                nom: 'Musée de la civilisation',
                description: 'Musée situé dans le Vieux-Québec.',
                ville: 'Québec',
                latitude: 46.8123,
                longitude: -71.2033,
                regionId: capitale.id,
                categoryId: musee.id,
            },
            {
                nom: 'Mont Royal',
                description: 'Parc emblématique de Montréal.',
                ville: 'Montréal',
                latitude: 45.5048,
                longitude: -73.5878,
                regionId: montreal.id,
                categoryId: parc.id,
            },
        ],
    });

    console.log('Base de données initialisée avec succès.');

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error(error);
    process.exit(1);
});