import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { WeatherServiceController } from './weather-service.controller';
import { WeatherServiceService } from './weather-service.service';

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
        WeatherServiceController,
    ],
    providers: [
        WeatherServiceService,
    ],
})
export class WeatherServiceModule { }