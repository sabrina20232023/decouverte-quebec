import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import {
    GeoapifySearchParams,
    GeoapifyService,
} from './geoapify/geoapify.service';
import { ImageService } from './images/image.service';
import { ImportService } from './import/import.service';
import { PlacesServiceService } from './places-service.service';

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

interface GeoapifyTestPayload {
    latitude?: number;
    longitude?: number;
    rayon?: number;
    limite?: number;
    categories?: string[];
    langue?: 'fr' | 'en';
    seulementCanada?: boolean;
}

interface ImportRegionPayload {
    provinceSlug: string;
    regionSlug: string;
}

interface ImageTestPayload {
    nom: string;
    ville?: string;
    province?: string;
}

@Controller()
export class PlacesServiceController {
    constructor(
        private readonly placesService: PlacesServiceService,
        private readonly geoapifyService: GeoapifyService,
        private readonly importService: ImportService,
        private readonly imageService: ImageService,
    ) { }

    @MessagePattern({ cmd: 'places.health' })
    getHealth() {
        return {
            service: 'places-service',
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @MessagePattern({ cmd: 'places.findAll' })
    findAll(@Payload() filters: PlacesFilters = {}) {
        return this.placesService.findAll(filters);
    }

    @MessagePattern({ cmd: 'places.findOne' })
    findOne(@Payload() payload: { id: number } | number) {
        const id =
            typeof payload === 'number'
                ? payload
                : payload.id;

        return this.placesService.findOne(Number(id));
    }

    @MessagePattern({ cmd: 'places.findBySlug' })
    findBySlug(
        @Payload() payload: { slug: string } | string,
    ) {
        const slug =
            typeof payload === 'string'
                ? payload
                : payload.slug;

        return this.placesService.findBySlug(slug);
    }

    @MessagePattern({ cmd: 'places.geoapify.test' })
    async testerGeoapify(
        @Payload() payload: GeoapifyTestPayload = {},
    ) {
        const params: GeoapifySearchParams = {
            latitude: Number(
                payload.latitude ?? 46.8139,
            ),
            longitude: Number(
                payload.longitude ?? -71.208,
            ),
            rayon: Number(
                payload.rayon ?? 10_000,
            ),
            limite: Number(
                payload.limite ?? 20,
            ),
            categories: payload.categories,
            langue: payload.langue ?? 'fr',
            seulementCanada:
                payload.seulementCanada ?? true,
        };

        const lieux =
            await this.geoapifyService.rechercherLieuxProches(
                params,
            );

        return {
            fournisseur: 'Geoapify',
            recherche: {
                latitude: params.latitude,
                longitude: params.longitude,
                rayon: params.rayon,
                limite: params.limite,
                categories:
                    params.categories ?? 'catégories par défaut',
                langue: params.langue,
                seulementCanada:
                    params.seulementCanada,
            },
            total: lieux.length,
            lieux: lieux.map((lieu) => ({
                placeId:
                    lieu.properties.place_id,
                nom:
                    lieu.properties.name,
                adresse:
                    lieu.properties.formatted,
                ville:
                    lieu.properties.city ??
                    lieu.properties.municipality,
                province:
                    lieu.properties.state,
                pays:
                    lieu.properties.country,
                codePays:
                    lieu.properties.country_code,
                latitude:
                    lieu.properties.lat,
                longitude:
                    lieu.properties.lon,
                categories:
                    lieu.properties.categories ?? [],
                siteWeb:
                    lieu.properties.website,
                telephone:
                    lieu.properties.phone ??
                    lieu.properties.contact?.phone,
            })),
        };
    }

    @MessagePattern({
        cmd: 'places.geoapify.quebec',
    })
    async rechercherLieuxAuQuebec(
        @Payload() payload: GeoapifyTestPayload = {},
    ) {
        const latitude = Number(
            payload.latitude ?? 46.8139,
        );

        const longitude = Number(
            payload.longitude ?? -71.208,
        );

        const rayon = Number(
            payload.rayon ?? 10_000,
        );

        const limite = Number(
            payload.limite ?? 20,
        );

        const lieux =
            await this.geoapifyService.rechercherLieuxAuQuebec(
                latitude,
                longitude,
                rayon,
                limite,
            );

        return {
            fournisseur: 'Geoapify',
            territoire: 'Québec',
            total: lieux.length,
            lieux,
        };
    }

    @MessagePattern({ cmd: 'places.import.region' })
    importerRegion(
        @Payload() payload: ImportRegionPayload,
    ) {
        return this.importService.importerRegion(
            payload.provinceSlug,
            payload.regionSlug,
        );
    }

    @MessagePattern({ cmd: 'places.import.all' })
    importerToutesLesRegionsActives() {
        return this.importService.importerRegionsActives();
    }

    @MessagePattern({ cmd: 'places.images.test' })
    async testerRechercheImage(
        @Payload() payload: ImageTestPayload,
    ) {
        const image =
            await this.imageService.rechercherImagePourLieu(
                payload.nom,
                payload.ville,
                payload.province,
            );

        return {
            fournisseur: 'Wikimedia Commons',
            recherche: {
                nom: payload.nom,
                ville: payload.ville ?? null,
                province: payload.province ?? null,
            },
            trouvee: image !== null,
            image,
        };
    }
}