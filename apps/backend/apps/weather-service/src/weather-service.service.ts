import { Injectable } from '@nestjs/common';

@Injectable()
export class WeatherServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
