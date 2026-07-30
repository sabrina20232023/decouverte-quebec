import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RegionsServiceService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findAll() {
        return this.prisma.region.findMany({
            where: {
                estActive: true,
            },
            select: {
                id: true,
                nom: true,
                slug: true,
                description: true,
                _count: {
                    select: {
                        places: {
                            where: {
                                estActif: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                nom: 'asc',
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.region.findFirst({
            where: {
                id,
                estActive: true,
            },
            select: {
                id: true,
                nom: true,
                slug: true,
                description: true,
                _count: {
                    select: {
                        places: {
                            where: {
                                estActif: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findBySlug(slug: string) {
        const normalizedSlug = slug
            .trim()
            .toLowerCase();

        const region =
            await this.prisma.region.findFirst({
                where: {
                    slug: normalizedSlug,
                    estActive: true,
                },
                select: {
                    id: true,
                    nom: true,
                    slug: true,
                    description: true,
                    places: {
                        where: {
                            estActif: true,
                        },
                        select: {
                            id: true,
                            nom: true,
                            description: true,
                            adresse: true,
                            ville: true,
                            latitude: true,
                            longitude: true,
                            thumbnailUrl: true,
                            siteWeb: true,
                            telephone: true,
                            regionId: true,
                            categoryId: true,
                            category: {
                                select: {
                                    id: true,
                                    nom: true,
                                    slug: true,
                                    description: true,
                                    icone: true,
                                },
                            },
                        },
                        orderBy: {
                            nom: 'asc',
                        },
                    },
                },
            });

        if (!region) {
            return null;
        }

        return {
            ...region,
            places: region.places.map(
                ({
                    thumbnailUrl,
                    ...place
                }) => ({
                    ...place,
                    imageUrl: thumbnailUrl,
                }),
            ),
        };
    }
}