import { Controller } from '@nestjs/common';
import {
    MessagePattern,
    Payload,
} from '@nestjs/microservices';

import { FavoritesServiceService } from './favorites-service.service';
import type { AjouterFavoriPayload } from './favorites-service.service';

interface ListerFavorisPayload {
    userId: number;
}

interface SupprimerFavoriPayload {
    userId: number;
    placeId: number;
}

interface VerifierFavoriPayload {
    userId: number;
    placeId: number;
}

@Controller()
export class FavoritesServiceController {
    constructor(
        private readonly favoritesService:
            FavoritesServiceService,
    ) { }

    @MessagePattern({
        cmd: 'favorites.health',
    })
    health() {
        return {
            service:
                'favorites-service',
            status:
                'ok',
            timestamp:
                new Date().toISOString(),
        };
    }

    @MessagePattern({
        cmd: 'favorites.add',
    })
    ajouterFavori(
        @Payload()
        payload: AjouterFavoriPayload,
    ) {
        return this.favoritesService
            .ajouterFavori(
                Number(payload.userId),
                Number(payload.placeId),
            );
    }

    @MessagePattern({
        cmd: 'favorites.list',
    })
    listerFavoris(
        @Payload()
        payload: ListerFavorisPayload,
    ) {
        return this.favoritesService
            .listerFavoris(
                Number(payload.userId),
            );
    }

    @MessagePattern({
        cmd: 'favorites.remove',
    })
    supprimerFavori(
        @Payload()
        payload: SupprimerFavoriPayload,
    ) {
        return this.favoritesService
            .supprimerFavori(
                Number(payload.userId),
                Number(payload.placeId),
            );
    }

    @MessagePattern({
        cmd: 'favorites.exists',
    })
    estFavori(
        @Payload()
        payload: VerifierFavoriPayload,
    ) {
        return this.favoritesService
            .estFavori(
                Number(payload.userId),
                Number(payload.placeId),
            );
    }
}