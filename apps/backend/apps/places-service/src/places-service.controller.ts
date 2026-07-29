import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
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

@Controller()
export class PlacesServiceController {
    constructor(
        private readonly placesService: PlacesServiceService,
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
        const id = typeof payload === 'number' ? payload : payload.id;

        return this.placesService.findOne(Number(id));
    }

    @MessagePattern({ cmd: 'places.findBySlug' })
    findBySlug(@Payload() payload: { slug: string } | string) {
        const slug =
            typeof payload === 'string'
                ? payload
                : payload.slug;

        return this.placesService.findBySlug(slug);
    }
}