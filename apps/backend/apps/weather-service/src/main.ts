import { NestFactory } from '@nestjs/core';
import { WeatherServiceModule } from './weather-service.module';

async function bootstrap() {
  const app = await NestFactory.create(WeatherServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
