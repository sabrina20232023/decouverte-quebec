import { ApiProperty } from '@nestjs/swagger';

export class RegionPlacesCountDto {
    @ApiProperty({
        example: 2,
        description:
            'Nombre de lieux associés à la région',
    })
    places: number;
}

export class RegionCountResponseDto {
    @ApiProperty({
        example: 1,
        description: 'Identifiant de la région',
    })
    id: number;

    @ApiProperty({
        example: 'Capitale-Nationale',
        description: 'Nom de la région',
    })
    nom: string;

    @ApiProperty({
        example: 'capitale-nationale',
        description: 'Slug de la région',
    })
    slug: string;

    @ApiProperty({
        example: 'Région de Québec',
        nullable: true,
        description: 'Description de la région',
    })
    description: string | null;

    @ApiProperty({
        type: RegionPlacesCountDto,
        description:
            'Nombre de lieux associés à la région',
    })
    _count: RegionPlacesCountDto;
}