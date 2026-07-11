import { NestFactory } from '@nestjs/core';
import { FavoritesServiceModule } from './favorites-service.module';

async function bootstrap() {
  const app = await NestFactory.create(FavoritesServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
