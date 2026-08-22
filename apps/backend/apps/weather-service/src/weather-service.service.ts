import { HttpService } from '@nestjs/axios';
import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '../../common/generated/prisma/client';

/*
 * ------------------------------------------------------------------
 * MIGRATION : One Call 3.0 (payant, nécessite un abonnement séparé)
 * -> API gratuites classiques :
 *      - /data/2.5/weather   (météo actuelle)
 *      - /data/2.5/forecast  (prévisions 3h, 5 jours max)
 *
 * Différences importantes par rapport à One Call 3.0 :
 * 1. Le champ "timezone" n'est plus un nom IANA ("America/Toronto")
 *    mais un décalage en secondes par rapport à UTC. Toutes les
 *    dates sont donc formatées manuellement à partir de ce décalage
 *    plutôt qu'avec Intl.DateTimeFormat + timeZone nommée.
 *
 * 2. /forecast ne fournit pas de prévisions quotidiennes toutes
 *    faites : il renvoie un point toutes les 3 heures, sur 5 jours
 *    maximum (40 points). On reconstruit donc des journées en
 *    regroupant ces points par date locale.
 *
 * 3. L'indice UV n'est pas disponible sur ces endpoints gratuits :
 *    indiceUV est toujours retourné à null.
 *
 * 4. Le lever/coucher du soleil n'est fourni par l'API que pour la
 *    journée courante (dans /weather). Il n'existe pas de valeur
 *    équivalente par jour dans /forecast : leverSoleil/coucherSoleil
 *    valent donc null pour les prévisions futures.
 *
 * ARCHITECTURE DU SERVICE :
 * - obtenirPrevisions() et obtenirMeteoComplete() fonctionnent avec
 *   latitude/longitude.
 * - placeId est OPTIONNEL et sert uniquement à activer le cache.
 *
 *   placeId absent/invalide :
 *      -> appel direct à OpenWeather.
 *
 *   placeId valide :
 *      -> vérification du cache Prisma ;
 *      -> sinon OpenWeather ;
 *      -> puis sauvegarde du cache.
 *
 * CACHE PRISMA :
 * - Le cache concerne uniquement les prévisions.
 * - Clé : (placeId, datePrevision).
 * - Durée : 10 minutes.
 * - donneesCompletes stocke le DTO complet afin que la réponse
 *   provenant du cache soit identique à une réponse fraîche.
 *
 *   Prisma.InputJsonValue exige une valeur JSON "pure" (objets,
 *   tableaux, string, number, boolean, null) — pas un type
 *   TypeScript avec des interfaces imbriquées comme
 *   PrevisionJournaliereResponse. JSON.parse(JSON.stringify(...))
 *   convertit le DTO typé en valeur JSON brute avant de la caster
 *   en Prisma.InputJsonValue, ce qui satisfait le compilateur.
 *
 * LOGS (Weather 1) :
 * - [CACHE BYPASS] : placeId absent/invalide, appel direct.
 * - [CACHE CHECK]  : recherche en cache lancée pour un placeId valide.
 * - [CACHE HIT]    : prévisions trouvées et servies depuis Prisma.
 * - [CACHE MISS]   : rien en cache (absent ou expiré) pour ce placeId.
 * - [OPENWEATHER]  : appel sortant vers l'API OpenWeather.
 * - [CACHE SAVE]   : début de l'écriture du cache.
 * - [CACHE SAVE END] : fin du traitement d'écriture (que chaque
 *   upsert individuel ait réussi ou non — voir sauvegarderPrevisionsEnCache).
 *
 * LOGS (Weather 2 — fallback sur cache expiré) :
 * - [OPENWEATHER FAILURE]    : l'appel OpenWeather a échoué, tentative
 *   de repli sur un ancien cache (uniquement si placeId valide).
 * - [CACHE FALLBACK CHECK]   : recherche d'un ancien cache expiré lancée.
 * - [CACHE FALLBACK HIT]     : ancien cache expiré trouvé et utilisé
 *   en secours (mieux qu'aucune donnée).
 * - [CACHE FALLBACK MISS]    : aucun ancien cache disponible ; l'erreur
 *   OpenWeather d'origine est propagée telle quelle.
 *
 *   Important : un cache expiré n'est JAMAIS considéré comme valide
 *   dans le chemin normal (rechercherPrevisionsEnCache filtre
 *   `expiresAt: { gt: now }`) — il n'est lu que dans ce chemin de
 *   secours, quand OpenWeather est indisponible.
 * ------------------------------------------------------------------
 */

interface OpenWeatherCondition {
    id: number;
    main: string;
    description: string;
    icon: string;
}

interface OpenWeatherWind {
    speed: number;
    deg: number;
    gust?: number;
}

interface OpenWeatherClouds {
    all: number;
}

// ======================================================
// /data/2.5/weather
// ======================================================

interface OpenWeatherCurrentMain {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    temp_min?: number;
    temp_max?: number;
}

interface OpenWeatherCurrentSys {
    sunrise?: number;
    sunset?: number;
}

interface OpenWeatherCurrentWeatherResponse {
    coord: {
        lat: number;
        lon: number;
    };

    weather: OpenWeatherCondition[];

    main: OpenWeatherCurrentMain;

    visibility?: number;

    wind: OpenWeatherWind;

    clouds: OpenWeatherClouds;

    dt: number;

    sys: OpenWeatherCurrentSys;

    timezone: number;

    name?: string;
}

// ======================================================
// /data/2.5/forecast
// ======================================================

interface OpenWeatherForecastMain {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
}

interface OpenWeatherForecastListItem {
    dt: number;

    main: OpenWeatherForecastMain;

    weather: OpenWeatherCondition[];

    clouds: OpenWeatherClouds;

    wind: OpenWeatherWind;

    visibility?: number;

    pop?: number;

    rain?: {
        '3h'?: number;
    };

    snow?: {
        '3h'?: number;
    };

    dt_txt?: string;
}

interface OpenWeatherForecastCity {
    id: number;
    name: string;

    coord: {
        lat: number;
        lon: number;
    };

    country?: string;

    timezone: number;

    sunrise?: number;
    sunset?: number;
}

interface OpenWeatherForecastResponse {
    cod: string;
    message: number;
    cnt: number;

    list: OpenWeatherForecastListItem[];

    city: OpenWeatherForecastCity;
}

// ======================================================
// Réponses exposées par le service
// ======================================================

export interface VentResponse {
    vitesseMetresSeconde: number;
    vitesseKmHeure: number;

    directionDegres: number;

    rafalesMetresSeconde: number | null;
    rafalesKmHeure: number | null;
}

export interface MeteoActuelleResponse {
    latitude: number;
    longitude: number;

    fuseauHoraire: string;

    dateObservation: string;

    temperature: number;

    temperatureRessentie: number;

    condition: string;

    description: string;

    icone: string | null;

    iconeUrl: string | null;

    humidite: number;

    pression: number;

    nuages: number;

    visibiliteMetres: number | null;

    vent: VentResponse;

    leverSoleil: string | null;

    coucherSoleil: string | null;

    indiceUV: number | null;
}

export interface TemperatureJournaliereResponse {
    matin: number;
    jour: number;
    soir: number;
    nuit: number;

    minimum: number;
    maximum: number;
}

export interface TemperatureRessentieJournaliereResponse {
    matin: number;
    jour: number;
    soir: number;
    nuit: number;
}

export interface PrevisionJournaliereResponse {
    date: string;

    resume: string | null;

    temperature:
    TemperatureJournaliereResponse;

    temperatureRessentie:
    TemperatureRessentieJournaliereResponse;

    condition: string;

    description: string;

    icone: string | null;

    iconeUrl: string | null;

    probabilitePrecipitation: number;

    pluieMillimetres: number;

    neigeMillimetres: number;

    humidite: number;

    pression: number;

    nuages: number;

    vent: VentResponse;

    leverSoleil: string | null;

    coucherSoleil: string | null;

    indiceUV: number | null;
}

export interface MeteoCompleteResponse {
    fournisseur: 'OpenWeather';

    latitude: number;
    longitude: number;

    fuseauHoraire: string;

    actuelle: MeteoActuelleResponse;

    previsions:
    PrevisionJournaliereResponse[];
}

interface JourAgrege {
    dateLocale: string;

    entrees:
    OpenWeatherForecastListItem[];
}

// ======================================================
// SERVICE
// ======================================================

@Injectable()
export class WeatherServiceService {
    private readonly logger =
        new Logger(
            WeatherServiceService.name,
        );

    private readonly apiKey: string;

    private readonly baseUrl: string;

    private readonly dureeCacheMinutes =
        10;

    constructor(
        private readonly httpService:
            HttpService,

        private readonly configService:
            ConfigService,

        private readonly prisma:
            PrismaService,
    ) {
        this.apiKey =
            this.configService
                .get<string>(
                    'OPENWEATHER_API_KEY',
                )
                ?.trim() ?? '';

        this.baseUrl =
            this.configService
                .get<string>(
                    'OPENWEATHER_BASE_URL',
                )
                ?.trim() ??
            'https://api.openweathermap.org/data/2.5';
    }

    // ==================================================
    // MÉTÉO COMPLÈTE
    // ==================================================

    async obtenirMeteoComplete(
        latitude: number,
        longitude: number,
        placeId?: number,
    ): Promise<MeteoCompleteResponse> {
        const latitudeValide =
            Number(latitude);

        const longitudeValide =
            Number(longitude);

        this.verifierConfiguration();

        this.verifierCoordonnees(
            latitudeValide,
            longitudeValide,
        );

        const [
            actuelle,
            previsions,
        ] = await Promise.all([
            this.obtenirMeteoActuelle(
                latitudeValide,
                longitudeValide,
            ),

            this.obtenirPrevisions(
                latitudeValide,
                longitudeValide,
                placeId,
            ),
        ]);

        return {
            fournisseur:
                'OpenWeather',

            latitude:
                actuelle.latitude,

            longitude:
                actuelle.longitude,

            fuseauHoraire:
                actuelle.fuseauHoraire,

            actuelle,

            previsions,
        };
    }

    // ==================================================
    // MÉTÉO ACTUELLE
    // ==================================================

    async obtenirMeteoActuelle(
        latitude: number,
        longitude: number,
    ): Promise<MeteoActuelleResponse> {
        const latitudeValide =
            Number(latitude);

        const longitudeValide =
            Number(longitude);

        this.verifierConfiguration();

        this.verifierCoordonnees(
            latitudeValide,
            longitudeValide,
        );

        const donnees =
            await this.appelerMeteoActuelle(
                latitudeValide,
                longitudeValide,
            );

        return this.transformerMeteoActuelle(
            donnees,
        );
    }

    // ==================================================
    // PRÉVISIONS
    // ==================================================

    async obtenirPrevisions(
        latitude: number,
        longitude: number,
        placeId?: number,
    ): Promise<
        PrevisionJournaliereResponse[]
    > {
        const latitudeValide =
            Number(latitude);

        const longitudeValide =
            Number(longitude);

        this.verifierConfiguration();

        this.verifierCoordonnees(
            latitudeValide,
            longitudeValide,
        );

        /*
         * Le cache est activé uniquement
         * si placeId est un entier positif.
         *
         * Attention :
         * typeof NaN === 'number',
         * donc typeof seul ne suffit pas.
         */
        const cacheActif =
            typeof placeId === 'number' &&
            Number.isInteger(placeId) &&
            placeId > 0;

        if (!cacheActif) {
            this.logger.log(
                '[CACHE BYPASS] Prévisions sans placeId valide. ' +
                'Appel direct à OpenWeather.',
            );
        }

        if (cacheActif) {
            this.logger.debug(
                `[CACHE CHECK] Recherche des prévisions ` +
                `pour placeId=${placeId}.`,
            );

            const previsionsEnCache =
                await this.rechercherPrevisionsEnCache(
                    placeId,
                );

            if (
                previsionsEnCache.length >
                0
            ) {
                this.logger.log(
                    `[CACHE HIT] placeId=${placeId} - ` +
                    `${previsionsEnCache.length} jour(s) ` +
                    `récupéré(s) depuis Prisma.`,
                );

                return previsionsEnCache.map(
                    (ligne) =>
                        this.convertirLigneEnPrevision(
                            ligne,
                        ),
                );
            }

            this.logger.log(
                `[CACHE MISS] Aucune prévision valide ` +
                `pour placeId=${placeId}.`,
            );
        }

        this.logger.log(
            `[OPENWEATHER] Récupération des prévisions ` +
            `pour latitude=${latitudeValide}, ` +
            `longitude=${longitudeValide}.`,
        );

        let donneesBrutes: OpenWeatherForecastResponse;

        try {
            donneesBrutes =
                await this.appelerPrevisions(
                    latitudeValide,
                    longitudeValide,
                );
        } catch (error: unknown) {
            if (cacheActif) {
                this.logger.warn(
                    `[OPENWEATHER FAILURE] Échec de l'appel OpenWeather ` +
                    `pour placeId=${placeId}, tentative de repli sur ` +
                    `le cache expiré.`,
                );

                this.logger.debug(
                    `[CACHE FALLBACK CHECK] Recherche d'un ancien cache ` +
                    `expiré pour placeId=${placeId}.`,
                );

                const previsionsExpirees =
                    await this.rechercherPrevisionsExpirees(
                        placeId,
                    );

                if (previsionsExpirees.length > 0) {
                    this.logger.log(
                        `[CACHE FALLBACK HIT] placeId=${placeId} - ` +
                        `${previsionsExpirees.length} jour(s) ` +
                        `récupéré(s) depuis un cache expiré, en secours.`,
                    );

                    return previsionsExpirees.map(
                        (ligne) =>
                            this.convertirLigneEnPrevision(
                                ligne,
                            ),
                    );
                }

                this.logger.warn(
                    `[CACHE FALLBACK MISS] Aucun ancien cache disponible ` +
                    `pour placeId=${placeId}. Propagation de l'erreur ` +
                    `OpenWeather d'origine.`,
                );
            }

            // Pas de placeId (donc pas de repli possible), ou repli
            // épuisé : on propage l'erreur OpenWeather d'origine
            // (déjà une BadGatewayException levée par
            // gererErreurOpenWeather via appelerPrevisions).
            throw error;
        }

        const previsions =
            this.transformerPrevisions(
                donneesBrutes,
            );

        this.logger.log(
            `[OPENWEATHER SUCCESS] ${previsions.length} ` +
            `jour(s) de prévisions récupéré(s).`,
        );

        if (cacheActif) {
            await this.sauvegarderPrevisionsEnCache(
                placeId,
                previsions,
            );
        }

        return previsions;
    }

    /**
     * Recherche un ancien cache (potentiellement expiré) pour
     * placeId, utilisé UNIQUEMENT en solution de secours quand
     * OpenWeather est indisponible (Weather 2 — fallback). Le cache
     * expiré n'est jamais considéré comme valide dans le chemin
     * normal (voir rechercherPrevisionsEnCache, qui filtre
     * `expiresAt: { gt: now }`).
     */
    private async rechercherPrevisionsExpirees(
        placeId: number,
    ) {
        const debutAujourdhui =
            new Date();

        debutAujourdhui.setHours(
            0,
            0,
            0,
            0,
        );

        try {
            return await this.prisma
                .weatherForecast
                .findMany({
                    where: {
                        placeId,

                        datePrevision: {
                            gte:
                                debutAujourdhui,
                        },

                        expiresAt: {
                            lte:
                                new Date(),
                        },
                    },

                    orderBy: {
                        datePrevision:
                            'asc',
                    },

                    take: 5,
                });
        } catch (error: unknown) {
            this.logger.warn(
                `[CACHE FALLBACK ERROR] Impossible de lire le cache expiré ` +
                `pour placeId=${placeId}. ` +
                `Erreur : ${error instanceof Error
                    ? error.message
                    : String(error)
                }`,
            );

            return [];
        }
    }

    // ==================================================
    // CACHE PRISMA
    // ==================================================

    private async rechercherPrevisionsEnCache(
        placeId: number,
    ) {
        const debutAujourdhui =
            new Date();

        debutAujourdhui.setHours(
            0,
            0,
            0,
            0,
        );

        try {
            return await this.prisma
                .weatherForecast
                .findMany({
                    where: {
                        placeId,

                        datePrevision: {
                            gte:
                                debutAujourdhui,
                        },

                        expiresAt: {
                            gt:
                                new Date(),
                        },
                    },

                    orderBy: {
                        datePrevision:
                            'asc',
                    },

                    take: 5,
                });
        } catch (error: unknown) {
            this.logger.warn(
                `[CACHE READ ERROR] Impossible de lire le cache valide ` +
                `pour placeId=${placeId}. ` +
                `La requête continuera avec OpenWeather. ` +
                `Erreur : ${error instanceof Error
                    ? error.message
                    : String(error)
                }`,
            );

            return [];
        }
    }

    private async sauvegarderPrevisionsEnCache(
        placeId: number,
        previsions:
            PrevisionJournaliereResponse[],
    ): Promise<void> {
        const maintenant =
            new Date();

        const expiresAt =
            new Date(
                maintenant.getTime() +
                this.dureeCacheMinutes *
                60_000,
            );

        this.logger.debug(
            `[CACHE SAVE] Sauvegarde de ${previsions.length} ` +
            `jour(s) pour placeId=${placeId}.`,
        );

        /*
         * Les upsert sont indépendants.
         *
         * Promise.all permet donc de les
         * exécuter en parallèle plutôt
         * que séquentiellement.
         */
        await Promise.all(
            previsions.map(
                async (prevision) => {
                    const datePrevision =
                        new Date(
                            `${prevision.date}T00:00:00.000Z`,
                        );

                    if (
                        Number.isNaN(
                            datePrevision.getTime(),
                        )
                    ) {
                        this.logger.warn(
                            `Date de prévision invalide : ` +
                            `${prevision.date}`,
                        );

                        return;
                    }

                    /*
                     * Prisma.InputJsonValue exige une valeur
                     * JSON pure. Le DTO typé
                     * (PrevisionJournaliereResponse) contient des
                     * interfaces TypeScript imbriquées que le
                     * compilateur ne reconnaît pas comme du JSON
                     * brut, même si la forme est compatible à
                     * l'exécution. JSON.parse(JSON.stringify(...))
                     * produit un objet réellement "plain JSON"
                     * qui satisfait le typage Prisma.
                     */
                    const donneesCompletes =
                        JSON.parse(
                            JSON.stringify(
                                prevision,
                            ),
                        ) as Prisma.InputJsonValue;

                    try {
                        await this.prisma
                            .weatherForecast
                            .upsert({
                                where: {
                                    placeId_datePrevision:
                                    {
                                        placeId,
                                        datePrevision,
                                    },
                                },

                                create: {
                                    placeId,

                                    datePrevision,

                                    temperatureMin:
                                        prevision
                                            .temperature
                                            .minimum,

                                    temperatureMax:
                                        prevision
                                            .temperature
                                            .maximum,

                                    temperatureRessentie:
                                        prevision
                                            .temperatureRessentie
                                            .jour,

                                    humidite:
                                        prevision
                                            .humidite,

                                    ventKmh:
                                        prevision
                                            .vent
                                            .vitesseKmHeure,

                                    probabilitePrecipitation:
                                        prevision
                                            .probabilitePrecipitation,

                                    condition:
                                        prevision
                                            .condition,

                                    description:
                                        prevision
                                            .description,

                                    icone:
                                        prevision
                                            .icone,

                                    sourceApi:
                                        'OpenWeather',

                                    donneesCompletes,

                                    fetchedAt:
                                        maintenant,

                                    expiresAt,
                                },

                                update: {
                                    temperatureMin:
                                        prevision
                                            .temperature
                                            .minimum,

                                    temperatureMax:
                                        prevision
                                            .temperature
                                            .maximum,

                                    temperatureRessentie:
                                        prevision
                                            .temperatureRessentie
                                            .jour,

                                    humidite:
                                        prevision
                                            .humidite,

                                    ventKmh:
                                        prevision
                                            .vent
                                            .vitesseKmHeure,

                                    probabilitePrecipitation:
                                        prevision
                                            .probabilitePrecipitation,

                                    condition:
                                        prevision
                                            .condition,

                                    description:
                                        prevision
                                            .description,

                                    icone:
                                        prevision
                                            .icone,

                                    sourceApi:
                                        'OpenWeather',

                                    donneesCompletes,

                                    fetchedAt:
                                        maintenant,

                                    expiresAt,
                                },
                            });
                    } catch (
                    error: unknown
                    ) {
                        /*
                         * Une erreur de cache
                         * ne doit jamais faire
                         * échouer la météo.
                         */
                        this.logger.warn(
                            `Échec de la mise en cache de ` +
                            `${prevision.date} pour ` +
                            `placeId=${placeId} : ` +
                            `${error instanceof
                                Error
                                ? error.message
                                : String(
                                    error,
                                )
                            }`,
                        );
                    }
                },
            ),
        );

        this.logger.log(
            `[CACHE SAVE END] Traitement de mise en cache terminé ` +
            `pour placeId=${placeId}. Expiration prévue : ` +
            `${expiresAt.toISOString()}.`,
        );
    }

    // ==================================================
    // LECTURE DU JSON EN CACHE
    // ==================================================

    private convertirLigneEnPrevision(
        ligne: {
            datePrevision: Date;

            temperatureMin:
            number | null;

            temperatureMax:
            number | null;

            temperatureRessentie:
            number | null;

            humidite:
            number | null;

            ventKmh:
            number | null;

            probabilitePrecipitation:
            number | null;

            condition: string;

            description:
            string | null;

            icone:
            string | null;

            donneesCompletes?:
            unknown;
        },
    ): PrevisionJournaliereResponse {
        if (
            this.estPrevisionComplete(
                ligne.donneesCompletes,
            )
        ) {
            return ligne.donneesCompletes;
        }

        return this.reconstituerPrevisionPartielle(
            ligne,
        );
    }

    private estPrevisionComplete(
        valeur: unknown,
    ): valeur is PrevisionJournaliereResponse {
        return (
            typeof valeur ===
            'object' &&
            valeur !== null &&
            'date' in valeur &&
            'temperature' in valeur &&
            'vent' in valeur
        );
    }

    private reconstituerPrevisionPartielle(
        ligne: {
            datePrevision: Date;

            temperatureMin:
            number | null;

            temperatureMax:
            number | null;

            temperatureRessentie:
            number | null;

            humidite:
            number | null;

            ventKmh:
            number | null;

            probabilitePrecipitation:
            number | null;

            condition: string;

            description:
            string | null;

            icone:
            string | null;
        },
    ): PrevisionJournaliereResponse {
        const minimum =
            ligne.temperatureMin ??
            0;

        const maximum =
            ligne.temperatureMax ??
            0;

        const moyenne =
            (minimum +
                maximum) /
            2;

        const ressentie =
            ligne.temperatureRessentie ??
            moyenne;

        const ventKmh =
            ligne.ventKmh ?? 0;

        return {
            date:
                this.formaterDateUtc(
                    ligne.datePrevision,
                ),

            resume: null,

            temperature: {
                matin:
                    moyenne,

                jour:
                    maximum,

                soir:
                    moyenne,

                nuit:
                    minimum,

                minimum,

                maximum,
            },

            temperatureRessentie: {
                matin:
                    ressentie,

                jour:
                    ressentie,

                soir:
                    ressentie,

                nuit:
                    ressentie,
            },

            condition:
                ligne.condition,

            description:
                ligne.description ??
                'Information indisponible',

            icone:
                ligne.icone,

            iconeUrl:
                this.construireUrlIcone(
                    ligne.icone ??
                    undefined,
                ),

            probabilitePrecipitation:
                ligne
                    .probabilitePrecipitation ??
                0,

            pluieMillimetres: 0,

            neigeMillimetres: 0,

            humidite:
                ligne.humidite ??
                0,

            pression: 0,

            nuages: 0,

            vent: {
                vitesseMetresSeconde:
                    Number(
                        (
                            ventKmh /
                            3.6
                        ).toFixed(
                            1,
                        ),
                    ),

                vitesseKmHeure:
                    ventKmh,

                directionDegres:
                    0,

                rafalesMetresSeconde:
                    null,

                rafalesKmHeure:
                    null,
            },

            leverSoleil:
                null,

            coucherSoleil:
                null,

            indiceUV: null,
        };
    }

    private formaterDateUtc(
        date: Date,
    ): string {
        const annee =
            date.getUTCFullYear();

        const mois =
            String(
                date.getUTCMonth() +
                1,
            ).padStart(
                2,
                '0',
            );

        const jour =
            String(
                date.getUTCDate(),
            ).padStart(
                2,
                '0',
            );

        return `${annee}-${mois}-${jour}`;
    }

    // ==================================================
    // APPEL OPENWEATHER : ACTUELLE
    // ==================================================

    private async appelerMeteoActuelle(
        latitude: number,
        longitude: number,
    ): Promise<OpenWeatherCurrentWeatherResponse> {
        try {
            this.logger.debug(
                `[OPENWEATHER CURRENT] Appel de /weather ` +
                `pour latitude=${latitude}, longitude=${longitude}.`,
            );

            const response =
                await firstValueFrom(
                    this.httpService.get<OpenWeatherCurrentWeatherResponse>(
                        `${this.baseUrl}/weather`,
                        {
                            params: {
                                lat:
                                    latitude,

                                lon:
                                    longitude,

                                appid:
                                    this.apiKey,

                                units:
                                    'metric',

                                lang:
                                    'fr',
                            },

                            timeout:
                                15_000,

                            headers: {
                                Accept:
                                    'application/json',
                            },
                        },
                    ),
                );

            if (!response.data) {
                throw new BadGatewayException(
                    'OpenWeather a retourné une réponse vide pour la météo actuelle.',
                );
            }

            this.logger.debug(
                '[OPENWEATHER CURRENT SUCCESS] ' +
                'Météo actuelle récupérée.',
            );

            return response.data;
        } catch (
        error: unknown
        ) {
            this.gererErreurOpenWeather(
                error,
            );
        }
    }

    // ==================================================
    // APPEL OPENWEATHER : FORECAST
    // ==================================================

    private async appelerPrevisions(
        latitude: number,
        longitude: number,
    ): Promise<OpenWeatherForecastResponse> {
        try {
            this.logger.debug(
                `[OPENWEATHER FORECAST] Appel de /forecast ` +
                `pour latitude=${latitude}, longitude=${longitude}.`,
            );

            const response =
                await firstValueFrom(
                    this.httpService.get<OpenWeatherForecastResponse>(
                        `${this.baseUrl}/forecast`,
                        {
                            params: {
                                lat:
                                    latitude,

                                lon:
                                    longitude,

                                appid:
                                    this.apiKey,

                                units:
                                    'metric',

                                lang:
                                    'fr',
                            },

                            timeout:
                                15_000,

                            headers: {
                                Accept:
                                    'application/json',
                            },
                        },
                    ),
                );

            if (
                !response.data
                    ?.list
            ) {
                throw new BadGatewayException(
                    'OpenWeather a retourné une réponse vide pour les prévisions.',
                );
            }

            this.logger.debug(
                `[OPENWEATHER FORECAST SUCCESS] ` +
                `${response.data.list.length} point(s) de prévision reçus.`,
            );

            return response.data;
        } catch (
        error: unknown
        ) {
            this.gererErreurOpenWeather(
                error,
            );
        }
    }

    // ==================================================
    // TRANSFORMATION MÉTÉO ACTUELLE
    // ==================================================

    private transformerMeteoActuelle(
        donnees:
            OpenWeatherCurrentWeatherResponse,
    ): MeteoActuelleResponse {
        const condition =
            donnees.weather?.[0];

        const decalageSecondes =
            donnees.timezone;

        return {
            latitude:
                donnees.coord.lat,

            longitude:
                donnees.coord.lon,

            fuseauHoraire:
                this.formaterDecalageHoraire(
                    decalageSecondes,
                ),

            dateObservation:
                this.formaterDateAvecDecalage(
                    donnees.dt,
                    decalageSecondes,
                ),

            temperature:
                donnees.main.temp,

            temperatureRessentie:
                donnees.main
                    .feels_like,

            condition:
                condition?.main ??
                'Inconnue',

            description:
                condition
                    ?.description ??
                'Information indisponible',

            icone:
                condition?.icon ??
                null,

            iconeUrl:
                this.construireUrlIcone(
                    condition?.icon,
                ),

            humidite:
                donnees.main
                    .humidity,

            pression:
                donnees.main
                    .pressure,

            nuages:
                donnees.clouds
                    ?.all ?? 0,

            visibiliteMetres:
                donnees.visibility ??
                null,

            vent:
                this.transformerVent(
                    donnees.wind
                        ?.speed ?? 0,

                    donnees.wind
                        ?.deg ?? 0,

                    donnees.wind
                        ?.gust,
                ),

            leverSoleil:
                donnees.sys
                    ?.sunrise
                    ? this.formaterDateAvecDecalage(
                        donnees.sys
                            .sunrise,
                        decalageSecondes,
                    )
                    : null,

            coucherSoleil:
                donnees.sys
                    ?.sunset
                    ? this.formaterDateAvecDecalage(
                        donnees.sys
                            .sunset,
                        decalageSecondes,
                    )
                    : null,

            indiceUV:
                null,
        };
    }

    // ==================================================
    // TRANSFORMATION FORECAST
    // ==================================================

    private transformerPrevisions(
        donnees:
            OpenWeatherForecastResponse,
    ): PrevisionJournaliereResponse[] {
        const decalageSecondes =
            donnees.city.timezone;

        const jours =
            this.regrouperParJour(
                donnees.list,
                decalageSecondes,
            );

        return jours
            .slice(0, 5)
            .map(
                (
                    jour,
                    index,
                ) =>
                    this.transformerJourAgrege(
                        jour,
                        decalageSecondes,
                        index === 0
                            ? donnees.city
                            : null,
                    ),
            );
    }

    private regrouperParJour(
        entrees:
            OpenWeatherForecastListItem[],

        decalageSecondes:
            number,
    ): JourAgrege[] {
        const groupes =
            new Map<
                string,
                OpenWeatherForecastListItem[]
            >();

        for (
            const entree of entrees
        ) {
            const dateLocale =
                this.extraireDateLocale(
                    entree.dt,
                    decalageSecondes,
                );

            const liste =
                groupes.get(
                    dateLocale,
                ) ?? [];

            liste.push(
                entree,
            );

            groupes.set(
                dateLocale,
                liste,
            );
        }

        return Array.from(
            groupes.entries(),
        ).map(
            ([
                dateLocale,
                liste,
            ]) => ({
                dateLocale,
                entrees:
                    liste,
            }),
        );
    }

    private transformerJourAgrege(
        jour: JourAgrege,

        decalageSecondes:
            number,

        city:
            OpenWeatherForecastCity |
            null,
    ): PrevisionJournaliereResponse {
        const entreeMatin =
            this.trouverEntreeProche(
                jour.entrees,
                decalageSecondes,
                6,
            );

        const entreeJour =
            this.trouverEntreeProche(
                jour.entrees,
                decalageSecondes,
                12,
            );

        const entreeSoir =
            this.trouverEntreeProche(
                jour.entrees,
                decalageSecondes,
                18,
            );

        const entreeNuit =
            this.trouverEntreeProche(
                jour.entrees,
                decalageSecondes,
                0,
            );

        const entreeReference =
            entreeJour ??
            jour.entrees[0];

        const condition =
            entreeReference
                .weather?.[0];

        const minimum =
            Math.min(
                ...jour.entrees.map(
                    (entree) =>
                        entree.main
                            .temp_min ??
                        entree.main
                            .temp,
                ),
            );

        const maximum =
            Math.max(
                ...jour.entrees.map(
                    (entree) =>
                        entree.main
                            .temp_max ??
                        entree.main
                            .temp,
                ),
            );

        const probabilitePrecipitation =
            Math.round(
                Math.max(
                    ...jour.entrees.map(
                        (
                            entree,
                        ) =>
                            entree.pop ??
                            0,
                    ),
                ) * 100,
            );

        const pluieMillimetres =
            jour.entrees.reduce(
                (
                    total,
                    entree,
                ) =>
                    total +
                    (entree.rain?.[
                        '3h'
                    ] ?? 0),
                0,
            );

        const neigeMillimetres =
            jour.entrees.reduce(
                (
                    total,
                    entree,
                ) =>
                    total +
                    (entree.snow?.[
                        '3h'
                    ] ?? 0),
                0,
            );

        return {
            date:
                jour.dateLocale,

            resume: null,

            temperature: {
                matin:
                    entreeMatin
                        ?.main
                        .temp ??
                    entreeReference
                        .main.temp,

                jour:
                    entreeReference
                        .main.temp,

                soir:
                    entreeSoir
                        ?.main
                        .temp ??
                    entreeReference
                        .main.temp,

                nuit:
                    entreeNuit
                        ?.main
                        .temp ??
                    entreeReference
                        .main.temp,

                minimum,

                maximum,
            },

            temperatureRessentie:
            {
                matin:
                    entreeMatin
                        ?.main
                        .feels_like ??
                    entreeReference
                        .main
                        .feels_like,

                jour:
                    entreeReference
                        .main
                        .feels_like,

                soir:
                    entreeSoir
                        ?.main
                        .feels_like ??
                    entreeReference
                        .main
                        .feels_like,

                nuit:
                    entreeNuit
                        ?.main
                        .feels_like ??
                    entreeReference
                        .main
                        .feels_like,
            },

            condition:
                condition?.main ??
                'Inconnue',

            description:
                condition
                    ?.description ??
                'Information indisponible',

            icone:
                condition?.icon ??
                null,

            iconeUrl:
                this.construireUrlIcone(
                    condition?.icon,
                ),

            probabilitePrecipitation,

            pluieMillimetres,

            neigeMillimetres,

            humidite:
                entreeReference
                    .main.humidity,

            pression:
                entreeReference
                    .main.pressure,

            nuages:
                entreeReference
                    .clouds?.all ??
                0,

            vent:
                this.transformerVent(
                    entreeReference
                        .wind?.speed ??
                    0,

                    entreeReference
                        .wind?.deg ??
                    0,

                    entreeReference
                        .wind?.gust,
                ),

            leverSoleil:
                city?.sunrise
                    ? this.formaterDateAvecDecalage(
                        city.sunrise,
                        decalageSecondes,
                    )
                    : null,

            coucherSoleil:
                city?.sunset
                    ? this.formaterDateAvecDecalage(
                        city.sunset,
                        decalageSecondes,
                    )
                    : null,

            indiceUV:
                null,
        };
    }

    // ==================================================
    // OUTILS FORECAST
    // ==================================================

    private trouverEntreeProche(
        entrees:
            OpenWeatherForecastListItem[],

        decalageSecondes:
            number,

        heureCible:
            number,
    ): OpenWeatherForecastListItem | null {
        if (
            entrees.length ===
            0
        ) {
            return null;
        }

        let meilleureEntree =
            entrees[0];

        let meilleurEcart =
            this.ecartHeure(
                entrees[0].dt,
                decalageSecondes,
                heureCible,
            );

        for (
            const entree of entrees.slice(
                1,
            )
        ) {
            const ecart =
                this.ecartHeure(
                    entree.dt,
                    decalageSecondes,
                    heureCible,
                );

            if (
                ecart <
                meilleurEcart
            ) {
                meilleureEntree =
                    entree;

                meilleurEcart =
                    ecart;
            }
        }

        return meilleureEntree;
    }

    private ecartHeure(
        timestampUnix:
            number,

        decalageSecondes:
            number,

        heureCible:
            number,
    ): number {
        const heureLocale =
            this.extraireHeureLocale(
                timestampUnix,
                decalageSecondes,
            );

        const ecartBrut =
            Math.abs(
                heureLocale -
                heureCible,
            );

        return Math.min(
            ecartBrut,
            24 -
            ecartBrut,
        );
    }

    // ==================================================
    // VENT
    // ==================================================

    private transformerVent(
        vitesseMetresSeconde:
            number,

        directionDegres:
            number,

        rafalesMetresSeconde?:
            number,
    ): VentResponse {
        return {
            vitesseMetresSeconde,

            vitesseKmHeure:
                this.convertirVentKmHeure(
                    vitesseMetresSeconde,
                ),

            directionDegres,

            rafalesMetresSeconde:
                rafalesMetresSeconde ??
                null,

            rafalesKmHeure:
                typeof rafalesMetresSeconde ===
                    'number'
                    ? this.convertirVentKmHeure(
                        rafalesMetresSeconde,
                    )
                    : null,
        };
    }

    private convertirVentKmHeure(
        vitesseMetresSeconde:
            number,
    ): number {
        return Number(
            (
                vitesseMetresSeconde *
                3.6
            ).toFixed(1),
        );
    }

    // ==================================================
    // VALIDATION
    // ==================================================

    private verifierConfiguration(): void {
        if (!this.apiKey) {
            throw new InternalServerErrorException(
                'La variable OPENWEATHER_API_KEY est absente du fichier .env.',
            );
        }

        if (!this.baseUrl) {
            throw new InternalServerErrorException(
                'La variable OPENWEATHER_BASE_URL est invalide.',
            );
        }
    }

    private verifierCoordonnees(
        latitude: number,
        longitude: number,
    ): void {
        if (
            !Number.isFinite(
                latitude,
            ) ||
            latitude < -90 ||
            latitude > 90
        ) {
            throw new BadRequestException(
                'La latitude doit être comprise entre -90 et 90.',
            );
        }

        if (
            !Number.isFinite(
                longitude,
            ) ||
            longitude <
            -180 ||
            longitude >
            180
        ) {
            throw new BadRequestException(
                'La longitude doit être comprise entre -180 et 180.',
            );
        }
    }

    // ==================================================
    // DATES
    // ==================================================

    private extraireHeureLocale(
        timestampUnix:
            number,

        decalageSecondes:
            number,
    ): number {
        const secondesDansLaJournee =
            (timestampUnix +
                decalageSecondes) %
            86_400;

        const secondesPositives =
            secondesDansLaJournee <
                0
                ? secondesDansLaJournee +
                86_400
                : secondesDansLaJournee;

        return (
            secondesPositives /
            3_600
        );
    }

    private extraireDateLocale(
        timestampUnix:
            number,

        decalageSecondes:
            number,
    ): string {
        const dateDecalee =
            new Date(
                (timestampUnix +
                    decalageSecondes) *
                1000,
            );

        const annee =
            dateDecalee.getUTCFullYear();

        const mois =
            String(
                dateDecalee.getUTCMonth() +
                1,
            ).padStart(
                2,
                '0',
            );

        const jour =
            String(
                dateDecalee.getUTCDate(),
            ).padStart(
                2,
                '0',
            );

        return `${annee}-${mois}-${jour}`;
    }

    private formaterDateAvecDecalage(
        timestampUnix:
            number,

        decalageSecondes:
            number,
    ): string {
        const dateDecalee =
            new Date(
                (timestampUnix +
                    decalageSecondes) *
                1000,
            );

        const annee =
            dateDecalee.getUTCFullYear();

        const mois =
            String(
                dateDecalee.getUTCMonth() +
                1,
            ).padStart(
                2,
                '0',
            );

        const jour =
            String(
                dateDecalee.getUTCDate(),
            ).padStart(
                2,
                '0',
            );

        const heures =
            String(
                dateDecalee.getUTCHours(),
            ).padStart(
                2,
                '0',
            );

        const minutes =
            String(
                dateDecalee.getUTCMinutes(),
            ).padStart(
                2,
                '0',
            );

        const secondes =
            String(
                dateDecalee.getUTCSeconds(),
            ).padStart(
                2,
                '0',
            );

        return (
            `${annee}-${mois}-${jour} ` +
            `${heures}:${minutes}:${secondes}`
        );
    }

    private formaterDecalageHoraire(
        decalageSecondes:
            number,
    ): string {
        const signe =
            decalageSecondes <
                0
                ? '-'
                : '+';

        const decalageAbsolu =
            Math.abs(
                decalageSecondes,
            );

        const heures =
            String(
                Math.floor(
                    decalageAbsolu /
                    3_600,
                ),
            ).padStart(
                2,
                '0',
            );

        const minutes =
            String(
                Math.floor(
                    (decalageAbsolu %
                        3_600) /
                    60,
                ),
            ).padStart(
                2,
                '0',
            );

        return `UTC${signe}${heures}:${minutes}`;
    }

    // ==================================================
    // ICÔNES
    // ==================================================

    private construireUrlIcone(
        codeIcone?: string,
    ): string | null {
        if (!codeIcone) {
            return null;
        }

        return (
            'https://openweathermap.org/img/wn/' +
            `${codeIcone}@2x.png`
        );
    }

    // ==================================================
    // ERREURS OPENWEATHER
    // ==================================================

    private gererErreurOpenWeather(
        error: unknown,
    ): never {
        if (
            error instanceof
            BadGatewayException
        ) {
            throw error;
        }

        if (
            error instanceof
            AxiosError
        ) {
            const statut =
                error.response
                    ?.status;

            const donnees =
                error.response
                    ?.data;

            // ==============================================
            // PAS DE RÉPONSE HTTP : TIMEOUT OU RÉSEAU
            // ==============================================

            if (!error.response) {
                if (error.code === 'ECONNABORTED') {
                    this.logger.error(
                        `[OPENWEATHER ERROR] Timeout dépassé lors de ` +
                        `l'appel OpenWeather.`,
                    );

                    throw new BadGatewayException({
                        message:
                            'Le service OpenWeather met trop de temps à répondre.',

                        fournisseur:
                            'OpenWeather',

                        type:
                            'TIMEOUT',

                        statutExterne:
                            null,
                    });
                }

                this.logger.error(
                    `[OPENWEATHER ERROR] Erreur réseau lors de l'appel ` +
                    `OpenWeather : ${error.code ?? 'inconnu'}.`,
                );

                throw new BadGatewayException({
                    message:
                        'Impossible de joindre le service OpenWeather (problème réseau).',

                    fournisseur:
                        'OpenWeather',

                    type:
                        'NETWORK_ERROR',

                    statutExterne:
                        null,
                });
            }

            this.logger.error(
                `Échec de l'appel OpenWeather. Statut HTTP : ${statut ??
                'inconnu'
                }`,

                typeof donnees ===
                    'string'
                    ? donnees
                    : JSON.stringify(
                        donnees,
                    ),
            );

            // ==============================================
            // CLÉ INVALIDE
            // ==============================================

            if (statut === 401) {
                throw new BadGatewayException({
                    message:
                        'La clé OpenWeather est invalide ou n\'a pas accès à cette API.',

                    fournisseur:
                        'OpenWeather',

                    type:
                        'AUTHENTICATION_ERROR',

                    statutExterne:
                        statut,
                });
            }

            // ==============================================
            // LIMITE API
            // ==============================================

            if (statut === 429) {
                throw new BadGatewayException({
                    message:
                        'La limite de requêtes OpenWeather a été atteinte.',

                    fournisseur:
                        'OpenWeather',

                    type:
                        'RATE_LIMIT',

                    statutExterne:
                        statut,
                });
            }

            // ==============================================
            // OPENWEATHER 5XX
            // ==============================================

            if (
                typeof statut === 'number' &&
                statut >= 500
            ) {
                throw new BadGatewayException({
                    message:
                        'Le service OpenWeather est temporairement indisponible.',

                    fournisseur:
                        'OpenWeather',

                    type:
                        'PROVIDER_UNAVAILABLE',

                    statutExterne:
                        statut,
                });
            }

            // ==============================================
            // AUTRE ERREUR HTTP
            // ==============================================

            throw new BadGatewayException({
                message:
                    'Impossible de récupérer les données météo.',

                fournisseur:
                    'OpenWeather',

                type:
                    'EXTERNAL_API_ERROR',

                statutExterne:
                    statut ?? null,
            });
        }

        this.logger.error(
            '[OPENWEATHER ERROR] Erreur inattendue pendant l’appel OpenWeather.',

            error instanceof Error
                ? error.stack
                : String(error),
        );

        throw new BadGatewayException({
            message:
                'Une erreur inattendue est survenue pendant la récupération des données météo.',

            fournisseur:
                'OpenWeather',

            type:
                'UNKNOWN_ERROR',
        });
    }
}