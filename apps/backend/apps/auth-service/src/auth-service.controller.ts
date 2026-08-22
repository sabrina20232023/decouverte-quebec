import { Controller } from '@nestjs/common';
import {
    MessagePattern,
    Payload,
} from '@nestjs/microservices';

import { AuthServiceService } from './auth-service.service';

import type {
    InscriptionPayload,
} from './auth-service.service';

@Controller()
export class AuthServiceController {
    constructor(
        private readonly authService:
            AuthServiceService,
    ) { }

    @MessagePattern({
        cmd: 'auth.health',
    })
    getHealth() {
        return this.authService
            .getHealth();
    }

    @MessagePattern({
        cmd: 'auth.register',
    })
    inscrire(
        @Payload()
        payload: InscriptionPayload,
    ) {
        return this.authService
            .inscrire(payload);
    }
}