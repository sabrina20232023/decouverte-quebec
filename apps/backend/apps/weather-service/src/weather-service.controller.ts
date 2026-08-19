import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { WeatherServiceService } from './weather-service.service';

interface WeatherCoordinatesPayload {
    latitude: number;
    longitude: number;
}

@Controller()
export class WeatherServiceController {
    constructor(
        private readonly weatherService: WeatherServiceService,
    ) { }

    @MessagePattern({ cmd: 'weather.health' })
    getHealth() {
        return {
            service: 'weather-service',
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @MessagePattern({ cmd: 'weather.current' })
    obtenirMeteoActuelle(
        @Payload() payload: WeatherCoordinatesPayload,
    ) {
        return this.weatherService.obtenirMeteoActuelle(
            payload.latitude,
            payload.longitude,
        );
    }

    @MessagePattern({ cmd: 'weather.forecast' })
    obtenirPrevisions(
        @Payload() payload: WeatherCoordinatesPayload,
    ) {
        return this.weatherService.obtenirPrevisions(
            payload.latitude,
            payload.longitude,
        );
    }

    @MessagePattern({ cmd: 'weather.complete' })
    obtenirMeteoComplete(
        @Payload() payload: WeatherCoordinatesPayload,
    ) {
        return this.weatherService.obtenirMeteoComplete(
            payload.latitude,
            payload.longitude,
        );
    }
}