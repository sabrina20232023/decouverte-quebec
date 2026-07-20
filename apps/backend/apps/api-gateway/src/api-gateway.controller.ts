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
import { PlacesResponseDto } from './dto/places-response.dto';
import { RegionCountResponseDto } from './dto/region-count-response.dto';
import { RegionDetailsResponseDto } from './dto/region-details-response.dto';

interface ServiceHealth {
    service: string;
    status: string;
    timestamp: string;
}

@ApiTags('Lieux', 'Régions')
@Controller('api')
export class ApiGatewayController {
    constructor(
        @Inject('PLACES_SERVICE')
        private readonly placesClient: ClientProxy,

        @Inject('REGIONS_SERVICE')
        private readonly regionsClient: ClientProxy,
    ) { }

    @ApiTags('Santé')
    @ApiOperation({
        summary: 'Vérifier l’état de l’API Gateway',
    })
    @ApiOkResponse({
        description: 'API Gateway fonctionnelle',
    })
    @Get('health')
    getGatewayHealth(): {
        service: string;
        status: string;
    } {
        return {
            service: 'api-gateway',
            status: 'ok',
        };
    }

    @ApiTags('Santé')
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

    @ApiTags('Lieux')
    @ApiOperation({
        summary: 'Récupérer la liste paginée des lieux',
        description:
            'Retourne les lieux avec filtres de recherche, région, catégorie, pagination et tri.',
    })
    @ApiOkResponse({
        description:
            'Liste paginée des lieux récupérée avec succès',
        type: PlacesResponseDto,
    })
    @Get('places')
    getPlaces(
        @Query() filters: PlaceFiltersDto,
    ): Observable<PlacesResponseDto> {
        const normalizedFilters: PlaceFiltersDto = {
            recherche:
                filters.recherche?.trim() || undefined,
            region: filters.region?.trim() || undefined,
            categorie:
                filters.categorie?.trim() || undefined,
            page: filters.page ?? 1,
            limit: filters.limit ?? 10,
            tri: filters.tri ?? 'nom',
            ordre: filters.ordre ?? 'asc',
        };

        return this.placesClient.send<PlacesResponseDto>(
            { cmd: 'places.findAll' },
            normalizedFilters,
        );
    }

    @ApiTags('Lieux')
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
            throw new NotFoundException(
                'Lieu introuvable',
            );
        }

        return place;
    }

    @ApiTags('Santé')
    @ApiOperation({
        summary:
            'Vérifier l’état du service des régions',
    })
    @ApiOkResponse({
        description: 'Regions Service fonctionnel',
    })
    @Get('regions/health')
    getRegionsHealth(): Observable<ServiceHealth> {
        return this.regionsClient.send<ServiceHealth>(
            { cmd: 'regions.health' },
            {},
        );
    }

    @ApiTags('Régions')
    @ApiOperation({
        summary: 'Récupérer toutes les régions',
        description:
            'Retourne les régions avec le nombre de lieux associés.',
    })
    @ApiOkResponse({
        description:
            'Liste des régions récupérée avec succès',
        type: RegionCountResponseDto,
        isArray: true,
    })
    @Get('regions')
    getRegions(): Observable<RegionCountResponseDto[]> {
        return this.regionsClient.send<
            RegionCountResponseDto[]
        >(
            { cmd: 'regions.findAll' },
            {},
        );
    }

    @ApiTags('Régions')
    @ApiOperation({
        summary: 'Récupérer une région par son slug',
        description:
            'Retourne une région et tous les lieux qui lui sont associés.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        example: 'capitale-nationale',
        description: 'Slug de la région',
    })
    @ApiOkResponse({
        description: 'Région récupérée avec succès',
        type: RegionDetailsResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Région introuvable',
    })
    @Get('regions/slug/:slug')
    async getRegionBySlug(
        @Param('slug') slug: string,
    ): Promise<RegionDetailsResponseDto> {
        const normalizedSlug = slug.trim().toLowerCase();

        const region = await firstValueFrom(
            this.regionsClient.send<
                RegionDetailsResponseDto | null
            >(
                { cmd: 'regions.findBySlug' },
                normalizedSlug,
            ),
        );

        if (!region) {
            throw new NotFoundException(
                'Région introuvable',
            );
        }

        return region;
    }

    @ApiTags('Régions')
    @ApiOperation({
        summary:
            'Récupérer une région par son identifiant',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
        description:
            'Identifiant numérique de la région',
    })
    @ApiOkResponse({
        description: 'Région récupérée avec succès',
        type: RegionCountResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'Identifiant invalide ou inférieur ou égal à zéro',
    })
    @ApiNotFoundResponse({
        description: 'Région introuvable',
    })
    @Get('regions/:id')
    async getRegionById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RegionCountResponseDto> {
        if (id <= 0) {
            throw new BadRequestException(
                'L’identifiant de la région doit être supérieur à zéro.',
            );
        }

        const region = await firstValueFrom(
            this.regionsClient.send<
                RegionCountResponseDto | null
            >(
                { cmd: 'regions.findOne' },
                id,
            ),
        );

        if (!region) {
            throw new NotFoundException(
                'Région introuvable',
            );
        }

        return region;
    }
}