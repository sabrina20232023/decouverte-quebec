import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

    @ApiPropertyOptional({
        example: 1,
        default: 1,
        minimum: 1,
        description: 'Numéro de la page',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        example: 10,
        default: 10,
        minimum: 1,
        maximum: 50,
        description: 'Nombre de lieux par page',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;
}