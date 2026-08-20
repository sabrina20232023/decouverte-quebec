import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import {
    MicroserviceOptions,
    Transport,
} from '@nestjs/microservices';

import { FavoritesServiceModule } from './favorites-service.module';

async function bootstrap(): Promise<void> {
    const host =
        process.env.FAVORITES_SERVICE_HOST ??
        '127.0.0.1';

    const port =
        Number(
            process.env.FAVORITES_SERVICE_PORT ??
            4005,
        );

    if (
        !Number.isInteger(port) ||
        port <= 0 ||
        port > 65_535
    ) {
        throw new Error(
            'FAVORITES_SERVICE_PORT doit être un port valide.',
        );
    }

    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            FavoritesServiceModule,
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
        `Favorites Service actif sur TCP ${host}:${port}`,
    );
}

bootstrap().catch(
    (error: unknown) => {
        console.error(
            'Impossible de démarrer le Favorites Service.',
            error,
        );

        process.exit(1);
    },
);