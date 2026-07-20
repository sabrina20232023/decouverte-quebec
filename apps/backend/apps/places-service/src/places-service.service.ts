import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlacesServiceService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.place.findMany({
            include: {
                region: true,
                category: true,
            },
            orderBy: {
                nom: 'asc',
            },
        });
    }

    findOne(id: number) {
        return this.prisma.place.findUnique({
            where: {
                id,
            },
            include: {
                region: true,
                category: true,
            },
        });
    }
}