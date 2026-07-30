import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class CategoryResponseDto {
    @ApiProperty({
        example: 1,
        description:
            'Identifiant de la catégorie',
    })
    id: number;

    @ApiProperty({
        example: 'Parcs',
        description: 'Nom de la catégorie',
    })
    nom: string;

    @ApiProperty({
        example: 'parcs',
        description: 'Slug de la catégorie',
    })
    slug: string;

    @ApiPropertyOptional({
        example: 'park',
        nullable: true,
        description:
            'Icône associée à la catégorie',
    })
    icone: string | null;
}