import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import {
    MicroserviceOptions,
    Transport,
} from '@nestjs/microservices';

import { UsersServiceModule } from './users-service.module';

async function bootstrap(): Promise<void> {
    const host =
        process.env.USERS_SERVICE_HOST ??
        '127.0.0.1';

    const port =
        Number(
            process.env.USERS_SERVICE_PORT ??
            4002,
        );

    if (
        !Number.isInteger(port) ||
        port <= 0 ||
        port > 65_535
    ) {
        throw new Error(
            'USERS_SERVICE_PORT doit être un port valide.',
        );
    }

    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            UsersServiceModule,
            {
                transport:
                    Transport.TCP,

                options: {
                    host,
                    port,
                },
            },
        );

    await app.listen();

    console.log(
        `Users Service actif sur TCP ${host}:${port}`,
    );
}

bootstrap().catch(
    (error: unknown) => {
        console.error(
            'Impossible de démarrer le Users Service.',
            error,
        );

        process.exit(1);
    },
);