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
import {
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Lieux')
@Controller('api')
export class ApiGatewayController {
    constructor(
        @Inject('PLACES_SERVICE')
        private readonly placesClient: ClientProxy,
    ) { }

    @ApiOperation({
        summary: 'Vérifier l’état de l’API Gateway',
    })
    @ApiOkResponse({
        description: 'API Gateway fonctionnelle',
    })
    @Get('health')
    getGatewayHealth(): { service: string; status: string } {
        return {
            service: 'api-gateway',
            status: 'ok',
        };
    }

    @ApiOperation({
        summary: 'Vérifier l’état du service des lieux',
    })
    @ApiOkResponse({
        description: 'Places Service fonctionnel',
    })
    @Get('places/health')
    getPlacesHealth(): Observable<ServiceHealth> {
        return this.placesClient.send<ServiceHealth>(
            { cmd: 'places.health' },
            {},
        );
    }

    @ApiOperation({
        summary: 'Récupérer la liste des lieux',
        description:
            'Retourne tous les lieux. Il est possible de filtrer les résultats par recherche, région ou catégorie.',
    })
    @ApiQuery({
        name: 'recherche',
        required: false,
        type: String,
        description:
            'Recherche dans le nom, la ville ou la description du lieu',
        example: 'mont',
    })
    @ApiQuery({
        name: 'region',
        required: false,
        type: String,
        description: 'Slug de la région',
        example: 'capitale-nationale',
    })
    @ApiQuery({
        name: 'categorie',
        required: false,
        type: String,
        description: 'Nom de la catégorie',
        example: 'Parc',
    })
    @ApiOkResponse({
        description: 'Liste des lieux récupérée avec succès',
    })
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

    @ApiOperation({
        summary: 'Récupérer un lieu par son identifiant',
        description:
            'Retourne les informations détaillées d’un lieu, incluant sa région et sa catégorie.',
    })
    @ApiParam({
        name: 'id',
        required: true,
        type: Number,
        example: 1,
        description: 'Identifiant numérique du lieu',
    })
    @ApiOkResponse({
        description: 'Lieu récupéré avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'Identifiant invalide ou inférieur ou égal à zéro',
    })
    @ApiNotFoundResponse({
        description: 'Lieu introuvable',
    })
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