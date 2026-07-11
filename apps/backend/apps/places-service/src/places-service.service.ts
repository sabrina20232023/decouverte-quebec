import { Injectable } from '@nestjs/common';

@Injectable()
export class PlacesServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
