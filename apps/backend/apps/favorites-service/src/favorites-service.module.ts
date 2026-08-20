import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/prisma/prisma.module';

import { FavoritesServiceController } from './favorites-service.controller';
import { FavoritesServiceService } from './favorites-service.service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [
        FavoritesServiceController,
    ],
    providers: [
        FavoritesServiceService,
    ],
})
export class FavoritesServiceModule { }