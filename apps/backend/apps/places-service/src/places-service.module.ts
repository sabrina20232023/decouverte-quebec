import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PlacesServiceController } from './places-service.controller';
import { PlacesServiceService } from './places-service.service';

@Module({
    imports: [PrismaModule],
    controllers: [PlacesServiceController],
    providers: [PlacesServiceService],
})
export class PlacesServiceModule { }