-- Records auth flow events so the D1 migration/deploy pipeline
-- can be exercised end-to-end from this sample app.
CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_sub TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_login_events_created_at
  ON login_events (created_at DESC);
