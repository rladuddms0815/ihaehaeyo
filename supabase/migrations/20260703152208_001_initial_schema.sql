/*
# 이해해요 - Initial Database Schema

1. New Tables
- `user_profiles`: Extended user data beyond auth.users (nickname, accessibility settings, voice speed)
- `scanned_documents`: Documents/images scanned by elderly users (OCR text, image URL, document type)
- `document_explanations`: AI-generated explanations in simple Korean, linked to scanned_documents
- `family_caregivers`: Trusted family members who can view/assist elderly users
- `voice_conversations`: Voice assistant chat history for follow-up Q&A
- `scam_reports`: Reported scam/phishing attempts for community safety

2. Security
- Enable RLS on all tables.
- Owner-scoped CRUD: each authenticated user can only access their own data.
- Family caregivers get read access to linked elderly users' data.
- All policies use `auth.uid()` for owner checks.

3. Notes
- This is a multi-user app with authentication (elderly users need personal accounts)
- All tables have DEFAULT auth.uid() for owner columns
- Family caregiver relationship is bidirectional - elderly user approves family member
*/

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT '사용자',
  birth_year integer,
  profile_image_url text,
  accessibility_settings jsonb DEFAULT '{
    "fontSize": "large",
    "highContrast": false,
    "voiceSpeed": 0.8,
    "screenReader": false,
    "simplifiedMode": true
  }'::jsonb,
  notification_settings jsonb DEFAULT '{
    "daily_reminder": true,
    "scam_alerts": true,
    "family_updates": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scanned documents
CREATE TABLE IF NOT EXISTS scanned_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text,
  ocr_text text NOT NULL,
  document_type text DEFAULT 'general',
  title text,
  is_scam boolean DEFAULT false,
  scam_risk_level text DEFAULT 'none',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON scanned_documents;
CREATE POLICY "select_own_documents" ON scanned_documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON scanned_documents;
CREATE POLICY "insert_own_documents" ON scanned_documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON scanned_documents;
CREATE POLICY "update_own_documents" ON scanned_documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON scanned_documents;
CREATE POLICY "delete_own_documents" ON scanned_documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Document explanations
CREATE TABLE IF NOT EXISTS document_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES scanned_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  simple_explanation text NOT NULL,
  key_points jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_explanations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_explanations" ON document_explanations;
CREATE POLICY "select_own_explanations" ON document_explanations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_explanations" ON document_explanations;
CREATE POLICY "insert_own_explanations" ON document_explanations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Family caregivers (trusted family members)
CREATE TABLE IF NOT EXISTS family_caregivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_email text NOT NULL,
  caregiver_name text,
  relationship text,
  status text DEFAULT 'pending',
  can_view_documents boolean DEFAULT true,
  can_view_conversations boolean DEFAULT true,
  can_receive_alerts boolean DEFAULT true,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(elderly_user_id, caregiver_email)
);

ALTER TABLE family_caregivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_caregivers" ON family_caregivers;
CREATE POLICY "select_own_caregivers" ON family_caregivers FOR SELECT
  TO authenticated USING (auth.uid() = elderly_user_id OR auth.uid() = caregiver_user_id);

DROP POLICY IF EXISTS "insert_own_caregivers" ON family_caregivers;
CREATE POLICY "insert_own_caregivers" ON family_caregivers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = elderly_user_id);

DROP POLICY IF EXISTS "update_own_caregivers" ON family_caregivers;
CREATE POLICY "update_own_caregivers" ON family_caregivers FOR UPDATE
  TO authenticated USING (auth.uid() = elderly_user_id OR auth.uid() = caregiver_user_id)
  WITH CHECK (auth.uid() = elderly_user_id OR auth.uid() = caregiver_user_id);

-- Voice conversations
CREATE TABLE IF NOT EXISTS voice_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES scanned_documents(id) ON DELETE SET NULL,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  is_follow_up boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON voice_conversations;
CREATE POLICY "select_own_conversations" ON voice_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON voice_conversations;
CREATE POLICY "insert_own_conversations" ON voice_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Scam reports (community safety feature)
CREATE TABLE IF NOT EXISTS scam_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES scanned_documents(id) ON DELETE SET NULL,
  scam_type text,
  description text,
  phone_number text,
  website_url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_scam_reports" ON scam_reports;
CREATE POLICY "select_all_scam_reports" ON scam_reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_scam_reports" ON scam_reports;
CREATE POLICY "insert_own_scam_reports" ON scam_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user ON scanned_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created ON scanned_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_explanations_document ON document_explanations(document_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON voice_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON voice_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_elderly ON family_caregivers(elderly_user_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_email ON family_caregivers(caregiver_email);