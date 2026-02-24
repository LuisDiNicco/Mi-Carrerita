/*
  Warnings:

  - You are about to drop the `recommendedSubject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trophy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userTrophy` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "idx_academicRecord_isIntermediate";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "recommendedSubject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "timetable";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "trophy";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "userTrophy";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Timetable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendedSubject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recommendedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "takenAt" DATETIME,
    CONSTRAINT "RecommendedSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecommendedSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL,
    "criteria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserTrophy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trophyId" TEXT NOT NULL,
    "unlockedAt" DATETIME,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTrophy_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "Trophy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_userId_subjectId_period_dayOfWeek_key" ON "Timetable"("userId", "subjectId", "period", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedSubject_userId_subjectId_key" ON "RecommendedSubject"("userId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Trophy_code_key" ON "Trophy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrophy_userId_trophyId_key" ON "UserTrophy"("userId", "trophyId");
