import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AuthServiceService } from './auth-service.service';

@Controller()
export class AuthServiceController {
    constructor(
        private readonly authService: AuthServiceService,
    ) { }

    @MessagePattern({
        cmd: 'auth.health',
    })
    getHealth() {
        return this.authService.getHealth();
    }
}