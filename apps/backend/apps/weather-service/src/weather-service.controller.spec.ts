import { Test, TestingModule } from '@nestjs/testing';
import { WeatherServiceController } from './weather-service.controller';
import { WeatherServiceService } from './weather-service.service';

describe('WeatherServiceController', () => {
  let weatherServiceController: WeatherServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WeatherServiceController],
      providers: [WeatherServiceService],
    }).compile();

    weatherServiceController = app.get<WeatherServiceController>(
      WeatherServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(weatherServiceController.getHello()).toBe('Hello World!');
    });
  });
});
