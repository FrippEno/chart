-- Chart value type: 'number' (plain values) or 'money' (currency-formatted).
-- Backfill existing charts whose y-axis label already implied money so
-- their formatting doesn't change.
ALTER TABLE charts ADD COLUMN value_type TEXT NOT NULL DEFAULT 'number';
UPDATE charts SET value_type = 'money' WHERE y_axis_label LIKE '%$%';
