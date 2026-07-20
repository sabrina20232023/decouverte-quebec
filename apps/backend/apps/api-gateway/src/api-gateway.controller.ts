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
    ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom, Observable } from 'rxjs';
import { PlaceFiltersDto } from './dto/place-filters.dto';
import { PlaceResponseDto } from './dto/place-response.dto';

interface ServiceHealth {
    service: string;
    status: string;
    timestamp: string;
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
            'Retourne tous les lieux avec possibilité de filtrer par recherche, région ou catégorie.',
    })
    @ApiOkResponse({
        description: 'Liste des lieux récupérée avec succès',
        type: PlaceResponseDto,
        isArray: true,
    })
    @Get('places')
    getPlaces(
        @Query() filters: PlaceFiltersDto,
    ): Observable<PlaceResponseDto[]> {
        const normalizedFilters: PlaceFiltersDto = {
            recherche: filters.recherche?.trim() || undefined,
            region: filters.region?.trim() || undefined,
            categorie: filters.categorie?.trim() || undefined,
        };

        return this.placesClient.send<PlaceResponseDto[]>(
            { cmd: 'places.findAll' },
            normalizedFilters,
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
        type: PlaceResponseDto,
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
    ): Promise<PlaceResponseDto> {
        if (id <= 0) {
            throw new BadRequestException(
                'L’identifiant du lieu doit être supérieur à zéro.',
            );
        }

        const place = await firstValueFrom(
            this.placesClient.send<PlaceResponseDto | null>(
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