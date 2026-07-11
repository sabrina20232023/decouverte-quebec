import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesServiceController } from './favorites-service.controller';
import { FavoritesServiceService } from './favorites-service.service';

describe('FavoritesServiceController', () => {
  let favoritesServiceController: FavoritesServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesServiceController],
      providers: [FavoritesServiceService],
    }).compile();

    favoritesServiceController = app.get<FavoritesServiceController>(
      FavoritesServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(favoritesServiceController.getHello()).toBe('Hello World!');
    });
  });
});
