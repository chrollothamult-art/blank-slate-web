/*
  # Seed Event Relationships

  This migration adds sample relationships between chronology events
  to demonstrate how the Event Relationships feature works. These relationships
  show cause-and-effect, temporal sequences, and thematic connections.

  The relationships connect key events from different eras and show:
  1. Direct causation (causes/caused_by)
  2. Temporal ordering (precedes/follows)
  3. Thematic connections (related_to)
*/

-- We'll use DO block with proper error handling to seed relationships
-- First, let's get event IDs and create relationships

DO $$
DECLARE
  v_age_of_beasts UUID;
  v_arrival_veldrum UUID;
  v_birth_petronai UUID;
  v_first_chimera UUID;
  v_disappearance_petronai UUID;
  v_veldrum_civil_war UUID;
  v_death_of_wonder UUID;
  v_fall_of_question UUID;
  v_fall_rise_phalagneon UUID;
  v_thou_art_chosen UUID;
BEGIN
  -- Get event IDs
  SELECT id INTO v_age_of_beasts FROM chronology_events WHERE title = 'Age of Beasts' LIMIT 1;
  SELECT id INTO v_arrival_veldrum FROM chronology_events WHERE title = 'Arrival of Veldrum Cyrad' LIMIT 1;
  SELECT id INTO v_birth_petronai FROM chronology_events WHERE title = 'Birth of Petronai''s Children' LIMIT 1;
  SELECT id INTO v_first_chimera FROM chronology_events WHERE title = 'Creation of the First Chimera' LIMIT 1;
  SELECT id INTO v_disappearance_petronai FROM chronology_events WHERE title = 'Disappearance of Petronai' LIMIT 1;
  SELECT id INTO v_veldrum_civil_war FROM chronology_events WHERE title = 'Veldrum Civil War' LIMIT 1;
  SELECT id INTO v_death_of_wonder FROM chronology_events WHERE title = 'Death of Wonder' LIMIT 1;
  SELECT id INTO v_fall_of_question FROM chronology_events WHERE title = 'Fall of Question' LIMIT 1;
  SELECT id INTO v_fall_rise_phalagneon FROM chronology_events WHERE title = 'Fall of Zephyrelle / Rise of Phalagneon' LIMIT 1;

  -- Age of Beasts -> Arrival of Veldrum (causal)
  IF v_age_of_beasts IS NOT NULL AND v_arrival_veldrum IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_age_of_beasts, v_arrival_veldrum, 'precedes', 'The reign of beasts ended with Veldrum''s arrival')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Arrival of Veldrum -> Birth of Petronai (causal)
  IF v_arrival_veldrum IS NOT NULL AND v_birth_petronai IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_arrival_veldrum, v_birth_petronai, 'precedes', 'Veldrum''s arrival preceded the creation of Petronai''s divine children')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Birth of Petronai -> First Chimera (related)
  IF v_birth_petronai IS NOT NULL AND v_first_chimera IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_birth_petronai, v_first_chimera, 'related_to', 'Both events involved creation through divine or magical means')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Disappearance of Petronai -> Veldrum Civil War (causes)
  IF v_disappearance_petronai IS NOT NULL AND v_veldrum_civil_war IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_disappearance_petronai, v_veldrum_civil_war, 'causes', 'The loss of divine guidance led to internal conflict')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Disappearance of Petronai -> Death of Wonder (related)
  IF v_disappearance_petronai IS NOT NULL AND v_death_of_wonder IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_disappearance_petronai, v_death_of_wonder, 'related_to', 'Both events marked the decline of hope and inspiration in the world')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Death of Wonder -> Fall of Question (follows)
  IF v_death_of_wonder IS NOT NULL AND v_fall_of_question IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_death_of_wonder, v_fall_of_question, 'precedes', 'With wonder gone, curiosity and learning soon followed into darkness')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Fall of Question -> Fall/Rise of Phalagneon (related)
  IF v_fall_of_question IS NOT NULL AND v_fall_rise_phalagneon IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_fall_of_question, v_fall_rise_phalagneon, 'related_to', 'The suppression of knowledge enabled the rise of tyranny')
    ON CONFLICT DO NOTHING;
  END IF;

  -- First Chimera -> Veldrum Civil War (related)
  IF v_first_chimera IS NOT NULL AND v_veldrum_civil_war IS NOT NULL THEN
    INSERT INTO chronology_event_relationships (source_event_id, target_event_id, relationship_type, description)
    VALUES (v_first_chimera, v_veldrum_civil_war, 'related_to', 'Forbidden magical experimentation contributed to societal destabilization')
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
