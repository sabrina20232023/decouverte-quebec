import { ApiProperty } from '@nestjs/swagger';
import { PlaceResponseDto } from './place-response.dto';

class PaginationDto {
    @ApiProperty({
        example: 1,
        description: 'Numéro de la page actuelle',
    })
    page: number;

    @ApiProperty({
        example: 10,
        description: 'Nombre de lieux par page',
    })
    limit: number;

    @ApiProperty({
        example: 3,
        description: 'Nombre total de lieux',
    })
    total: number;

    @ApiProperty({
        example: 1,
        description: 'Nombre total de pages',
    })
    totalPages: number;
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
        description: 'Informations de pagination',
    })
    pagination: PaginationDto;
}