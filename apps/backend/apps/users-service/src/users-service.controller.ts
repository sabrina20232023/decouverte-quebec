import { Controller } from '@nestjs/common';
import {
    MessagePattern,
    Payload,
} from '@nestjs/microservices';
import { UsersServiceService } from './users-service.service';
import type {
    CreerUtilisateurPayload,
    ModifierStatutUtilisateurPayload,
    ModifierUtilisateurPayload,
} from './users-service.service';

interface TrouverUtilisateurPayload {
    id: number;
}

interface TrouverUtilisateurEmailPayload {
    email: string;
}

@Controller()
export class UsersServiceController {
    constructor(
        private readonly usersService:
            UsersServiceService,
    ) { }

    @MessagePattern({
        cmd: 'users.health',
    })
    getHealth() {
        return {
            service:
                'users-service',
            status:
                'ok',
            timestamp:
                new Date().toISOString(),
        };
    }

    @MessagePattern({
        cmd: 'users.create',
    })
    creerUtilisateur(
        @Payload()
        payload: CreerUtilisateurPayload,
    ) {
        return this.usersService
            .creerUtilisateur(
                payload.email,
                payload.prenom,
                payload.nom,
                payload.passwordHash,
                payload.displayName,
            );
    }

    @MessagePattern({
        cmd: 'users.findOne',
    })
    trouverParId(
        @Payload()
        payload: TrouverUtilisateurPayload,
    ) {
        return this.usersService
            .trouverParId(
                Number(payload.id),
            );
    }

    @MessagePattern({
        cmd: 'users.findByEmail',
    })
    trouverParEmail(
        @Payload()
        payload: TrouverUtilisateurEmailPayload,
    ) {
        return this.usersService
            .trouverParEmail(
                payload.email,
            );
    }

    @MessagePattern({
        cmd: 'users.update',
    })
    modifierUtilisateur(
        @Payload()
        payload: ModifierUtilisateurPayload,
    ) {
        return this.usersService
            .modifierUtilisateur(
                Number(payload.id),
                {
                    prenom:
                        payload.prenom,
                    nom:
                        payload.nom,
                    displayName:
                        payload.displayName,
                    avatarUrl:
                        payload.avatarUrl,
                },
            );
    }

    @MessagePattern({
        cmd: 'users.setActive',
    })
    modifierStatutUtilisateur(
        @Payload()
        payload: ModifierStatutUtilisateurPayload,
    ) {
        return this.usersService
            .modifierStatutUtilisateur(
                Number(payload.id),
                payload.estActif,
            );
    }
}