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
                    host:
                        process.env.PLACES_SERVICE_HOST ??
                        '127.0.0.1',
                    port: Number(
                        process.env.PLACES_SERVICE_PORT ??
                        4001,
                    ),
                },
            },
            {
                name: 'REGIONS_SERVICE',
                transport: Transport.TCP,
                options: {
                    host:
                        process.env.REGIONS_SERVICE_HOST ??
                        '127.0.0.1',
                    port: Number(
                        process.env.REGIONS_SERVICE_PORT ??
                        3003,
                    ),
                },
            },
            {
                name: 'WEATHER_SERVICE',
                transport: Transport.TCP,
                options: {
                    host:
                        process.env.WEATHER_SERVICE_HOST ??
                        '127.0.0.1',
                    port: Number(
                        process.env.WEATHER_SERVICE_PORT ??
                        4004,
                    ),
                },
            },
        ]),
    ],
    controllers: [
        ApiGatewayController,
    ],
})
export class ApiGatewayModule { }