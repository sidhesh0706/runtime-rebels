DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leave_requests_attachment_document_fk'
  ) THEN
    ALTER TABLE leave_requests
      ADD CONSTRAINT leave_requests_attachment_document_fk
      FOREIGN KEY (attachment_document_id) REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;
