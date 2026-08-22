import {
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    ClientProxy,
    RpcException,
} from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { firstValueFrom } from 'rxjs';

export interface InscriptionPayload {
    email: string;
    prenom: string;
    nom: string;
    password: string;
    displayName?: string;
}

@Injectable()
export class AuthServiceService {
    private readonly nombreRounds =
        12;

    constructor(
        @Inject('USERS_SERVICE')
        private readonly usersClient:
            ClientProxy,
    ) { }

    getHealth() {
        return {
            service:
                'auth-service',
            status:
                'ok',
            timestamp:
                new Date().toISOString(),
        };
    }

    async inscrire(
        payload: InscriptionPayload,
    ) {
        const email =
            payload.email
                ?.trim()
                .toLowerCase();

        const prenom =
            payload.prenom
                ?.trim();

        const nom =
            payload.nom
                ?.trim();

        const password =
            payload.password;

        const displayName =
            payload.displayName
                ?.trim() ||
            undefined;

        if (!email) {
            throw new RpcException(
                'L’adresse courriel est obligatoire.',
            );
        }

        const formatEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatEmail.test(email)) {
            throw new RpcException(
                'L’adresse courriel est invalide.',
            );
        }

        if (!prenom) {
            throw new RpcException(
                'Le prénom est obligatoire.',
            );
        }

        if (!nom) {
            throw new RpcException(
                'Le nom est obligatoire.',
            );
        }

        if (
            typeof password !==
            'string' ||
            password.length < 8
        ) {
            throw new RpcException(
                'Le mot de passe doit contenir au moins 8 caractères.',
            );
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                this.nombreRounds,
            );

        const reponse =
            await firstValueFrom(
                this.usersClient.send(
                    {
                        cmd:
                            'users.create',
                    },
                    {
                        email,
                        prenom,
                        nom,
                        passwordHash,
                        displayName,
                    },
                ),
            );

        return {
            ...reponse,
            message:
                'Compte créé avec succès.',
        };
    }
}