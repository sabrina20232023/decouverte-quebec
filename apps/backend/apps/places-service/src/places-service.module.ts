import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GeoapifyService } from './geoapify/geoapify.service';
import { ImportService } from './import/import.service';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';
import { ImageService } from './images/image.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        HttpModule,
        PrismaModule,
    ],
    controllers: [
        PlacesServiceController,
    ],
    providers: [
        PlacesServiceService,
        GeoapifyService,
        ImageService,
        ImportService,
    ],
    exports: [
        GeoapifyService,
    ],
})
export class PlacesServiceModule { }