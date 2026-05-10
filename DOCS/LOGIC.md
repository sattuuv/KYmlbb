# MLBB Counter Pro - Counter Logic Engine

## Core Philosophy
Counters in MLBB are determined by a multi-dimensional analysis of hero attributes, role relationships, damage types, and crowd control interactions. The Brain evaluates enemies as a team composition, not individually.

## Data Dimensions

### 1. Hero Attributes
Each hero has:
- **role**: (role hierarchy defined below)
- **damageType**: physical | magic | mixed
- **playStyle**: burst | sustain | poke
- **mobility**: low | medium | high
- **crowdControl**: soft | hard | none
- **range**: melee | ranged
- **survivability**: low | medium | high (based on HP, shields, lifesteal, escape)
- **powerSpike**: early | mid | late (power curve)
- **tags**: additional classifiers like [true_damage, heal, shield, stealth, summon]

### 2. Role Hierarchy (Who Counters Whom)
```
Tank -> Assassin, Fighter (physical mitigation)
Fighter -> Assassin, Marksman (durable + dive)
Assassin -> Mage, Marksman, Support (squishy burst)
Mage -> Tank, Fighter, Support (AoE magic, CC)
Marksman -> Tank, Slow (sustained DPS)
Support -> Assassin (peel, CC)
```

### 3. Damage Type Counter Matrix
| Attacker Damage | Target Defense | Effectiveness |
|----------------|---------------|---------------|
| Physical       | High Armor    | -30%          |
| Magic          | High MR       | -30%          |
| Physical       | Low Armor     | +40%          |
| Magic          | Low MR        | +40%          |
| True Damage    | Any           | +20% (ignores mitigation) |

### 4. Strategic Counters
- **Burst > Squishy**: Heroes with high burst damage (Eudora, Kadita) counter low-HP backliners
- **Sustain > Burst**: Lifesteal/regeneration heroes (Ruby, Alucard) counter burst with sustain
- **CC > Mobile**: Lock-down CC counters highly mobile heroes
- **Mobile > Skillshot**: High mobility (Lancelot, Hayabusa) dodges skillshot abilities
- **Range > Melee**: Longer range poke (Lunox, Kimmy) controls melee engagement
- **Dive > Backline**: Divers (Chou, Kaja) counter immobile backliners
- **Anti-heal > Heal**: Heroes with anti-heal + items counter healer compositions

### 5. Team Composition Analysis
The API evaluates:
- **Team Damage Profile**: What % physical vs magic damage does the enemy team output?
  - Recommend heroes + items stacking the appropriate defense
- **Team CC Score**: How much crowd control does the enemy team have?
  - Recommend Tough Boots, Purify, or CC-immune heroes
- **Team Role Gaps**: Is the enemy missing a tank? Low backline protection?
  - Recommend dive/burst assassins
- **Power Spike Window**: Is the enemy team early or late game?
  - If early-game enemy: recommend defensive items to survive
  - If late-game enemy: recommend early aggression + snowball items

## Counter Scoring Algorithm

```
FINAL_SCORE = 
  0.30 * ROLE_ADVANTAGE      (role counter matrix)
  0.20 * DAMAGE_TYPE_EDGE    (resist vs exploit enemy damage)
  0.15 * PLAY_STYLE_MATCHUP  (burst vs sustain vs poke)
  0.15 * CC_MOBILITY_FACTOR  (CC against mobile / mobile against skillshot)
  0.10 * RANGE_ENGAGEMENT    (range advantage)
  0.10 * TEAM_SYNERGY        (how well hero fills team gaps)
```

### Item Recommendations
Items are scored based on:
- Defensive value against enemy damage profile
- Countering specific enemy threats (anti-heal, anti-CC)
- Synergy with the recommended hero's kit

## Example
**Enemy**: Chou (Fighter/CC), Moskov (Marksman/Burst)  
**Recommended Heroes**:
1. Ruby (Fighter/Sustain) - resists burst with lifesteal + CC counters Chou
2. Belerick (Tank/CC) - hard counters physical with vengeance
3. Khufra (Tank/CC) - suppresses Moskov's mobility  
**Recommended Items**:
1. Antique Cuirass - reduces Chou's physical damage
2. Twilight Armor - negates Moskov burst
3. Tough Boots - reduces CC duration from both