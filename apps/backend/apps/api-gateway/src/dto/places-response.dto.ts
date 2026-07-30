import { ApiProperty } from '@nestjs/swagger';
import { PlaceResponseDto } from './place-response.dto';

export class PaginationDto {
    @ApiProperty({
        example: 1,
        description:
            'Numéro de la page actuelle',
    })
    page: number;

    @ApiProperty({
        example: 10,
        description:
            'Nombre de lieux par page',
    })
    limit: number;

    @ApiProperty({
        example: 35,
        description:
            'Nombre total de lieux',
    })
    total: number;

    @ApiProperty({
        example: 4,
        description:
            'Nombre total de pages',
    })
    totalPages: number;

    @ApiProperty({
        example: false,
        description:
            'Indique s’il existe une page précédente',
    })
    hasPreviousPage: boolean;

    @ApiProperty({
        example: true,
        description:
            'Indique s’il existe une page suivante',
    })
    hasNextPage: boolean;
}

export class PlacesResponseDto {
    @ApiProperty({
        type: PlaceResponseDto,
        isArray: true,
        description: 'Liste des lieux',
    })
    data: PlaceResponseDto[];

    @ApiProperty({
        type: PaginationDto,
        description:
            'Informations de pagination',
    })
    pagination: PaginationDto;
}