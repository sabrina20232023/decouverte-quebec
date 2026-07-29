import { Injectable } from '@nestjs/common';
import { Prisma } from '../../common/generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

interface PlacesFilters {
    recherche?: string;
    province?: string;
    region?: string;
    categorie?: string;
    activite?: string;
    ville?: string;
    estVedette?: boolean;
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
            province,
            region,
            categorie,
            activite,
            ville,
            estVedette,
            page = 1,
            limit = 10,
            tri = 'nom',
            ordre = 'asc',
        } = filters;

        const pageValide = Math.max(1, Number(page) || 1);
        const limitValide = Math.min(50, Math.max(1, Number(limit) || 10));

        const where: Prisma.PlaceWhereInput = {
            estActif: true,

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
                            resume: {
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

            ...(province
                ? {
                    region: {
                        province: {
                            slug: province,
                        },
                    },
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
                        slug: categorie,
                    },
                }
                : {}),

            ...(activite
                ? {
                    placeActivities: {
                        some: {
                            activity: {
                                slug: activite,
                            },
                        },
                    },
                }
                : {}),

            ...(ville
                ? {
                    ville: {
                        equals: ville,
                        mode: 'insensitive',
                    },
                }
                : {}),

            ...(typeof estVedette === 'boolean'
                ? {
                    estVedette,
                }
                : {}),
        };

        const skip = (pageValide - 1) * limitValide;

        const orderBy: Prisma.PlaceOrderByWithRelationInput = {
            [tri]: ordre,
        };

        const [data, total] = await this.prisma.$transaction([
            this.prisma.place.findMany({
                where,
                select: {
                    id: true,
                    nom: true,
                    slug: true,
                    resume: true,
                    ville: true,
                    latitude: true,
                    longitude: true,
                    thumbnailUrl: true,
                    estGratuit: true,
                    note: true,
                    nombreAvis: true,
                    estVedette: true,

                    region: {
                        select: {
                            id: true,
                            nom: true,
                            slug: true,
                            province: {
                                select: {
                                    id: true,
                                    nom: true,
                                    code: true,
                                    slug: true,
                                },
                            },
                        },
                    },

                    category: {
                        select: {
                            id: true,
                            nom: true,
                            slug: true,
                            icone: true,
                        },
                    },

                    images: {
                        where: {
                            estImagePrincipale: true,
                        },
                        orderBy: {
                            ordre: 'asc',
                        },
                        take: 1,
                        select: {
                            id: true,
                            url: true,
                            titre: true,
                            altText: true,
                        },
                    },

                    placeActivities: {
                        orderBy: {
                            ordre: 'asc',
                        },
                        select: {
                            ordre: true,
                            activity: {
                                select: {
                                    id: true,
                                    nom: true,
                                    slug: true,
                                    icone: true,
                                },
                            },
                        },
                    },
                },
                orderBy,
                skip,
                take: limitValide,
            }),

            this.prisma.place.count({
                where,
            }),
        ]);

        return {
            data,
            pagination: {
                page: pageValide,
                limit: limitValide,
                total,
                totalPages: Math.ceil(total / limitValide),
                hasPreviousPage: pageValide > 1,
                hasNextPage: pageValide * limitValide < total,
            },
        };
    }

    async findOne(id: number) {
        return this.prisma.place.findFirst({
            where: {
                id,
                estActif: true,
            },
            include: {
                region: {
                    include: {
                        province: true,
                    },
                },
                category: true,
                images: {
                    orderBy: {
                        ordre: 'asc',
                    },
                },
                links: {
                    orderBy: {
                        ordre: 'asc',
                    },
                },
                placeActivities: {
                    orderBy: {
                        ordre: 'asc',
                    },
                    include: {
                        activity: true,
                    },
                },
            },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.place.findFirst({
            where: {
                slug,
                estActif: true,
            },
            include: {
                region: {
                    include: {
                        province: true,
                    },
                },
                category: true,
                images: {
                    orderBy: {
                        ordre: 'asc',
                    },
                },
                links: {
                    orderBy: {
                        ordre: 'asc',
                    },
                },
                placeActivities: {
                    orderBy: {
                        ordre: 'asc',
                    },
                    include: {
                        activity: true,
                    },
                },
            },
        });
    }
}