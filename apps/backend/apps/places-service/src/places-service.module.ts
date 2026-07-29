import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../common/prisma/prisma.module';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
    ],
    controllers: [PlacesServiceController],
    providers: [PlacesServiceService],
})
export class PlacesServiceModule { }