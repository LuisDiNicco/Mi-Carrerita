-- Enhance AcademicRecord with isIntermediate field

-- SQLite
ALTER TABLE academicRecord ADD COLUMN isIntermediate BOOLEAN NOT NULL DEFAULT 0;

-- Index for filtering by intermediate/final distinction
CREATE INDEX IF NOT EXISTS idx_academicRecord_isIntermediate ON academicRecord(isIntermediate);
