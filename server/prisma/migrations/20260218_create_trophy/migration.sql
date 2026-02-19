-- Create Trophy & UserTrophy migration

-- SQLite
CREATE TABLE IF NOT EXISTS trophy (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK(tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  icon TEXT NOT NULL,
  rarity INTEGER NOT NULL CHECK(rarity >= 1 AND rarity <= 100),
  criteria TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS userTrophy (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  trophyId TEXT NOT NULL,
  unlockedAt DATETIME,
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  metadata TEXT, -- JSON string (SQLite doesn't have JSON type)
  lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, trophyId),
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  FOREIGN KEY (trophyId) REFERENCES trophy(id) ON DELETE CASCADE
);

-- Indices for better query performance
CREATE INDEX IF NOT EXISTS idx_trophy_tier ON trophy(tier);
CREATE INDEX IF NOT EXISTS idx_trophy_code ON trophy(code);
CREATE INDEX IF NOT EXISTS idx_userTrophy_userId ON userTrophy(userId);
CREATE INDEX IF NOT EXISTS idx_userTrophy_unlockedAt ON userTrophy(unlockedAt);
CREATE INDEX IF NOT EXISTS idx_userTrophy_progress ON userTrophy(progress);
