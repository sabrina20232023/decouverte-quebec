import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface AjouterFavoriPayload {
    userId: number;
    placeId: number;
}

@Injectable()
export class FavoritesServiceService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async ajouterFavori(
        userId: number,
        placeId: number,
    ) {
        this.validerIdentifiants(
            userId,
            placeId,
        );

        const utilisateur =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    estActif: true,
                },
            });

        if (!utilisateur) {
            throw new RpcException(
                'Utilisateur introuvable.',
            );
        }

        if (!utilisateur.estActif) {
            throw new RpcException(
                'Utilisateur inactif.',
            );
        }

        const lieu =
            await this.prisma.place.findUnique({
                where: {
                    id: placeId,
                },
                select: {
                    id: true,
                    nom: true,
                    slug: true,
                    estActif: true,
                },
            });

        if (!lieu) {
            throw new RpcException(
                'Lieu introuvable.',
            );
        }

        if (!lieu.estActif) {
            throw new RpcException(
                'Ce lieu est actuellement indisponible.',
            );
        }

        const favoriExistant =
            await this.prisma.favorite.findUnique({
                where: {
                    userId_placeId: {
                        userId,
                        placeId,
                    },
                },
                include: {
                    place: {
                        select: {
                            id: true,
                            nom: true,
                            slug: true,
                            ville: true,
                            thumbnailUrl: true,
                            latitude: true,
                            longitude: true,
                            estVedette: true,
                        },
                    },
                },
            });

        if (favoriExistant) {
            return {
                favori: favoriExistant,
                dejaFavori: true,
                message:
                    'Ce lieu est déjà dans les favoris.',
            };
        }

        const favori =
            await this.prisma.favorite.create({
                data: {
                    userId,
                    placeId,
                },
                include: {
                    place: {
                        select: {
                            id: true,
                            nom: true,
                            slug: true,
                            ville: true,
                            thumbnailUrl: true,
                            latitude: true,
                            longitude: true,
                            estVedette: true,
                        },
                    },
                },
            });

        return {
            favori,
            dejaFavori: false,
            message:
                'Lieu ajouté aux favoris avec succès.',
        };
    }

    async listerFavoris(
        userId: number,
    ) {
        this.validerUserId(userId);

        const utilisateur =
            await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    estActif: true,
                },
            });

        if (!utilisateur) {
            throw new RpcException(
                'Utilisateur introuvable.',
            );
        }

        if (!utilisateur.estActif) {
            throw new RpcException(
                'Utilisateur inactif.',
            );
        }

        const favoris =
            await this.prisma.favorite.findMany({
                where: {
                    userId,
                    place: {
                        estActif: true,
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    place: {
                        select: {
                            id: true,
                            nom: true,
                            slug: true,
                            resume: true,
                            ville: true,
                            thumbnailUrl: true,
                            latitude: true,
                            longitude: true,
                            estVedette: true,
                            note: true,
                            nombreAvis: true,
                            region: {
                                select: {
                                    id: true,
                                    nom: true,
                                    slug: true,
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
                        },
                    },
                },
            });

        return {
            userId,
            total: favoris.length,
            favoris,
        };
    }

    async supprimerFavori(
        userId: number,
        placeId: number,
    ) {
        this.validerIdentifiants(
            userId,
            placeId,
        );

        const favori =
            await this.prisma.favorite.findUnique({
                where: {
                    userId_placeId: {
                        userId,
                        placeId,
                    },
                },
            });

        if (!favori) {
            return {
                supprime: false,
                message:
                    'Ce lieu n’était pas dans les favoris.',
            };
        }

        await this.prisma.favorite.delete({
            where: {
                userId_placeId: {
                    userId,
                    placeId,
                },
            },
        });

        return {
            supprime: true,
            message:
                'Favori supprimé avec succès.',
        };
    }

    async estFavori(
        userId: number,
        placeId: number,
    ) {
        this.validerIdentifiants(
            userId,
            placeId,
        );

        const favori =
            await this.prisma.favorite.findUnique({
                where: {
                    userId_placeId: {
                        userId,
                        placeId,
                    },
                },
                select: {
                    id: true,
                },
            });

        return {
            userId,
            placeId,
            estFavori:
                favori !== null,
        };
    }

    private validerIdentifiants(
        userId: number,
        placeId: number,
    ): void {
        this.validerUserId(userId);

        if (
            !Number.isInteger(placeId) ||
            placeId <= 0
        ) {
            throw new RpcException(
                'placeId doit être un entier positif.',
            );
        }
    }

    private validerUserId(
        userId: number,
    ): void {
        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            throw new RpcException(
                'userId doit être un entier positif.',
            );
        }
    }
}