import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegionsServiceService } from './regions-service.service';

@Controller()
export class RegionsServiceController {
    constructor(
        private readonly regionsService: RegionsServiceService,
    ) { }

    @MessagePattern({ cmd: 'regions.health' })
    getHealth() {
        return {
            service: 'regions-service',
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @MessagePattern({ cmd: 'regions.findAll' })
    findAll() {
        return this.regionsService.findAll();
    }

    @MessagePattern({ cmd: 'regions.findOne' })
    findOne(@Payload() id: number) {
        return this.regionsService.findOne(id);
    }

    @MessagePattern({ cmd: 'regions.findBySlug' })
    findBySlug(@Payload() slug: string) {
        return this.regionsService.findBySlug(slug);
    }
}