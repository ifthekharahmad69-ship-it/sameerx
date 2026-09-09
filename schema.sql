-- ================================================================
-- CourtSaarthi — COMPLETE DATABASE SCHEMA
-- Run this entire script once in your Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- TABLE 1: lawyers
-- Referenced by: services/draft.py (lawyer name lookup)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lawyers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  phone       TEXT,
  bar_number  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLE 2: cases
-- Referenced by: routers/cases.py, services/case_builder.py,
--               services/draft.py, routers/messages.py,
--               routers/hearings.py
-- NOTE: id is TEXT (not UUID) because case_builder generates
--       string IDs like "CRIM-2025-1234" or uses UUID strings
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  lawyer_id           UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,

  -- Case classification
  case_type           TEXT,                      -- 'criminal', 'civil'
  sub_type            TEXT,                      -- e.g. 'bail_application'
  status              TEXT DEFAULT 'active',     -- 'active', 'closed', 'pending'

  -- Client details
  client_name         TEXT,
  client_phone        TEXT,
  client_address      TEXT,

  -- Extracted facts (from OCR + AI)
  accused_name        TEXT,
  complainant_name    TEXT,
  fo_number           TEXT,                      -- FIR / case number
  ipc_sections        TEXT[],                    -- Array of section strings
  crime_type          TEXT,
  police_station      TEXT,
  place_of_offence    TEXT,
  arrest_date         TEXT,
  arrest_time         TEXT,
  value_stolen        TEXT,                      -- value_stolen_or_loss

  -- AI analysis output (saved via /save-analysis)
  brief               TEXT,                      -- AI summary paragraph
  named_sections      JSONB,                     -- [{section, quote, verified, span}]
  suggested_sections  JSONB,                     -- [{section, label, basis_fact, ...}]

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_updated_at ON public.cases;
CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ================================================================
-- TABLE 3: documents
-- Referenced by: routers/cases.py, services/draft.py
-- ================================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name   TEXT,
  file_url    TEXT,                    -- Supabase Storage public URL
  doc_type    TEXT,                    -- 'FIR', 'bail_draft', 'analysis_brief', etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================================
-- TABLE 4: hearings
-- Referenced by: routers/hearings.py, services/case_builder.py
-- ================================================================
CREATE TABLE IF NOT EXISTS public.hearings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id       TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  hearing_type  TEXT,                  -- 'Bail Hearing', 'Hearing', etc.
  hearing_date  TEXT,                  -- stored as 'YYYY-MM-DD' string
  court         TEXT,
  location      TEXT,
  notes         TEXT,
  reminder_set  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================================
-- TABLE 5: messages
-- Referenced by: routers/messages.py
-- ================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id           UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,
  client_phone        TEXT,
  content_text        TEXT,
  content_audio_url   TEXT,            -- Supabase Storage URL for voice note MP3
  channel             TEXT DEFAULT 'whatsapp',
  sent_at             TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================================
-- INDEXES — speeds up common queries
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id       ON public.cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status          ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_documents_case_id     ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_case_id      ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date         ON public.hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_messages_case_id      ON public.messages(case_id);


-- ================================================================
-- ROW LEVEL SECURITY — disabled for dev/hackathon
-- Enable and add policies when going to production
-- ================================================================
ALTER TABLE public.lawyers   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages  DISABLE ROW LEVEL SECURITY;


-- ================================================================
-- SEED: Default lawyer record
-- This UUID is hardcoded in routers/cases.py — keep it the same!
-- ================================================================
INSERT INTO public.lawyers (id, name, email)
VALUES (
  '793776d8-0f5c-4232-a158-c94054b29666',
  'Demo Lawyer',
  'demo@courtsaarthi.com'
) ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- STORAGE BUCKET: case-documents
-- Run these separately OR create manually in Storage UI:
--   Storage → New Bucket → Name: case-documents → Toggle Public ON
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public read - case-documents'
  ) THEN
    CREATE POLICY "Public read - case-documents"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'case-documents');
  END IF;
END $$;

-- Allow service role to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service upload - case-documents'
  ) THEN
    CREATE POLICY "Service upload - case-documents"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'case-documents');
  END IF;
END $$;

-- ================================================================
-- SIH 2026 PS 26190: NCRB / MHA SECURE DIGITAL DOCUMENT TABLES
-- ================================================================

-- Add agency classification to lawyers / users table
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS agency_type TEXT DEFAULT 'lawyer'; -- 'police', 'ncrb', 'fsl', 'prosecutor', 'court', 'lawyer'
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS badge_number TEXT;

-- TABLE 6: blockchain_audit_ledger
CREATE TABLE IF NOT EXISTS public.blockchain_audit_ledger (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id         TEXT NOT NULL,
  sha256_hash         TEXT NOT NULL,
  previous_block_hash TEXT,
  blockchain_tx_id    TEXT,
  block_number        BIGINT,
  action_type         TEXT DEFAULT 'ANCHOR_HASH', -- 'ANCHOR_HASH', 'VERIFY_INTEGRITY', 'TAMPER_ALERT'
  actor_badge_id      TEXT DEFAULT 'IO-8821',
  timestamp           TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 7: victim_redaction_logs
CREATE TABLE IF NOT EXISTS public.victim_redaction_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id         TEXT NOT NULL,
  redacted_fields     JSONB NOT NULL, -- list of redacted PII items [{type, original_hash, redacted_mask}]
  redacted_by         TEXT DEFAULT 'AUTO_AI_SURVIVOR_PROTECT',
  redaction_reason    TEXT DEFAULT 'BNS Section 73 & POCSO Identity Protection Compliance',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 8: evidence_items
CREATE TABLE IF NOT EXISTS public.evidence_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  barcode_id          TEXT UNIQUE NOT NULL,
  evidence_type       TEXT NOT NULL, -- 'Digital Evidence', 'Forensic Specimen', 'Physical Asset', 'Weapons', 'Seized Device'
  description         TEXT,
  custodian_badge_id  TEXT NOT NULL,
  seizure_location    TEXT,
  chain_of_custody    JSONB NOT NULL, -- array of custody transfers [{timestamp, custodian, action, location, signature_hash}]
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_doc_id ON public.blockchain_audit_ledger(document_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id   ON public.evidence_items(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_barcode   ON public.evidence_items(barcode_id);

ALTER TABLE public.blockchain_audit_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.victim_redaction_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- DONE ✓
-- Tables created: lawyers, cases, documents, hearings, messages,
--                blockchain_audit_ledger, victim_redaction_logs, evidence_items
-- ================================================================

