import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface GeoapifyGeometry {
    type: 'Point';
    coordinates: [number, number];
}

export interface GeoapifyContact {
    phone?: string;
    email?: string;
}

export interface GeoapifyDatasource {
    sourcename?: string;
    attribution?: string;
    license?: string;
    url?: string;
    raw?: Record<string, unknown>;
}

export interface GeoapifyPlaceProperties {
    name?: string;
    country?: string;
    country_code?: string;
    state?: string;
    state_code?: string;
    county?: string;
    city?: string;
    municipality?: string;
    postcode?: string;
    district?: string;
    suburb?: string;
    street?: string;
    housenumber?: string;
    address_line1?: string;
    address_line2?: string;
    formatted?: string;

    lat: number;
    lon: number;

    categories?: string[];
    details?: string[];
    place_id: string;

    website?: string;
    phone?: string;
    email?: string;

    contact?: GeoapifyContact;
    datasource?: GeoapifyDatasource;
}

export interface GeoapifyFeature {
    type: 'Feature';
    properties: GeoapifyPlaceProperties;
    geometry: GeoapifyGeometry;
}

export interface GeoapifyFeatureCollection {
    type: 'FeatureCollection';
    features: GeoapifyFeature[];
}

export interface GeoapifySearchParams {
    latitude: number;
    longitude: number;

    rayon?: number;
    limite?: number;
    offset?: number;

    categories?: string[];

    langue?: 'fr' | 'en';

    seulementCanada?: boolean;
    countryCode?: string;
    provinceCode?: string;
}

/**
 * Nombre maximal de résultats que Geoapify accepte en un seul appel
 * (paramètre `limit`, plafonné à 100 côté API).
 */
const TAILLE_PAGE_GEOAPIFY = 100;

@Injectable()
export class GeoapifyService {
    private readonly logger = new Logger(GeoapifyService.name);

    private readonly apiKey: string;
    private readonly baseUrl: string;

    private readonly categoriesTouristiquesParDefaut = [
        'tourism',
        'entertainment',
        'natural',
        'heritage',
    ];

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.apiKey =
            this.configService.get<string>('GEOAPIFY_API_KEY')?.trim() ?? '';

        this.baseUrl =
            this.configService.get<string>('GEOAPIFY_BASE_URL')?.trim() ??
            'https://api.geoapify.com/v2';
    }

    async rechercherLieuxProches(
        params: GeoapifySearchParams,
    ): Promise<GeoapifyFeature[]> {
        this.verifierConfiguration();

        const latitude = Number(params.latitude);
        const longitude = Number(params.longitude);

        this.verifierCoordonnees(latitude, longitude);

        const rayon = Math.min(
            100_000,
            Math.max(100, Number(params.rayon) || 10_000),
        );

        const limite = Math.min(
            100,
            Math.max(1, Number(params.limite) || 20),
        );

        const offset = Math.max(0, Number(params.offset) || 0);

        const categories =
            params.categories?.length
                ? params.categories
                : this.categoriesTouristiquesParDefaut;

        const langue = params.langue ?? 'fr';

        const seulementCanada = params.seulementCanada ?? true;

        const countryCode = params.countryCode?.trim().toLowerCase();

        const provinceCode = params.provinceCode?.trim().toLowerCase();

        const url = `${this.baseUrl}/places`;

        try {
            const response = await firstValueFrom(
                this.httpService.get<GeoapifyFeatureCollection>(url, {
                    params: {
                        categories: categories.join(','),
                        filter: `circle:${longitude},${latitude},${rayon}`,
                        bias: `proximity:${longitude},${latitude}`,
                        limit: limite,
                        offset,
                        lang: langue,
                        apiKey: this.apiKey,
                    },
                    timeout: 15_000,
                }),
            );

            const features = Array.isArray(response.data?.features)
                ? response.data.features
                : [];

            return features.filter((feature) => {
                if (!this.estLieuValide(feature)) {
                    return false;
                }

                const properties = feature.properties;

                if (
                    seulementCanada &&
                    properties.country_code?.toLowerCase() !== 'ca'
                ) {
                    return false;
                }

                if (
                    countryCode &&
                    properties.country_code?.toLowerCase() !== countryCode
                ) {
                    return false;
                }

                if (
                    provinceCode &&
                    !this.correspondAProvince(properties, provinceCode)
                ) {
                    return false;
                }

                return true;
            });
        } catch (error: unknown) {
            this.gererErreurApi(
                error,
                'Impossible de récupérer les lieux depuis Geoapify.',
            );
        }
    }

    /**
     * Variante paginée de `rechercherLieuxProches`, pour dépasser la
     * limite de 100 résultats par appel imposée par Geoapify.
     *
     * Enchaîne les appels par pages de `TAILLE_PAGE_GEOAPIFY` (offset
     * croissant) jusqu'à atteindre `limiteTotale` ou jusqu'à ce
     * qu'une page revienne avec moins de résultats que la taille de
     * page demandée (signe qu'il n'y a plus de résultats à récupérer).
     */
    async rechercherLieuxProchesPagine(
        params: GeoapifySearchParams,
        limiteTotale: number,
    ): Promise<GeoapifyFeature[]> {
        const cible = Math.max(1, Math.floor(limiteTotale) || 20);

        const resultats: GeoapifyFeature[] = [];
        let offset = 0;

        while (resultats.length < cible) {
            const tailleRestante = cible - resultats.length;
            const tailleDemandee = Math.min(
                TAILLE_PAGE_GEOAPIFY,
                tailleRestante,
            );

            const page = await this.rechercherLieuxProches({
                ...params,
                limite: tailleDemandee,
                offset,
            });

            resultats.push(...page);

            // Moins de résultats que demandé => plus rien à paginer.
            if (page.length < tailleDemandee) {
                break;
            }

            offset += tailleDemandee;
        }

        return resultats.slice(0, cible);
    }

    async rechercherLieuxAuQuebec(
        latitude: number,
        longitude: number,
        rayon = 10_000,
        limite = 20,
        offset = 0,
    ): Promise<GeoapifyFeature[]> {
        return this.rechercherLieuxProches({
            latitude,
            longitude,
            rayon,
            limite,
            offset,
            langue: 'fr',
            seulementCanada: true,
            countryCode: 'ca',
            provinceCode: 'qc',
        });
    }

    async rechercherLieuxAuCanada(
        latitude: number,
        longitude: number,
        rayon = 10_000,
        limite = 20,
        offset = 0,
    ): Promise<GeoapifyFeature[]> {
        return this.rechercherLieuxProches({
            latitude,
            longitude,
            rayon,
            limite,
            offset,
            langue: 'fr',
            seulementCanada: true,
            countryCode: 'ca',
        });
    }

    private estLieuValide(feature: GeoapifyFeature): boolean {
        if (!feature?.properties?.place_id) {
            return false;
        }

        if (!feature.properties.name?.trim()) {
            return false;
        }

        const latitude = Number(
            feature.properties.lat ?? feature.geometry?.coordinates?.[1],
        );

        const longitude = Number(
            feature.properties.lon ?? feature.geometry?.coordinates?.[0],
        );

        return (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
        );
    }

    private correspondAProvince(
        properties: GeoapifyPlaceProperties,
        provinceCode: string,
    ): boolean {
        const state = properties.state?.trim().toLowerCase() ?? '';

        const stateCode =
            properties.state_code?.trim().toLowerCase() ?? '';

        const codeNormalise = provinceCode.toLowerCase();

        if (
            stateCode === codeNormalise ||
            stateCode === `ca-${codeNormalise}`
        ) {
            return true;
        }

        const nomsParCode: Record<string, string[]> = {
            qc: ['quebec', 'québec'],
            on: ['ontario'],
            nb: ['new brunswick', 'nouveau-brunswick'],
            ns: ['nova scotia', 'nouvelle-écosse'],
            pe: ['prince edward island', 'île-du-prince-édouard'],
            nl: ['newfoundland and labrador', 'terre-neuve-et-labrador'],
            mb: ['manitoba'],
            sk: ['saskatchewan'],
            ab: ['alberta'],
            bc: ['british columbia', 'colombie-britannique'],
            yt: ['yukon'],
            nt: ['northwest territories', 'territoires du nord-ouest'],
            nu: ['nunavut'],
        };

        return nomsParCode[codeNormalise]?.includes(state) ?? false;
    }

    private verifierConfiguration(): void {
        if (!this.apiKey) {
            throw new InternalServerErrorException(
                'La variable GEOAPIFY_API_KEY est absente du fichier .env.',
            );
        }
    }

    private verifierCoordonnees(
        latitude: number,
        longitude: number,
    ): void {
        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {
            throw new BadRequestException(
                'La latitude doit être comprise entre -90 et 90.',
            );
        }

        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            throw new BadRequestException(
                'La longitude doit être comprise entre -180 et 180.',
            );
        }
    }

    private gererErreurApi(
        error: unknown,
        message: string,
    ): never {
        if (error instanceof AxiosError) {
            const statut = error.response?.status;
            const donnees = error.response?.data;

            this.logger.error(
                `${message} Statut HTTP : ${statut ?? 'inconnu'}`,
                typeof donnees === 'string'
                    ? donnees
                    : JSON.stringify(donnees),
            );

            throw new BadGatewayException({
                message,
                fournisseur: 'Geoapify',
                statutExterne: statut ?? null,
            });
        }

        this.logger.error(
            message,
            error instanceof Error ? error.stack : String(error),
        );

        throw new BadGatewayException({
            message,
            fournisseur: 'Geoapify',
        });
    }
}