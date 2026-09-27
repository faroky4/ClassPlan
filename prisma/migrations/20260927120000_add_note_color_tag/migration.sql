-- CreateEnum
CREATE TYPE "NoteColorTag" AS ENUM ('green', 'orange', 'yellow');

-- AlterTable
ALTER TABLE "weekly_plans" ADD COLUMN "note_color_tag" "NoteColorTag";
