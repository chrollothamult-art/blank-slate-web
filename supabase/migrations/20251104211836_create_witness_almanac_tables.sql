/*
  # Witness Almanac Tables

  ## New Tables
  
  ### almanac_kingdoms
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `founded_date` (text, nullable)
  - `status` (text, one of: active, fallen, unknown)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### almanac_relics
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `type` (text, nullable - weapon, artifact, item, etc.)
  - `power_level` (text, nullable)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### almanac_races
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `population` (text, nullable)
  - `homeland` (text, nullable)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### almanac_titles
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `rank` (text, nullable)
  - `authority` (text, nullable)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### almanac_locations
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `location_type` (text, nullable - city, region, landmark, etc.)
  - `kingdom` (text, nullable)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### almanac_magic
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `magic_type` (text, nullable - spell, school, concept, etc.)
  - `difficulty` (text, nullable)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### almanac_concepts
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `article` (text)
  - `image_url` (text, nullable)
  - `concept_type` (text, nullable)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Anyone can view entries
  - Only admins can manage entries
*/

-- Kingdoms table
CREATE TABLE IF NOT EXISTS almanac_kingdoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  founded_date text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'fallen', 'unknown')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_kingdoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view kingdoms"
  ON almanac_kingdoms FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage kingdoms"
  ON almanac_kingdoms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Relics table
CREATE TABLE IF NOT EXISTS almanac_relics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  type text,
  power_level text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_relics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view relics"
  ON almanac_relics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage relics"
  ON almanac_relics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Races table
CREATE TABLE IF NOT EXISTS almanac_races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  population text,
  homeland text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view races"
  ON almanac_races FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage races"
  ON almanac_races FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Titles table
CREATE TABLE IF NOT EXISTS almanac_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  rank text,
  authority text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view titles"
  ON almanac_titles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage titles"
  ON almanac_titles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Locations table
CREATE TABLE IF NOT EXISTS almanac_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  location_type text,
  kingdom text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view locations"
  ON almanac_locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON almanac_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Magic table
CREATE TABLE IF NOT EXISTS almanac_magic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  magic_type text,
  difficulty text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_magic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view magic"
  ON almanac_magic FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage magic"
  ON almanac_magic FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Concepts table
CREATE TABLE IF NOT EXISTS almanac_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  article text NOT NULL,
  image_url text,
  concept_type text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE almanac_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view concepts"
  ON almanac_concepts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage concepts"
  ON almanac_concepts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_almanac_kingdoms_slug ON almanac_kingdoms(slug);
CREATE INDEX IF NOT EXISTS idx_almanac_relics_slug ON almanac_relics(slug);
CREATE INDEX IF NOT EXISTS idx_almanac_races_slug ON almanac_races(slug);
CREATE INDEX IF NOT EXISTS idx_almanac_titles_slug ON almanac_titles(slug);
CREATE INDEX IF NOT EXISTS idx_almanac_locations_slug ON almanac_locations(slug);
CREATE INDEX IF NOT EXISTS idx_almanac_magic_slug ON almanac_magic(slug);
CREATE INDEX IF NOT EXISTS idx_almanac_concepts_slug ON almanac_concepts(slug);