import { Test, TestingModule } from '@nestjs/testing';
import { RegionsServiceController } from './regions-service.controller';
import { RegionsServiceService } from './regions-service.service';

describe('RegionsServiceController', () => {
  let regionsServiceController: RegionsServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RegionsServiceController],
      providers: [RegionsServiceService],
    }).compile();

    regionsServiceController = app.get<RegionsServiceController>(RegionsServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(regionsServiceController.getHello()).toBe('Hello World!');
    });
  });
});
