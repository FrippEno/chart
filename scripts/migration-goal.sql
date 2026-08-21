-- Optional goal target for a chart: a score to reach, optionally by a date.
ALTER TABLE charts ADD COLUMN goal_score REAL;
ALTER TABLE charts ADD COLUMN goal_date TEXT;
