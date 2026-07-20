import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface PlacesFilters {
    recherche?: string;
    region?: string;
    categorie?: string;
    page?: number;
    limit?: number;
    tri?: 'nom' | 'ville' | 'createdAt';
    ordre?: 'asc' | 'desc';
}

@Injectable()
export class PlacesServiceService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filters: PlacesFilters = {}) {
        const {
            recherche,
            region,
            categorie,
            page = 1,
            limit = 10,
            tri = 'nom',
            ordre = 'asc',
        } = filters;

        const where = {
            ...(recherche
                ? {
                    OR: [
                        {
                            nom: {
                                contains: recherche,
                                mode: 'insensitive' as const,
                            },
                        },
                        {
                            ville: {
                                contains: recherche,
                                mode: 'insensitive' as const,
                            },
                        },
                        {
                            description: {
                                contains: recherche,
                                mode: 'insensitive' as const,
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
                            mode: 'insensitive' as const,
                        },
                    },
                }
                : {}),
        };

        const skip = (page - 1) * limit;

        const orderBy = {
            [tri]: ordre,
        };

        const [data, total] = await this.prisma.$transaction([
            this.prisma.place.findMany({
                where,
                include: {
                    region: true,
                    category: true,
                },
                orderBy,
                skip,
                take: limit,
            }),

            this.prisma.place.count({
                where,
            }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
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