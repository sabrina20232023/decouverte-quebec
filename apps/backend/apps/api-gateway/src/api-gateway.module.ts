import { Module } from '@nestjs/common';
import {
    ClientsModule,
    Transport,
} from '@nestjs/microservices';
import { ApiGatewayController } from './api-gateway.controller';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'PLACES_SERVICE',
                transport: Transport.TCP,
                options: {
                    host: '127.0.0.1',
                    port: 3002,
                },
            },
            {
                name: 'REGIONS_SERVICE',
                transport: Transport.TCP,
                options: {
                    host: '127.0.0.1',
                    port: 3003,
                },
            },
        ]),
    ],
    controllers: [ApiGatewayController],
})
export class ApiGatewayModule { }