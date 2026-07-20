import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PlacesServiceService } from './places-service.service';

@Controller()
export class PlacesServiceController {
    constructor(
        private readonly placesService: PlacesServiceService,
    ) { }

    @MessagePattern({ cmd: 'places.health' })
    getHealth() {
        return {
            service: 'places-service',
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @MessagePattern({ cmd: 'places.findAll' })
    async findAll() {
        return this.placesService.findAll();
    }
}