import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface ServiceHealth {
  service: string;
  status: string;
  timestamp: string;
}

@Controller('api')
export class ApiGatewayController {
  constructor(
    @Inject('PLACES_SERVICE')
    private readonly placesClient: ClientProxy,
  ) {}

  @Get('health')
  getGatewayHealth(): { service: string; status: string } {
    return {
      service: 'api-gateway',
      status: 'ok',
    };
  }

  @Get('places/health')
  getPlacesHealth(): Observable<ServiceHealth> {
    return this.placesClient.send<ServiceHealth>({ cmd: 'places.health' }, {});
  }
}
