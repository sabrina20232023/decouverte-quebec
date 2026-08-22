import { NestFactory } from '@nestjs/core';
import {
    MicroserviceOptions,
    Transport,
} from '@nestjs/microservices';

import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            AuthServiceModule,
            {
                transport: Transport.TCP,
                options: {
                    host: process.env.AUTH_SERVICE_HOST ?? '127.0.0.1',
                    port: Number(
                        process.env.AUTH_SERVICE_PORT ?? 4006,
                    ),
                },
            },
        );

    await app.listen();

    console.log(
        'Auth Service actif sur TCP 127.0.0.1:4006',
    );
}

bootstrap();