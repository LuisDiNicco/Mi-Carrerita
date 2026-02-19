-- CreateTimetable & RecommendedSubject migration

-- SQLite
CREATE TABLE IF NOT EXISTS timetable (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  subjectId TEXT NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('AM', 'PM', 'EVENING')),
  dayOfWeek INTEGER NOT NULL CHECK(dayOfWeek >= 1 AND dayOfWeek <= 6),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, subjectId, period, dayOfWeek),
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES "subject"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendedSubject (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  subjectId TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('SUGGESTED', 'MANTENIDA', 'DELETED')),
  recommendedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  takenAt DATETIME,
  UNIQUE(userId, subjectId),
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId) REFERENCES "subject"(id) ON DELETE CASCADE
);

-- Indices for better query performance
CREATE INDEX IF NOT EXISTS idx_timetable_userId ON timetable(userId);
CREATE INDEX IF NOT EXISTS idx_timetable_subjectId ON timetable(subjectId);
CREATE INDEX IF NOT EXISTS idx_timetable_period ON timetable(period);
CREATE INDEX IF NOT EXISTS idx_recommendedSubject_userId ON recommendedSubject(userId);
CREATE INDEX IF NOT EXISTS idx_recommendedSubject_status ON recommendedSubject(status);
