import { Module } from '@nestjs/common';
import { FavoritesServiceController } from './favorites-service.controller';
import { FavoritesServiceService } from './favorites-service.service';

@Module({
  imports: [],
  controllers: [FavoritesServiceController],
  providers: [FavoritesServiceService],
})
export class FavoritesServiceModule {}
