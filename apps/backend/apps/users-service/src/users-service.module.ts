import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/prisma/prisma.module';

import { UsersServiceController } from './users-service.controller';
import { UsersServiceService } from './users-service.service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [
        UsersServiceController,
    ],
    providers: [
        UsersServiceService,
    ],
})
export class UsersServiceModule { }