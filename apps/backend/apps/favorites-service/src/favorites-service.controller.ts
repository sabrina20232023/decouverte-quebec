import { Controller, Get } from '@nestjs/common';
import { FavoritesServiceService } from './favorites-service.service';

@Controller()
export class FavoritesServiceController {
  constructor(
    private readonly favoritesServiceService: FavoritesServiceService,
  ) {}

  @Get()
  getHello(): string {
    return this.favoritesServiceService.getHello();
  }
}
