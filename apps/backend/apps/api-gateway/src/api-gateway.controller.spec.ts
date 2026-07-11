import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { ApiGatewayController } from './api-gateway.controller';

describe('ApiGatewayController', () => {
    let controller: ApiGatewayController;
    let placesClient: {
        send: jest.Mock;
    };

    beforeEach(async () => {
        placesClient = {
            send: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApiGatewayController],
            providers: [
                {
                    provide: 'PLACES_SERVICE',
                    useValue: placesClient,
                },
            ],
        }).compile();

        controller = module.get<ApiGatewayController>(ApiGatewayController);
    });

    it('devrait retourner le statut du Gateway', () => {
        expect(controller.getGatewayHealth()).toEqual({
            service: 'api-gateway',
            status: 'ok',
        });
    });

    it('devrait demander le statut du Places Service', () => {
        const response = {
            service: 'places-service',
            status: 'ok',
            timestamp: '2026-07-11T12:00:00.000Z',
        };

        placesClient.send.mockReturnValue(of(response));

        controller.getPlacesHealth().subscribe((result) => {
            expect(result).toEqual(response);
        });

        expect(placesClient.send).toHaveBeenCalledWith(
            { cmd: 'places.health' },
            {},
        );
    });
});