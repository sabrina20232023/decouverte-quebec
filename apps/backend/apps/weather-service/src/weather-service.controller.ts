import { Controller, Get } from '@nestjs/common';
import { WeatherServiceService } from './weather-service.service';

@Controller()
export class WeatherServiceController {
  constructor(private readonly weatherServiceService: WeatherServiceService) {}

  @Get()
  getHello(): string {
    return this.weatherServiceService.getHello();
  }
}
