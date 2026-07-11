import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class PlacesServiceController {
    @MessagePattern({ cmd: 'places.health' })
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    } {
        return {
            service: 'places-service',
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}