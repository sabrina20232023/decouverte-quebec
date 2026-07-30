import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
    DocumentBuilder,
    SwaggerModule,
} from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(
        ApiGatewayModule,
    );

    const port = Number(
        process.env.API_GATEWAY_PORT ?? 3001,
    );

    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(
            'La variable API_GATEWAY_PORT doit contenir un port valide.',
        );
    }

    const frontendUrls = (
        process.env.FRONTEND_URL ??
        'http://localhost:3000'
    )
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

    app.enableCors({
        origin: frontendUrls,
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Découverte Québec API')
        .setDescription(
            'Documentation de l’API du projet Découverte Québec',
        )
        .setVersion('1.0')
        .addTag('Santé')
        .addTag('Lieux')
        .addTag('Régions')
        .build();

    const swaggerDocument =
        SwaggerModule.createDocument(
            app,
            swaggerConfig,
        );

    SwaggerModule.setup(
        'api/docs',
        app,
        swaggerDocument,
    );

    await app.listen(port, '0.0.0.0');

    console.log(
        `API Gateway actif sur http://localhost:${port}`,
    );

    console.log(
        `Swagger disponible sur http://localhost:${port}/api/docs`,
    );
}

void bootstrap().catch((error: unknown) => {
    console.error(
        'Erreur au démarrage de l’API Gateway :',
        error,
    );

    process.exit(1);
});