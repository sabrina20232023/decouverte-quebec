import { Module } from '@nestjs/common';
import {
    ClientsModule,
    Transport,
} from '@nestjs/microservices';

import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'USERS_SERVICE',
                transport: Transport.TCP,
                options: {
                    host:
                        process.env.USERS_SERVICE_HOST ??
                        '127.0.0.1',
                    port: Number(
                        process.env.USERS_SERVICE_PORT ??
                        4002,
                    ),
                },
            },
        ]),
    ],
    controllers: [
        AuthServiceController,
    ],
    providers: [
        AuthServiceService,
    ],
})
export class AuthServiceModule { }