import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RegionsServiceService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.region.findMany({
            orderBy: {
                nom: 'asc',
            },
            include: {
                _count: {
                    select: {
                        places: true,
                    },
                },
            },
        });
    }

    findOne(id: number) {
        return this.prisma.region.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        places: true,
                    },
                },
            },
        });
    }

    findBySlug(slug: string) {
        return this.prisma.region.findUnique({
            where: {
                slug,
            },
            include: {
                places: {
                    include: {
                        category: true,
                    },
                    orderBy: {
                        nom: 'asc',
                    },
                },
            },
        });
    }
}