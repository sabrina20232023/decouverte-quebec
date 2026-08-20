import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import {
    firstValueFrom,
    map,
    Observable,
} from 'rxjs';

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

interface ImportRegionPayload {
    provinceSlug: string;
    regionSlug: string;
}

interface ImportRegionResponse {
    provinceSlug: string;
    regionSlug: string;
    total: number;
    crees: number;
    misAJour: number;
    ignores: number;
    erreurs: Array<{
        placeId?: string;
        nom?: string;
        message: string;
    }>;
}

interface ImportAllResponse {
    regions: number;
    lieuxCrees: number;
    lieuxMisAJour: number;
    lieuxIgnores: number;
    erreurs: Array<{
        placeId?: string;
        nom?: string;
        message: string;
    }>;
}

interface WeatherCoordinatesPayload {
    latitude: number;
    longitude: number;
    placeId?: number;
}

interface PlaceDetailResponse {
    place: PlaceResponseDto;
    meteo: unknown | null;
}

interface AjouterFavoriBody {
    userId: number;
    placeId: number;
}

@ApiTags('Lieux', 'Régions')
@Controller('api')
export class ApiGatewayController {
    constructor(
        @Inject('PLACES_SERVICE')
        private readonly placesClient: ClientProxy,

        @Inject('REGIONS_SERVICE')
        private readonly regionsClient: ClientProxy,

        @Inject('WEATHER_SERVICE')
        private readonly weatherClient: ClientProxy,

        @Inject('FAVORITES_SERVICE')
        private readonly favoritesClient: ClientProxy,
    ) { }

    @ApiTags('Santé')
    @ApiOperation({
        summary:
            'Vérifier l’état de l’API Gateway',
    })
    @ApiOkResponse({
        description:
            'API Gateway fonctionnelle',
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
        summary:
            'Vérifier l’état du service des lieux',
    })
    @ApiOkResponse({
        description:
            'Places Service fonctionnel',
    })
    @Get('places/health')
    getPlacesHealth(): Observable<ServiceHealth> {
        return this.placesClient.send<ServiceHealth>(
            {
                cmd: 'places.health',
            },
            {},
        );
    }

    @ApiTags('Geoapify')
    @ApiOperation({
        summary:
            'Tester la connexion avec Geoapify',
    })
    @Get('places/geoapify/test')
    testerGeoapify() {
        return this.placesClient.send(
            {
                cmd: 'places.geoapify.test',
            },
            {},
        );
    }

    @ApiTags('Geoapify')
    @ApiOperation({
        summary:
            'Rechercher des lieux au Québec via Geoapify',
    })
    @Get('places/geoapify/quebec')
    geoapifyQuebec() {
        return this.placesClient.send(
            {
                cmd:
                    'places.geoapify.quebec',
            },
            {},
        );
    }

    @ApiTags('Images')
    @ApiOperation({
        summary:
            'Tester la recherche d’une image sur Wikimedia Commons',
        description:
            'Recherche une image correspondant à un lieu touristique sans l’enregistrer dans la base de données.',
    })
    @ApiOkResponse({
        description:
            'Résultat de la recherche Wikimedia',
    })
    @ApiBadRequestResponse({
        description:
            'Le nom du lieu est absent',
    })
    @Get('places/images/test')
    testerImageWikimedia(
        @Query('nom')
        nom: string,

        @Query('ville')
        ville?: string,

        @Query('province')
        province?: string,
    ) {
        const nomNormalise =
            nom?.trim();

        if (!nomNormalise) {
            throw new BadRequestException(
                'Le paramètre nom est obligatoire.',
            );
        }

        return this.placesClient.send(
            {
                cmd:
                    'places.images.test',
            },
            {
                nom:
                    nomNormalise,
                ville:
                    ville?.trim() ||
                    undefined,
                province:
                    province?.trim() ||
                    undefined,
            },
        );
    }

    @ApiTags('Importation')
    @ApiOperation({
        summary:
            'Importer les lieux Geoapify d’une région',
        description:
            'Déclenche l’importation des lieux Geoapify pour une région configurée dans le Places Service.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: [
                'provinceSlug',
                'regionSlug',
            ],
            properties: {
                provinceSlug: {
                    type: 'string',
                    example:
                        'quebec',
                },
                regionSlug: {
                    type: 'string',
                    example:
                        'capitale-nationale',
                },
            },
        },
    })
    @ApiOkResponse({
        description:
            'Importation terminée avec succès',
        schema: {
            example: {
                provinceSlug:
                    'quebec',
                regionSlug:
                    'capitale-nationale',
                total: 20,
                crees: 18,
                misAJour: 0,
                ignores: 2,
                erreurs: [],
            },
        },
    })
    @ApiBadRequestResponse({
        description:
            'Province ou région manquante dans la requête',
    })
    @Post('places/import/region')
    importerRegion(
        @Body()
        body: ImportRegionPayload,
    ): Observable<ImportRegionResponse> {
        const provinceSlug =
            body.provinceSlug
                ?.trim()
                .toLowerCase();

        const regionSlug =
            body.regionSlug
                ?.trim()
                .toLowerCase();

        if (
            !provinceSlug ||
            !regionSlug
        ) {
            throw new BadRequestException(
                'provinceSlug et regionSlug sont obligatoires.',
            );
        }

        return this.placesClient.send<ImportRegionResponse>(
            {
                cmd:
                    'places.import.region',
            },
            {
                provinceSlug,
                regionSlug,
            },
        );
    }

    @ApiTags('Importation')
    @ApiOperation({
        summary:
            'Importer les lieux Geoapify de toutes les régions actives',
        description:
            'Déclenche l’importation Geoapify pour chaque région marquée estActive: true dans la configuration du Places Service, puis retourne un bilan agrégé.',
    })
    @ApiOkResponse({
        description:
            'Importation terminée avec succès',
        schema: {
            example: {
                regions: 5,
                lieuxCrees: 268,
                lieuxMisAJour: 41,
                lieuxIgnores: 3,
                erreurs: [],
            },
        },
    })
    @Post('places/import/all')
    importerToutesLesRegions(): Observable<ImportAllResponse> {
        return this.placesClient
            .send<ImportRegionResponse[]>(
                {
                    cmd:
                        'places.import.all',
                },
                {},
            )
            .pipe(
                map((bilans) =>
                    this.agregerBilans(
                        bilans,
                    ),
                ),
            );
    }

    private agregerBilans(
        bilans: ImportRegionResponse[],
    ): ImportAllResponse {
        return {
            regions:
                bilans.length,

            lieuxCrees:
                bilans.reduce(
                    (
                        total,
                        bilan,
                    ) =>
                        total +
                        bilan.crees,
                    0,
                ),

            lieuxMisAJour:
                bilans.reduce(
                    (
                        total,
                        bilan,
                    ) =>
                        total +
                        bilan.misAJour,
                    0,
                ),

            lieuxIgnores:
                bilans.reduce(
                    (
                        total,
                        bilan,
                    ) =>
                        total +
                        bilan.ignores,
                    0,
                ),

            erreurs:
                bilans.flatMap(
                    (bilan) =>
                        bilan.erreurs,
                ),
        };
    }

    @ApiTags('Lieux')
    @ApiOperation({
        summary:
            'Récupérer la liste paginée des lieux',
        description:
            'Retourne les lieux avec filtres de recherche, région, catégorie, pagination et tri.',
    })
    @ApiOkResponse({
        description:
            'Liste paginée des lieux récupérée avec succès',
        type:
            PlacesResponseDto,
    })
    @Get('places')
    getPlaces(
        @Query()
        filters: PlaceFiltersDto,
    ): Observable<PlacesResponseDto> {
        const normalizedFilters: PlaceFiltersDto =
        {
            recherche:
                filters.recherche
                    ?.trim() ||
                undefined,

            province:
                filters.province
                    ?.trim() ||
                undefined,

            region:
                filters.region
                    ?.trim() ||
                undefined,

            categorie:
                filters.categorie
                    ?.trim() ||
                undefined,

            activite:
                filters.activite
                    ?.trim() ||
                undefined,

            ville:
                filters.ville
                    ?.trim() ||
                undefined,

            estVedette:
                filters.estVedette,

            page:
                filters.page ??
                1,

            limit:
                filters.limit ??
                10,

            tri:
                filters.tri ??
                'nom',

            ordre:
                filters.ordre ??
                'asc',
        };

        return this.placesClient.send<PlacesResponseDto>(
            {
                cmd:
                    'places.findAll',
            },
            normalizedFilters,
        );
    }

    @ApiTags('Lieux')
    @ApiOperation({
        summary:
            'Récupérer un lieu par son identifiant',
        description:
            'Retourne les informations détaillées d’un lieu, incluant sa région et sa catégorie.',
    })
    @ApiParam({
        name: 'id',
        required: true,
        type: Number,
        example: 1,
        description:
            'Identifiant numérique du lieu',
    })
    @ApiOkResponse({
        description:
            'Lieu récupéré avec succès',
        type:
            PlaceResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'Identifiant invalide ou inférieur ou égal à zéro',
    })
    @ApiNotFoundResponse({
        description:
            'Lieu introuvable',
    })
    @Get('places/:id')
    async getPlaceById(
        @Param(
            'id',
            ParseIntPipe,
        )
        id: number,
    ): Promise<PlaceResponseDto> {
        if (id <= 0) {
            throw new BadRequestException(
                'L’identifiant du lieu doit être supérieur à zéro.',
            );
        }

        return this.recupererLieuParId(id);
    }

    @ApiTags('Lieux')
    @ApiOperation({
        summary:
            'Récupérer la fiche enrichie d’un lieu (lieu + météo)',
        description:
            'Combine en un seul appel les informations du lieu (Places Service) et sa météo complète (Weather Service, avec cache Prisma activé via placeId). Évite au frontend de faire deux requêtes séparées.',
    })
    @ApiParam({
        name: 'id',
        required: true,
        type: Number,
        example: 1,
        description: 'Identifiant numérique du lieu',
    })
    @ApiOkResponse({
        description:
            'Fiche enrichie récupérée avec succès',
        schema: {
            example: {
                place: {
                    id: 1,
                    nom: 'Chute Montmorency',
                    latitude: 46.8878,
                    longitude: -71.1497,
                },
                meteo: {
                    fournisseur: 'OpenWeather',
                    actuelle: {},
                    previsions: [],
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description:
            'Identifiant invalide ou inférieur ou égal à zéro',
    })
    @ApiNotFoundResponse({
        description: 'Lieu introuvable',
    })
    @Get('places/:id/detail')
    async getPlaceDetail(
        @Param(
            'id',
            ParseIntPipe,
        )
        id: number,
    ): Promise<PlaceDetailResponse> {
        if (id <= 0) {
            throw new BadRequestException(
                'L’identifiant du lieu doit être supérieur à zéro.',
            );
        }

        const place =
            await this.recupererLieuParId(id);

        if (
            place.latitude == null ||
            place.longitude == null
        ) {
            return {
                place,
                meteo: null,
            };
        }

        let meteo: unknown | null = null;

        try {
            meteo =
                await firstValueFrom(
                    this.weatherClient.send(
                        {
                            cmd: 'weather.complete',
                        },
                        {
                            latitude:
                                place.latitude,
                            longitude:
                                place.longitude,
                            placeId:
                                place.id,
                        },
                    ),
                );
        } catch {
            meteo = null;
        }

        return {
            place,
            meteo,
        };
    }

    /**
     * Récupère un lieu par son identifiant auprès du Places
     * Service, ou lève NotFoundException s'il n'existe pas.
     * Factorisé car utilisé par getPlaceById() et getPlaceDetail().
     */
    private async recupererLieuParId(
        id: number,
    ): Promise<PlaceResponseDto> {
        const place =
            await firstValueFrom(
                this.placesClient.send<
                    PlaceResponseDto |
                    null
                >(
                    {
                        cmd:
                            'places.findOne',
                    },
                    {
                        id,
                    },
                ),
            );

        if (!place) {
            throw new NotFoundException(
                'Lieu introuvable',
            );
        }

        return place;
    }

    @ApiTags('Lieux')
    @ApiOperation({
        summary:
            'Récupérer un lieu par son slug',
        description:
            'Retourne les informations détaillées d’un lieu à partir de son slug.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        example:
            'chute-montmorency',
        description:
            'Slug du lieu',
    })
    @ApiOkResponse({
        description:
            'Lieu récupéré avec succès',
        type:
            PlaceResponseDto,
    })
    @ApiNotFoundResponse({
        description:
            'Lieu introuvable',
    })
    @Get('places/slug/:slug')
    async getPlaceBySlug(
        @Param('slug')
        slug: string,
    ): Promise<PlaceResponseDto> {
        const normalizedSlug =
            slug
                .trim()
                .toLowerCase();

        const place =
            await firstValueFrom(
                this.placesClient.send<
                    PlaceResponseDto |
                    null
                >(
                    {
                        cmd:
                            'places.findBySlug',
                    },
                    {
                        slug:
                            normalizedSlug,
                    },
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
        description:
            'Regions Service fonctionnel',
    })
    @Get('regions/health')
    getRegionsHealth(): Observable<ServiceHealth> {
        return this.regionsClient.send<ServiceHealth>(
            {
                cmd:
                    'regions.health',
            },
            {},
        );
    }

    @ApiTags('Régions')
    @ApiOperation({
        summary:
            'Récupérer toutes les régions',
        description:
            'Retourne les régions avec le nombre de lieux associés.',
    })
    @ApiOkResponse({
        description:
            'Liste des régions récupérée avec succès',
        type:
            RegionCountResponseDto,
        isArray: true,
    })
    @Get('regions')
    getRegions(): Observable<
        RegionCountResponseDto[]
    > {
        return this.regionsClient.send<
            RegionCountResponseDto[]
        >(
            {
                cmd:
                    'regions.findAll',
            },
            {},
        );
    }

    @ApiTags('Régions')
    @ApiOperation({
        summary:
            'Récupérer une région par son slug',
        description:
            'Retourne une région et tous les lieux qui lui sont associés.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        example:
            'capitale-nationale',
        description:
            'Slug de la région',
    })
    @ApiOkResponse({
        description:
            'Région récupérée avec succès',
        type:
            RegionDetailsResponseDto,
    })
    @ApiNotFoundResponse({
        description:
            'Région introuvable',
    })
    @Get('regions/slug/:slug')
    async getRegionBySlug(
        @Param('slug')
        slug: string,
    ): Promise<RegionDetailsResponseDto> {
        const normalizedSlug =
            slug
                .trim()
                .toLowerCase();

        const region =
            await firstValueFrom(
                this.regionsClient.send<
                    RegionDetailsResponseDto |
                    null
                >(
                    {
                        cmd:
                            'regions.findBySlug',
                    },
                    {
                        slug:
                            normalizedSlug,
                    },
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
        description:
            'Région récupérée avec succès',
        type:
            RegionCountResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'Identifiant invalide ou inférieur ou égal à zéro',
    })
    @ApiNotFoundResponse({
        description:
            'Région introuvable',
    })
    @Get('regions/:id')
    async getRegionById(
        @Param(
            'id',
            ParseIntPipe,
        )
        id: number,
    ): Promise<RegionCountResponseDto> {
        if (id <= 0) {
            throw new BadRequestException(
                'L’identifiant de la région doit être supérieur à zéro.',
            );
        }

        const region =
            await firstValueFrom(
                this.regionsClient.send<
                    RegionCountResponseDto |
                    null
                >(
                    {
                        cmd:
                            'regions.findOne',
                    },
                    {
                        id,
                    },
                ),
            );

        if (!region) {
            throw new NotFoundException(
                'Région introuvable',
            );
        }

        return region;
    }

    @ApiTags('Météo')
    @ApiOperation({
        summary:
            'Vérifier l’état du service météo',
    })
    @ApiOkResponse({
        description:
            'Weather Service fonctionnel',
    })
    @Get('weather/health')
    getWeatherHealth(): Observable<ServiceHealth> {
        return this.weatherClient.send<ServiceHealth>(
            {
                cmd: 'weather.health',
            },
            {},
        );
    }

    @ApiTags('Météo')
    @ApiOperation({
        summary:
            'Récupérer la météo actuelle pour des coordonnées',
        description:
            'Retourne la température, l’humidité, le vent et les conditions actuelles pour la position donnée.',
    })
    @ApiQuery({
        name: 'latitude',
        type: Number,
        example: 46.8139,
        description: 'Latitude du lieu (-90 à 90)',
    })
    @ApiQuery({
        name: 'longitude',
        type: Number,
        example: -71.208,
        description: 'Longitude du lieu (-180 à 180)',
    })
    @ApiOkResponse({
        description:
            'Météo actuelle récupérée avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'Latitude ou longitude manquante ou invalide',
    })
    @Get('weather/current')
    getWeatherCurrent(
        @Query('latitude')
        latitude?: string,

        @Query('longitude')
        longitude?: string,
    ) {
        const coordonnees =
            this.validerCoordonneesMeteo(
                latitude,
                longitude,
            );

        return this.weatherClient.send(
            {
                cmd: 'weather.current',
            },
            coordonnees,
        );
    }

    @ApiTags('Météo')
    @ApiOperation({
        summary:
            'Récupérer les prévisions météo (jusqu’à 5 jours)',
        description:
            'Retourne un tableau de prévisions quotidiennes pour la position donnée. Si placeId est fourni, la réponse passe par le cache Prisma du Weather Service.',
    })
    @ApiQuery({
        name: 'latitude',
        type: Number,
        example: 46.8139,
        description: 'Latitude du lieu (-90 à 90)',
    })
    @ApiQuery({
        name: 'longitude',
        type: Number,
        example: -71.208,
        description: 'Longitude du lieu (-180 à 180)',
    })
    @ApiQuery({
        name: 'placeId',
        type: Number,
        required: false,
        example: 1,
        description:
            'Identifiant du lieu, optionnel. Active le cache Prisma des prévisions quand fourni.',
    })
    @ApiOkResponse({
        description:
            'Prévisions météo récupérées avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'Latitude, longitude ou placeId manquant ou invalide',
    })
    @Get('weather/forecast')
    getWeatherForecast(
        @Query('latitude')
        latitude?: string,

        @Query('longitude')
        longitude?: string,

        @Query('placeId')
        placeId?: string,
    ) {
        const coordonnees =
            this.validerCoordonneesMeteo(
                latitude,
                longitude,
            );

        const placeIdValide =
            this.validerPlaceId(
                placeId,
            );

        return this.weatherClient.send(
            {
                cmd: 'weather.forecast',
            },
            {
                ...coordonnees,
                placeId: placeIdValide,
            },
        );
    }

    @ApiTags('Météo')
    @ApiOperation({
        summary:
            'Récupérer la météo complète (actuelle + prévisions)',
        description:
            'Retourne en une seule réponse la météo actuelle et les prévisions pour la position donnée. Utilisée notamment par la fiche détaillée d’un lieu. Si placeId est fourni, les prévisions passent par le cache Prisma du Weather Service.',
    })
    @ApiQuery({
        name: 'latitude',
        type: Number,
        example: 46.8139,
        description: 'Latitude du lieu (-90 à 90)',
    })
    @ApiQuery({
        name: 'longitude',
        type: Number,
        example: -71.208,
        description: 'Longitude du lieu (-180 à 180)',
    })
    @ApiQuery({
        name: 'placeId',
        type: Number,
        required: false,
        example: 1,
        description:
            'Identifiant du lieu, optionnel. Active le cache Prisma des prévisions quand fourni.',
    })
    @ApiOkResponse({
        description:
            'Météo complète récupérée avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'Latitude, longitude ou placeId manquant ou invalide',
    })
    @Get('weather/complete')
    getWeatherComplete(
        @Query('latitude')
        latitude?: string,

        @Query('longitude')
        longitude?: string,

        @Query('placeId')
        placeId?: string,
    ) {
        const coordonnees =
            this.validerCoordonneesMeteo(
                latitude,
                longitude,
            );

        const placeIdValide =
            this.validerPlaceId(
                placeId,
            );

        return this.weatherClient.send(
            {
                cmd: 'weather.complete',
            },
            {
                ...coordonnees,
                placeId: placeIdValide,
            },
        );
    }

    private validerCoordonneesMeteo(
        latitude?: string,
        longitude?: string,
    ): WeatherCoordinatesPayload {
        const latitudeNormalisee =
            latitude?.trim();

        const longitudeNormalisee =
            longitude?.trim();

        if (!latitudeNormalisee) {
            throw new BadRequestException(
                'Le paramètre latitude est obligatoire.',
            );
        }

        if (!longitudeNormalisee) {
            throw new BadRequestException(
                'Le paramètre longitude est obligatoire.',
            );
        }

        const latitudeNombre =
            Number(
                latitudeNormalisee,
            );

        const longitudeNombre =
            Number(
                longitudeNormalisee,
            );

        if (
            !Number.isFinite(
                latitudeNombre,
            ) ||
            latitudeNombre < -90 ||
            latitudeNombre > 90
        ) {
            throw new BadRequestException(
                'La latitude doit être comprise entre -90 et 90.',
            );
        }

        if (
            !Number.isFinite(
                longitudeNombre,
            ) ||
            longitudeNombre <
            -180 ||
            longitudeNombre >
            180
        ) {
            throw new BadRequestException(
                'La longitude doit être comprise entre -180 et 180.',
            );
        }

        return {
            latitude:
                latitudeNombre,
            longitude:
                longitudeNombre,
        };
    }

    /**
     * placeId est optionnel — il n'active que le cache Prisma des
     * prévisions côté Weather Service. Retourne undefined quand il
     * est absent (le microservice fonctionne alors sans cache), et
     * lève une erreur seulement s'il est fourni mais invalide.
     */
    private validerPlaceId(
        placeId?: string,
    ): number | undefined {
        const placeIdNormalise =
            placeId?.trim();

        if (!placeIdNormalise) {
            return undefined;
        }

        const placeIdNombre =
            Number(placeIdNormalise);

        if (
            !Number.isInteger(
                placeIdNombre,
            ) ||
            placeIdNombre <= 0
        ) {
            throw new BadRequestException(
                'Le paramètre placeId doit être un entier positif.',
            );
        }

        return placeIdNombre;
    }

    @ApiTags('Favoris')
    @ApiOperation({
        summary:
            'Vérifier l’état du service des favoris',
    })
    @ApiOkResponse({
        description:
            'Favorites Service fonctionnel',
    })
    @Get('favorites/health')
    getFavoritesHealth(): Observable<ServiceHealth> {
        return this.favoritesClient.send<ServiceHealth>(
            {
                cmd: 'favorites.health',
            },
            {},
        );
    }

    @ApiTags('Favoris')
    @ApiOperation({
        summary:
            'Ajouter un lieu aux favoris',
        description:
            'Ajoute un lieu aux favoris d’un utilisateur. Sans effet si le lieu y figure déjà (dejaFavori: true dans la réponse).',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['userId', 'placeId'],
            properties: {
                userId: {
                    type: 'number',
                    example: 1,
                },
                placeId: {
                    type: 'number',
                    example: 1,
                },
            },
        },
    })
    @ApiOkResponse({
        description:
            'Favori ajouté (ou déjà présent) avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'userId ou placeId manquant ou invalide',
    })
    @Post('favorites')
    ajouterFavori(
        @Body()
        body: AjouterFavoriBody,
    ) {
        const userId =
            this.validerIdRequis(
                body?.userId,
                'userId',
            );

        const placeId =
            this.validerIdRequis(
                body?.placeId,
                'placeId',
            );

        return this.favoritesClient.send(
            {
                cmd: 'favorites.add',
            },
            {
                userId,
                placeId,
            },
        );
    }

    @ApiTags('Favoris')
    @ApiOperation({
        summary:
            'Lister les favoris d’un utilisateur',
    })
    @ApiQuery({
        name: 'userId',
        type: Number,
        example: 1,
        description:
            'Identifiant numérique de l’utilisateur',
    })
    @ApiOkResponse({
        description:
            'Liste des favoris récupérée avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'userId manquant ou invalide',
    })
    @Get('favorites')
    listerFavoris(
        @Query('userId')
        userId?: string,
    ) {
        const userIdValide =
            this.validerIdRequisChaine(
                userId,
                'userId',
            );

        return this.favoritesClient.send(
            {
                cmd: 'favorites.list',
            },
            {
                userId: userIdValide,
            },
        );
    }

    @ApiTags('Favoris')
    @ApiOperation({
        summary:
            'Vérifier si un lieu est dans les favoris d’un utilisateur',
    })
    @ApiQuery({
        name: 'userId',
        type: Number,
        example: 1,
        description:
            'Identifiant numérique de l’utilisateur',
    })
    @ApiQuery({
        name: 'placeId',
        type: Number,
        example: 1,
        description:
            'Identifiant numérique du lieu',
    })
    @ApiOkResponse({
        description:
            'Statut du favori récupéré avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'userId ou placeId manquant ou invalide',
    })
    @Get('favorites/exists')
    estFavori(
        @Query('userId')
        userId?: string,

        @Query('placeId')
        placeId?: string,
    ) {
        const userIdValide =
            this.validerIdRequisChaine(
                userId,
                'userId',
            );

        const placeIdValide =
            this.validerIdRequisChaine(
                placeId,
                'placeId',
            );

        return this.favoritesClient.send(
            {
                cmd: 'favorites.exists',
            },
            {
                userId: userIdValide,
                placeId: placeIdValide,
            },
        );
    }

    @ApiTags('Favoris')
    @ApiOperation({
        summary:
            'Retirer un lieu des favoris',
    })
    @ApiParam({
        name: 'placeId',
        type: Number,
        example: 1,
        description:
            'Identifiant numérique du lieu à retirer des favoris',
    })
    @ApiQuery({
        name: 'userId',
        type: Number,
        example: 1,
        description:
            'Identifiant numérique de l’utilisateur',
    })
    @ApiOkResponse({
        description:
            'Favori supprimé (ou déjà absent) avec succès',
    })
    @ApiBadRequestResponse({
        description:
            'userId ou placeId manquant ou invalide',
    })
    @Delete('favorites/:placeId')
    supprimerFavori(
        @Param(
            'placeId',
            ParseIntPipe,
        )
        placeId: number,

        @Query('userId')
        userId?: string,
    ) {
        if (placeId <= 0) {
            throw new BadRequestException(
                'Le paramètre placeId doit être un entier positif.',
            );
        }

        const userIdValide =
            this.validerIdRequisChaine(
                userId,
                'userId',
            );

        return this.favoritesClient.send(
            {
                cmd: 'favorites.remove',
            },
            {
                userId: userIdValide,
                placeId,
            },
        );
    }

    /**
     * Valide un identifiant numérique requis provenant d'un body
     * JSON (déjà de type number, mais potentiellement absent).
     */
    private validerIdRequis(
        valeur: number | undefined,
        nomParametre: string,
    ): number {
        if (
            valeur === undefined ||
            valeur === null ||
            !Number.isInteger(valeur) ||
            valeur <= 0
        ) {
            throw new BadRequestException(
                `Le paramètre ${nomParametre} doit être un entier positif.`,
            );
        }

        return valeur;
    }

    /**
     * Valide un identifiant numérique requis provenant d'un
     * paramètre de requête (query string, donc reçu en chaîne).
     */
    private validerIdRequisChaine(
        valeur: string | undefined,
        nomParametre: string,
    ): number {
        const valeurNormalisee =
            valeur?.trim();

        if (!valeurNormalisee) {
            throw new BadRequestException(
                `Le paramètre ${nomParametre} est obligatoire.`,
            );
        }

        const valeurNombre =
            Number(valeurNormalisee);

        if (
            !Number.isInteger(
                valeurNombre,
            ) ||
            valeurNombre <= 0
        ) {
            throw new BadRequestException(
                `Le paramètre ${nomParametre} doit être un entier positif.`,
            );
        }

        return valeurNombre;
    }
}