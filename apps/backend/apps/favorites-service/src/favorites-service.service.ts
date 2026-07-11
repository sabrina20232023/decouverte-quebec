import { Injectable } from '@nestjs/common';

@Injectable()
export class FavoritesServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
