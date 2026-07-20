import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';

export class RegionPlaceResponseDto {
    @ApiProperty({
        example: 1,
        description: 'Identifiant du lieu',
    })
    id: number;

    @ApiProperty({
        example: 'Chute Montmorency',
        description: 'Nom du lieu',
    })
    nom: string;

    @ApiPropertyOptional({
        example: 'Magnifique chute près de Québec.',
        nullable: true,
        description: 'Description du lieu',
    })
    description: string | null;

    @ApiPropertyOptional({
        example: '5300 boulevard Sainte-Anne',
        nullable: true,
        description: 'Adresse du lieu',
    })
    adresse: string | null;

    @ApiPropertyOptional({
        example: 'Québec',
        nullable: true,
        description: 'Ville du lieu',
    })
    ville: string | null;

    @ApiProperty({
        example: 46.8902,
        description: 'Latitude du lieu',
    })
    latitude: number;

    @ApiProperty({
        example: -71.1474,
        description: 'Longitude du lieu',
    })
    longitude: number;

    @ApiPropertyOptional({
        example:
            'https://exemple.com/chute-montmorency.jpg',
        nullable: true,
        description: 'URL de l’image du lieu',
    })
    imageUrl: string | null;

    @ApiPropertyOptional({
        example: 'https://www.sepaq.com',
        nullable: true,
        description: 'Site Web du lieu',
    })
    siteWeb: string | null;

    @ApiPropertyOptional({
        example: '418-000-0000',
        nullable: true,
        description: 'Numéro de téléphone',
    })
    telephone: string | null;

    @ApiProperty({
        example: 1,
        description: 'Identifiant de la région',
    })
    regionId: number;

    @ApiProperty({
        example: 1,
        description: 'Identifiant de la catégorie',
    })
    categoryId: number;

    @ApiProperty({
        type: CategoryResponseDto,
        description: 'Catégorie associée au lieu',
    })
    category: CategoryResponseDto;
}

export class RegionDetailsResponseDto {
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

    @ApiProperty({
        type: RegionPlaceResponseDto,
        isArray: true,
        description: 'Lieux appartenant à la région',
    })
    places: RegionPlaceResponseDto[];
}