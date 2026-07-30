import { Controller } from '@nestjs/common';
import {
    MessagePattern,
    Payload,
} from '@nestjs/microservices';
import { RegionsServiceService } from './regions-service.service';

interface RegionIdPayload {
    id: number;
}

interface RegionSlugPayload {
    slug: string;
}

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
    findOne(
        @Payload() payload: RegionIdPayload,
    ) {
        return this.regionsService.findOne(
            payload.id,
        );
    }

    @MessagePattern({ cmd: 'regions.findBySlug' })
    findBySlug(
        @Payload() payload: RegionSlugPayload,
    ) {
        return this.regionsService.findBySlug(
            payload.slug,
        );
    }
}