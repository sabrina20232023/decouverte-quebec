import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
    MicroserviceOptions,
    Transport,
} from '@nestjs/microservices';
import { PlacesServiceModule } from './places-service.module';

async function bootstrap(): Promise<void> {
    const host =
        process.env.PLACES_SERVICE_HOST ?? '127.0.0.1';

    const port = Number(
        process.env.PLACES_SERVICE_PORT ?? 4001,
    );

    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(
            'La variable PLACES_SERVICE_PORT doit contenir un port valide.',
        );
    }

    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            PlacesServiceModule,
            {
                transport: Transport.TCP,
                options: {
                    host,
                    port,
                },
            },
        );

    await app.listen();

    console.log(
        `Places Service actif sur TCP ${host}:${port}`,
    );
}

void bootstrap().catch((error: unknown) => {
    console.error(
        'Erreur au démarrage du Places Service :',
        error,
    );

    process.exit(1);
});