import { Test, TestingModule } from '@nestjs/testing';
import { RegionsServiceController } from './regions-service.controller';
import { RegionsServiceService } from './regions-service.service';

describe('RegionsServiceController', () => {
    let controller: RegionsServiceController;
    let service: jest.Mocked<RegionsServiceService>;

    const mockRegions = [
        {
            id: 1,
            nom: 'Capitale-Nationale',
            slug: 'capitale-nationale',
            description: 'Région touristique de Québec',
            _count: {
                places: 2,
            },
        },
        {
            id: 2,
            nom: 'Charlevoix',
            slug: 'charlevoix',
            description: 'Région touristique de Charlevoix',
            _count: {
                places: 1,
            },
        },
    ];

    const mockRegion = {
        id: 1,
        nom: 'Capitale-Nationale',
        slug: 'capitale-nationale',
        description: 'Région touristique de Québec',
        _count: {
            places: 2,
        },
    };

    const mockRegionDetails = {
        id: 1,
        nom: 'Capitale-Nationale',
        slug: 'capitale-nationale',
        description: 'Région touristique de Québec',
        places: [
            {
                id: 1,
                nom: 'Chute Montmorency',
                description: 'Une chute près de Québec',
                adresse: '5300 boulevard Sainte-Anne',
                ville: 'Québec',
                latitude: 46.8902,
                longitude: -71.1474,
                imageUrl:
                    'https://exemple.com/chute-montmorency.jpg',
                siteWeb: 'https://www.sepaq.com',
                telephone: '418-000-0000',
                regionId: 1,
                categoryId: 1,
                category: {
                    id: 1,
                    nom: 'Nature',
                    slug: 'nature',
                    description: null,
                    icone: null,
                },
            },
        ],
    };

    beforeEach(async () => {
        const regionsServiceMock = {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findBySlug: jest.fn(),
        };

        const module: TestingModule =
            await Test.createTestingModule({
                controllers: [
                    RegionsServiceController,
                ],
                providers: [
                    {
                        provide: RegionsServiceService,
                        useValue: regionsServiceMock,
                    },
                ],
            }).compile();

        controller =
            module.get<RegionsServiceController>(
                RegionsServiceController,
            );

        service =
            module.get(
                RegionsServiceService,
            ) as jest.Mocked<RegionsServiceService>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getHealth', () => {
        it('doit retourner l’état du service', () => {
            const result = controller.getHealth();

            expect(result.service).toBe(
                'regions-service',
            );

            expect(result.status).toBe('ok');

            expect(result.timestamp).toBeDefined();

            expect(
                new Date(
                    result.timestamp,
                ).toString(),
            ).not.toBe('Invalid Date');
        });
    });

    describe('findAll', () => {
        it('doit retourner toutes les régions', async () => {
            service.findAll.mockResolvedValue(
                mockRegions,
            );

            const result =
                await controller.findAll();

            expect(service.findAll).toHaveBeenCalledTimes(
                1,
            );

            expect(result).toEqual(mockRegions);
        });
    });

    describe('findOne', () => {
        it('doit transmettre l’identifiant au service', async () => {
            service.findOne.mockResolvedValue(
                mockRegion,
            );

            const result =
                await controller.findOne({
                    id: 1,
                });

            expect(service.findOne).toHaveBeenCalledWith(
                1,
            );

            expect(service.findOne).toHaveBeenCalledTimes(
                1,
            );

            expect(result).toEqual(mockRegion);
        });

        it('doit retourner null lorsque la région est introuvable', async () => {
            service.findOne.mockResolvedValue(
                null,
            );

            const result =
                await controller.findOne({
                    id: 999,
                });

            expect(service.findOne).toHaveBeenCalledWith(
                999,
            );

            expect(result).toBeNull();
        });
    });

    describe('findBySlug', () => {
        it('doit transmettre le slug au service', async () => {
            service.findBySlug.mockResolvedValue(
                mockRegionDetails,
            );

            const result =
                await controller.findBySlug({
                    slug: 'capitale-nationale',
                });

            expect(
                service.findBySlug,
            ).toHaveBeenCalledWith(
                'capitale-nationale',
            );

            expect(
                service.findBySlug,
            ).toHaveBeenCalledTimes(1);

            expect(result).toEqual(
                mockRegionDetails,
            );
        });

        it('doit retourner null lorsque le slug est introuvable', async () => {
            service.findBySlug.mockResolvedValue(
                null,
            );

            const result =
                await controller.findBySlug({
                    slug: 'region-inexistante',
                });

            expect(
                service.findBySlug,
            ).toHaveBeenCalledWith(
                'region-inexistante',
            );

            expect(result).toBeNull();
        });
    });
});