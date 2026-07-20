import {
    BadRequestException,
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

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

interface PlacesFilters {
    recherche?: string;
    region?: string;
    categorie?: string;
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
    getPlaces(
        @Query('recherche') recherche?: string,
        @Query('region') region?: string,
        @Query('categorie') categorie?: string,
    ): Observable<Place[]> {
        const filters: PlacesFilters = {
            recherche: recherche?.trim() || undefined,
            region: region?.trim() || undefined,
            categorie: categorie?.trim() || undefined,
        };

        return this.placesClient.send<Place[]>(
            { cmd: 'places.findAll' },
            filters,
        );
    }

    @Get('places/:id')
    async getPlaceById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Place> {
        if (id <= 0) {
            throw new BadRequestException(
                'L’identifiant du lieu doit être supérieur à zéro.',
            );
        }

        const place = await firstValueFrom(
            this.placesClient.send<Place | null>(
                { cmd: 'places.findOne' },
                id,
            ),
        );

        if (!place) {
            throw new NotFoundException('Lieu introuvable');
        }

        return place;
    }
}