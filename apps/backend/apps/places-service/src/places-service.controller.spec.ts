import { Test, TestingModule } from '@nestjs/testing';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';

describe('PlacesServiceController', () => {
  let placesServiceController: PlacesServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PlacesServiceController],
      providers: [PlacesServiceService],
    }).compile();

    placesServiceController = app.get<PlacesServiceController>(
      PlacesServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(placesServiceController.getHello()).toBe('Hello World!');
    });
  });
});
