-- MatoFlow Prospection — Schéma V1
-- Exécuter via Supabase CLI : supabase db push
-- ou coller dans l'éditeur SQL du dashboard Supabase

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum des statuts de prospection
CREATE TYPE prospect_status AS ENUM (
  'nouveau',
  'contacte',
  'relance',
  'rdv',
  'client',
  'refuse'
);

-- Enum des sources de prospects
CREATE TYPE prospect_source AS ENUM (
  'manuel',
  'google_maps',
  'scraping',
  'import_csv',
  'api',
  'linkedin'
);

-- Table principale des prospects
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identité entreprise
  company_name TEXT NOT NULL,
  siret TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,

  -- Métadonnées Google / enrichissement
  google_reviews_count INTEGER DEFAULT 0,

  -- Qualification
  status prospect_status NOT NULL DEFAULT 'nouveau',
  source prospect_source NOT NULL DEFAULT 'manuel',
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_score_details JSONB DEFAULT '{}'::jsonb,

  -- Clés de déduplication (calculées automatiquement)
  website_domain TEXT,
  email_normalized TEXT,
  siret_normalized TEXT,

  -- Contenu commercial généré (cache)
  generated_email TEXT,
  generated_linkedin TEXT,
  generated_call_script TEXT,
  content_generated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,

  -- Contraintes d'unicité pour la déduplication
  CONSTRAINT prospects_siret_unique UNIQUE (siret_normalized),
  CONSTRAINT prospects_email_unique UNIQUE (email_normalized),
  CONSTRAINT prospects_domain_unique UNIQUE (website_domain)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_prospects_status ON prospects (status);
CREATE INDEX idx_prospects_ai_score ON prospects (ai_score DESC NULLS LAST);
CREATE INDEX idx_prospects_created_at ON prospects (created_at DESC);
CREATE INDEX idx_prospects_city ON prospects (city);
CREATE INDEX idx_prospects_source ON prospects (source);

-- Historique des qualifications IA (pour scoring avancé futur)
CREATE TABLE prospect_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  website_analysis JSONB DEFAULT '{}'::jsonb,
  model_version TEXT DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qualifications_prospect ON prospect_qualifications (prospect_id, created_at DESC);

-- Journal d'activité (relances, contacts — V2)
CREATE TABLE prospect_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_prospect ON prospect_activities (prospect_id, created_at DESC);

-- Fonction : normaliser le domaine d'un site web
CREATE OR REPLACE FUNCTION normalize_website_domain(url TEXT)
RETURNS TEXT AS $$
DECLARE
  domain TEXT;
BEGIN
  IF url IS NULL OR TRIM(url) = '' THEN
    RETURN NULL;
  END IF;

  domain := LOWER(TRIM(url));
  domain := REGEXP_REPLACE(domain, '^https?://', '');
  domain := REGEXP_REPLACE(domain, '^www\.', '');
  domain := SPLIT_PART(domain, '/', 1);
  domain := SPLIT_PART(domain, '?', 1);

  IF domain = '' THEN
    RETURN NULL;
  END IF;

  RETURN domain;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction : normaliser un email
CREATE OR REPLACE FUNCTION normalize_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  IF email IS NULL OR TRIM(email) = '' THEN
    RETURN NULL;
  END IF;
  RETURN LOWER(TRIM(email));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction : normaliser un SIRET (14 chiffres)
CREATE OR REPLACE FUNCTION normalize_siret(siret TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF siret IS NULL OR TRIM(siret) = '' THEN
    RETURN NULL;
  END IF;

  cleaned := REGEXP_REPLACE(siret, '[^0-9]', '', 'g');

  IF LENGTH(cleaned) != 14 THEN
    RETURN NULL;
  END IF;

  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger : mettre à jour les champs normalisés et updated_at
CREATE OR REPLACE FUNCTION prospects_before_upsert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.website_domain := normalize_website_domain(NEW.website);
  NEW.email_normalized := normalize_email(NEW.email);
  NEW.siret_normalized := normalize_siret(NEW.siret);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prospects_before_upsert
  BEFORE INSERT OR UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION prospects_before_upsert();

-- Fonction RPC : upsert prospect avec déduplication
CREATE OR REPLACE FUNCTION upsert_prospect(
  p_company_name TEXT,
  p_siret TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_google_reviews_count INTEGER DEFAULT 0,
  p_source prospect_source DEFAULT 'manuel',
  p_status prospect_status DEFAULT 'nouveau',
  p_ai_score INTEGER DEFAULT NULL
)
RETURNS prospects AS $$
DECLARE
  v_domain TEXT;
  v_email TEXT;
  v_siret TEXT;
  v_existing prospects;
  v_result prospects;
BEGIN
  v_domain := normalize_website_domain(p_website);
  v_email := normalize_email(p_email);
  v_siret := normalize_siret(p_siret);

  -- Recherche par SIRET, email ou domaine (priorité dans cet ordre)
  SELECT * INTO v_existing FROM prospects
  WHERE (v_siret IS NOT NULL AND siret_normalized = v_siret)
     OR (v_email IS NOT NULL AND email_normalized = v_email)
     OR (v_domain IS NOT NULL AND website_domain = v_domain)
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE prospects SET
      company_name = COALESCE(NULLIF(TRIM(p_company_name), ''), company_name),
      siret = COALESCE(p_siret, siret),
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      website = COALESCE(p_website, website),
      city = COALESCE(p_city, city),
      google_reviews_count = GREATEST(COALESCE(p_google_reviews_count, 0), google_reviews_count),
      source = COALESCE(p_source, source),
      ai_score = COALESCE(p_ai_score, ai_score)
    WHERE id = v_existing.id
    RETURNING * INTO v_result;
  ELSE
    INSERT INTO prospects (
      company_name, siret, phone, email, website, city,
      google_reviews_count, source, status, ai_score
    ) VALUES (
      p_company_name, p_siret, p_phone, p_email, p_website, p_city,
      COALESCE(p_google_reviews_count, 0), p_source, p_status, p_ai_score
    )
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Vue dashboard : statistiques agrégées
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  COUNT(*)::INTEGER AS total_prospects,
  COUNT(*) FILTER (WHERE status = 'nouveau')::INTEGER AS nouveaux,
  COUNT(*) FILTER (WHERE status = 'contacte')::INTEGER AS contactes,
  COUNT(*) FILTER (WHERE status = 'relance')::INTEGER AS relances,
  COUNT(*) FILTER (WHERE status = 'rdv')::INTEGER AS rdv,
  COUNT(*) FILTER (WHERE status = 'client')::INTEGER AS clients,
  COUNT(*) FILTER (WHERE status = 'refuse')::INTEGER AS refuses,
  COUNT(*) FILTER (WHERE ai_score >= 70 AND status IN ('nouveau', 'contacte'))::INTEGER AS prioritaires,
  ROUND(AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL), 1) AS score_moyen
FROM prospects;

-- RLS (Row Level Security) — à activer quand l'auth sera configurée
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_activities ENABLE ROW LEVEL SECURITY;

-- Politique permissive pour le service role (dev)
CREATE POLICY "Service role full access prospects" ON prospects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access qualifications" ON prospect_qualifications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access activities" ON prospect_activities
  FOR ALL USING (true) WITH CHECK (true);
