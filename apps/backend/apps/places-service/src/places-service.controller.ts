import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
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
    findAll() {
        return this.placesService.findAll();
    }

    @MessagePattern({ cmd: 'places.findOne' })
    findOne(@Payload() id: number) {
        return this.placesService.findOne(id);
    }
}