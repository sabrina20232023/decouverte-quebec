import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
        example: 'Région de Québec',
        nullable: true,
        description: 'Description de la région',
    })
    description: string | null;
}