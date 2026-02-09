# ThouArt - Feature Roadmap & Bug Fixes

## 🎮 Lore Chronicles — Interactive Roleplay System

A choose-your-adventure roleplay experience where users create characters and embark on branching story adventures within the ThouArt universe. Stories can intertwine, and users can expand the lore under Loremaster oversight.

### Vision & Goals

- **Immersive storytelling** tied to existing Witness Almanac lore
- **Player agency** through meaningful branching choices
- **Community-driven content** with quality control via Loremasters
- **Scalable architecture** supporting solo, async, and real-time multiplayer

---

### Core Systems

#### 1. Character Creation
- [x] **Race Selection** — Pick from almanac races (links to `almanac_races`)
- [x] **Stat Allocation** — Distribute points across Strength, Magic, Charisma, etc.
- [x] **Character Profile** — Name, backstory, portrait upload (reuse `AvatarUpload` with crop)
- [x] **Progression System** — Abilities & faction affiliation earned through story choices
- [x] **Character Sheet View** — D&D-style character sheet display

**UI Flow:**
1. Step 1: Select race → show race lore from almanac
2. Step 2: Allocate stat points (point-buy system, e.g., 20 points total)
3. Step 3: Write backstory + upload portrait
4. Step 4: Review & create

#### 2. Story Campaigns
- [x] **Campaign Creator** — Authors create branching narratives
- [x] **Story Nodes** — Choice points with multiple paths
- [x] **Outcome System** — Choices affect stats, unlock abilities, change story
- [x] **Campaign Browser** — Discover and join campaigns by genre/difficulty
- [x] **Featured Campaigns** — Loremaster-approved spotlight campaigns

**Node Types:**
- `narrative` — Story text with "Continue" button
- `choice` — 2-4 options leading to different nodes
- `stat_check` — Pass/fail based on character stats
- `combat` — Simple dice-roll resolution (future)
- `ending` — Campaign conclusion with outcome summary

#### 3. Chronicle Threads (Sessions)
- [x] **Async Mode** — Turn-based, players act when online
- [x] **Real-Time Mode** — Scheduled sessions with live participants
- [x] **Group Sessions** — Multiple players in same campaign
- [x] **Solo Play** — Single-player story experiences
- [x] **Story Intertwining** — Characters can cross into other campaigns via "crossover events"

#### 4. Lore Expansion System
- [x] **Lore Proposals** — Users submit new races, locations, items, factions
- [x] **Proposal Review Queue** — Loremasters approve/reject submissions
- [x] **Universe Rules Enforcement** — Guidelines for lore-compliant content
- [x] **Community Lore Almanac** — Dedicated almanac for approved community lore (separate from official Witness Almanac)
- [x] **Community Lore Browser** — Browse/search approved community entries by category
- [x] **Lore Contribution Credits** — Recognition for accepted contributions (badges, profile display)
- [x] **Contributor Badges** — "Lore Contributor" badge on profiles with accepted proposals

#### 5. Loremaster Role
- [x] **Loremaster Permissions** — Special role for trusted users/admins
- [x] **Moderation Dashboard** — Review proposals, flag content, feature campaigns
- [x] **Universe Consistency Tools** — Check new lore against existing almanac
- [x] **Loremaster Applications** — Users can apply for the role
- [x] **Loremaster Leaderboard** — Track reviews completed by each Loremaster

---

### Database Schema (Detailed)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_characters` | Player characters | `user_id`, `name`, `race_id` (FK → almanac_races), `stats` (JSONB), `backstory`, `portrait_url`, `current_campaign_id` |
| `rp_character_abilities` | Unlocked abilities per character | `character_id`, `ability_name`, `unlocked_at`, `source_node_id` |
| `rp_campaigns` | User-created adventures | `author_id`, `title`, `description`, `genre`, `difficulty`, `is_published`, `is_featured`, `start_node_id` |
| `rp_story_nodes` | Branching choice points | `campaign_id`, `node_type`, `content` (JSONB), `position_x`, `position_y` |
| `rp_node_choices` | Available choices at each node | `node_id`, `choice_text`, `target_node_id`, `stat_requirement` (JSONB), `stat_effect` (JSONB) |
| `rp_sessions` | Active playthroughs | `campaign_id`, `mode` (solo/group/async), `created_by`, `current_node_id`, `story_flags` (JSONB) |
| `rp_session_participants` | Players in group sessions | `session_id`, `character_id`, `joined_at`, `is_active` |
| `rp_character_progress` | Per-character session state | `session_id`, `character_id`, `current_node_id`, `story_flags` (JSONB), `stats_snapshot` (JSONB) |
| `rp_lore_proposals` | User-submitted new lore | `user_id`, `category`, `content` (JSONB), `status` (pending/approved/rejected), `reviewer_id`, `reviewed_at` |
| `rp_loremasters` | Users with oversight permissions | `user_id`, `appointed_at`, `appointed_by` |
| `rp_campaign_forks` | Crossover connections | `source_campaign_id`, `target_campaign_id`, `fork_node_id`, `entry_node_id` |

**JSONB Structures:**
- `stats`: `{ "strength": 5, "magic": 3, "charisma": 4, "wisdom": 3, "agility": 5 }`
- `story_flags`: `{ "met_elder": true, "has_relic": false, "reputation_score": 12 }`
- `stat_requirement`: `{ "stat": "charisma", "min_value": 4 }`
- `stat_effect`: `{ "charisma": +1 }` or `{ "unlock_ability": "persuasion" }`

---

### Technical Architecture

#### State Management
- Use **finite state machine** pattern for story progression
- `story_flags` JSONB for tracking narrative state (items, relationships, decisions)
- Snapshot stats at session start for consistency during playthrough

#### Real-Time (Phase 3)
- Supabase Realtime subscriptions on `rp_sessions` for multiplayer sync
- Presence tracking for "who's online" in group sessions
- Optimistic UI updates with conflict resolution

#### Lore Validation (Phase 4)
- Cross-reference proposals against `almanac_*` tables
- Flag potential conflicts (e.g., duplicate location names)
- Automated checks + human Loremaster review

#### Reusable Components
- `AvatarUpload` → Character portrait upload with cropping
- `CharacterComparison` → Adapt for stat visualization
- `DynamicRelationshipMap` → Visualize character connections within campaigns

---

### UI/UX Wireframe Concepts

#### Character Creation Wizard
```
┌─────────────────────────────────────────────┐
│ Step 1 of 4: Choose Your Race               │
├─────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ Elf     │ │ Dwarf   │ │ Human   │  ...    │
│ │ [img]   │ │ [img]   │ │ [img]   │         │
│ └─────────┘ └─────────┘ └─────────┘         │
│                                             │
│ Selected: Elf                               │
│ "Ancient beings of the First Age..."        │
│                                             │
│              [Back] [Next →]                │
└─────────────────────────────────────────────┘
```

#### Story Player
```
┌─────────────────────────────────────────────┐
│ Chapter 3: The Crossroads                   │
├─────────────────────────────────────────────┤
│                                             │
│ The ancient path splits before you. To the │
│ east, smoke rises from a distant village.  │
│ To the west, the dark forest beckons...    │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ → Head toward the village (Charisma 3+)│ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ → Enter the dark forest                 │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ → Make camp and rest                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Character Sheet]        [Save & Exit]      │
└─────────────────────────────────────────────┘
```

#### Campaign Node Editor (Visual)
```
┌─────────────────────────────────────────────┐
│ Campaign: The Lost Relic                    │
├─────────────────────────────────────────────┤
│                                             │
│   [Start] ──→ [Intro] ──→ [Choice 1]        │
│                              │     │        │
│                              ▼     ▼        │
│                          [Path A] [Path B]  │
│                              │     │        │
│                              └──┬──┘        │
│                                 ▼           │
│                             [Ending]        │
│                                             │
│ + Add Node   🔗 Connect   🗑 Delete          │
└─────────────────────────────────────────────┘
```

---

### Implementation Phases (Revised)

**Phase 1: Foundation (MVP)**
- [x] Create database schema (core tables with RLS)
- [x] Build character creation wizard UI
- [x] Implement character sheet display
- [x] Seed sample race data from `almanac_races`

**Phase 2: Solo Campaigns**
- [x] Campaign creator with visual node editor
- [x] Story player UI with choice presentation
- [x] Session management (start, save, resume)
- [x] Create 1-2 sample campaigns for testing

**Phase 3: Multiplayer & Social**
- [x] Group session support with turn-based flow
- [x] Real-time synchronization via Supabase Realtime
- [x] Crossover event system between campaigns
- [x] Leaderboards / achievement integration
- [x] Campaign reviews and ratings
- [x] Character showcase (public profiles)

**Phase 4: Lore Governance**
- [x] Lore proposal submission form
- [x] Loremaster dashboard with approval workflow
- [x] Community Lore Almanac (separate from official Witness Almanac)
- [x] Automated lore conflict detection
- [x] Loremaster application system
- [x] Contributor recognition system

---

### Advanced Campaign Systems

#### 6. Key Points & Dynamic Pathways
Campaign creators define **Key Points** (major story milestones) — what happens *between* them is driven by the player.

- [x] **Key Point Nodes** — Special high-priority milestone nodes that anchor the narrative arc
- [x] **Dynamic Path Generation** — Between key points, players navigate via:
  - Pre-built response selections (creator-authored choices)
  - Activity-based interactions (mini-challenges, puzzles, trades)
  - Free-text player input (open-ended responses interpreted by game logic)
- [x] **Key Point Branching** — Which key points even occur depends on prior player actions
- [x] **Key Point Editor UI** — Visual editor showing key points as anchors with flexible paths between
- [x] **Path Weighting** — Creator assigns probability/conditions for which paths appear

**Key Point Structure:**
```
[Start] ──→ {dynamic path} ──→ [Key Point A] ──→ {dynamic path} ──→ [Key Point C]
                                      │
                                      └── (if betrayed faction) ──→ [Key Point B] ──→ ...
```

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_key_points` | Major story milestones | `campaign_id`, `title`, `description`, `order_index`, `is_required`, `conditions` (JSONB), `image_url` |
| `rp_key_point_paths` | Connections between key points | `source_key_point_id`, `target_key_point_id`, `path_type` (linear/conditional/random), `conditions` (JSONB) |

#### 7. Event Trigger System
Events require specific **triggers** set by the creator — player actions, stat thresholds, item possession, or time-based conditions.

- [x] **Trigger Definitions** — Creators define triggers on nodes (stat check, item held, flag set, relationship threshold)
- [x] **Trigger Chains** — Multiple triggers can be combined (AND/OR logic)
- [x] **Triggered Events** — When conditions are met, fire events (unlock path, spawn encounter, modify stats)
- [x] **Conditional Visibility** — Choices/paths only appear when triggers are satisfied
- [x] **Trigger Editor UI** — Visual builder for creating trigger conditions in the campaign editor
- [x] **Trigger Log** — Players can see which triggers they've activated (optional transparency)

**Trigger Types:**
| Trigger | Example |
|---------|---------|
| `stat_threshold` | Strength ≥ 7 |
| `item_possessed` | Has "Ancient Key" |
| `flag_set` | `met_elder = true` |
| `relationship_score` | NPC "Kael" ≥ 50 |
| `faction_reputation` | "Shadow Guild" ≥ 30 |
| `choice_made` | Selected "spare the wolf" at node X |
| `player_count` | ≥ 3 players in session (multiplayer) |
| `random_chance` | 30% probability per visit |

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_event_triggers` | Trigger definitions | `campaign_id`, `name`, `trigger_type`, `conditions` (JSONB), `target_event_id` |
| `rp_triggered_events` | Events fired by triggers | `campaign_id`, `name`, `event_type` (unlock_path/spawn_node/modify_stat/grant_item), `payload` (JSONB) |
| `rp_session_trigger_log` | Per-session trigger history | `session_id`, `trigger_id`, `character_id`, `fired_at`, `context` (JSONB) |

#### 8. Interaction Point System
Character-to-character (and character-to-NPC) interactions that trigger **different progressions** for each participant.

- [x] **Interaction Nodes** — Special node type where two+ characters/NPCs interact
- [x] **Dual Outcomes** — Each interaction produces separate outcomes per participant (one gains, other loses — or both benefit/suffer)
- [x] **Interaction Types** — Dialogue, trade, combat, persuasion, alliance proposal, betrayal
- [x] **Interaction History** — Track all interactions per character pair
- [x] **Creator Outcome Designer** — UI for creators to design good/bad outcomes per interaction
- [x] **Stat-Influenced Interactions** — Interaction results modified by participant stats
- [x] **Cascading Effects** — One interaction's outcome affects future available interactions

**Outcome Matrix Example:**
```
Character A (Charisma 7) meets NPC "Kael" (Persuasion check):
  ├─ Pass: A gains trust (+20 relationship), Kael reveals secret → unlocks Path X
  └─ Fail: A loses trust (-10 relationship), Kael becomes suspicious → triggers guard encounter

Creator designs BOTH branches with full consequences.
```

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_interaction_points` | Interaction definitions | `campaign_id`, `node_id`, `interaction_type`, `participants` (JSONB), `outcomes` (JSONB) |
| `rp_interaction_outcomes` | Outcome templates | `interaction_id`, `participant_role`, `result_type` (good/bad/neutral), `stat_effects` (JSONB), `flag_effects` (JSONB), `narrative_text` |
| `rp_interaction_log` | Session interaction history | `session_id`, `interaction_id`, `participants` (JSONB), `outcome_chosen`, `timestamp` |

#### 9. Random Events System
Creator-defined events that fire when **certain conditions are met** — adding unpredictability and replayability.

- [x] **Random Event Pool** — Creators add events to a pool with activation conditions
- [x] **Condition-Based Triggering** — Events fire based on player state, location, turn count, etc.
- [x] **Probability Weighting** — Each event has a % chance when conditions are met
- [x] **One-Time vs Recurring** — Events can fire once or repeat
- [x] **Random Event Categories** — Encounter, weather, fortune, misfortune, discovery, ambush
- [x] **Random Event Editor** — Drag-and-drop event creation with condition builder
- [x] **Event Cooldowns** — Prevent same random event firing too frequently

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_random_events` | Random event definitions | `campaign_id`, `name`, `description`, `category`, `probability`, `conditions` (JSONB), `effects` (JSONB), `is_recurring`, `cooldown_turns` |
| `rp_random_event_log` | When events fired | `session_id`, `event_id`, `character_id`, `fired_at`, `outcome` (JSONB) |

#### 10. Multiplayer Convergence System
Each player starts from a **different campaign beginning** which later merges — resulting in allies or enemies based on prior choices.

- [x] **Multiple Entry Points** — Campaign has 2-4+ distinct starting branches (one per player/faction)
- [x] **Convergence Nodes** — Special nodes where player paths merge
- [x] **Convergence Conditions** — Creators define when/how paths collide (after X key points, specific triggers, etc.)
- [x] **Prior Choice Impact** — Players' decisions before convergence determine their relationship at meeting
- [x] **Alliance/Enemy Resolution** — Automatic determination: allies, enemies, or neutral based on faction, flags, and choices
- [x] **Post-Convergence Branching** — Story continues differently for allied vs enemy player groups
- [x] **Convergence Reveal UI** — Dramatic reveal moment when players discover each other's histories
- [x] **Split & Reconverge** — Paths can split and merge multiple times

**Convergence Flow:**
```
Player 1: [Start A] → [Key Point A1] → [Key Point A2] ──────┐
                                                              ├──→ [Convergence] → [Allied Path] or [Enemy Path]
Player 2: [Start B] → [Key Point B1] → [Key Point B2] ──────┘

Convergence checks:
  - Did Player 1 help the rebels? Did Player 2 join the crown?
  - If opposing factions → Enemy encounter
  - If same faction → Alliance formed
  - If neutral → Negotiation interaction point
```

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_campaign_entry_points` | Multiple starting branches | `campaign_id`, `entry_label`, `start_node_id`, `faction_id`, `description`, `max_players` |
| `rp_convergence_nodes` | Where paths merge | `campaign_id`, `node_id`, `required_entry_points` (JSONB), `convergence_type` (merge/clash/negotiate) |
| `rp_convergence_rules` | How alliances/enemies are decided | `convergence_id`, `condition_type`, `conditions` (JSONB), `result` (ally/enemy/neutral), `target_node_id` |

#### 11. Faction System (Campaign-Level)
Factions within campaigns that players can join, betray, or destroy — affecting the entire story arc.

- [x] **Campaign Factions** — Creators define factions per campaign with lore, goals, and values
- [x] **Faction Joining** — Players join factions through story choices or interaction points
- [x] **Faction Reputation** — Per-player reputation with each faction (-100 to +100)
- [x] **Faction Conflicts** — Factions can be allied, neutral, or at war — affecting player interactions
- [x] **Faction Perks** — High reputation unlocks faction-specific choices, items, abilities
- [x] **Faction Betrayal** — Leaving/betraying a faction has severe consequences
- [x] **Multiplayer Faction Wars** — In convergence, faction alignment determines ally/enemy status
- [x] **Faction Leaderboard** — Track which factions are most popular across all sessions

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_campaign_factions` | Faction definitions per campaign | `campaign_id`, `name`, `description`, `image_url`, `values` (JSONB), `perks` (JSONB) |
| `rp_faction_relations` | Inter-faction relationships | `campaign_id`, `faction_a_id`, `faction_b_id`, `relation_type` (allied/neutral/hostile) |
| `rp_character_faction_standing` | Player's faction reputation | `session_id`, `character_id`, `faction_id`, `reputation_score`, `joined_at`, `betrayed_at` |

---

### Implementation Phases (Advanced Systems)

**Phase 5: Dynamic Campaigns**
- [x] Key Points system with conditional branching
- [x] Event Trigger system with visual editor
- [x] Random Events pool with condition builder
- [x] Free-text input handling for player responses

**Phase 6: Interaction & Consequences**
- [x] Interaction Point system with dual outcomes
- [x] Creator Outcome Designer UI
- [x] Cascading effects engine
- [x] Interaction history tracking

**Phase 7: Multiplayer Convergence**
- [x] Multiple entry points per campaign
- [x] Convergence node system
- [x] Alliance/Enemy resolution engine
- [x] Convergence reveal UI
- [x] Faction system with reputation tracking
- [x] Faction conflicts affecting multiplayer dynamics

#### 12. Player-to-Player Physical Interaction System
Real-time physical and social interactions between players when they meet in multiplayer campaigns — proximity-based, skill-gated, and inventory-dependent.

##### Proximity Mechanics
- [x] **Proximity Tracking** — Track relative distance between players in a scene (close/mid/far)
- [x] **Movement Actions** — Players can: stop, walk, run, approach a specific player, retreat, circle around
- [x] **Proximity Zones** — Actions unlock based on distance:
  - **Far** (10+ paces): Shout, signal, observe
  - **Mid** (3-9 paces): Speak normally, gesture, throw item
  - **Close** (1-2 paces): Whisper, hand item, grab, shove
  - **Adjacent** (touching): Stab, pickpocket, embrace, restrain

##### Physical Actions (Proximity + Inventory + Skill Gated)
- [x] **Melee Actions** — Stab, slash, punch, shove (requires: adjacent + weapon in inventory + combat skill)
- [x] **Stealth Actions** — Stab from behind, pickpocket, plant item (requires: adjacent + stealth skill + concealed item)
- [x] **Social Actions** — Whisper, lie, persuade, intimidate, bargain (requires: close/adjacent + charisma/wisdom checks)
- [x] **Ranged Actions** — Throw item, shoot bow, cast spell (requires: mid+ range + item/ability)
- [x] **Movement Actions** — Walk closer, run away, block path, follow silently

**Action Availability Logic:**
```
Can player A "stab" player B?
  ├─ Is A adjacent to B? ✗ → Action hidden
  ├─ Does A have a bladed weapon in inventory? ✗ → Action hidden
  ├─ Has A prepared the weapon (unsheathed/unhidden)? ✗ → Action hidden
  ├─ Does A have sufficient combat/stealth stat? ✗ → Action visible but grayed out
  └─ All pass → Action available (with stat check roll on execution)
```

##### Pre-Planning & Preparation
- [x] **Action Preparation** — Players must prepare actions in advance (hidden from others):
  - "Hide knife in cloak" → Conceals weapon, enables surprise attacks later
  - "Ready bow" → Enables ranged attack next turn but visible to perceptive players
  - "Prepare lie" → Pre-write a deceptive statement for upcoming conversation
  - "Signal ally" → Set up a secret signal with another player
- [x] **Preparation Slots** — Limited number of preparations based on level/wisdom
- [x] **Preparation Reveal** — Preparations only revealed when used or detected by perception
- [x] **Preparation Cooldowns** — Can't re-prepare immediately after use

##### Awareness & Perception System
- [x] **Passive Perception** — Auto-calculated from wisdom + agility + level
- [x] **Perception Checks** — Automatic rolls when nearby players prepare/execute hidden actions
- [x] **Awareness Levels:**
  - **Oblivious** (low perception): No warnings, easily surprised
  - **Alert** (mid perception): "You sense something is off" hints
  - **Vigilant** (high perception): "Player X reached into their cloak" — partial reveal
  - **Hawkeye** (max perception): Full action detection — "Player X concealed a dagger"
- [x] **Perception Modifiers** — Environment (dark = harder), fatigue, distraction, magic
- [x] **Detection Notifications** — Private alerts to perceptive players about suspicious actions
- [x] **Counter-Actions** — If you detect a threat, unlock reactive options (dodge, block, call out, counter-attack)

##### Action Resolution
- [x] **Stat Check Rolls** — Actions resolved via stat checks (attacker stat vs defender stat)
- [x] **Surprise Bonus** — Undetected actions get +3 to stat check
- [x] **Consequence Engine** — Each action has success/fail outcomes defined by campaign creator
- [x] **Witness System** — Other nearby players may witness actions and gain knowledge/flags
- [x] **Reputation Impact** — Aggressive actions affect faction standing and NPC relationships
- [x] **Death/Injury from PvP** — Stab can wound or kill based on damage system (creator-configured lethality)

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_player_positions` | Player proximity in scene | `session_id`, `character_id`, `zone` (far/mid/close/adjacent), `relative_to_character_id`, `updated_at` |
| `rp_prepared_actions` | Pre-planned hidden actions | `session_id`, `character_id`, `action_type`, `target_character_id`, `item_id`, `preparation` (JSONB), `is_revealed`, `prepared_at` |
| `rp_action_log` | All executed actions | `session_id`, `actor_id`, `target_id`, `action_type`, `stat_check_result`, `was_detected`, `outcome` (JSONB), `witnesses` (JSONB), `executed_at` |
| `rp_perception_events` | Detection alerts | `session_id`, `observer_id`, `target_id`, `perception_roll`, `detection_level` (oblivious/alert/vigilant/hawkeye), `message`, `created_at` |

**Action Categories & Requirements:**
| Action | Range | Requires Item? | Requires Skill? | Detectable? |
|--------|-------|---------------|-----------------|-------------|
| Stab | Adjacent | Bladed weapon | Combat ≥ 3 | Perception vs Stealth |
| Stab from behind | Adjacent | Concealed blade | Stealth ≥ 5 | Perception vs Stealth+2 |
| Whisper | Close | No | — | Perception ≥ 7 to overhear |
| Lie | Close/Mid | No | Charisma ≥ 4 | Wisdom vs Charisma |
| Scream/Shout | Any | No | — | Always detected |
| Pickpocket | Adjacent | No | Agility ≥ 6 | Perception vs Agility |
| Throw item | Mid+ | Throwable item | Agility ≥ 3 | Always visible |
| Block path | Close | No | Strength ≥ 4 | Always visible |
| Follow silently | Mid | No | Stealth ≥ 5 | Perception vs Stealth |
| Hide item on person | Self | Item | Stealth ≥ 3 | Not until used |
| Signal ally | Far+ | No | — | Perception ≥ 5 |

##### Creator Tools for PvP Interactions
- [x] **Interaction Zone Editor** — Define which scenes allow PvP interactions
- [x] **Lethality Settings** — Per-campaign: no-kill, wound-only, permadeath
- [x] **Custom Action Builder** — Creators add campaign-specific actions with custom requirements
- [x] **Consequence Templates** — Pre-built outcomes (wound, betray, ally, escape) creators can assign
- [x] **PvP Toggle** — Campaign-level setting to enable/disable player-vs-player actions

---

#### 13. Suggestion & Hint System
A dynamic hint system that nudges players toward interesting paths — whether they follow or ignore hints affects the campaign trajectory and can trigger random events.

##### Hint Mechanics
- [x] **Context-Aware Suggestions** — System analyzes player state (stats, inventory, flags, position) and suggests relevant actions
- [x] **Hint Types:**
  - 🧭 **Direction hints** — "The eastern path seems less traveled..." (navigation)
  - ⚔️ **Action hints** — "Your blade could serve you well here..." (combat/stealth)
  - 🗣️ **Social hints** — "Perhaps diplomacy would yield better results..." (persuasion)
  - 🔍 **Discovery hints** — "Something glints in the corner of your eye..." (exploration)
  - ⚠️ **Warning hints** — "Your instincts tell you to be cautious..." (danger ahead)
- [x] **Hint Frequency** — Configurable per campaign (frequent/moderate/rare/none)
- [x] **Hint Accuracy** — Not all hints are helpful — some are traps or misdirection (creator-designed)

##### Player Response & Consequences
- [x] **Follow Hint** — Player takes the suggested action → triggers "obedient path" outcomes
- [x] **Ignore Hint** — Player does something else → triggers "defiant path" outcomes
- [x] **Opposite Action** — Player deliberately does the opposite → triggers special "contrarian" events
- [x] **Hint Tracking** — Track how often a player follows/ignores hints (affects future hint accuracy)
- [x] **Hint as Random Event Trigger** — Hint responses serve as triggers for random events:
  - Followed 3 hints in a row → "Guardian Angel" event (bonus)
  - Ignored 3 hints in a row → "Lost Wanderer" event (penalty or surprise)
  - Took opposite action → "Wildcard" random event

##### Creator Hint Designer
- [x] **Hint Placement** — Attach hints to specific nodes, key points, or interaction zones
- [x] **Conditional Hints** — Hints only appear if certain conditions are met (stat threshold, item, flag)
- [x] **Hint Chains** — Sequence of hints that build toward a revelation or trap
- [x] **Red Herrings** — Deliberately misleading hints to test player judgment
- [x] **Multiplayer Divergent Hints** — Different players in same session get different/conflicting hints
- [x] **Hint Source Flavor** — Hints presented as: inner voice, companion whisper, environmental clue, divine sign

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_hints` | Hint definitions per campaign | `campaign_id`, `node_id`, `hint_type`, `hint_text`, `conditions` (JSONB), `follow_outcome` (JSONB), `ignore_outcome` (JSONB), `is_red_herring`, `source_flavor` |
| `rp_hint_responses` | Player reactions to hints | `session_id`, `hint_id`, `character_id`, `response` (followed/ignored/opposite), `triggered_event_id`, `responded_at` |
| `rp_hint_chains` | Linked hint sequences | `campaign_id`, `chain_name`, `hint_ids` (JSONB array), `completion_reward` (JSONB), `chain_order` |

**Hint → Random Event Integration:**
```
Player receives hint: "The shadows whisper of danger ahead..."
  ├─ Follows (takes cautious route) → No ambush, +5 XP, hint streak +1
  ├─ Ignores (walks straight through) → 60% chance ambush random event fires
  └─ Opposite (charges into shadows) → Triggers "Reckless Bravery" event
       ├─ If Strength ≥ 6: Defeat ambushers, +30 XP, rare item drop
       └─ If Strength < 6: Captured, injury, lose item
```

---

### Implementation Phases (Advanced Systems — continued)

**Phase 8: Player Physical Interactions**
- [x] Proximity tracking system with zone mechanics
- [x] Movement action UI (stop/walk/run/approach)
- [x] Physical action system with inventory + skill gates
- [x] Action preparation mechanic (hide knife, ready bow)
- [x] Perception and awareness engine
- [x] Action resolution with stat check rolls
- [x] Witness and detection notification system
- [x] Creator PvP tools (lethality settings, interaction zones, custom actions)

**Phase 9: Hint & Suggestion Engine**
- [x] Context-aware hint generation based on player state
- [x] Hint response tracking (follow/ignore/opposite)
- [x] Hint → random event trigger integration
- [x] Creator hint designer with placement and conditions
- [x] Red herring and hint chain support
- [x] Multiplayer divergent hints

---

### 🤖 AI Integration — Lore Chronicles Intelligence Layer

A multi-faceted AI system powered by Lovable AI (via edge functions) that enhances every layer of the Lore Chronicles experience — from narrating stories to generating backstories, interpreting free-text player actions, and answering lore questions.

**Core Principle:** The AI is always grounded in existing lore. Every AI-generated response pulls context from almanac data, campaign content, and session history to stay universe-consistent.

**AI Gateway:** All AI calls go through Lovable AI (`https://ai.gateway.lovable.dev/v1/chat/completions`) via dedicated edge functions. Uses `LOVABLE_API_KEY` (auto-provisioned). Default model: `google/gemini-3-flash-preview`.

---

#### AI Feature 1: AI Dungeon Master

The AI acts as a dynamic narrator/DM that generates story prose, NPC dialogue, and scene descriptions based on the campaign's existing nodes, lore, and player state. **Crucially, the campaign creator feeds the AI with lore context and story structure — the AI fills in the narrative gaps between key points.**

##### How It Works
1. **Campaign creator defines** key points, story nodes, NPCs, and world rules as usual
2. **Between authored nodes**, the AI generates transitional narrative based on:
   - The campaign's genre, tone, and world rules
   - The current player's character stats, race, abilities, inventory
   - Session history (past choices, story flags, interaction logs)
   - Almanac lore relevant to the current location/faction/race
   - Creator-defined "DM instructions" (tone guidance, plot constraints, forbidden topics)
3. **AI narrates** scene descriptions, NPC dialogue, ambient events, and consequences
4. **Player choices still drive progression** — AI enhances the journey, doesn't replace authored structure

##### Creator DM Configuration
- [x] **DM Instructions Field** — Free-text field on campaign settings where creator defines AI behavior:
  - Tone: "dark and foreboding", "lighthearted adventure", "political intrigue"
  - Constraints: "never kill the player outright", "always offer a peaceful option"
  - Lore focus: "emphasize the conflict between the Elder Council and the Shadow Guild"
  - NPC personalities: "Kael is sarcastic but loyal; The Elder speaks in riddles"
- [x] **AI Narration Toggle** — Per-node option: "AI-narrated transition" vs "direct jump to next node"
- [x] **Lore Context Injection** — Creator selects which almanac entries the AI should reference for this campaign
- [x] **NPC Voice Profiles** — Define speaking style per NPC (formal, casual, cryptic, aggressive)
- [x] **Guardrails** — Creator sets hard limits: no romance, no real-world references, PG-13 only, etc.

##### Technical Implementation
- [x] **Edge Function: `ai-dungeon-master`**
  - Input: `{ session_id, character_id, current_node_id, action_context }`
  - Fetches: campaign data, character stats, session flags, recent history, relevant almanac entries
  - System prompt built dynamically from creator's DM instructions + lore context
  - Output: `{ narration: string, npc_dialogue?: { name, text }[], suggested_choices?: string[], stat_effects?: object }`
  - Streaming response for immersive text reveal
- [x] **Context Window Management** — Summarize older session history to fit context limits; keep last 10 interactions verbatim
- [x] **Lore Retrieval** — Query almanac tables (characters, locations, races, relics) for relevant context based on current campaign tags/references
- [x] **Response Caching** — Cache deterministic narrations (same node + same flags = same narration) to reduce API calls

##### Database Addition
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_campaign_ai_config` | AI settings per campaign | `campaign_id`, `dm_instructions` (TEXT), `tone`, `guardrails` (JSONB), `lore_context_ids` (JSONB array of almanac entry IDs), `npc_voice_profiles` (JSONB), `ai_enabled` (BOOLEAN) |
| `rp_ai_narration_log` | Log of all AI-generated narrations | `session_id`, `character_id`, `node_id`, `prompt_hash`, `narration_text`, `model_used`, `tokens_used`, `created_at` |

##### UI Integration
- [x] **Narration Panel** — AI text appears in a styled "narrator voice" panel with typewriter animation
- [x] **NPC Dialogue Bubbles** — AI-generated NPC speech displayed with portrait + speech bubble
- [x] **AI Transition Screens** — Between key points, show AI-narrated scene with atmospheric styling
- [x] **DM Config Panel** — In campaign editor, a dedicated "AI Dungeon Master" settings tab

---

#### AI Feature 2: Free-Text Response Interpreter

Players type free-form actions ("I try to pick the lock", "I intimidate the guard", "I search the room for hidden compartments") and the AI interprets them in context, resolving outcomes based on character stats and story state.

##### How It Works
1. Player reaches a node with free-text input enabled (existing `FreeTextInput` component)
2. Player types their action
3. AI receives: the action text, character stats, current node context, available story flags
4. AI determines:
   - Which stat check applies (if any)
   - Whether the action succeeds or fails
   - Narrative outcome description
   - Any stat/flag/inventory changes
   - Which node to transition to next (if applicable)

##### Implementation Details
- [x] **Edge Function: `ai-interpret-action`**
  - Input: `{ session_id, character_id, node_id, player_text, campaign_ai_config }`
  - System prompt includes: current scene description, character sheet, available exits/choices, DM instructions
  - Uses tool calling to return structured output:
    ```json
    {
      "interpretation": "You attempt to pick the lock...",
      "stat_check": { "stat": "agility", "difficulty": 5, "result": "pass" },
      "outcome_narration": "The lock clicks open with a satisfying snap...",
      "stat_effects": { "agility": 1 },
      "flag_effects": { "lockpicked_cell": true },
      "next_node_id": "uuid-or-null",
      "xp_reward": 15
    }
    ```
  - If no matching authored node exists, AI generates a mini-narrative and returns player to the nearest authored node
- [x] **Stat Check Resolution** — AI picks the relevant stat, rolls against difficulty, narrates pass/fail
- [x] **Action Validation** — AI rejects impossible actions ("I fly to the moon") with in-character responses
- [x] **Memory Integration** — AI remembers past free-text actions within the session for continuity
- [x] **Creator Opt-In** — Free-text input only available on nodes where the creator enables it

##### UI Changes
- [x] **Enhanced FreeTextInput** — Add loading state with "The DM considers your action..." animation
- [x] **Outcome Display** — Show stat check roll visualization (dice animation), then narration
- [x] **Action History** — Scrollable log of past free-text actions and their outcomes in the session

---

#### AI Feature 3: AI Lore Q&A Assistant

A chat-based assistant that answers player questions about the ThouArt universe using almanac data as context. Available as a sidebar panel during gameplay or as a standalone page.

##### How It Works
1. Player asks a question: "Who is the Elder of the Northern Council?" / "What powers do the Shadowkin have?"
2. AI searches relevant almanac entries (characters, locations, races, relics, lore articles)
3. AI responds with lore-accurate information, citing sources
4. Maintains conversation history for follow-up questions

##### Implementation Details
- [x] **Edge Function: `ai-lore-assistant`**
  - Input: `{ messages: Message[], user_id }`
  - Pre-processes: searches almanac tables for relevant entries using keyword matching
  - Injects matched almanac entries into system prompt as context
  - System prompt: "You are the Keeper of Lore for the ThouArt universe. Answer questions using ONLY the provided lore entries. If the answer isn't in the provided lore, say so. Cite your sources."
  - Streaming response for conversational feel
- [x] **Almanac Search** — Full-text search across `almanac_characters`, `almanac_locations`, `almanac_races`, `almanac_relics` for relevant context
- [x] **Source Citations** — AI references which almanac entry each fact comes from, with links
- [x] **Conversation Memory** — Store conversation per user (last N messages) for context continuity
- [ ] **Spoiler Guard** — If player is mid-campaign, AI avoids spoiling unreached story content

##### Database Addition
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_lore_conversations` | Chat history per user | `user_id`, `messages` (JSONB array), `last_active_at`, `created_at` |

##### UI Components
- [x] **LoreAssistant Panel** — Slide-out sidebar with chat interface, available from Lore Chronicles and Almanac pages
- [ ] **Inline Lore Tooltips** — During gameplay, highlighted lore terms open a quick AI-powered explanation popup
- [x] **"Ask the Keeper" Button** — Floating action button on relevant pages

---

#### AI Feature 4: AI Character Backstory Generator

Generate rich, lore-consistent character backstories based on the player's chosen race, stats, and optional prompts. Helps players who struggle with creative writing create compelling characters.

##### How It Works
1. During character creation (Step 3: Backstory), player can click "Generate Backstory"
2. AI receives: selected race (with lore), allocated stats, optional player prompt ("I want my character to be a disgraced noble")
3. AI generates a 2-3 paragraph backstory that:
   - References the character's race and its lore
   - Explains how their stats developed (high strength = trained warrior, high magic = studied at academy)
   - Incorporates the player's optional prompt
   - References real locations/factions from the almanac
4. Player can regenerate, edit, or use as-is

##### Implementation Details
- [x] **Edge Function: `ai-generate-backstory`**
  - Input: `{ race_id, race_lore, stats, player_prompt?, existing_backstory? }`
  - Fetches race data from `almanac_races` for lore context
  - Optionally fetches related almanac entries (locations, factions) for world grounding
  - System prompt: "Generate a compelling 2-3 paragraph character backstory for a {race_name} in the ThouArt universe. Their stats suggest: {stat_interpretation}. Use the following world lore for grounding: {lore_context}. {player_prompt}"
  - Non-streaming (returns complete backstory)
  - Uses tool calling for structured output: `{ backstory: string, suggested_name?: string }`
- [x] **Stat Interpretation** — Map stats to narrative hooks:
  - High Strength → warrior, laborer, gladiator background
  - High Magic → academy student, wild mage, cursed bloodline
  - High Charisma → diplomat, merchant, performer, cult leader
  - High Wisdom → hermit, scholar, elder's apprentice
  - High Agility → thief, scout, acrobat, hunter
- [x] **Regenerate with Tweaks** — Player can say "make it darker" or "add a lost sibling" and AI refines
- [x] **"Inspire Me" Mode** — Generate 3 short backstory hooks (one-liners) for player to choose from before full generation

##### UI Integration
- [x] **"Generate Backstory" Button** — In CharacterCreator Step 3, next to the backstory textarea
- [x] **Generation Modal** — Shows loading spinner, then displays generated backstory with "Use This" / "Regenerate" / "Edit" buttons
- [x] **Prompt Input** — Optional text field: "Any preferences? (e.g., 'exiled warrior', 'orphan mage')"
- [x] **Backstory Preview** — Styled preview card showing the generated backstory before confirming

---

#### AI Implementation Phases

**Phase AI-1: Foundation**
- [x] Create `ai-lore-assistant` edge function with almanac context injection
- [x] Build LoreAssistant chat panel component
- [x] Create `rp_lore_conversations` table
- [ ] Test with existing almanac data

**Phase AI-2: Character Backstory**
- [x] Create `ai-generate-backstory` edge function
- [x] Add "Generate Backstory" button to CharacterCreator
- [x] Build generation modal with regenerate/edit flow
- [ ] Test with all existing races

**Phase AI-3: Free-Text Interpreter**
- [x] Create `ai-interpret-action` edge function with stat check logic
- [x] Enhance `FreeTextInput` component with AI integration
- [x] Build outcome display with stat check visualization
- [x] Add creator toggle for free-text nodes in campaign editor
- [ ] Test in solo sessions

**Phase AI-4: AI Dungeon Master**
- [x] Create `rp_campaign_ai_config` table
- [x] Create `ai-dungeon-master` edge function with streaming
- [x] Build DM configuration panel in campaign editor
- [x] Build narration panel with typewriter effect in StoryPlayer
- [x] Implement lore context retrieval and injection
- [x] Create `rp_ai_narration_log` table for tracking
- [ ] Test with a sample campaign using AI transitions
- [x] Implement context window management (history summarization)

**Phase AI-5: Polish & Integration**
- [x] Rate limit handling with user-friendly error messages (429/402)
- [x] Response caching for repeated narrations
- [x] Spoiler guard for lore assistant during active campaigns
- [x] Inline lore tooltips during gameplay
- [ ] Usage analytics and cost monitoring
- [ ] A/B test AI narration quality across models

---

#### 14. Campaign Universe Mode — Original vs ThouArt Variation
Creators choose whether their campaign uses the official ThouArt universe rules or an entirely original custom world system.

##### Universe Mode Selection (Campaign Creation)
- [x] **Universe Toggle** — "ThouArt Variation" or "Original Universe" selected at campaign creation
- [x] **ThouArt Variation Mode:**
  - Uses existing `almanac_races`, `almanac_magic`, factions, relics, etc.
  - Stat system follows standard ThouArt rules
  - Lore references auto-link to the Witness Almanac
  - Community lore entries also available
- [x] **Original Universe Mode:**
  - Creator defines **everything** from scratch
  - Custom races, magic systems, beliefs, factions, physics, rules
  - No cross-references to ThouArt almanac
  - Fully self-contained universe

##### Custom World Builder (Original Mode)
- [x] **Custom Races** — Name, description, stat bonuses, lore, portrait
- [x] **Custom Magic Systems** — Define magic types, casting rules, costs, effects
- [x] **Custom Beliefs/Religions** — Deity pantheons, rituals, divine powers, alignment effects
- [x] **Custom Factions** — Organizations with goals, ranks, perks, conflicts
- [x] **Custom Items & Weapons** — Define unique weapons, armor, consumables, artifacts
- [x] **Custom Stat Systems** — Override default stats (rename, add, remove stat categories)
- [x] **World Rules Document** — Free-text world bible that players see before joining
- [x] **Custom Titles & Ranks** — Rank hierarchies unique to the universe

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_campaign_universe` | Universe settings per campaign | `campaign_id`, `mode` (thouart/original), `world_name`, `world_description`, `rules_document`, `custom_stats` (JSONB) |
| `rp_custom_races` | Creator-defined races | `campaign_id`, `name`, `description`, `stat_bonuses` (JSONB), `image_url`, `lore` |
| `rp_custom_magic` | Creator-defined magic systems | `campaign_id`, `name`, `magic_type`, `rules`, `casting_cost` (JSONB), `effects` (JSONB) |
| `rp_custom_beliefs` | Creator-defined religions/beliefs | `campaign_id`, `name`, `deity_name`, `description`, `rituals` (JSONB), `divine_powers` (JSONB) |
| `rp_custom_items` | Creator-defined items | `campaign_id`, `name`, `item_type`, `description`, `effects` (JSONB), `rarity`, `icon_url` |

---

#### 15. Interaction Points — Relationship-Driven Events & Hidden Combat
Interaction Points (IP) between players accumulate from all interactions and **dynamically unlock situations, events, and forced choices**.

##### Interaction Point Accumulation
- [x] **Auto-Calculated IP** — Every interaction between two characters adjusts their IP score:
  - Helped in combat → +15 IP
  - Shared item → +10 IP
  - Lied successfully → -5 IP (if discovered later: -20 IP)
  - Stole from → -25 IP
  - Saved their life → +30 IP
  - Betrayed → -50 IP
  - Whispered secret → +5 to +15 IP depending on value
- [x] **IP Thresholds** — Crossing thresholds triggers creator-defined events:
  - **-75 to -100: Blood Feud** → Forced confrontation event
  - **-50 to -74: Hostile** → "Kill or be killed" scenarios become available
  - **-25 to -49: Distrustful** → Perception bonus against them, limited cooperation
  - **-24 to +24: Neutral** → Standard interactions
  - **+25 to +49: Friendly** → Share hints, cooperative bonuses
  - **+50 to +74: Bonded** → Unlock duo abilities, shared quests
  - **+75 to +100: Sworn** → Sacrifice events, combined stat checks, unbreakable alliance mechanics

##### IP-Triggered Scenarios
- [x] **Forced Choice Events** — When IP is deeply negative, creator can trigger:
  - "Choose who lives" — pick between two characters to save
  - "Duel to the death" — mandatory PvP with no escape
  - "Betray your ally or lose everything" — faction loyalty vs personal bond
- [x] **Alliance Events** — When IP is highly positive:
  - "Combined strength" — merge stat checks for powerful joint actions
  - "Shield wall" — one player can absorb damage for the other
  - "Shared vision" — see each other's hints temporarily
- [x] **IP-Based Path Unlocks** — Certain story branches only available at specific IP thresholds

##### Hidden Combat & Fog of War
- [x] **Hidden Stats in Combat** — Players do NOT see each other's ability scores during encounters
- [x] **Blind Decisions** — Must judge opponents based on:
  - Visible equipment (armor, weapons)
  - Prior interactions (did they seem strong?)
  - Reputation/rumors from NPCs
  - Their own perception skill
- [x] **Bluff System** — Players can bluff their strength:
  - "Flex" action → Charisma check to appear stronger than you are
  - "Feign weakness" → Stealth check to appear weaker (lure into trap)
- [x] **Combat Reveal** — Stats only revealed after combat resolves (post-fight summary)
- [x] **Scouting** — Spend a turn to attempt perception check → partial stat reveal ("They seem agile but frail")

##### Free-Text Input → Dynamic Skill Calculation
- [x] **Open Input Actions** — Players can type custom actions instead of choosing from a list
- [x] **Action Parsing Engine** — System analyzes free-text input and calculates:
  - Which stat(s) are required (e.g., "I try to climb the wall" → Agility + Strength)
  - Difficulty rating based on context
  - Required items (e.g., "I pick the lock" → needs lockpick in inventory)
  - IP adjustment if targeting another player
- [x] **Interaction Input** — When interacting with another player via free text:
  - "I compliment their armor" → Charisma check, +3 IP if passed
  - "I secretly pocket their coin purse" → Agility + Stealth check, -25 IP if caught
  - "I offer to share my food" → No check, +5 IP
- [x] **Creator Overrides** — Campaign creator can pre-define custom input responses for specific scenarios
- [x] **Fallback Resolution** — If input doesn't match any pattern, default to nearest stat check + narrator description

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_interaction_points` | IP score between character pairs | `session_id`, `character_a_id`, `character_b_id`, `score`, `last_interaction`, `updated_at` |
| `rp_ip_events` | Events triggered by IP thresholds | `campaign_id`, `threshold_min`, `threshold_max`, `event_type`, `event_payload` (JSONB), `is_mandatory` |
| `rp_ip_history` | Full log of IP changes | `session_id`, `character_a_id`, `character_b_id`, `change`, `reason`, `source_action_id`, `created_at` |
| `rp_free_text_actions` | Player free-text input log | `session_id`, `character_id`, `input_text`, `parsed_stats` (JSONB), `difficulty`, `result`, `ip_change`, `created_at` |
| `rp_combat_encounters` | PvP/PvE combat instances | `session_id`, `participants` (JSONB), `combat_type`, `stats_hidden`, `outcome` (JSONB), `started_at`, `resolved_at` |

**Free-Text → Skill Mapping Examples:**
| Player Input | Parsed Stats | Difficulty | Item Required? |
|-------------|-------------|-----------|----------------|
| "I climb the wall quietly" | Agility + Stealth | Medium | No |
| "I stab him while he sleeps" | Stealth + Combat | Hard | Bladed weapon |
| "I convince the guard to let us pass" | Charisma + Wisdom | Medium | No |
| "I forge a document to enter the city" | Wisdom + Agility | Hard | Paper + Ink |
| "I challenge him to an arm wrestle" | Strength | Easy | No |
| "I pray to the old gods for guidance" | Wisdom + Magic | Varies | Belief alignment |

---

### Implementation Phases (Advanced Systems — continued)

**Phase 10: Universe Mode & World Builder**
- [x] Universe toggle in campaign creation (ThouArt vs Original)
- [x] Custom race, magic, belief, faction, and item builders
- [x] World rules document editor
- [x] Custom stat system override

**Phase 11: Interaction Points & Hidden Combat**
- [x] IP accumulation engine from all player interactions
- [x] IP threshold event triggers (forced choices, alliances, duels)
- [x] Hidden stats during combat encounters
- [x] Bluff and scouting mechanics
- [x] Free-text input parser with dynamic skill calculation
- [x] IP-based path unlocks in story progression

---

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Multiplayer complexity | Defer to Phase 3; build solo-first |
| Scope creep on node editor | Start with linear + simple branching only |
| Lore inconsistency | Automate validation + require Loremaster approval |
| Performance with large campaigns | Paginate node loading; lazy-load branches |

---

### Success Metrics

- **Characters created** per week
- **Campaigns published** by users
- **Session completion rate** (started → finished)
- **Lore proposals** submitted vs approved
- **Average session duration**

---

### Gamification & Progression

#### Experience & Leveling
- [x] **XP System** — Earn XP for completing nodes, finishing campaigns, making choices
- [x] **Character Levels** — Level up at XP thresholds (100, 300, 600, 1000...)
- [x] **Level Benefits** — Unlock stat points, new ability slots, cosmetic titles
- [x] **XP Bonuses** — Bonus XP for first completions, difficult paths, group play

**XP Awards:**
| Action | XP |
|--------|-----|
| Complete narrative node | 5 |
| Make a choice | 10 |
| Pass stat check | 20 |
| Fail stat check (learning!) | 5 |
| Complete campaign | 100 |
| First-time campaign bonus | +50 |

#### Inventory System
- [x] **Item Pickups** — Nodes can grant items (relics, weapons, potions)
- [x] **Inventory Slots** — Limited inventory (expand with levels)
- [x] **Item Effects** — Consumables, stat boosters, quest items
- [x] **Item Trading** — Trade items between characters
- [x] **Item Requirements** — Nodes can require specific items to proceed

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_items` | Item definitions | `name`, `description`, `type`, `effect` (JSONB), `rarity`, `icon_url` |
| `rp_character_inventory` | Items held by characters | `character_id`, `item_id`, `quantity`, `acquired_at`, `source_node_id` |

#### Character Death & Failure
- [x] **Death Nodes** — Special ending nodes for character death
- [x] **Permadeath Mode** — Optional hardcore mode (character deleted on death)
- [x] **Respawn System** — Default: restart from last checkpoint node
- [x] **Injury System** — Temporary stat penalties instead of death
- [x] **Legacy System** — Dead characters leave items/bonuses for next character
- [x] **Character Graveyard** — Display "fallen" characters with death context

**Failure Handling:**
- Soft fail: Retry the node with different choice
- Hard fail: Sent to "failure branch" with recovery path
- Death: Campaign ends, character marked as "fallen" (visible in graveyard)

#### Achievements (Roleplay-Specific)
- [x] **First Steps** — Create your first character
- [x] **Storyteller** — Complete 5 campaigns
- [x] **Lorekeeper** — Have a lore proposal approved
- [x] **Survivor** — Complete a campaign without failing any stat check
- [x] **Explorer** — Visit 50 unique story nodes
- [x] **Charismatic** — Pass 10 Charisma checks
- [x] **Completionist** — See all endings of a campaign
- [x] **Worldbuilder** — Have 5 lore proposals approved

---

### Rich Media Support

#### Node Illustrations
- [x] **Header Images** — Optional banner image per story node
- [ ] **Inline Images** — Embed images within narrative text
- [x] **Image Library** — Campaign creators upload to dedicated bucket
- [ ] **Stock Art Integration** — Curated fantasy art for common scenes
- [x] **Node Preview Thumbnails** — Thumbnails in campaign editor

**Storage:**
- Bucket: `rp-campaign-assets` (public, with RLS per campaign author)
- Max file size: 2MB per image
- Supported formats: JPG, PNG, WebP

#### Audio & Ambiance
- [ ] **Background Music** — Loop ambient tracks per node/chapter
- [ ] **Sound Effects** — Trigger sounds on choice selection
- [ ] **Audio Library** — Pre-approved royalty-free tracks
- [ ] **Custom Audio Upload** — Authors upload their own (with moderation)
- [ ] **Volume Controls** — User-adjustable music/SFX volume

**Audio Categories:**
- Ambient (forest, tavern, dungeon, storm)
- Dramatic (battle, discovery, tension)
- Emotional (sad, triumphant, mysterious)

#### NPC Portraits
- [ ] **Portrait Slots** — Nodes can display speaking NPC portraits
- [ ] **Expression Variants** — Happy, angry, sad, neutral per NPC
- [ ] **Portrait Position** — Left, right, or center of narrative text
- [ ] **Animated Portraits** — Subtle idle animations (future)
- [ ] **NPC Voice Lines** — Optional text-to-speech or audio clips

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_campaign_npcs` | NPCs in a campaign | `campaign_id`, `name`, `description`, `portrait_url`, `expressions` (JSONB) |
| `rp_node_media` | Media attached to nodes | `node_id`, `type` (image/audio), `url`, `position`, `loop` |

#### Location Illustrations
- [ ] **Location Backdrops** — Full-width scene art behind narrative
- [ ] **Parallax Scrolling** — Subtle depth effect on scene layers
- [ ] **Day/Night Variants** — Different art based on story time
- [ ] **Weather Overlays** — Rain, snow, fog effects on scenes

---

### Creator Tools

#### Campaign Versioning
- [ ] **Version History** — Track changes to published campaigns
- [ ] **Rollback** — Revert to previous version
- [ ] **Draft Mode** — Edit without affecting live players
- [ ] **Changelog** — Authors document changes per version

**Version Flow:**
```
Draft v1 → Publish → Draft v2 (edit) → Publish v2
                ↓
        Active players on v1 finish
        New players get v2
```

#### Co-Authoring
- [ ] **Collaborator Invites** — Invite other users to edit campaign
- [ ] **Role Permissions** — Owner, Editor, Viewer roles
- [ ] **Edit Locking** — Prevent conflicts when editing same node
- [ ] **Activity Log** — See who edited what and when

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_campaign_collaborators` | Co-authors | `campaign_id`, `user_id`, `role`, `invited_at`, `accepted_at` |
| `rp_campaign_versions` | Version history | `campaign_id`, `version`, `snapshot` (JSONB), `published_at`, `changelog` |

#### Starter Templates
- [ ] **Template Library** — Pre-built campaign structures
- [ ] **Genre Templates** — Mystery, Adventure, Horror, Romance
- [ ] **Tutorial Template** — Step-by-step guide for new creators
- [ ] **Fork Existing** — Clone a published campaign as starting point

**Template Examples:**
- "Three-Act Adventure" — Classic hero's journey structure
- "Murder Mystery" — Clue-gathering with multiple suspects
- "Survival Horror" — Resource management + escape
- "Political Intrigue" — Faction reputation + dialogue trees

#### Import/Export
- [ ] **JSON Export** — Download campaign as JSON file
- [ ] **JSON Import** — Upload JSON to create campaign
- [ ] **Markdown Support** — Write nodes in Markdown format
- [ ] **Bulk Node Import** — CSV import for rapid prototyping

**Export Format:**
```json
{
  "campaign": { "title": "...", "genre": "..." },
  "nodes": [
    { "id": "start", "type": "narrative", "content": "..." },
    { "id": "choice1", "type": "choice", "choices": [...] }
  ],
  "connections": [
    { "from": "start", "to": "choice1" }
  ]
}
```

---

### Community Lore Almanac

> **Important:** The official Witness Almanac is author-curated only. Community-approved lore lives in a separate "Community Lore Almanac."

#### Community Lore Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `community_lore_races` | Approved community races | `proposal_id`, `name`, `description`, `homeland`, `image_url`, `created_by` |
| `community_lore_locations` | Approved community locations | `proposal_id`, `name`, `description`, `location_type`, `image_url`, `created_by` |
| `community_lore_items` | Approved community items | `proposal_id`, `name`, `description`, `item_type`, `rarity`, `effect`, `created_by` |
| `community_lore_factions` | Approved community factions | `proposal_id`, `name`, `description`, `faction_type`, `image_url`, `created_by` |
| `community_lore_abilities` | Approved community abilities | `proposal_id`, `name`, `description`, `rarity`, `effect`, `created_by` |
| `community_lore_concepts` | Approved community concepts | `proposal_id`, `name`, `description`, `concept_type`, `created_by` |

#### Features
- [ ] **Community Lore Page** — Browse all approved community lore entries
- [ ] **Category Tabs** — Filter by races, locations, items, factions, abilities, concepts
- [ ] **Contributor Attribution** — Show "Created by @username" on each entry
- [ ] **Search & Filter** — Search community lore by name, creator, or keywords
- [ ] **Link to Original Proposal** — View the original proposal with Loremaster notes
- [ ] **Use in Campaigns** — Campaign creators can reference community lore in nodes
- [ ] **Community Lore Stats** — Total entries, top contributors, recent additions
- [ ] **Featured Community Lore** — Loremaster-highlighted exceptional entries

---

### Lore Integration

#### World Map Connection
- [ ] **Location Pins** — Nodes reference `almanac_locations`
- [ ] **Journey Tracker** — Show character's path on world map
- [ ] **Discoverable Locations** — Unlock map locations through story
- [ ] **Region-Locked Campaigns** — Campaigns set in specific regions

**Map Integration UI:**
- Mini-map in story player showing current location
- Full map view in character sheet with visited locations
- Campaign browser filters by map region

#### NPC Relationship Tracking
- [ ] **Relationship Score** — -100 (enemy) to +100 (ally) per NPC
- [ ] **Relationship Effects** — Score affects dialogue options, stat checks
- [ ] **Relationship History** — Log of actions that changed relationship
- [ ] **NPC Memory** — NPCs reference past interactions

**Database Addition:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `rp_character_relationships` | NPC relationships | `character_id`, `npc_id`, `score`, `history` (JSONB) |

**Relationship Thresholds:**
| Score | Status | Effect |
|-------|--------|--------|
| -100 to -50 | Hostile | May attack, refuse help |
| -49 to -10 | Unfriendly | Higher stat checks |
| -9 to +9 | Neutral | Standard interactions |
| +10 to +49 | Friendly | Lower stat checks |
| +50 to +100 | Allied | Special dialogue, gifts |

#### Faction Reputation
- [ ] **Faction Standings** — Track reputation with `almanac_factions`
- [ ] **Faction Perks** — High reputation unlocks abilities, items
- [ ] **Faction Conflicts** — Raising one may lower another
- [ ] **Faction Quests** — Campaigns aligned to specific factions

**Reputation Events:**
- Completing faction-aligned campaign: +20
- Choices favoring faction: +5 to +15
- Betraying faction: -30 to -50
- Helping rival faction: -10

#### Almanac Cross-References
- [ ] **Lore Popups** — Hover almanac terms for quick definitions
- [ ] **Entry Links** — Click to open full almanac entry
- [ ] **Auto-Detection** — Highlight known almanac terms in narrative
- [ ] **Spoiler Protection** — Hide almanac links until term is encountered in story

**Implementation:**
- Reuse `AlmanacReferenceParser` component
- Cache almanac entries in `useAlmanacEntries` hook (already exists)
- Mark terms with `[[term]]` syntax in node content

### Mobile & Accessibility

#### Mobile-First Roleplay
- [ ] **Touch-Optimized Story Player** — Large tap targets, swipe between choices
- [ ] **Portrait Mode Layout** — Vertical story flow for mobile reading
- [ ] **Offline Story Caching** — Download campaigns for offline play
- [ ] **Push Notifications** — Alert when it's your turn in group sessions
- [ ] **Vibration Feedback** — Haptic response on critical choices/events

#### Accessibility Features
- [ ] **Screen Reader Support** — ARIA labels on all interactive elements
- [ ] **Keyboard Navigation** — Full campaign playthrough via keyboard
- [ ] **High Contrast Mode** — Alternative color scheme for visibility
- [ ] **Font Size Controls** — Adjustable text size in story player
- [ ] **Dyslexia-Friendly Font** — OpenDyslexic font option
- [ ] **Reduced Motion** — Disable animations for vestibular disorders

### Social & Discovery

#### Campaign Discovery
- [ ] **Trending Campaigns** — Weekly popular campaigns based on plays/ratings
- [ ] **Staff Picks** — Loremaster-curated featured campaigns
- [ ] **Genre Playlists** — Curated lists: "Best Horror", "Epic Adventures"
- [ ] **Author Spotlights** — Featured campaign creators with bios
- [ ] **Similar Campaigns** — "Players also enjoyed" recommendations

#### Social Features
- [ ] **Campaign Reviews** — Rate and review completed campaigns
- [ ] **Play History** — Public profile showing campaigns completed
- [ ] **Character Showcase** — Share character sheets publicly
- [ ] **Session Replays** — Read-only playback of notable sessions
- [ ] **Leaderboards** — Top characters by XP, achievements, etc.

#### Streaming & Content Creation
- [ ] **Streamer Mode** — Hide spoilers, clean UI for broadcasts
- [ ] **Spectator Mode** — Watch group sessions live (read-only)
- [ ] **Clip Sharing** — Share specific story moments as images
- [ ] **Campaign Trailers** — Auto-generate preview from first nodes

---

## 🚀 Suggested Feature Additions

### High Priority
- [x] **User Dashboard** - Personal dashboard showing reading progress, achievements, and activity summary
- [ ] **Book Reading Tracker** - Track pages read per session with time-based analytics
- [x] **Push Notifications** - Real-time browser push notifications via Service Worker (PWA)
- [x] **Advanced Search** - Full-text search across books, almanac entries, and community content
- [x] **Offline Mode** - PWA support with service worker caching for offline access

### Community Features
- [x] **@Mentions in Replies** - Tag users in forum and submission replies
- [x] **Reply Editing/Deleting** - Edit and delete your own replies
- [x] **Direct Messaging** - Private messaging between users
- [x] **Discussion Replies** - Fixed book club discussion replies functionality
- [ ] **User Badges Display** - Show earned badges on user profiles and submissions
- [ ] **Community Challenges** - Weekly/monthly reading or art challenges
- [ ] **Submission Collections** - Allow users to create curated collections of submissions
- [x] **Polls in Discussions** - Add polling feature to forum discussions
- [ ] **User Reputation Levels** - Visual rank progression based on activity
- [ ] **Trending Submissions** - Weekly/daily trending section based on engagement
- [ ] **Art Contests** - Time-limited community art competitions with voting
- [ ] **Submission Reactions** - Multiple reaction types beyond likes (love, wow, insightful)

### Almanac & Lore
- [x] **Interactive World Map** - Clickable map showing kingdoms, locations, and character origins
- [ ] **Timeline Filtering** - Filter chronology by era, character, or event type
- [x] **Character Comparison** - Side-by-side character stat comparison
- [ ] **Lore Quiz Mode** - Interactive quizzes about the ThouArt universe
- [ ] **Audio Narration** - Text-to-speech for almanac articles
- [ ] **Character Gallery View** - Grid view of all characters with quick filters
- [ ] **Faction/Affiliation Pages** - Dedicated pages for each faction showing members
- [ ] **Event Impact Visualization** - Show how events affected characters/locations

### Reading Experience
- [ ] **Reading Themes** - Sepia, dark, and custom color themes for e-reader
- [x] **Highlight & Notes** - Save highlights and notes while reading
- [ ] **Reading Goals** - Set and track daily/weekly reading goals
- [x] **Book Clubs** - Create and join book discussion groups
- [ ] **Annotation Sharing** - Share highlighted passages with the community
- [ ] **Read-Along Mode** - Synchronized reading sessions for book clubs
- [ ] **Chapter Progress Indicator** - Visual chapter-by-chapter progress bar
- [ ] **Reading Time Estimates** - Show estimated reading time per chapter

### E-Commerce & Books
- [ ] **Book Bundle Discounts** - Discount when purchasing multiple books together
- [ ] **Gift Cards** - Purchase and redeem gift cards for the store
- [ ] **Pre-Order System** - Allow pre-orders for upcoming books
- [ ] **Book Sample Downloads** - Free sample chapter downloads
- [ ] **Purchase Receipts via Email** - Email confirmation for orders
- [ ] **Order Tracking** - Track order status and shipping
- [ ] **Related Books Suggestions** - "Readers also bought" recommendations

### Admin Features
- [ ] **Bulk Content Import** - CSV/JSON import for almanac entries
- [x] **Analytics Dashboard** - Detailed user engagement and content metrics
- [x] **Content Scheduling** - Schedule almanac entries and announcements
- [ ] **A/B Testing** - Test different layouts and features
- [x] **Moderation Queue** - Enhanced moderation tools for submissions
- [ ] **User Management** - Admin tools for managing user accounts and roles
- [ ] **Sales Reports** - Detailed sales analytics with export options
- [ ] **Email Templates** - Customizable email templates for notifications

### Technical Improvements
- [x] **Image Optimization** - Lazy loading with intersection observer and WebP fallback support
- [x] **Caching Strategy** - Service worker caching via PWA for faster loads
- [ ] **SEO Enhancements** - Dynamic meta tags and structured data
- [ ] **Performance Monitoring** - Add analytics for Core Web Vitals
- [ ] **Accessibility Audit** - Full WCAG 2.1 compliance review
- [ ] **Rate Limiting** - Prevent spam and abuse on forms
- [ ] **Error Boundary Components** - Graceful error handling throughout app
- [x] **Skeleton Loaders Everywhere** - Consistent staggered loading states on all pages
 - [x] **Grid/List Toggle** - View mode toggle for Books page with optimized images
 
 ### Lore Chronicles Game System
 - [x] **Character Creation Wizard** - Multi-step wizard with race selection, stat allocation, and backstory
 - [x] **Character Sheet View** - D&D-style character sheet with stats, XP, and adventure history
 - [x] **Campaign Creator** - Create campaigns with title, description, genre, and difficulty
 - [x] **Campaign Node Editor** - Visual editor for creating/editing story nodes with choices
 - [x] **Story Player** - Play campaigns with choice-based navigation and stat checks
 - [x] **Session Management** - Start, save, and resume campaign sessions
 - [x] **Campaign Browser** - Browse and filter published campaigns by genre/difficulty

---

## 🐛 Known Bugs & Fixes Needed

### Critical
- [ ] Fix intermittent bun install timeout during builds
- [ ] Ensure RLS policies are correctly applied to all tables
- [ ] Book versions showing "Unavailable" on homepage despite data existing

### UI/UX
- [ ] Dropdown menus occasionally transparent on certain pages
- [x] Mobile navigation menu doesn't close on route change
- [ ] Image aspect ratios inconsistent in submission cards
- [x] Dark mode color contrast issues on some badges
- [ ] Community page hero section has rendering issues (faded cards visible)
- [ ] Some submission card titles show placeholder text ("d", "eeeee", "cectctc")
- [ ] Book details page shows empty ISBN field
- [ ] Price display shows $22.00 but format options all say "Unavailable"
- [x] Missing "Forum" link in main navigation (only Books & Community visible)

### Functionality
- [ ] Forum reply notifications not always triggering
- [ ] Bookmark labels not persisting after page refresh
- [ ] Reading progress sometimes resets when switching devices
- [ ] Search results pagination resets filter state
- [ ] Community stats show "0 Members" even when users exist
- [ ] Missing review count sync with actual reviews

### Performance
- [ ] Large almanac pages slow to render with many images
- [x] Relationship map performance degrades with 50+ characters (fixed SVG rendering)
- [ ] Community page initial load could be faster
- [ ] Chronology page world map image is quite large

---

## ✅ Recently Completed

- [x] Breadcrumb navigation component for detail pages
- [x] Navigation progress bar during route transitions
- [x] Empty state component with illustrations
- [x] IconButton component with tooltip support
- [x] Gallery image manager for all almanac categories
- [x] Push notifications with Service Worker support
- [x] PWA configuration with offline caching
- [x] @Mentions in forum replies with user search
- [x] Reply editing and deleting functionality
- [x] Enhanced profile dropdown component
- [x] Fixed fan art submission links (404 error)
- [x] Fixed user preferences settings persistence
- [x] Modern UI overhaul with rounded corners and softer design
- [x] Page transition animations with framer-motion
- [x] Staggered list and grid animations
- [x] Dynamic force-directed relationship map (Obsidian-style)
- [x] Particle effects on relationship map
- [x] Card hover effects with scale and glow
- [x] Staggered skeleton loading states
- [x] Featured creations section fix
- [x] Almanac image rounded corners fix
- [x] Character stats database table for comparison feature
- [x] World locations database table for interactive map

---

## 🎯 QA Testing Notes (Jan 2026)

### Homepage
- ✓ Book display loads correctly with cover image
- ✓ "Explore the Realms" button works
- ⚠ Book format selector shows all formats as "Unavailable"
- ⚠ Review count appears randomized (not from DB)

### Books Page
- ✓ Filter sidebar works correctly
- ✓ Price range slider functional
- ✓ Category checkboxes work
- ✓ Sort dropdown works
- ✓ Grid/List view toggle added

### Community Page
- ✓ Gallery/Discussions/Book Clubs tabs work
- ✓ Submit Creation button visible
- ✓ Search and filter options present
- ⚠ Stats show 0 for Discussions, Reviews, Members
- ⚠ Some submission cards have placeholder content

### Chronology Page
- ✓ Beautiful world map header
- ✓ Timeline with eras displays correctly
- ✓ Almanac sidebar with category links
- ✓ Events show dates in BGD format
- ⚠ Could benefit from era filtering
- ⚠ Character links in events would be nice

### Suggested UX Improvements
- [x] Add breadcrumb navigation on detail pages
- [x] Add "Back to top" button on long pages
- [x] Add loading indicators on navigation
- [x] Add empty state illustrations (not just text)
- [x] Add keyboard shortcuts for power users
- [x] Add confirmation modals before destructive actions
- [x] Add tooltips on icon-only buttons

### New UI/UX Improvements (Feb 2026)

#### Homepage & Navigation
- [ ] **Animated Hero Section** — Add subtle parallax or fade-in on book cover
- [ ] **Quick Category Pills** — Horizontal scroll of genre filters on homepage
- [ ] **Recently Viewed** — Show last 3-5 books user viewed
- [ ] **Announcement Banner** — Dismissible banner for sales/new releases
- [ ] **Forum Link in Header** — Add Forum to main navigation (currently missing)

#### Visual Polish
- [ ] **Consistent Card Shadows** — Standardize shadow depths across all cards
- [ ] **Micro-Interactions** — Add subtle hover states on all interactive elements
- [ ] **Loading Shimmer** — Replace spinner with shimmer skeleton on page loads
- [ ] **Image Placeholder Blur** — BlurHash or LQIP for image loading
- [ ] **Scroll-Triggered Animations** — Fade-in sections as user scrolls

#### Mobile Experience
- [ ] **Bottom Navigation Bar** — Fixed bottom nav for key actions on mobile
- [ ] **Swipe Gestures** — Swipe between book gallery items on mobile
- [ ] **Pull-to-Refresh** — Native-feeling refresh on list pages
- [ ] **Floating Action Button** — Quick "Add to Cart" or "Create" button
- [ ] **Mobile-Optimized Modals** — Full-screen sheets instead of centered modals

#### Accessibility
- [ ] **Skip to Content Link** — Keyboard nav for screen readers
- [ ] **Focus Visible States** — Clear focus outlines on all interactive elements
- [ ] **Color Contrast Audit** — Ensure WCAG AA on all text
- [ ] **Alt Text Review** — Audit all images for descriptive alt text
- [ ] **Reduced Motion Support** — Respect `prefers-reduced-motion`

#### Performance Perception
- [ ] **Optimistic UI Updates** — Instant feedback on add to cart/wishlist
- [ ] **Prefetch on Hover** — Preload likely next pages
- [ ] **Infinite Scroll Option** — Alternative to pagination on galleries
- [ ] **Image Lazy Loading** — Intersection observer for below-fold images

#### Delight Features
- [ ] **Confetti on Purchase** — Celebrate successful checkout
- [ ] **Reading Milestone Toasts** — "You've read 100 pages today!"
- [ ] **Easter Eggs** — Hidden interactions for loyal users
- [ ] **Seasonal Themes** — Holiday-themed color schemes

---

### 🎮 Lore Chronicles — UX & User Engagement Improvements

#### Phase A: Navigation & Onboarding (Quick Wins)

- [ ] **Grouped Tab Navigation** — Consolidate 9 flat tabs into 3 grouped sections:
  - **Play** → Campaigns, Characters, Sessions
  - **Community** → Showcase, Leaderboard, Factions, Graveyard
  - **Govern** → Lore, Loremaster
  - Use a segmented control for groups, sub-tabs within each
- [ ] **Quick-Resume Banner** — Sticky banner at top of Lore Chronicles showing active sessions
  - Character portrait, campaign name, last-played timestamp
  - "Continue Adventure →" CTA button
  - Auto-hides if no active sessions
- [ ] **First-Time Onboarding Tour** — Guided tooltip walkthrough for new players
  - Highlights: Create Character → Browse Campaigns → Join Session → Expand Lore
  - Dismissible, remembers completion via `user_preferences`

#### Phase B: Retention & Engagement Loops

- [ ] **Daily Quest Board** — Rotating daily challenges with XP rewards
  - Examples: "Complete 1 story node", "Rate a campaign", "Submit a lore proposal", "Visit the Graveyard"
  - Database: `rp_daily_quests` (quest definitions), `rp_daily_quest_completions` (user progress)
  - Visible as a card on the Lore Chronicles dashboard
  - Streak multiplier: consecutive daily completions increase XP bonus
- [ ] **"Previously..." Story Recap** — Cinematic recap when resuming a campaign
  - Shows last 3-5 key choices made, narrative summary
  - Animated scroll-style reveal with atmospheric background
  - "Skip Recap" option for returning players
- [ ] **Character Legacy Timeline** — Visual timeline of a character's journey
  - Key events, stat changes, factions joined, campaigns completed
  - Shareable public view on character profiles
- [ ] **"What's New" Activity Feed** — Persistent feed on Lore Chronicles landing
  - New campaigns published, lore proposals approved, leaderboard changes
  - Personalized: friends' activity, campaigns you follow

#### Phase C: Social & Sharing

- [ ] **Campaign Completion Certificate** — Beautiful journey summary at campaign end
  - Character portrait, final stats, key choices made, campaign title
  - Shareable as social image (OG-compatible)
  - "Share Your Journey" button generates downloadable card
- [ ] **Social Choice Stats** — Show what % of players picked each choice
  - Displayed after making a choice: "42% of players chose this path"
  - Optional toggle (can be hidden for spoiler-free play)
  - Database: aggregate choice counts per node
- [ ] **Spectator Mode** — Watch friends play campaigns in real-time
  - Read-only view of active session with live narration
  - "Cheer" reactions (emoji pops) visible to the player
- [ ] **Campaign Recommendations** — "Players who enjoyed X also played Y"
  - Based on completion data and ratings
  - Shown on campaign detail pages and after completion

#### Phase D: Creator & Campaign Tools

- [ ] **Campaign Analytics Dashboard** — Stats for campaign authors
  - Play count, completion rate, average rating, drop-off nodes
  - Heatmap of most/least chosen paths
  - Database: `rp_campaign_analytics` (play_count, completion_count, avg_rating, drop_off_data JSONB)
- [ ] **Campaign Templates** — Pre-built campaign structures for new creators
  - "Linear Adventure", "Branching Mystery", "Faction War", "Dungeon Crawl"
  - Template includes starter nodes, suggested key points, sample triggers
- [ ] **Node Preview Mode** — Play-test individual nodes without starting full session
  - Quick iteration for campaign creators
  - Test stat checks and trigger conditions

#### Phase E: Atmosphere & Polish

- [ ] **Ambient Audio Layers** — Background audio in `StoryPlayer.tsx`
  - Environment sounds: forest, tavern, dungeon, battlefield
  - Music mood shifts based on node type (tense, peaceful, combat)
  - Volume control + mute toggle, remembers preference
- [ ] **Animated Choice Consequences** — Visual feedback after making choices
  - Stat change badges: "+1 Charisma", "-2 Health" with animated pop-in
  - Item acquisition: glowing item card appears briefly
  - Relationship change: NPC portrait with heart/broken-heart icon
- [ ] **Cinematic Node Transitions** — Smooth transitions between story nodes
  - Page-turn effect for narrative nodes
  - Dramatic fade-to-black for major choices
  - Quick slide for minor transitions
- [ ] **Character Emotion States** — Character portrait reflects story mood
  - Happy, worried, angry, injured states
  - Changes based on recent story events and stat thresholds

---

## 📋 Development Notes

### Design System
- Use HSL colors from CSS variables
- Maintain consistent 2xl border radius on cards
- Follow semantic token naming (primary, secondary, muted, accent)
- Keep animations subtle (0.2-0.4s duration, easeOut)

### Code Patterns
- Create focused components (< 200 lines ideal)
- Use custom hooks for data fetching
- Prefer parallel tool calls for efficiency
- Add staggered animations to lists/grids

### Testing Checklist
- [ ] Test on mobile viewport
- [ ] Verify dark mode appearance
- [ ] Check loading states
- [ ] Validate form submissions
- [ ] Test authenticated vs guest views
- [ ] Test with empty data states
- [ ] Test with slow network (3G throttle)
