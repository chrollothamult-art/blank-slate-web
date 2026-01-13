/*
  # Create Event Relationships Table

  1. New Tables
    - `chronology_event_relationships`
      - `id` (uuid, primary key)
      - `source_event_id` (uuid, references chronology_events)
      - `target_event_id` (uuid, references chronology_events)
      - `relationship_type` (text: 'causes', 'caused_by', 'related_to', 'precedes', 'follows')
      - `description` (text, optional explanation of the relationship)
      - `created_at` (timestamp)

  2. Security
    - RLS enabled for consistency
    - Public read access (chronology is public lore)
    - Admin-only write access (handled via application logic)

  3. Indexes
    - Index on source_event_id for efficient lookups
    - Index on target_event_id for reverse lookups
    - Composite index on both for relationship queries
*/

CREATE TABLE IF NOT EXISTS chronology_event_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID NOT NULL REFERENCES chronology_events(id) ON DELETE CASCADE,
  target_event_id UUID NOT NULL REFERENCES chronology_events(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('causes', 'caused_by', 'related_to', 'precedes', 'follows')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_event_id, target_event_id, relationship_type)
);

ALTER TABLE chronology_event_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to event relationships"
  ON chronology_event_relationships
  FOR SELECT
  USING (true);

CREATE POLICY "Admin only insert"
  ON chronology_event_relationships
  FOR INSERT
  WITH CHECK (false);

CREATE INDEX idx_event_relationships_source ON chronology_event_relationships(source_event_id);
CREATE INDEX idx_event_relationships_target ON chronology_event_relationships(target_event_id);
CREATE INDEX idx_event_relationships_both ON chronology_event_relationships(source_event_id, target_event_id);