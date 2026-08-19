import { WeatherServiceController } from './weather-service.controller';
import { WeatherServiceService } from './weather-service.service';

describe('WeatherServiceController', () => {
    let controller: WeatherServiceController;

    const weatherServiceMock = {
        obtenirMeteoActuelle: jest.fn(),
        obtenirPrevisions: jest.fn(),
        obtenirMeteoComplete: jest.fn(),
    };

    beforeEach(() => {
        controller = new WeatherServiceController(
            weatherServiceMock as unknown as WeatherServiceService,
        );

        jest.clearAllMocks();
    });

    describe('getHealth', () => {
        it('doit retourner l’état du service météo', () => {
            const result = controller.getHealth();

            expect(result.service).toBe(
                'weather-service',
            );

            expect(result.status).toBe('ok');

            expect(result.timestamp).toBeDefined();
        });
    });

    describe('obtenirMeteoActuelle', () => {
        it('doit transmettre les coordonnées au service', async () => {
            const meteo = {
                latitude: 46.8139,
                longitude: -71.208,
                fuseauHoraire:
                    'America/Toronto',
                dateObservation:
                    '2026-08-04 14:00:00',
                temperature: 24,
                temperatureRessentie: 25,
                condition: 'Clouds',
                description:
                    'partiellement nuageux',
                icone: '02d',
                iconeUrl:
                    'https://openweathermap.org/img/wn/02d@2x.png',
                humidite: 62,
                pression: 1012,
                nuages: 40,
                visibiliteMetres: 10000,
                vent: {
                    vitesseMetresSeconde: 4,
                    vitesseKmHeure: 14.4,
                    directionDegres: 210,
                    rafalesMetresSeconde: null,
                    rafalesKmHeure: null,
                },
                leverSoleil:
                    '2026-08-04 05:30:00',
                coucherSoleil:
                    '2026-08-04 20:15:00',
                indiceUV: 5,
            };

            weatherServiceMock
                .obtenirMeteoActuelle
                .mockResolvedValue(meteo);

            const result =
                await controller.obtenirMeteoActuelle({
                    latitude: 46.8139,
                    longitude: -71.208,
                });

            expect(
                weatherServiceMock
                    .obtenirMeteoActuelle,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
            );

            expect(result).toEqual(meteo);
        });
    });

    describe('obtenirPrevisions', () => {
        it('doit transmettre les coordonnées au service', async () => {
            const previsions = [
                {
                    date:
                        '2026-08-05 12:00:00',
                    resume:
                        'Ciel variable',
                    temperature: {
                        matin: 16,
                        jour: 24,
                        soir: 21,
                        nuit: 17,
                        minimum: 15,
                        maximum: 25,
                    },
                    temperatureRessentie: {
                        matin: 16,
                        jour: 25,
                        soir: 22,
                        nuit: 17,
                    },
                    condition: 'Clouds',
                    description:
                        'nuageux',
                    icone: '03d',
                    iconeUrl:
                        'https://openweathermap.org/img/wn/03d@2x.png',
                    probabilitePrecipitation: 20,
                    pluieMillimetres: 0,
                    neigeMillimetres: 0,
                    humidite: 60,
                    pression: 1013,
                    nuages: 50,
                    vent: {
                        vitesseMetresSeconde: 3,
                        vitesseKmHeure: 10.8,
                        directionDegres: 180,
                        rafalesMetresSeconde: null,
                        rafalesKmHeure: null,
                    },
                    leverSoleil:
                        '2026-08-05 05:31:00',
                    coucherSoleil:
                        '2026-08-05 20:14:00',
                    indiceUV: 4,
                },
            ];

            weatherServiceMock
                .obtenirPrevisions
                .mockResolvedValue(previsions);

            const result =
                await controller.obtenirPrevisions({
                    latitude: 46.8139,
                    longitude: -71.208,
                });

            expect(
                weatherServiceMock
                    .obtenirPrevisions,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
            );

            expect(result).toEqual(previsions);
        });
    });

    describe('obtenirMeteoComplete', () => {
        it('doit transmettre les coordonnées au service', async () => {
            const meteoComplete = {
                fournisseur: 'OpenWeather',
                latitude: 46.8139,
                longitude: -71.208,
                fuseauHoraire:
                    'America/Toronto',
                actuelle: {
                    temperature: 24,
                },
                previsions: [],
            };

            weatherServiceMock
                .obtenirMeteoComplete
                .mockResolvedValue(meteoComplete);

            const result =
                await controller.obtenirMeteoComplete({
                    latitude: 46.8139,
                    longitude: -71.208,
                });

            expect(
                weatherServiceMock
                    .obtenirMeteoComplete,
            ).toHaveBeenCalledWith(
                46.8139,
                -71.208,
            );

            expect(result).toEqual(
                meteoComplete,
            );
        });
    });
});