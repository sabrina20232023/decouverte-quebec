import { Test, TestingModule } from '@nestjs/testing';

import { WeatherServiceController } from './weather-service.controller';
import { WeatherServiceService } from './weather-service.service';

describe('WeatherServiceController', () => {
    let controller: WeatherServiceController;

    let weatherService: {
        obtenirMeteoActuelle: jest.Mock;
        obtenirPrevisions: jest.Mock;
        obtenirMeteoComplete: jest.Mock;
    };

    beforeEach(async () => {
        weatherService = {
            obtenirMeteoActuelle:
                jest.fn(),

            obtenirPrevisions:
                jest.fn(),

            obtenirMeteoComplete:
                jest.fn(),
        };

        const module: TestingModule =
            await Test.createTestingModule({
                controllers: [
                    WeatherServiceController,
                ],

                providers: [
                    {
                        provide:
                            WeatherServiceService,

                        useValue:
                            weatherService,
                    },
                ],
            }).compile();

        controller =
            module.get<WeatherServiceController>(
                WeatherServiceController,
            );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ==================================================
    // HEALTH
    // ==================================================

    it(
        'retourne le statut du Weather Service',
        () => {
            const resultat =
                controller.getHealth();

            expect(
                resultat.service,
            ).toBe(
                'weather-service',
            );

            expect(
                resultat.status,
            ).toBe('ok');

            expect(
                resultat.timestamp,
            ).toBeDefined();
        },
    );

    // ==================================================
    // MÉTÉO ACTUELLE
    // ==================================================

    it(
        'transmet les coordonnées au service pour la météo actuelle',
        async () => {
            const reponse = {
                temperature: 20,
                condition: 'Clear',
            };

            weatherService
                .obtenirMeteoActuelle
                .mockResolvedValue(
                    reponse,
                );

            const resultat =
                await controller
                    .obtenirMeteoActuelle({
                        latitude:
                            46.8139,

                        longitude:
                            -71.208,
                    });

            expect(
                weatherService
                    .obtenirMeteoActuelle,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
            );

            expect(
                resultat,
            ).toEqual(
                reponse,
            );
        },
    );

    // ==================================================
    // PRÉVISIONS AVEC PLACE ID
    // ==================================================

    it(
        'transmet latitude, longitude et placeId pour les prévisions',
        async () => {
            const reponse = [
                {
                    date:
                        '2026-08-22',

                    condition:
                        'Clear',
                },
            ];

            weatherService
                .obtenirPrevisions
                .mockResolvedValue(
                    reponse,
                );

            const resultat =
                await controller
                    .obtenirPrevisions({
                        latitude:
                            46.8139,

                        longitude:
                            -71.208,

                        placeId: 1,
                    });

            expect(
                weatherService
                    .obtenirPrevisions,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
                1,
            );

            expect(
                resultat,
            ).toEqual(
                reponse,
            );
        },
    );

    // ==================================================
    // PRÉVISIONS SANS PLACE ID
    // ==================================================

    it(
        'accepte une demande de prévisions sans placeId',
        async () => {
            weatherService
                .obtenirPrevisions
                .mockResolvedValue(
                    [],
                );

            await controller
                .obtenirPrevisions({
                    latitude:
                        46.8139,

                    longitude:
                        -71.208,
                });

            expect(
                weatherService
                    .obtenirPrevisions,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
                undefined,
            );
        },
    );

    // ==================================================
    // MÉTÉO COMPLÈTE
    // ==================================================

    it(
        'transmet les coordonnées et placeId pour la météo complète',
        async () => {
            const reponse = {
                actuelle: {
                    temperature:
                        20,
                },

                previsions: [],
            };

            weatherService
                .obtenirMeteoComplete
                .mockResolvedValue(
                    reponse,
                );

            const resultat =
                await controller
                    .obtenirMeteoComplete({
                        latitude:
                            46.8139,

                        longitude:
                            -71.208,

                        placeId: 5,
                    });

            expect(
                weatherService
                    .obtenirMeteoComplete,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
                5,
            );

            expect(
                resultat,
            ).toEqual(
                reponse,
            );
        },
    );
});