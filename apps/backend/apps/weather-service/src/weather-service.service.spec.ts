import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';

import { WeatherServiceService } from './weather-service.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('WeatherServiceService', () => {
    let service: WeatherServiceService;

    let httpService: {
        get: jest.Mock;
    };

    let configService: {
        get: jest.Mock;
    };

    let prismaService: {
        weatherForecast: {
            findMany: jest.Mock;
            upsert: jest.Mock;
        };
    };

    const latitude = 46.8139;
    const longitude = -71.2080;
    const placeId = 1;

    const timestamp =
        Math.floor(
            Date.now() / 1000,
        );

    const forecastResponse = {
        cod: '200',
        message: 0,
        cnt: 1,

        list: [
            {
                dt: timestamp,

                main: {
                    temp: 20,
                    feels_like: 19,
                    temp_min: 18,
                    temp_max: 22,
                    pressure: 1015,
                    humidity: 60,
                },

                weather: [
                    {
                        id: 800,
                        main: 'Clear',
                        description:
                            'ciel dégagé',
                        icon: '01d',
                    },
                ],

                clouds: {
                    all: 10,
                },

                wind: {
                    speed: 3,
                    deg: 180,
                },

                visibility: 10000,

                pop: 0.2,
            },
        ],

        city: {
            id: 1,
            name: 'Québec',

            coord: {
                lat: latitude,
                lon: longitude,
            },

            country: 'CA',

            timezone: -14400,

            sunrise:
                timestamp - 10000,

            sunset:
                timestamp + 10000,
        },
    };

    const previsionCache = {
        id: 1,

        placeId,

        datePrevision:
            new Date(),

        temperatureMin: 18,

        temperatureMax: 22,

        temperatureRessentie: 19,

        humidite: 60,

        ventKmh: 10.8,

        probabilitePrecipitation: 20,

        condition: 'Clear',

        description:
            'ciel dégagé',

        icone: '01d',

        sourceApi:
            'OpenWeather',

        fetchedAt:
            new Date(),

        expiresAt:
            new Date(
                Date.now() +
                600_000,
            ),

        createdAt:
            new Date(),

        donneesCompletes: {
            date: '2026-08-22',

            resume: null,

            temperature: {
                matin: 18,
                jour: 20,
                soir: 19,
                nuit: 17,
                minimum: 17,
                maximum: 22,
            },

            temperatureRessentie: {
                matin: 18,
                jour: 19,
                soir: 18,
                nuit: 17,
            },

            condition:
                'Clear',

            description:
                'ciel dégagé',

            icone:
                '01d',

            iconeUrl:
                'https://openweathermap.org/img/wn/01d@2x.png',

            probabilitePrecipitation:
                20,

            pluieMillimetres:
                0,

            neigeMillimetres:
                0,

            humidite:
                60,

            pression:
                1015,

            nuages:
                10,

            vent: {
                vitesseMetresSeconde:
                    3,

                vitesseKmHeure:
                    10.8,

                directionDegres:
                    180,

                rafalesMetresSeconde:
                    null,

                rafalesKmHeure:
                    null,
            },

            leverSoleil:
                null,

            coucherSoleil:
                null,

            indiceUV:
                null,
        },
    };

    beforeEach(() => {
        httpService = {
            get:
                jest.fn(),
        };

        configService = {
            get:
                jest.fn(
                    (
                        cle: string,
                    ) => {
                        if (
                            cle ===
                            'OPENWEATHER_API_KEY'
                        ) {
                            return 'test-api-key';
                        }

                        if (
                            cle ===
                            'OPENWEATHER_BASE_URL'
                        ) {
                            return 'https://api.openweathermap.org/data/2.5';
                        }

                        return undefined;
                    },
                ),
        };

        prismaService = {
            weatherForecast: {
                findMany:
                    jest.fn(),

                upsert:
                    jest.fn(),
            },
        };

        service =
            new WeatherServiceService(
                httpService as unknown as HttpService,

                configService as unknown as ConfigService,

                prismaService as unknown as PrismaService,
            );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ==================================================
    // CACHE HIT
    // ==================================================

    it(
        'retourne le cache valide sans appeler OpenWeather',
        async () => {
            prismaService
                .weatherForecast
                .findMany
                .mockResolvedValue([
                    previsionCache,
                ]);

            const resultat =
                await service
                    .obtenirPrevisions(
                        latitude,
                        longitude,
                        placeId,
                    );

            expect(
                resultat,
            ).toHaveLength(1);

            expect(
                resultat[0].condition,
            ).toBe('Clear');

            expect(
                prismaService
                    .weatherForecast
                    .findMany,
            ).toHaveBeenCalledTimes(1);

            expect(
                httpService.get,
            ).not.toHaveBeenCalled();
        },
    );

    // ==================================================
    // CACHE MISS
    // ==================================================

    it(
        'appelle OpenWeather et sauvegarde le cache lors d’un CACHE MISS',
        async () => {
            prismaService
                .weatherForecast
                .findMany
                .mockResolvedValue([]);

            prismaService
                .weatherForecast
                .upsert
                .mockResolvedValue({});

            httpService.get.mockReturnValue(
                of({
                    data:
                        forecastResponse,
                }),
            );

            const resultat =
                await service
                    .obtenirPrevisions(
                        latitude,
                        longitude,
                        placeId,
                    );

            expect(
                resultat.length,
            ).toBeGreaterThan(0);

            expect(
                httpService.get,
            ).toHaveBeenCalledTimes(1);

            expect(
                prismaService
                    .weatherForecast
                    .upsert,
            ).toHaveBeenCalled();
        },
    );

    // ==================================================
    // SANS PLACE ID
    // ==================================================

    it(
        'appelle directement OpenWeather lorsque placeId est absent',
        async () => {
            httpService.get.mockReturnValue(
                of({
                    data:
                        forecastResponse,
                }),
            );

            const resultat =
                await service
                    .obtenirPrevisions(
                        latitude,
                        longitude,
                    );

            expect(
                resultat.length,
            ).toBeGreaterThan(0);

            expect(
                prismaService
                    .weatherForecast
                    .findMany,
            ).not.toHaveBeenCalled();

            expect(
                prismaService
                    .weatherForecast
                    .upsert,
            ).not.toHaveBeenCalled();

            expect(
                httpService.get,
            ).toHaveBeenCalledTimes(1);
        },
    );

    // ==================================================
    // PANNE PRISMA
    // ==================================================

    it(
        'continue avec OpenWeather si la lecture du cache Prisma échoue',
        async () => {
            prismaService
                .weatherForecast
                .findMany
                .mockRejectedValue(
                    new Error(
                        'Prisma indisponible',
                    ),
                );

            prismaService
                .weatherForecast
                .upsert
                .mockResolvedValue({});

            httpService.get.mockReturnValue(
                of({
                    data:
                        forecastResponse,
                }),
            );

            const resultat =
                await service
                    .obtenirPrevisions(
                        latitude,
                        longitude,
                        placeId,
                    );

            expect(
                resultat.length,
            ).toBeGreaterThan(0);

            expect(
                httpService.get,
            ).toHaveBeenCalledTimes(1);
        },
    );

    // ==================================================
    // FALLBACK CACHE EXPIRÉ
    // ==================================================

    it(
        'retourne le cache expiré lorsque OpenWeather échoue',
        async () => {
            const cacheExpire = {
                ...previsionCache,

                expiresAt:
                    new Date(
                        Date.now() -
                        60_000,
                    ),
            };

            prismaService
                .weatherForecast
                .findMany
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    cacheExpire,
                ]);

            const erreurAxios =
                new AxiosError(
                    'Service indisponible',
                    'ERR_BAD_RESPONSE',
                    undefined,
                    undefined,
                    {
                        status: 503,
                        statusText:
                            'Service Unavailable',
                        headers: {},
                        config: {
                            headers: {},
                        },
                        data: {},
                    } as never,
                );

            httpService.get.mockReturnValue(
                throwError(
                    () =>
                        erreurAxios,
                ),
            );

            const resultat =
                await service
                    .obtenirPrevisions(
                        latitude,
                        longitude,
                        placeId,
                    );

            expect(
                resultat,
            ).toHaveLength(1);

            expect(
                resultat[0].condition,
            ).toBe('Clear');

            expect(
                prismaService
                    .weatherForecast
                    .findMany,
            ).toHaveBeenCalledTimes(2);

            expect(
                prismaService
                    .weatherForecast
                    .upsert,
            ).not.toHaveBeenCalled();
        },
    );

    // ==================================================
    // OPENWEATHER KO + AUCUN FALLBACK
    // ==================================================

    it(
        'propage une erreur lorsque OpenWeather échoue et aucun cache expiré n’existe',
        async () => {
            prismaService
                .weatherForecast
                .findMany
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const erreurAxios =
                new AxiosError(
                    'Service indisponible',
                    'ERR_BAD_RESPONSE',
                    undefined,
                    undefined,
                    {
                        status: 503,
                        statusText:
                            'Service Unavailable',
                        headers: {},
                        config: {
                            headers: {},
                        },
                        data: {},
                    } as never,
                );

            httpService.get.mockReturnValue(
                throwError(
                    () =>
                        erreurAxios,
                ),
            );

            await expect(
                service.obtenirPrevisions(
                    latitude,
                    longitude,
                    placeId,
                ),
            ).rejects.toBeDefined();

            expect(
                prismaService
                    .weatherForecast
                    .findMany,
            ).toHaveBeenCalledTimes(2);
        },
    );
});