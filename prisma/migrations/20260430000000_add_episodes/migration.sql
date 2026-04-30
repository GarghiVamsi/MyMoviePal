-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "thumbnail" TEXT,
    "airDate" TIMESTAMP(3),
    "animeId" TEXT NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "episodes_animeId_idx" ON "episodes"("animeId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "episodes_animeId_number_key" ON "episodes"("animeId", "number");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
