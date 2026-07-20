import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface ServiceHealth {
    service: string;
    status: string;
    timestamp: string;
}

interface Region {
    id: number;
    nom: string;
    slug: string;
    description: string | null;
}

interface Category {
    id: number;
    nom: string;
    icone: string | null;
}

interface Place {
    id: number;
    nom: string;
    description: string | null;
    adresse: string | null;
    ville: string | null;
    latitude: number;
    longitude: number;
    imageUrl: string | null;
    siteWeb: string | null;
    telephone: string | null;
    regionId: number;
    categoryId: number;
    createdAt: Date;
    updatedAt: Date;
    region: Region;
    category: Category;
}

@Controller('api')
export class ApiGatewayController {
    constructor(
        @Inject('PLACES_SERVICE')
        private readonly placesClient: ClientProxy,
    ) { }

    @Get('health')
    getGatewayHealth(): { service: string; status: string } {
        return {
            service: 'api-gateway',
            status: 'ok',
        };
    }

    @Get('places/health')
    getPlacesHealth(): Observable<ServiceHealth> {
        return this.placesClient.send<ServiceHealth>(
            { cmd: 'places.health' },
            {},
        );
    }

    @Get('places')
    getPlaces(): Observable<Place[]> {
        return this.placesClient.send<Place[]>(
            { cmd: 'places.findAll' },
            {},
        );
    }
}