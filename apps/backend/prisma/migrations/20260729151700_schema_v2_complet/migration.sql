/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Place` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Region` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TemperatureUnit" AS ENUM ('CELSIUS', 'FAHRENHEIT');

-- CreateEnum
CREATE TYPE "PlaceLinkType" AS ENUM ('OFFICIAL', 'BOOKING', 'WIKIPEDIA', 'FACEBOOK', 'INSTAGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "Place" DROP CONSTRAINT "Place_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Place" DROP CONSTRAINT "Place_regionId_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Place";

-- DropTable
DROP TABLE "Region";

-- CreateTable
CREATE TABLE "provinces" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "provinceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icone" TEXT,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icone" TEXT,
    "estActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resume" TEXT,
    "description" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "codePostal" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "siteWeb" TEXT,
    "thumbnailUrl" TEXT,
    "horaire" TEXT,
    "prix" TEXT,
    "accessibilite" TEXT,
    "stationnement" TEXT,
    "tempsVisite" TEXT,
    "estGratuit" BOOLEAN NOT NULL DEFAULT false,
    "note" DOUBLE PRECISION,
    "nombreAvis" INTEGER NOT NULL DEFAULT 0,
    "estVedette" BOOLEAN NOT NULL DEFAULT false,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "sourceExterneId" TEXT,
    "sourceExterne" TEXT,
    "regionId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_images" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "titre" TEXT,
    "altText" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "estImagePrincipale" BOOLEAN NOT NULL DEFAULT false,
    "largeur" INTEGER,
    "hauteur" INTEGER,
    "source" TEXT,
    "sourceUrl" TEXT,
    "placeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_links" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "PlaceLinkType" NOT NULL DEFAULT 'OTHER',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "placeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_activities" (
    "id" SERIAL NOT NULL,
    "ordre" INTEGER,
    "placeId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_forecasts" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "datePrevision" TIMESTAMP(3) NOT NULL,
    "temperatureMin" DOUBLE PRECISION,
    "temperatureMax" DOUBLE PRECISION,
    "temperatureRessentie" DOUBLE PRECISION,
    "humidite" INTEGER,
    "ventKmh" DOUBLE PRECISION,
    "probabilitePrecipitation" INTEGER,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "icone" TEXT,
    "sourceApi" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "displayName" TEXT,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "device" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "placeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recently_viewed" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "placeId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" SERIAL NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "uniteTemperature" "TemperatureUnit" NOT NULL DEFAULT 'CELSIUS',
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "recevoirNotificationsMeteo" BOOLEAN NOT NULL DEFAULT false,
    "recevoirSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferred_provinces" (
    "id" SERIAL NOT NULL,
    "preferenceId" INTEGER NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferred_categories" (
    "id" SERIAL NOT NULL,
    "preferenceId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferred_activities" (
    "id" SERIAL NOT NULL,
    "preferenceId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_slug_key" ON "provinces"("slug");

-- CreateIndex
CREATE INDEX "provinces_estActive_idx" ON "provinces"("estActive");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_nom_key" ON "provinces"("nom");

-- CreateIndex
CREATE INDEX "regions_provinceId_idx" ON "regions"("provinceId");

-- CreateIndex
CREATE INDEX "regions_estActive_idx" ON "regions"("estActive");

-- CreateIndex
CREATE UNIQUE INDEX "regions_provinceId_slug_key" ON "regions"("provinceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "regions_provinceId_nom_key" ON "regions"("provinceId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_estActive_idx" ON "categories"("estActive");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "activities_slug_key" ON "activities"("slug");

-- CreateIndex
CREATE INDEX "activities_estActive_idx" ON "activities"("estActive");

-- CreateIndex
CREATE UNIQUE INDEX "activities_nom_key" ON "activities"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- CreateIndex
CREATE INDEX "places_nom_idx" ON "places"("nom");

-- CreateIndex
CREATE INDEX "places_ville_idx" ON "places"("ville");

-- CreateIndex
CREATE INDEX "places_regionId_idx" ON "places"("regionId");

-- CreateIndex
CREATE INDEX "places_categoryId_idx" ON "places"("categoryId");

-- CreateIndex
CREATE INDEX "places_estActif_idx" ON "places"("estActif");

-- CreateIndex
CREATE INDEX "places_estVedette_idx" ON "places"("estVedette");

-- CreateIndex
CREATE INDEX "places_latitude_longitude_idx" ON "places"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "places_regionId_categoryId_estActif_idx" ON "places"("regionId", "categoryId", "estActif");

-- CreateIndex
CREATE UNIQUE INDEX "places_sourceExterne_sourceExterneId_key" ON "places"("sourceExterne", "sourceExterneId");

-- CreateIndex
CREATE INDEX "place_images_placeId_idx" ON "place_images"("placeId");

-- CreateIndex
CREATE INDEX "place_images_placeId_ordre_idx" ON "place_images"("placeId", "ordre");

-- CreateIndex
CREATE INDEX "place_images_placeId_estImagePrincipale_idx" ON "place_images"("placeId", "estImagePrincipale");

-- CreateIndex
CREATE INDEX "place_links_placeId_idx" ON "place_links"("placeId");

-- CreateIndex
CREATE INDEX "place_links_placeId_ordre_idx" ON "place_links"("placeId", "ordre");

-- CreateIndex
CREATE INDEX "place_activities_placeId_idx" ON "place_activities"("placeId");

-- CreateIndex
CREATE INDEX "place_activities_activityId_idx" ON "place_activities"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "place_activities_placeId_activityId_key" ON "place_activities"("placeId", "activityId");

-- CreateIndex
CREATE INDEX "weather_forecasts_placeId_idx" ON "weather_forecasts"("placeId");

-- CreateIndex
CREATE INDEX "weather_forecasts_datePrevision_idx" ON "weather_forecasts"("datePrevision");

-- CreateIndex
CREATE UNIQUE INDEX "weather_forecasts_placeId_datePrevision_key" ON "weather_forecasts"("placeId", "datePrevision");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_estActif_idx" ON "users"("estActif");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_placeId_idx" ON "favorites"("placeId");

-- CreateIndex
CREATE INDEX "favorites_userId_createdAt_idx" ON "favorites"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_placeId_key" ON "favorites"("userId", "placeId");

-- CreateIndex
CREATE INDEX "recently_viewed_userId_idx" ON "recently_viewed"("userId");

-- CreateIndex
CREATE INDEX "recently_viewed_placeId_idx" ON "recently_viewed"("placeId");

-- CreateIndex
CREATE INDEX "recently_viewed_userId_viewedAt_idx" ON "recently_viewed"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "recently_viewed_userId_placeId_key" ON "recently_viewed"("userId", "placeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferred_provinces_preferenceId_idx" ON "user_preferred_provinces"("preferenceId");

-- CreateIndex
CREATE INDEX "user_preferred_provinces_provinceId_idx" ON "user_preferred_provinces"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferred_provinces_preferenceId_provinceId_key" ON "user_preferred_provinces"("preferenceId", "provinceId");

-- CreateIndex
CREATE INDEX "user_preferred_categories_preferenceId_idx" ON "user_preferred_categories"("preferenceId");

-- CreateIndex
CREATE INDEX "user_preferred_categories_categoryId_idx" ON "user_preferred_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferred_categories_preferenceId_categoryId_key" ON "user_preferred_categories"("preferenceId", "categoryId");

-- CreateIndex
CREATE INDEX "user_preferred_activities_preferenceId_idx" ON "user_preferred_activities"("preferenceId");

-- CreateIndex
CREATE INDEX "user_preferred_activities_activityId_idx" ON "user_preferred_activities"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferred_activities_preferenceId_activityId_key" ON "user_preferred_activities"("preferenceId", "activityId");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_links" ADD CONSTRAINT "place_links_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_activities" ADD CONSTRAINT "place_activities_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_activities" ADD CONSTRAINT "place_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_forecasts" ADD CONSTRAINT "weather_forecasts_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_provinces" ADD CONSTRAINT "user_preferred_provinces_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_provinces" ADD CONSTRAINT "user_preferred_provinces_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_categories" ADD CONSTRAINT "user_preferred_categories_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_categories" ADD CONSTRAINT "user_preferred_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_activities" ADD CONSTRAINT "user_preferred_activities_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_activities" ADD CONSTRAINT "user_preferred_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
