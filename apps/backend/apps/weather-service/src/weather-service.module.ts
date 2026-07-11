import { Module } from '@nestjs/common';
import { WeatherServiceController } from './weather-service.controller';
import { WeatherServiceService } from './weather-service.service';

@Module({
  imports: [],
  controllers: [WeatherServiceController],
  providers: [WeatherServiceService],
})
export class WeatherServiceModule {}
