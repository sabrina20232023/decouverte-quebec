import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PlaceFiltersDto {
    @ApiPropertyOptional({
        example: 'mont',
        description: 'Recherche dans le nom, la ville ou la description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    recherche?: string;

    @ApiPropertyOptional({
        example: 'capitale-nationale',
        description: 'Slug de la région',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    region?: string;

    @ApiPropertyOptional({
        example: 'Parc',
        description: 'Nom de la catégorie',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    categorie?: string;
}