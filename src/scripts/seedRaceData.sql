-- Sample Race Data for Lore Chronicles Character Creation
-- Run this in the Supabase SQL Editor to populate almanac_races

-- First check if data already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM almanac_races LIMIT 1) THEN
    INSERT INTO almanac_races (name, slug, description, article, homeland, population, image_url, is_disabled)
    VALUES 
    (
      'Human',
      'human',
      'The most adaptable and numerous of all races, humans are found in every corner of the known world.',
      'Humans are known for their ambition, diversity, and remarkable ability to adapt to any circumstance. Though they lack the longevity of elves or the hardiness of dwarves, their determination and ingenuity have allowed them to build vast empires and forge alliances with nearly every other race.',
      'Various Kingdoms',
      'Very Common',
      NULL,
      false
    ),
    (
      'Elf',
      'elf',
      'Ancient beings of grace and wisdom, elves are attuned to the natural world and possess an innate connection to magic.',
      'The elves are one of the oldest races, with histories stretching back to the dawn of the world. Their pointed ears, graceful features, and luminous eyes mark them as otherworldly. Elves live for centuries, giving them perspectives on time and change that shorter-lived races struggle to comprehend.',
      'The Verdant Realm',
      'Uncommon',
      NULL,
      false
    ),
    (
      'Dwarf',
      'dwarf',
      'Stout and steadfast, dwarves are master craftsmen who dwell in great mountain halls carved deep into stone.',
      'Dwarves are renowned throughout the realms for their craftsmanship, particularly in metalworking and stonecraft. Their underground cities are marvels of engineering, filled with forges that burn eternally and halls adorned with precious gems. Honor and tradition are the cornerstones of dwarven society.',
      'The Iron Mountains',
      'Common',
      NULL,
      false
    ),
    (
      'Orc',
      'orc',
      'Powerful warriors with a rich tribal culture, orcs value strength, honor, and the bonds of clan.',
      'Long misunderstood by other races, orcs possess a complex society built around clans, honor duels, and ancestor worship. Their physical strength is legendary, but equally impressive is their oral tradition—epic songs and tales passed down through generations that chronicle their proud history.',
      'The Ashlands',
      'Common',
      NULL,
      false
    ),
    (
      'Halfling',
      'halfling',
      'Small in stature but large in heart, halflings are known for their cheerful nature and remarkable luck.',
      'Halflings stand about half the height of humans, with large feet and an even larger appetite for good food and pleasant company. They prefer peaceful lives in their cozy burrows but possess a hidden streak of bravery that emerges when their homes or friends are threatened.',
      'The Shire Hills',
      'Common',
      NULL,
      false
    ),
    (
      'Dragonkin',
      'dragonkin',
      'Descendants of ancient dragons, these proud beings carry the blood of the great wyrms in their veins.',
      'Dragonkin claim descent from the primordial dragons that once ruled the world. Their scales shimmer with colors that hint at their draconic heritage, and many possess breath weapons or other abilities inherited from their ancestors. They are a proud people, sometimes to the point of arrogance.',
      'The Scorched Peaks',
      'Rare',
      NULL,
      false
    ),
    (
      'Fae',
      'fae',
      'Mysterious beings from the twilight realm, the Fae dance between the mortal world and their enchanted homeland.',
      'The Fae are creatures of magic and mystery, originating from a parallel realm where the laws of nature bend to whimsy and wonder. Their appearance varies wildly—some appear almost human but for their pointed ears and unsettling beauty, while others manifest features of animals, plants, or pure light.',
      'The Twilight Court',
      'Rare',
      NULL,
      false
    ),
    (
      'Golem',
      'golem',
      'Artificial beings given life through ancient magic, golems seek to understand their purpose and place in the world.',
      'Golems are not born but created, animated through powerful rituals that bind elemental forces to crafted bodies of stone, metal, or other materials. The awakening of consciousness in a golem is rare and poorly understood—most golems are simple automatons, but a few have developed true sentience and free will.',
      'The Artificers Guild',
      'Very Rare',
      NULL,
      false
    );
  END IF;
END $$;

SELECT 'Race data seeding complete!' as status;
