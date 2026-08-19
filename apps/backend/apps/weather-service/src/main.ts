import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
    MicroserviceOptions,
    Transport,
} from '@nestjs/microservices';
import { WeatherServiceModule } from './weather-service.module';

async function bootstrap(): Promise<void> {
    const host =
        process.env.WEATHER_SERVICE_HOST ??
        '127.0.0.1';

    const port = Number(
        process.env.WEATHER_SERVICE_PORT ??
        4004,
    );

    if (Number.isNaN(port)) {
        throw new Error(
            'WEATHER_SERVICE_PORT doit être un nombre valide.',
        );
    }

    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            WeatherServiceModule,
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
        `Weather Service actif sur TCP ${host}:${port}`,
    );
}

bootstrap().catch((error: unknown) => {
    console.error(
        'Impossible de démarrer le Weather Service.',
        error,
    );
    process.exit(1);
});