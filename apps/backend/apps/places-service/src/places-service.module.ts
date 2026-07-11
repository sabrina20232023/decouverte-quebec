import { Module } from '@nestjs/common';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';

@Module({
  imports: [],
  controllers: [PlacesServiceController],
  providers: [PlacesServiceService],
})
export class PlacesServiceModule {}
