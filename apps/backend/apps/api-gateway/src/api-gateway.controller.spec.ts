import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, of } from 'rxjs';

import { ApiGatewayController } from './api-gateway.controller';

describe('ApiGatewayController', () => {
    let controller: ApiGatewayController;

    let placesClient: {
        send: jest.Mock;
    };

    let regionsClient: {
        send: jest.Mock;
    };

    let weatherClient: {
        send: jest.Mock;
    };

    beforeEach(async () => {
        placesClient = {
            send: jest.fn(),
        };

        regionsClient = {
            send: jest.fn(),
        };

        weatherClient = {
            send: jest.fn(),
        };

        const module: TestingModule =
            await Test.createTestingModule({
                controllers: [
                    ApiGatewayController,
                ],
                providers: [
                    {
                        provide:
                            'PLACES_SERVICE',
                        useValue:
                            placesClient,
                    },
                    {
                        provide:
                            'REGIONS_SERVICE',
                        useValue:
                            regionsClient,
                    },
                    {
                        provide:
                            'WEATHER_SERVICE',
                        useValue:
                            weatherClient,
                    },
                ],
            }).compile();

        controller =
            module.get<ApiGatewayController>(
                ApiGatewayController,
            );

        jest.clearAllMocks();
    });

    describe('Santé', () => {
        it('devrait retourner le statut du Gateway', () => {
            expect(
                controller.getGatewayHealth(),
            ).toEqual({
                service: 'api-gateway',
                status: 'ok',
            });
        });

        it('devrait demander le statut du Places Service', async () => {
            const response = {
                service:
                    'places-service',
                status: 'ok',
                timestamp:
                    '2026-07-11T12:00:00.000Z',
            };

            placesClient.send.mockReturnValue(
                of(response),
            );

            const result =
                await firstValueFrom(
                    controller
                        .getPlacesHealth(),
                );

            expect(result).toEqual(
                response,
            );

            expect(
                placesClient.send,
            ).toHaveBeenCalledWith(
                {
                    cmd:
                        'places.health',
                },
                {},
            );
        });

        it('devrait demander le statut du Weather Service', async () => {
            const response = {
                service:
                    'weather-service',
                status: 'ok',
                timestamp:
                    '2026-08-18T15:00:00.000Z',
            };

            weatherClient.send.mockReturnValue(
                of(response),
            );

            const result =
                await firstValueFrom(
                    controller
                        .getWeatherHealth(),
                );

            expect(result).toEqual(
                response,
            );

            expect(
                weatherClient.send,
            ).toHaveBeenCalledWith(
                {
                    cmd:
                        'weather.health',
                },
                {},
            );
        });
    });

    describe('Images Wikimedia', () => {
        it('devrait transmettre la recherche d’image au Places Service', async () => {
            const response = {
                fournisseur:
                    'Wikimedia Commons',
                trouvee: true,
                image: {
                    url:
                        'https://upload.wikimedia.org/image.jpg',
                },
            };

            placesClient.send.mockReturnValue(
                of(response),
            );

            const result =
                await firstValueFrom(
                    controller
                        .testerImageWikimedia(
                            'Chute Montmorency',
                            'Québec',
                            'Québec',
                        ),
                );

            expect(result).toEqual(
                response,
            );

            expect(
                placesClient.send,
            ).toHaveBeenCalledWith(
                {
                    cmd:
                        'places.images.test',
                },
                {
                    nom:
                        'Chute Montmorency',
                    ville:
                        'Québec',
                    province:
                        'Québec',
                },
            );
        });

        it('devrait refuser une recherche sans nom', () => {
            expect(() =>
                controller
                    .testerImageWikimedia(
                        '   ',
                        'Québec',
                        'Québec',
                    ),
            ).toThrow(
                'Le paramètre nom est obligatoire.',
            );
        });
    });

    describe('Météo', () => {
        it('devrait transmettre la demande de météo actuelle', async () => {
            const response = {
                temperature: 22,
                humidite: 60,
            };

            weatherClient.send.mockReturnValue(
                of(response),
            );

            const result =
                await firstValueFrom(
                    controller
                        .getWeatherCurrent(
                            '46.8139',
                            '-71.208',
                        ),
                );

            expect(result).toEqual(
                response,
            );

            expect(
                weatherClient.send,
            ).toHaveBeenCalledWith(
                {
                    cmd:
                        'weather.current',
                },
                {
                    latitude:
                        46.8139,
                    longitude:
                        -71.208,
                },
            );
        });

        it('devrait transmettre la demande de prévisions météo', async () => {
            const response = [
                {
                    date:
                        '2026-08-19',
                    temperature: {
                        minimum: 15,
                        maximum: 24,
                    },
                },
            ];

            weatherClient.send.mockReturnValue(
                of(response),
            );

            const result =
                await firstValueFrom(
                    controller
                        .getWeatherForecast(
                            '46.8139',
                            '-71.208',
                        ),
                );

            expect(result).toEqual(
                response,
            );

            expect(
                weatherClient.send,
            ).toHaveBeenCalledWith(
                {
                    cmd:
                        'weather.forecast',
                },
                {
                    latitude:
                        46.8139,
                    longitude:
                        -71.208,
                },
            );
        });

        it('devrait transmettre la demande de météo complète', async () => {
            const response = {
                fournisseur:
                    'OpenWeather',
                actuelle: {
                    temperature: 22,
                },
                previsions: [],
            };

            weatherClient.send.mockReturnValue(
                of(response),
            );

            const result =
                await firstValueFrom(
                    controller
                        .getWeatherComplete(
                            '46.8139',
                            '-71.208',
                        ),
                );

            expect(result).toEqual(
                response,
            );

            expect(
                weatherClient.send,
            ).toHaveBeenCalledWith(
                {
                    cmd:
                        'weather.complete',
                },
                {
                    latitude:
                        46.8139,
                    longitude:
                        -71.208,
                },
            );
        });

        it('devrait refuser une latitude invalide', () => {
            expect(() =>
                controller
                    .getWeatherComplete(
                        '999',
                        '-71.208',
                    ),
            ).toThrow(
                'La latitude doit être comprise entre -90 et 90.',
            );
        });

        it('devrait refuser une longitude invalide', () => {
            expect(() =>
                controller
                    .getWeatherComplete(
                        '46.8139',
                        '-999',
                    ),
            ).toThrow(
                'La longitude doit être comprise entre -180 et 180.',
            );
        });

        it('devrait refuser une latitude absente', () => {
            expect(() =>
                controller
                    .getWeatherComplete(
                        undefined,
                        '-71.208',
                    ),
            ).toThrow(
                'Le paramètre latitude est obligatoire.',
            );
        });

        it('devrait refuser une longitude absente', () => {
            expect(() =>
                controller
                    .getWeatherComplete(
                        '46.8139',
                        undefined,
                    ),
            ).toThrow(
                'Le paramètre longitude est obligatoire.',
            );
        });

        it('devrait refuser une latitude non numérique', () => {
            expect(() =>
                controller
                    .getWeatherCurrent(
                        'Québec',
                        '-71.208',
                    ),
            ).toThrow(
                'La latitude doit être comprise entre -90 et 90.',
            );
        });
    });
});