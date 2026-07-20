import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
    const app = await NestFactory.create(ApiGatewayModule);

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
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

    const swaggerDocument = SwaggerModule.createDocument(
        app,
        swaggerConfig,
    );

    SwaggerModule.setup(
        'api/docs',
        app,
        swaggerDocument,
    );

    await app.listen(3001);

    console.log(
        'API Gateway actif sur http://localhost:3001',
    );

    console.log(
        'Swagger disponible sur http://localhost:3001/api/docs',
    );
}

bootstrap();