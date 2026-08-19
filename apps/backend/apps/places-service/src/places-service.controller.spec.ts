import { GeoapifyService } from './geoapify/geoapify.service';
import { ImageService } from './images/image.service';
import { ImportService } from './import/import.service';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';

describe('PlacesServiceController', () => {
    let controller: PlacesServiceController;

    const placesServiceMock = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findBySlug: jest.fn(),
    };

    const geoapifyServiceMock = {
        rechercherLieuxProches: jest.fn(),
        rechercherLieuxAuQuebec: jest.fn(),
    };

    const importServiceMock = {
        importerRegion: jest.fn(),
        importerRegionsActives: jest.fn(),
    };

    const imageServiceMock = {
        rechercherImagePourLieu: jest.fn(),
    };

    beforeEach(() => {
        controller = new PlacesServiceController(
            placesServiceMock as unknown as PlacesServiceService,
            geoapifyServiceMock as unknown as GeoapifyService,
            importServiceMock as unknown as ImportService,
            imageServiceMock as unknown as ImageService,
        );

        jest.clearAllMocks();
    });

    describe('getHealth', () => {
        it('doit retourner l’état du service', () => {
            const result = controller.getHealth();

            expect(result.service).toBe(
                'places-service',
            );

            expect(result.status).toBe('ok');

            expect(result.timestamp).toBeDefined();
        });
    });

    describe('findAll', () => {
        it('doit transmettre les filtres au service', async () => {
            const filters = {
                region: 'capitale-nationale',
                page: 1,
                limit: 10,
            };

            placesServiceMock.findAll.mockResolvedValue({
                data: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                },
            });

            await controller.findAll(filters);

            expect(
                placesServiceMock.findAll,
            ).toHaveBeenCalledWith(filters);
        });
    });

    describe('findOne', () => {
        it('doit rechercher un lieu avec un objet contenant id', async () => {
            placesServiceMock.findOne.mockResolvedValue({
                id: 1,
                nom: 'Chute Montmorency',
            });

            await controller.findOne({
                id: 1,
            });

            expect(
                placesServiceMock.findOne,
            ).toHaveBeenCalledWith(1);
        });

        it('doit accepter directement un identifiant numérique', async () => {
            placesServiceMock.findOne.mockResolvedValue({
                id: 1,
            });

            await controller.findOne(1);

            expect(
                placesServiceMock.findOne,
            ).toHaveBeenCalledWith(1);
        });
    });

    describe('findBySlug', () => {
        it('doit rechercher un lieu par slug avec un objet', async () => {
            placesServiceMock.findBySlug.mockResolvedValue({
                id: 1,
                slug: 'chute-montmorency',
            });

            await controller.findBySlug({
                slug: 'chute-montmorency',
            });

            expect(
                placesServiceMock.findBySlug,
            ).toHaveBeenCalledWith(
                'chute-montmorency',
            );
        });

        it('doit accepter directement un slug sous forme de chaîne', async () => {
            placesServiceMock.findBySlug.mockResolvedValue({
                id: 1,
                slug: 'vieux-quebec',
            });

            await controller.findBySlug(
                'vieux-quebec',
            );

            expect(
                placesServiceMock.findBySlug,
            ).toHaveBeenCalledWith(
                'vieux-quebec',
            );
        });
    });

    describe('testerGeoapify', () => {
        it('doit utiliser les valeurs par défaut et retourner les lieux', async () => {
            geoapifyServiceMock.rechercherLieuxProches
                .mockResolvedValue([
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [
                                -71.208,
                                46.8139,
                            ],
                        },
                        properties: {
                            place_id:
                                'geoapify-lieu-1',
                            name:
                                'Lieu touristique',
                            formatted:
                                'Québec, QC, Canada',
                            city: 'Québec',
                            state: 'Québec',
                            country: 'Canada',
                            country_code: 'ca',
                            lat: 46.8139,
                            lon: -71.208,
                            categories: [
                                'tourism.attraction',
                            ],
                        },
                    },
                ]);

            const result =
                await controller.testerGeoapify();

            expect(
                geoapifyServiceMock
                    .rechercherLieuxProches,
            ).toHaveBeenCalledWith({
                latitude: 46.8139,
                longitude: -71.208,
                rayon: 10_000,
                limite: 20,
                categories: undefined,
                langue: 'fr',
                seulementCanada: true,
            });

            expect(result.fournisseur).toBe(
                'Geoapify',
            );

            expect(result.total).toBe(1);

            expect(result.lieux).toHaveLength(1);

            expect(result.lieux[0]).toEqual(
                expect.objectContaining({
                    placeId:
                        'geoapify-lieu-1',
                    nom: 'Lieu touristique',
                    ville: 'Québec',
                    codePays: 'ca',
                }),
            );
        });
    });

    describe('rechercherLieuxAuQuebec', () => {
        it('doit transmettre les paramètres au service Geoapify', async () => {
            geoapifyServiceMock
                .rechercherLieuxAuQuebec
                .mockResolvedValue([]);

            const result =
                await controller
                    .rechercherLieuxAuQuebec({
                        latitude: 46.9,
                        longitude: -71.1,
                        rayon: 25_000,
                        limite: 15,
                    });

            expect(
                geoapifyServiceMock
                    .rechercherLieuxAuQuebec,
            ).toHaveBeenCalledWith(
                46.9,
                -71.1,
                25_000,
                15,
            );

            expect(result).toEqual({
                fournisseur: 'Geoapify',
                territoire: 'Québec',
                total: 0,
                lieux: [],
            });
        });
    });

    describe('importerRegion', () => {
        it('doit importer une région précise', async () => {
            const bilan = {
                provinceSlug: 'quebec',
                regionSlug:
                    'capitale-nationale',
                total: 20,
                crees: 10,
                misAJour: 5,
                ignores: 5,
                erreurs: [],
            };

            importServiceMock.importerRegion
                .mockResolvedValue(bilan);

            const result =
                await controller.importerRegion({
                    provinceSlug: 'quebec',
                    regionSlug:
                        'capitale-nationale',
                });

            expect(
                importServiceMock.importerRegion,
            ).toHaveBeenCalledWith(
                'quebec',
                'capitale-nationale',
            );

            expect(result).toEqual(bilan);
        });
    });

    describe('importerToutesLesRegionsActives', () => {
        it('doit importer toutes les régions actives', async () => {
            const bilans = [
                {
                    provinceSlug: 'quebec',
                    regionSlug:
                        'capitale-nationale',
                    total: 20,
                    crees: 10,
                    misAJour: 5,
                    ignores: 5,
                    erreurs: [],
                },
            ];

            importServiceMock
                .importerRegionsActives
                .mockResolvedValue(bilans);

            const result =
                await controller
                    .importerToutesLesRegionsActives();

            expect(
                importServiceMock
                    .importerRegionsActives,
            ).toHaveBeenCalledTimes(1);

            expect(result).toEqual(bilans);
        });
    });

    describe('testerRechercheImage', () => {
        it('doit rechercher une image Wikimedia pour un lieu', async () => {
            const image = {
                url: 'https://upload.wikimedia.org/image.jpg',
                thumbnailUrl:
                    'https://upload.wikimedia.org/thumb/image.jpg',
                titre: 'Chute Montmorency.jpg',
                altText: 'Chute Montmorency',
                source: 'Wikimedia Commons',
                sourceUrl:
                    'https://commons.wikimedia.org/wiki/File:Chute_Montmorency.jpg',
                auteur: 'Auteur',
                licence: 'CC BY-SA 4.0',
            };

            imageServiceMock.rechercherImagePourLieu
                .mockResolvedValue(image);

            const result =
                await controller.testerRechercheImage({
                    nom: 'Chute Montmorency',
                    ville: 'Québec',
                    province: 'Québec',
                });

            expect(
                imageServiceMock.rechercherImagePourLieu,
            ).toHaveBeenCalledWith(
                'Chute Montmorency',
                'Québec',
                'Québec',
            );

            expect(result.trouvee).toBe(true);
            expect(result.image).toEqual(image);
        });
    });
});