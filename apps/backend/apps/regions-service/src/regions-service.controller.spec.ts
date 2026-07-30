import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
    MicroserviceOptions,
    Transport,
} from '@nestjs/microservices';
import { RegionsServiceModule } from './regions-service.module';

async function bootstrap(): Promise<void> {
    const host =
        process.env.REGIONS_SERVICE_HOST ??
        '127.0.0.1';

    const port = Number(
        process.env.REGIONS_SERVICE_PORT ??
        3003,
    );

    if (Number.isNaN(port)) {
        throw new Error(
            'REGIONS_SERVICE_PORT doit être un nombre valide.',
        );
    }

    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            RegionsServiceModule,
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
        `Regions Service actif sur TCP ${host}:${port}`,
    );
}

bootstrap().catch((error: unknown) => {
    console.error(
        'Impossible de démarrer le Regions Service.',
        error,
    );

    process.exit(1);
});