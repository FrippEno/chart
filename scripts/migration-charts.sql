-- Charts Table
CREATE TABLE IF NOT EXISTS charts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  x_axis_label TEXT NOT NULL,
  y_axis_label TEXT NOT NULL,
  y_min REAL NOT NULL,
  y_max REAL NOT NULL,
  date_start TEXT NOT NULL,
  date_end TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Chart Entries Table (data points)
CREATE TABLE IF NOT EXISTS chart_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chart_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  score REAL NOT NULL,
  annotation TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chart_entries_chart ON chart_entries(chart_id);
CREATE INDEX IF NOT EXISTS idx_chart_entries_date ON chart_entries(chart_id, entry_date);
