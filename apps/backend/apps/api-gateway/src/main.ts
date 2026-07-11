import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(ApiGatewayModule);

    app.enableCors({
        origin: 'http://localhost:3000',
    });

    await app.listen(3001);
    console.log('API Gateway actif sur http://localhost:3001');
}
void bootstrap();