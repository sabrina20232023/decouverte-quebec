import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreerUtilisateurPayload {
    email: string;
    prenom: string;
    nom: string;
    passwordHash: string;
    displayName?: string;
}

export interface ModifierUtilisateurPayload {
    id: number;
    prenom?: string;
    nom?: string;
    displayName?: string;
    avatarUrl?: string | null;
}

export interface ModifierStatutUtilisateurPayload {
    id: number;
    estActif: boolean;
}

@Injectable()
export class UsersServiceService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // ==================================================
    // CRÉATION
    // ==================================================

    async creerUtilisateur(
        email: string,
        prenom: string,
        nom: string,
        passwordHash: string,
        displayName?: string,
    ) {
        const emailNormalise =
            this.normaliserEmail(email);

        const prenomNormalise =
            prenom?.trim();

        const nomNormalise =
            nom?.trim();

        const passwordHashNormalise =
            passwordHash?.trim();

        if (!prenomNormalise) {
            throw new RpcException(
                'Le prénom est obligatoire.',
            );
        }

        if (!nomNormalise) {
            throw new RpcException(
                'Le nom est obligatoire.',
            );
        }

        if (!passwordHashNormalise) {
            throw new RpcException(
                'Le mot de passe est obligatoire.',
            );
        }

        const utilisateurExistant =
            await this.prisma.user.findUnique({
                where: {
                    email: emailNormalise,
                },
                select: {
                    id: true,
                },
            });

        if (utilisateurExistant) {
            throw new RpcException(
                'Un utilisateur avec cette adresse courriel existe déjà.',
            );
        }

        const nomAffichage =
            displayName?.trim() ||
            `${prenomNormalise} ${nomNormalise}`;

        const utilisateur =
            await this.prisma.user.create({
                data: {
                    email:
                        emailNormalise,

                    prenom:
                        prenomNormalise,

                    nom:
                        nomNormalise,

                    passwordHash:
                        passwordHashNormalise,

                    displayName:
                        nomAffichage,
                },

                select: {
                    id: true,
                    email: true,
                    prenom: true,
                    nom: true,
                    displayName: true,
                    avatarUrl: true,
                    role: true,
                    estActif: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return {
            utilisateur,
            message:
                'Utilisateur créé avec succès.',
        };
    }

    // ==================================================
    // RECHERCHE PAR ID
    // ==================================================

    async trouverParId(
        id: number,
    ) {
        this.validerId(id);

        const utilisateur =
            await this.prisma.user.findUnique({
                where: {
                    id,
                },

                select: {
                    id: true,
                    email: true,
                    prenom: true,
                    nom: true,
                    displayName: true,
                    avatarUrl: true,
                    role: true,
                    estActif: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        if (!utilisateur) {
            throw new RpcException(
                'Utilisateur introuvable.',
            );
        }

        return utilisateur;
    }

    // ==================================================
    // RECHERCHE PAR EMAIL
    // ==================================================

    async trouverParEmail(
        email: string,
    ) {
        const emailNormalise =
            this.normaliserEmail(email);

        const utilisateur =
            await this.prisma.user.findUnique({
                where: {
                    email:
                        emailNormalise,
                },

                select: {
                    id: true,
                    email: true,
                    prenom: true,
                    nom: true,
                    displayName: true,
                    avatarUrl: true,
                    role: true,
                    estActif: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        if (!utilisateur) {
            throw new RpcException(
                'Utilisateur introuvable.',
            );
        }

        return utilisateur;
    }

    // ==================================================
    // MODIFICATION DU PROFIL
    // ==================================================

    async modifierUtilisateur(
        id: number,
        donnees: {
            prenom?: string;
            nom?: string;
            displayName?: string;
            avatarUrl?: string | null;
        },
    ) {
        this.validerId(id);

        const utilisateurExistant =
            await this.prisma.user.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                },
            });

        if (!utilisateurExistant) {
            throw new RpcException(
                'Utilisateur introuvable.',
            );
        }

        const data: {
            prenom?: string;
            nom?: string;
            displayName?: string | null;
            avatarUrl?: string | null;
        } = {};

        if (
            donnees.prenom !==
            undefined
        ) {
            const prenom =
                donnees.prenom.trim();

            if (!prenom) {
                throw new RpcException(
                    'Le prénom ne peut pas être vide.',
                );
            }

            data.prenom =
                prenom;
        }

        if (
            donnees.nom !==
            undefined
        ) {
            const nom =
                donnees.nom.trim();

            if (!nom) {
                throw new RpcException(
                    'Le nom ne peut pas être vide.',
                );
            }

            data.nom =
                nom;
        }

        if (
            donnees.displayName !==
            undefined
        ) {
            const displayName =
                donnees.displayName.trim();

            data.displayName =
                displayName ||
                null;
        }

        if (
            donnees.avatarUrl !==
            undefined
        ) {
            const avatarUrl =
                donnees.avatarUrl
                    ?.trim();

            data.avatarUrl =
                avatarUrl ||
                null;
        }

        if (
            Object.keys(data).length ===
            0
        ) {
            throw new RpcException(
                'Aucune donnée à modifier.',
            );
        }

        const utilisateur =
            await this.prisma.user.update({
                where: {
                    id,
                },

                data,

                select: {
                    id: true,
                    email: true,
                    prenom: true,
                    nom: true,
                    displayName: true,
                    avatarUrl: true,
                    role: true,
                    estActif: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return {
            utilisateur,
            message:
                'Profil utilisateur mis à jour avec succès.',
        };
    }

    // ==================================================
    // ACTIVATION / DÉSACTIVATION
    // ==================================================

    async modifierStatutUtilisateur(
        id: number,
        estActif: boolean,
    ) {
        this.validerId(id);

        if (typeof estActif !== 'boolean') {
            throw new RpcException(
                'Le paramètre estActif doit être un booléen.',
            );
        }

        const utilisateurExistant =
            await this.prisma.user.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                },
            });

        if (!utilisateurExistant) {
            throw new RpcException(
                'Utilisateur introuvable.',
            );
        }

        const utilisateur =
            await this.prisma.user.update({
                where: {
                    id,
                },
                data: {
                    estActif,
                },
                select: {
                    id: true,
                    email: true,
                    prenom: true,
                    nom: true,
                    displayName: true,
                    avatarUrl: true,
                    role: true,
                    estActif: true,
                    emailVerifiedAt: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return {
            utilisateur,
            message:
                estActif
                    ? 'Utilisateur réactivé avec succès.'
                    : 'Utilisateur désactivé avec succès.',
        };
    }

    // ==================================================
    // VALIDATION
    // ==================================================

    private validerId(
        id: number,
    ): void {
        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            throw new RpcException(
                'L’identifiant utilisateur doit être un entier positif.',
            );
        }
    }

    private normaliserEmail(
        email: string,
    ): string {
        const emailNormalise =
            email
                ?.trim()
                .toLowerCase();

        if (!emailNormalise) {
            throw new RpcException(
                'L’adresse courriel est obligatoire.',
            );
        }

        const formatEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !formatEmail.test(
                emailNormalise,
            )
        ) {
            throw new RpcException(
                'L’adresse courriel est invalide.',
            );
        }

        return emailNormalise;
    }
}