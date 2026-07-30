import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class ProvinceResponseDto {
    @ApiProperty({
        example: 1,
        description: 'Identifiant de la province',
    })
    id: number;

    @ApiProperty({
        example: 'Québec',
        description: 'Nom de la province',
    })
    nom: string;

    @ApiProperty({
        example: 'QC',
        description: 'Code de la province',
    })
    code: string;

    @ApiProperty({
        example: 'quebec',
        description: 'Slug de la province',
    })
    slug: string;
}

export class RegionResponseDto {
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

    @ApiPropertyOptional({
        example: 'Région touristique de Québec',
        nullable: true,
        description: 'Description de la région',
    })
    description?: string | null;

    @ApiPropertyOptional({
        type: ProvinceResponseDto,
        description:
            'Province associée à la région',
    })
    province?: ProvinceResponseDto;
}