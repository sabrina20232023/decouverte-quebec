import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RegionsServiceController } from './regions-service.controller';
import { RegionsServiceService } from './regions-service.service';

@Module({
    imports: [PrismaModule],
    controllers: [RegionsServiceController],
    providers: [RegionsServiceService],
})
export class RegionsServiceModule { }