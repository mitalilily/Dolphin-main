ALTER TABLE ndr_events
  ADD COLUMN IF NOT EXISTS admin_note varchar(1000),
  ADD COLUMN IF NOT EXISTS admin_attachment_key varchar(500),
  ADD COLUMN IF NOT EXISTS admin_attachment_name varchar(255),
  ADD COLUMN IF NOT EXISTS admin_attachment_mime varchar(120);
