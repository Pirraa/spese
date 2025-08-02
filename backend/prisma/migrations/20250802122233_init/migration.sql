-- CreateEnum
CREATE TYPE "TipoFonte" AS ENUM ('CARTA', 'CONTANTI', 'DIGITALE');

-- CreateEnum
CREATE TYPE "TipoTransazione" AS ENUM ('ENTRATA', 'SPESA', 'TRASFERIMENTO');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('ENTRATA', 'SPESA');

-- CreateTable
CREATE TABLE "utenti" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utenti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fonti" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoFonte" NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ubicazione" TEXT,
    "codice" TEXT,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "utenteId" TEXT NOT NULL,

    CONSTRAINT "fonti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transazioni" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransazione" NOT NULL,
    "importo" DOUBLE PRECISION NOT NULL,
    "descrizione" TEXT NOT NULL,
    "luogo" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "utenteId" TEXT NOT NULL,
    "fonteId" TEXT NOT NULL,
    "fonteDestinazioneId" TEXT,

    CONSTRAINT "transazioni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorie" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "colore" TEXT,
    "icona" TEXT,
    "tipo" "TipoCategoria" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utenti_email_key" ON "utenti"("email");

-- AddForeignKey
ALTER TABLE "fonti" ADD CONSTRAINT "fonti_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "utenti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transazioni" ADD CONSTRAINT "transazioni_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "utenti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transazioni" ADD CONSTRAINT "transazioni_fonteId_fkey" FOREIGN KEY ("fonteId") REFERENCES "fonti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transazioni" ADD CONSTRAINT "transazioni_fonteDestinazioneId_fkey" FOREIGN KEY ("fonteDestinazioneId") REFERENCES "fonti"("id") ON DELETE SET NULL ON UPDATE CASCADE;
