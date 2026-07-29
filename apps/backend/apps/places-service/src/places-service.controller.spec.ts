import { Test, TestingModule } from '@nestjs/testing';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';

describe('PlacesServiceController', () => {
    let controller: PlacesServiceController;

    const placesServiceMock = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findBySlug: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlacesServiceController],
            providers: [
                {
                    provide: PlacesServiceService,
                    useValue: placesServiceMock,
                },
            ],
        }).compile();

        controller = module.get<PlacesServiceController>(
            PlacesServiceController,
        );

        jest.clearAllMocks();
    });

    describe('getHealth', () => {
        it('doit retourner l’état du service', () => {
            const result = controller.getHealth();

            expect(result.service).toBe('places-service');
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

            expect(placesServiceMock.findAll).toHaveBeenCalledWith(filters);
        });
    });

    describe('findOne', () => {
        it('doit rechercher un lieu avec un objet contenant id', async () => {
            placesServiceMock.findOne.mockResolvedValue({
                id: 1,
                nom: 'Chute Montmorency',
            });

            await controller.findOne({ id: 1 });

            expect(placesServiceMock.findOne).toHaveBeenCalledWith(1);
        });

        it('doit accepter directement un identifiant numérique', async () => {
            placesServiceMock.findOne.mockResolvedValue({
                id: 1,
            });

            await controller.findOne(1);

            expect(placesServiceMock.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('findBySlug', () => {
        it('doit rechercher un lieu par slug', async () => {
            placesServiceMock.findBySlug.mockResolvedValue({
                id: 1,
                slug: 'chute-montmorency',
            });

            await controller.findBySlug({
                slug: 'chute-montmorency',
            });

            expect(
                placesServiceMock.findBySlug,
            ).toHaveBeenCalledWith('chute-montmorency');
        });
    });
});