
-- Add equipped_slot column to rp_character_inventory for equipment system
ALTER TABLE public.rp_character_inventory
ADD COLUMN IF NOT EXISTS equipped_slot TEXT DEFAULT NULL;

-- Add durability columns to rp_items
ALTER TABLE public.rp_items
ADD COLUMN IF NOT EXISTS max_durability INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS equipment_slot TEXT DEFAULT NULL;

-- Add current_durability to rp_character_inventory
ALTER TABLE public.rp_character_inventory
ADD COLUMN IF NOT EXISTS current_durability INTEGER DEFAULT NULL;

-- Add comment for valid equipment slot values
COMMENT ON COLUMN public.rp_character_inventory.equipped_slot IS 'Valid values: head, chest, hands, feet, weapon, accessory, or NULL if not equipped';
COMMENT ON COLUMN public.rp_items.equipment_slot IS 'Which slot this item can be equipped in: head, chest, hands, feet, weapon, accessory';
