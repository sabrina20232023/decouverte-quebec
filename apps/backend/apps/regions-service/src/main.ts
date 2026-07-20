import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RegionsServiceModule } from './regions-service.module';

async function bootstrap() {
    const app =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            RegionsServiceModule,
            {
                transport: Transport.TCP,
                options: {
                    host: '127.0.0.1',
                    port: 3003,
                },
            },
        );

    await app.listen();

    console.log(
        'Regions Service actif sur le port TCP 3003',
    );
}

bootstrap();