import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';
import { RegionResponseDto } from './region-response.dto';

export class PlaceImageResponseDto {
    @ApiProperty({
        example: 1,
        description: 'Identifiant de l’image',
    })
    id: number;

    @ApiProperty({
        example:
            'https://exemple.com/chute-montmorency.jpg',
        description: 'URL de l’image',
    })
    url: string;

    @ApiPropertyOptional({
        example: 'Vue de la chute Montmorency',
        nullable: true,
        description: 'Titre de l’image',
    })
    titre: string | null;

    @ApiPropertyOptional({
        example:
            'Vue panoramique de la chute Montmorency',
        nullable: true,
        description:
            'Texte alternatif de l’image',
    })
    altText: string | null;

    @ApiPropertyOptional({
        example: 1,
        description:
            'Ordre d’affichage de l’image',
    })
    ordre?: number;

    @ApiPropertyOptional({
        example: true,
        description:
            'Indique s’il s’agit de l’image principale',
    })
    estImagePrincipale?: boolean;
}

export class ActivityResponseDto {
    @ApiProperty({
        example: 1,
        description:
            'Identifiant de l’activité',
    })
    id: number;

    @ApiProperty({
        example: 'Randonnée',
        description: 'Nom de l’activité',
    })
    nom: string;

    @ApiProperty({
        example: 'randonnee',
        description: 'Slug de l’activité',
    })
    slug: string;

    @ApiPropertyOptional({
        example: 'hiking',
        nullable: true,
        description:
            'Icône associée à l’activité',
    })
    icone: string | null;
}

export class PlaceActivityResponseDto {
    @ApiProperty({
        example: 1,
        description:
            'Ordre d’affichage de l’activité',
    })
    ordre: number;

    @ApiProperty({
        type: ActivityResponseDto,
        description:
            'Activité associée au lieu',
    })
    activity: ActivityResponseDto;
}

export class PlaceLinkResponseDto {
    @ApiProperty({
        example: 1,
        description: 'Identifiant du lien',
    })
    id: number;

    @ApiProperty({
        example: 'WEBSITE',
        description: 'Type du lien',
    })
    type: string;

    @ApiProperty({
        example:
            'https://www.sepaq.com/destinations/parc-chute-montmorency',
        description: 'Adresse du lien',
    })
    url: string;

    @ApiPropertyOptional({
        example: 'Site officiel',
        nullable: true,
        description: 'Libellé du lien',
    })
    label?: string | null;

    @ApiPropertyOptional({
        example: 1,
        description:
            'Ordre d’affichage du lien',
    })
    ordre?: number;
}

export class PlaceResponseDto {
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

    @ApiProperty({
        example: 'chute-montmorency',
        description: 'Slug du lieu',
    })
    slug: string;

    @ApiPropertyOptional({
        example:
            'Une chute spectaculaire près de Québec.',
        nullable: true,
        description: 'Résumé du lieu',
    })
    resume: string | null;

    @ApiPropertyOptional({
        example:
            'La chute Montmorency mesure environ 83 mètres de hauteur.',
        nullable: true,
        description:
            'Description détaillée du lieu',
    })
    description?: string | null;

    @ApiPropertyOptional({
        example: 'Québec',
        nullable: true,
        description: 'Ville du lieu',
    })
    ville: string | null;

    @ApiPropertyOptional({
        example: '5300 boulevard Sainte-Anne',
        nullable: true,
        description: 'Adresse du lieu',
    })
    adresse?: string | null;

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
        description:
            'URL de l’image miniature du lieu',
    })
    thumbnailUrl: string | null;

    @ApiProperty({
        example: false,
        description:
            'Indique si l’accès au lieu est gratuit',
    })
    estGratuit: boolean;

    @ApiProperty({
        example: true,
        description:
            'Indique si le lieu est mis en vedette',
    })
    estVedette: boolean;

    @ApiPropertyOptional({
        example: 4.7,
        nullable: true,
        description:
            'Note moyenne attribuée au lieu',
    })
    note: number | null;

    @ApiProperty({
        example: 125,
        description:
            'Nombre d’avis associés au lieu',
    })
    nombreAvis: number;

    @ApiPropertyOptional({
        example: '418-663-3330',
        nullable: true,
        description:
            'Numéro de téléphone du lieu',
    })
    telephone?: string | null;

    @ApiPropertyOptional({
        example:
            'https://www.sepaq.com/destinations/parc-chute-montmorency',
        nullable: true,
        description:
            'Site Web principal du lieu',
    })
    siteWeb?: string | null;

    @ApiPropertyOptional({
        example: true,
        description:
            'Indique si le lieu est actif',
    })
    estActif?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description:
            'Identifiant de la région',
    })
    regionId?: number;

    @ApiPropertyOptional({
        example: 1,
        description:
            'Identifiant de la catégorie',
    })
    categoryId?: number;

    @ApiProperty({
        type: RegionResponseDto,
        description:
            'Région associée au lieu',
    })
    region: RegionResponseDto;

    @ApiProperty({
        type: CategoryResponseDto,
        description:
            'Catégorie associée au lieu',
    })
    category: CategoryResponseDto;

    @ApiProperty({
        type: PlaceImageResponseDto,
        isArray: true,
        description:
            'Images associées au lieu',
    })
    images: PlaceImageResponseDto[];

    @ApiProperty({
        type: PlaceActivityResponseDto,
        isArray: true,
        description:
            'Activités offertes dans le lieu',
    })
    placeActivities: PlaceActivityResponseDto[];

    @ApiPropertyOptional({
        type: PlaceLinkResponseDto,
        isArray: true,
        description:
            'Liens associés au lieu',
    })
    links?: PlaceLinkResponseDto[];

    @ApiPropertyOptional({
        example: '2026-07-20T15:51:31.171Z',
        description: 'Date de création',
    })
    createdAt?: Date;

    @ApiPropertyOptional({
        example: '2026-07-20T15:51:31.171Z',
        description:
            'Date de dernière modification',
    })
    updatedAt?: Date;
}