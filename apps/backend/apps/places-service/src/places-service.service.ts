import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface PlacesFilters {
    recherche?: string;
    region?: string;
    categorie?: string;
}

@Injectable()
export class PlacesServiceService {
    constructor(private readonly prisma: PrismaService) { }

    findAll(filters: PlacesFilters = {}) {
        const { recherche, region, categorie } = filters;

        return this.prisma.place.findMany({
            where: {
                ...(recherche
                    ? {
                        OR: [
                            {
                                nom: {
                                    contains: recherche,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                ville: {
                                    contains: recherche,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                description: {
                                    contains: recherche,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    }
                    : {}),

                ...(region
                    ? {
                        region: {
                            slug: region,
                        },
                    }
                    : {}),

                ...(categorie
                    ? {
                        category: {
                            nom: {
                                equals: categorie,
                                mode: 'insensitive',
                            },
                        },
                    }
                    : {}),
            },

            include: {
                region: true,
                category: true,
            },

            orderBy: {
                nom: 'asc',
            },
        });
    }

    findOne(id: number) {
        return this.prisma.place.findUnique({
            where: {
                id,
            },
            include: {
                region: true,
                category: true,
            },
        });
    }
}