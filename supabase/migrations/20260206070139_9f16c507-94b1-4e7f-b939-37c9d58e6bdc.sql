-- Seed a sample campaign for testing Lore Chronicles

-- Create sample campaign (will be published and featured)
INSERT INTO rp_campaigns (id, author_id, title, description, genre, difficulty, is_published, is_featured, estimated_duration, play_count)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  (SELECT id FROM auth.users LIMIT 1),
  'The Lost Relic of Eldoria',
  'A brave adventurer must journey through ancient ruins to recover a legendary artifact before dark forces claim it for themselves. Your choices will shape the fate of the realm.',
  'adventure',
  'normal',
  true,
  true,
  30,
  0
WHERE NOT EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Create story nodes for the sample campaign
-- Start Node
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'narrative',
  'The Journey Begins',
  '{"text": "You stand at the edge of the Whispering Woods, the ancient forest that guards the entrance to the Ruins of Eldoria. The locals warned you not to venture here, speaking of dark creatures and forgotten magic. But the promise of the Lost Relic—an artifact said to grant immense power—drives you forward.\n\nThe morning mist swirls around your feet as you take your first steps into the unknown. The path splits ahead: one trail descends into a dark ravine, while another climbs toward a crumbling watchtower on the hill."}'::jsonb,
  100,
  100,
  10
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '11111111-1111-1111-1111-111111111111')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Choice Node 1: Path Decision
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'choice',
  'A Fork in the Path',
  '{"text": "The two paths stretch before you, each promising different dangers and rewards. You must choose wisely."}'::jsonb,
  300,
  100,
  5
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '22222222-2222-2222-2222-222222222222')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Path A: The Ravine
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '33333333-3333-3333-3333-333333333333'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'narrative',
  'Into the Depths',
  '{"text": "The ravine path is treacherous. Loose stones shift beneath your feet as you descend into the shadows. Strange luminescent mushrooms light your way with an eerie blue glow.\n\nAt the bottom, you discover an ancient stone bridge spanning an underground river. On the far side, you spot the gleam of something metallic—perhaps treasure, or perhaps a trap.", "npc_name": "Mysterious Voice"}'::jsonb,
  500,
  50,
  15
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '33333333-3333-3333-3333-333333333333')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Path B: The Watchtower
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '44444444-4444-4444-4444-444444444444'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'narrative',
  'The Watchtower',
  '{"text": "You climb the winding path to the watchtower. Though centuries of neglect have crumbled its walls, the structure still stands defiant against time.\n\nInside, you find the remains of an ancient guardian''s quarters. Scattered parchments cover a dusty desk, and among them, a map showing the location of the Relic''s chamber deep within the ruins.", "npc_name": "Spirit of the Guardian"}'::jsonb,
  500,
  150,
  15
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '44444444-4444-4444-4444-444444444444')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Stat Check Node: Cross the Bridge
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '55555555-5555-5555-5555-555555555555'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'stat_check',
  'The Crumbling Bridge',
  '{"text": "The ancient bridge groans under your weight. To cross safely, you will need quick reflexes—or perhaps the wisdom to find another way."}'::jsonb,
  700,
  50,
  20
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '55555555-5555-5555-5555-555555555555')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Ending Node: Success
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '66666666-6666-6666-6666-666666666666'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'ending',
  'The Relic is Yours',
  '{"text": "After overcoming countless trials, you stand in the heart of the ancient chamber. The Lost Relic of Eldoria hovers before you, pulsing with ethereal light.\n\nAs your fingers close around the artifact, power surges through you. You have succeeded where countless others have failed. The realm will remember your name.\n\n**Congratulations, Hero!**\n\nYou have completed The Lost Relic of Eldoria and proven yourself worthy of legend."}'::jsonb,
  900,
  100,
  100
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '66666666-6666-6666-6666-666666666666')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Ending Node: Failure
INSERT INTO rp_story_nodes (id, campaign_id, node_type, title, content, position_x, position_y, xp_reward)
SELECT 
  '77777777-7777-7777-7777-777777777777'::uuid,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'ending',
  'A Hero Falls',
  '{"text": "The darkness closes in around you. Whether through misfortune or poor choices, your quest ends here in the forgotten depths of Eldoria.\n\nBut perhaps another hero will one day succeed where you have fallen...\n\n**Your journey has ended.**\n\nTry again with different choices, or create a new character to face the challenge."}'::jsonb,
  900,
  200,
  25
WHERE NOT EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '77777777-7777-7777-7777-777777777777')
AND EXISTS (SELECT 1 FROM rp_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Update campaign with start node
UPDATE rp_campaigns 
SET start_node_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '11111111-1111-1111-1111-111111111111');

-- Create node choices
-- Start -> Choice
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, order_index)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Continue deeper into the forest',
  '22222222-2222-2222-2222-222222222222'::uuid,
  0
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '11111111-1111-1111-1111-111111111111');

-- Choice -> Ravine
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, order_index)
SELECT 
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Descend into the dark ravine (Brave but dangerous)',
  '33333333-3333-3333-3333-333333333333'::uuid,
  0
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '22222222-2222-2222-2222-222222222222');

-- Choice -> Tower
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, order_index)
SELECT 
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Climb to the ancient watchtower (Seek knowledge)',
  '44444444-4444-4444-4444-444444444444'::uuid,
  1
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '22222222-2222-2222-2222-222222222222');

-- Ravine -> Bridge
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, order_index)
SELECT 
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Cross the ancient bridge',
  '55555555-5555-5555-5555-555555555555'::uuid,
  0
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '33333333-3333-3333-3333-333333333333');

-- Tower -> Success (with map)
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, stat_effect, order_index)
SELECT 
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Follow the map to the Relic''s chamber',
  '66666666-6666-6666-6666-666666666666'::uuid,
  '{"wisdom": 1}'::jsonb,
  0
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '44444444-4444-4444-4444-444444444444');

-- Bridge -> Success (agility check)
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, stat_requirement, stat_effect, order_index)
SELECT 
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Sprint across before it collapses',
  '66666666-6666-6666-6666-666666666666'::uuid,
  '{"stat": "agility", "min_value": 4}'::jsonb,
  '{"agility": 1}'::jsonb,
  0
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '55555555-5555-5555-5555-555555555555');

-- Bridge -> Fail (no agility)
INSERT INTO rp_node_choices (id, node_id, choice_text, target_node_id, order_index)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Try to cross carefully (risky)',
  '77777777-7777-7777-7777-777777777777'::uuid,
  1
WHERE NOT EXISTS (SELECT 1 FROM rp_node_choices WHERE id = '00000000-0000-0000-0000-000000000001')
AND EXISTS (SELECT 1 FROM rp_story_nodes WHERE id = '55555555-5555-5555-5555-555555555555');