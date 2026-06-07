#!/usr/bin/env python3
"""
MLBB Counter Pro - Fandom Wiki Scraper
---------------------------------------
Scrapes hero names, images, attributes, and item stats from the MLBB Fandom Wiki.

Robust design:
  - Retry with exponential backoff
  - Multiple CSS selector fallbacks for resilience
  - JSON output for MongoDB import
  - Designed to run as Vercel Cron Job (serverless-compatible)
  
Usage:
  python mlbb_scraper.py --output ./data
  python mlbb_scraper.py --heroes-only (just heroes)
  python mlbb_scraper.py --items-only  (just items)
"""

import sys
import json
import time
import hashlib
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from urllib.parse import urljoin

from curl_cffi import requests
from bs4 import BeautifulSoup, Tag

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mlbb-scraper")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BASE_URL = "https://mobile-legends.fandom.com"
HERO_LIST_URL = urljoin(BASE_URL, "/wiki/List_of_heroes")
ITEMS_URL = urljoin(BASE_URL, "/wiki/Items")
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 5
RETRY_BACKOFF = 3  # exponential base (seconds)

# ---------------------------------------------------------------------------
# HTTP utilities
# ---------------------------------------------------------------------------
_session = requests.Session(impersonate="chrome124")


def fetch_html(url: str) -> str:
    """Fetch HTML with retry logic and exponential backoff."""
    last_exc = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = _session.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as exc:
            last_exc = exc
            logger.warning(
                "Attempt %d/%d failed fetching %s: %s",
                attempt, MAX_RETRIES, url, exc,
            )
            if attempt < MAX_RETRIES:
                sleep_sec = RETRY_BACKOFF ** attempt
                logger.info("Retrying in %ds...", sleep_sec)
                time.sleep(sleep_sec)
    raise RuntimeError(f"Failed to fetch {url} after {MAX_RETRIES} attempts") from last_exc


def safe_get_text(el: Optional[Tag], strip: bool = True) -> str:
    """Safely extract text from a BeautifulSoup element."""
    if el is None:
        return ""
    text = el.get_text(strip=strip)
    return text.replace("\xa0", " ").replace("\n", " ").strip()


def safe_find(el: Tag, selector: str, **kwargs) -> Optional[Tag]:
    """Safely find a child element."""
    try:
        return el.find(selector, **kwargs)
    except Exception:
        return None


def safe_find_all(el: Tag, selector: str, **kwargs) -> List[Tag]:
    """Safely find_all children."""
    try:
        return el.find_all(selector, **kwargs)
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Hero Scraping
# ---------------------------------------------------------------------------

ROLE_MAP = {
    "tank": "Tank",
    "fighter": "Fighter",
    "assassin": "Assassin",
    "mage": "Mage",
    "marksman": "Marksman",
    "support": "Support",
}

DAMAGE_TYPE_MAP = {
    "physical": "physical",
    "magic": "magic",
    "true": "mixed",
    "mixed": "mixed",
}

PLAY_STYLE_MAP = {
    "burst": "burst",
    "sustain": "sustain",
    "poke": "poke",
    "poker": "poke",
}


def classify_playstyle(hero_name: str, tags: List[str], role: str) -> str:
    """Infer playstyle from role and tags."""
    name_lower = hero_name.lower()
    # Known burst heroes
    burst_indicators = ["eudora", "kadita", "aurora", "cecilion", "kagura", "gusion",
                        "selena", "harley", "vale", "alice", "harith", "lunox",
                        "charlotte", "april", "julian", "xavier", "valentina",
                        "joy", "nolan", "novaria", "lylia", "zhask", "vexana"]
    # Known sustain heroes
    sustain_indicators = ["ruby", "alucard", "esmeralda", "uranus", "hilda", "terizla",
                          "silvanna", "lapu-lapu", "thamuz", "alpha", "freya",
                          "sun", "zilong", "minsitthar", "balmond", "baxia",
                          "grock", "johnson", "lolita", "belerick", "gatotkaca",
                          "hylos", "khufra", "minotaur", "tigreal", "jawhead",
                          "akai", "franco", "atlas", "edith", "gloo", "barats",
                          "chip", "terizla"]
    # Known poke heroes
    poke_indicators = ["kimmy", "chang'e", "yve", "pharsa", "kaja", "rafaela",
                       "angela", "estes", "mathilda", "floryn", "diggie",
                       "carmilla", "nana", "odette", "lolita", "popol", "kupa",
                       "beatrix", "clint", "brody", "granger", "claude",
                       "karrie", "natan", "wanwan", "ixia", "melissa",
                       "layla", "bruno", "lesley", "miya", "moscov", "hanabi",
                       "irithel", "roger"]

    if any(ind in name_lower for ind in burst_indicators):
        return "burst"
    if any(ind in name_lower for ind in sustain_indicators):
        return "sustain"
    if any(ind in name_lower for ind in poke_indicators):
        return "poke"
    # Default by role
    role_style_map = {
        "Tank": "sustain",
        "Fighter": "sustain",
        "Assassin": "burst",
        "Mage": "burst",
        "Marksman": "poke",
        "Support": "poke",
    }
    return role_style_map.get(role, "poke")


def classify_mobility(name_lower: str, role: str, tags: List[str]) -> str:
    """Heuristic mobility classification."""
    high_mobility = ["fanny", "lancelot", "hayabusa", "ling", "benedetta", "gusion",
                     "kagura", "harley", "selena", "karina", "helcurt", "joy",
                     "nolan", "wukong", "hanzo", "natalia", "chou", "paquito",
                     "silvanna", "jawhead", "alpha", "claude", "wanwan",
                     "roger", "mathilda", "barats", "chip", "suyou", "luo yi"]
    medium_mobility = ["alucard", "dyroth", "martis", "lapu-lapu", "zilong", "sun",
                       "terizla", "thamuz", "minsitthar", "khaleed", "badang",
                       "barats", "akai", "hilda", "esmeralda", "gloo", "edith",
                       "kaja", "carmilla", "guinevere", "ruby", "chou",
                       "kagura", "harith", "cecilion", "xavier", "lylia",
                       "valir", "lunox", "kimmy", "claude", "bruno",
                       "granger", "brody", "natan", "irithel", "karrie",
                       "beatrix", "clint", "lesley", "moskov", "hanabi",
                       "miya", "layla", "popol", "melissa", "ixia"]

    name_lc = name_lower
    if any(h in name_lc for h in high_mobility):
        return "high"
    if any(h in name_lc for h in medium_mobility):
        return "medium"
    if role in ("Mage", "Marksman", "Support"):
        return "low"
    return "medium"


def classify_cc(name_lower: str, role: str, tags: List[str]) -> str:
    """Heuristic CC classification."""
    hard_cc = ["tigreal", "atlas", "khufra", "franco", "minotaur", "akai",
               "chou", "kaja", "johnson", "grock", "jawhead", "carmilla",
               "gatotkaca", "barats", "chip", "edith", "glood", "belerick",
               "lolita", "hylos", "baxia", "clint", "selena", "aurora",
               "kadita", "vale", "pharsa", "valir", "ruby", "guinevere",
               "silvanna", "mathilda", "minsitthar", "nana", "diggie",
               "helcurt", "saber", "kaja", "suyou"]
    name_lc = name_lower
    if any(h in name_lc for h in hard_cc):
        return "hard"
    if role in ("Tank", "Support", "Fighter"):
        return "soft"
    return "none"


def classify_range(name_lower: str, role: str) -> str:
    """Classify hero as melee or ranged."""
    melee_roles = {"Tank", "Fighter", "Assassin"}
    if role in melee_roles:
        return "melee"
    return "ranged"


def classify_survivability(hp_val: float, role: str, tags: List[str]) -> str:
    """Classify survivability based on HP and role."""
    if hp_val > 2700:
        return "high"
    if role in ("Tank", "Fighter") or hp_val > 2500:
        return "medium"
    return "low"


def classify_power_spike(name_lower: str, role: str) -> str:
    """Early, mid, or late game spike."""
    early_spike = ["paquito", "khaleed", "chou", "saber", "helcurt", "akari",
                   "dyroth", "alucard", "selena", "harley", "nolan", "joy",
                   "kaja", "mathilda", "chip", "jawhead", "minsitthar"]
    late_spike = ["layla", "miya", "hanabi", "moskov", "irithel", "lesley",
                  "claude", "karrie", "wanwan", "melissa", "lunox", "cecilion",
                  "kagura", "pharsa", "vale", "xavier", "novaria",
                  "estes", "rafaela", "angela", "floryn", "aldous",
                  "sun", "zilong", "roger", "natan", "brody"]
    if any(h in name_lower for h in early_spike):
        return "early"
    if any(h in name_lower for h in late_spike):
        return "late"
    return "mid"


def extract_tags(soup: Tag, name_lower: str, role: str) -> List[str]:
    """Extract special tags from hero data."""
    tags = []
    # Check for healing abilities
    heal_heroes = ["estes", "rafaela", "angela", "floryn", "minotaur", "mathilda",
                   "carmilla", "diggie", "rafaela"]
    if any(h in name_lower for h in heal_heroes):
        tags.append("heal")
    # Shield heroes
    shield_heroes = ["johnson", "lolita", "gloo", "atlas", "grock", "belerick",
                     "hylos", "edith", "barats", "esmeralda", "guinevere",
                     "silvanna", "angela", "rafaela", "mathilda"]
    if any(h in name_lower for h in shield_heroes):
        tags.append("shield")
    # Stealth
    stealth_heroes = ["natalia", "hayabusa", "helcurt", "lesley", "selena",
                      "karina", "ling", "benedetta", "wukong"]
    if any(h in name_lower for h in stealth_heroes):
        tags.append("stealth")
    # Summon
    summon_heroes = ["zhask", "popol", "kupa", "vexana", "faramis", "silvanna",
                     "sun", "nana", "gloo", "barats"]
    if any(h in name_lower for h in summon_heroes):
        tags.append("summon")
    # True damage
    true_dmg = ["karrie", "xavier", "lunox", "alpha", "balmond", "dyrroth",
                "hayabusa", "suyou", "martis", "badang", "silvanna"]
    if any(h in name_lower for h in true_dmg):
        tags.append("true_damage")
    # Anti-heal
    anti_heal = ["ruby", "esmeralda", "alpha", "balmond", "thamuz", "terizla",
                 "silvanna", "lapu-lapu", "hilda", "baxia", "belerick",
                 "gloo", "edith", "barats", "khufra", "akai"]
    if any(h in name_lower for h in anti_heal):
        tags.append("anti_heal")
    return tags


def scrape_hero_list() -> List[Dict[str, Any]]:
    """
    Scrape the MLBB hero list page to get all hero names and profile URLs.
    Returns list of dicts with name, title, imageUrl, heroUrl.
    """
    logger.info("Fetching hero list from %s", HERO_LIST_URL)
    html = fetch_html(HERO_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    heroes = []
    hero_id_counter = 1

    # Strategy 1: Look for the hero gallery/table (most common Fandom structure)
    hero_links = soup.select("a[href*='/wiki/']") or []
    # Better: find the hero roster table
    hero_table = soup.find("table", class_=lambda c: c and ("hero" in c.lower() or "roster" in c.lower() or "wikitable" in c.lower()))
    
    if hero_table:
        rows = safe_find_all(hero_table, "tr")
        for row in rows:
            cells = safe_find_all(row, "td")
            if not cells:
                continue
            # Find the <a> tag with hero name
            link = safe_find(row, "a", href=True)
            img = safe_find(row, "img", src=True)
            if not link:
                continue
            
            name = safe_get_text(link)
            # Skip headers / non-hero entries
            if not name or len(name) < 2:
                continue
            name = name.strip()
            
            # Filter out non-hero entries
            skip_words = ["list", "hero", "role", "damage", "type", "cost", "special"]
            if name.lower() in skip_words:
                continue
            
            href = link.get("href", "")
            hero_url = urljoin(BASE_URL, href) if href.startswith("/") else href
            
            image_url = ""
            if img and img.get("src"):
                image_url = img["src"] if img["src"].startswith("http") else urljoin(BASE_URL, img["src"])
            
            title_tag = safe_find(row, "span", class_=lambda c: c and "title" in c.lower()) if False else None
            title = safe_get_text(title_tag) if title_tag else ""
            
            heroes.append({
                "heroId": hero_id_counter,
                "name": name,
                "title": title,
                "imageUrl": image_url,
                "heroUrl": hero_url,
            })
            hero_id_counter += 1
    
    # Strategy 2: Fallback - parse all wiki links with hero-sounding names
    if not heroes:
        logger.warning("Hero table not found; falling back to link-based extraction.")
        all_links = soup.find_all("a", href=True)
        seen_names = set()
        for link in all_links:
            href = link.get("href", "")
            name = safe_get_text(link)
            if not name or len(name) < 2 or name in seen_names:
                continue
            # Filter: only get links that look like hero pages
            if href.startswith("/wiki/") and ":" not in href.replace("/wiki/", ""):
                # Check if there's an image nearby
                parent = link.find_parent("div") or link.find_parent("td") or link
                img = safe_find(parent, "img", src=True)
                image_url = ""
                if img and img.get("src"):
                    image_url = img["src"] if img["src"].startswith("http") else urljoin(BASE_URL, img["src"])
                hero_url = urljoin(BASE_URL, href)
                heroes.append({
                    "heroId": hero_id_counter,
                    "name": name,
                    "title": "",
                    "imageUrl": image_url,
                    "heroUrl": hero_url,
                })
                seen_names.add(name)
                hero_id_counter += 1
                if hero_id_counter > 130:  # Sanity cap
                    break

    logger.info("Found %d heroes on list page", len(heroes))
    return heroes


def scrape_hero_details(hero: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Scrape an individual hero's detail page to extract attributes.
    Returns enriched hero data or None on failure.
    """
    hero_url = hero.get("heroUrl", "")
    if not hero_url:
        return None

    try:
        html = fetch_html(hero_url)
    except Exception as exc:
        logger.error("Failed to fetch %s: %s", hero_url, exc)
        return None

    soup = BeautifulSoup(html, "html.parser")
    name = hero["name"]
    name_lower = name.lower()

    # --- Extract role from page ---
    role = ""
    # Check infobox
    infobox = soup.find("aside", class_="portable-infobox") or soup.find("table", class_="infobox")
    if infobox:
        rows = safe_find_all(infobox, "tr") or infobox.find_all("div", class_="pi-data")
        for row in rows:
            label_el = safe_find(row, "th") or safe_find(row, "div", class_="pi-data-label")
            if label_el:
                label_text = safe_get_text(label_el).lower()
                if "role" in label_text:
                    value_el = safe_find(row, "td") or safe_find(row, "div", class_="pi-data-value")
                    if value_el:
                        role = safe_get_text(value_el)
    
    # Normalize role
    for key, val in ROLE_MAP.items():
        if key in role.lower():
            role = val
            break
    
    # Role fallback from name (heuristic)
    if not role:
        role_guess_map = {
            "tank": "Tank", "fighter": "Fighter", "assassin": "Assassin",
            "mage": "Mage", "marksman": "Marksman", "support": "Support",
            "mm": "Marksman",
        }
        for key, val in role_guess_map.items():
            if key in name_lower:
                role = val
                break
    
    if not role:
        role = "Fighter"  # Default

    # --- Damage type ---
    damage_type = "physical"
    dt_map = {"physical": "physical", "magic": "magic", "true damage": "mixed"}
    # Check infobox for damage type
    if infobox:
        rows = safe_find_all(infobox, "tr") or infobox.find_all("div", class_="pi-data")
        for row in rows:
            label_el = safe_find(row, "th") or safe_find(row, "div", class_="pi-data-label")
            if label_el:
                label_text = safe_get_text(label_el).lower()
                if "damage" in label_text or "type" in label_text:
                    value_el = safe_find(row, "td") or safe_find(row, "div", class_="pi-data-value")
                    if value_el:
                        dt_text = safe_get_text(value_el).lower()
                        for key, val in dt_map.items():
                            if key in dt_text:
                                damage_type = val
                                break
    
    # Fallback: mages are magic, marksmen are mostly physical
    if damage_type == "physical" and role == "Mage":
        damage_type = "magic"
    if damage_type == "magic" and role in ("Fighter", "Marksman", "Assassin"):
        damage_type = "physical"

    # --- Stats extraction ---
    stats_table = soup.find("table", class_=lambda c: c and "stat" in c.lower()) if False else None
    hp_val = 2500.0  # default
    if stats_table:
        stat_rows = safe_find_all(stats_table, "tr")
        for srow in stat_rows:
            cells = safe_find_all(srow, "td")
            if len(cells) >= 2:
                key = safe_get_text(cells[0]).lower()
                val = safe_get_text(cells[1])
                if "hp" in key or "health" in key:
                    try:
                        hp_val = float(val.replace(",", "").replace(" ", ""))
                    except ValueError:
                        pass

    # --- Classify derived attributes ---
    tags = extract_tags(soup, name_lower, role)
    play_style = classify_playstyle(name_lower, tags, role)
    mobility = classify_mobility(name_lower, role, tags)
    cc = classify_cc(name_lower, role, tags)
    hero_range = classify_range(name_lower, role)
    survivability = classify_survivability(hp_val, role, tags)
    power_spike = classify_power_spike(name_lower, role)

    # --- Skills extraction ---
    skills = []
    skill_sections = soup.find_all("div", class_=lambda c: c and "skill" in c.lower()) or []
    # Also try to find skill tables
    skill_tables = soup.find_all("table", class_=lambda c: c and "skill" in c.lower())
    for skill_el in skill_sections[:5] if skill_sections else []:
        skill_name = safe_get_text(safe_find(skill_el, "div", class_="skill-name") or 
                                    safe_find(skill_el, "h3") or safe_find(skill_el, "h4") or skill_el)
        skill_desc = safe_get_text(safe_find(skill_el, "div", class_="skill-desc") or 
                                    safe_find(skill_el, "p") or skill_el)
        if skill_name and len(skill_name) > 1:
            skills.append({
                "name": skill_name[:50],
                "description": skill_desc[:200],
                "type": "active",
            })

    # Build final hero object
    hero_data = {
        "heroId": hero["heroId"],
        "name": name,
        "title": hero.get("title", ""),
        "role": role,
        "damageType": damage_type,
        "playStyle": play_style,
        "mobility": mobility,
        "crowdControl": cc,
        "range": hero_range,
        "survivability": survivability,
        "powerSpike": power_spike,
        "tags": tags,
        "imageUrl": hero.get("imageUrl", ""),
        "stats": {
            "hp": int(hp_val),
            "physicalAttack": 0,
            "magicPower": 0,
            "physicalDef": 0,
            "magicDef": 0,
        },
        "skills": skills,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    return hero_data


def scrape_all_heroes() -> List[Dict[str, Any]]:
    """
    Scrape full hero data for all heroes on the list page.
    """
    hero_list = scrape_hero_list()
    logger.info("Scraping details for %d heroes...", len(hero_list))

    heroes = []
    for i, hero in enumerate(hero_list, 1):
        logger.info("[%d/%d] Processing %s...", i, len(hero_list), hero["name"])
        details = scrape_hero_details(hero)
        if details:
            heroes.append(details)
        else:
            # Fallback: add basic hero entry
            heroes.append({
                "heroId": hero["heroId"],
                "name": hero["name"],
                "title": hero.get("title", ""),
                "role": "Fighter",
                "damageType": "physical",
                "playStyle": "sustain",
                "mobility": "medium",
                "crowdControl": "none",
                "range": "melee",
                "survivability": "medium",
                "powerSpike": "mid",
                "tags": [],
                "imageUrl": hero.get("imageUrl", ""),
                "stats": {"hp": 2500, "physicalAttack": 100, "magicPower": 0, "physicalDef": 15, "magicDef": 10},
                "skills": [],
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            })
        # Small delay to be polite
        time.sleep(0.5)

    return heroes


# ---------------------------------------------------------------------------
# Item Scraping
# ---------------------------------------------------------------------------

def scrape_items() -> List[Dict[str, Any]]:
    """
    Scrape items from the MLBB Fandom Items page.
    """
    logger.info("Fetching items from %s", ITEMS_URL)
    html = fetch_html(ITEMS_URL)
    soup = BeautifulSoup(html, "html.parser")

    items = []
    item_id_counter = 1

    # Find item tables
    item_tables = soup.find_all("table", class_=lambda c: c and ("item" in c.lower() or "wikitable" in c.lower()))
    if not item_tables:
        # Fallback: find any table with item-like content
        item_tables = soup.find_all("table", class_="wikitable")
    
    for table in item_tables:
        rows = safe_find_all(table, "tr")
        for row in rows:
            cells = safe_find_all(row, "td")
            if len(cells) < 2:
                continue
            
            link = safe_find(row, "a", href=True)
            img = safe_find(row, "img", src=True)
            if not link:
                continue
            
            name = safe_get_text(link)
            if not name or len(name) < 2:
                continue
            
            skip_names = ["item", "name", "cost", "stats", "effect", "passive", "recipe"]
            if name.lower() in skip_names:
                continue

            # Extract cost
            cost = 0
            cost_el = None
            for cell in cells:
                text = safe_get_text(cell).lower()
                if "gold" in text or "cost" in text or any(c.isdigit() for c in text):
                    nums = "".join(c for c in text if c.isdigit())
                    if nums:
                        cost = int(nums)
                        cost_el = cell
                        break
            
            # Item type
            item_type = "equipment"
            if safe_find(row, "span", string=lambda s: s and "defense" in s.lower()):
                item_type = "defense"
            elif safe_find(row, "span", string=lambda s: s and "attack" in s.lower()):
                item_type = "attack"
            elif safe_find(row, "span", string=lambda s: s and "magic" in s.lower()):
                item_type = "magic"
            
            # Stats from text
            stats_text = safe_get_text(row).lower()
            pdef = 0
            mdef = 0
            hp_item = 0
            regen = 0
            if "physical defense" in stats_text or "armor" in stats_text:
                # Try to extract number
                import re
                nums = re.findall(r"(\d+)\s*(?:physical defense|armor)", stats_text)
                if nums:
                    pdef = int(nums[0])
            if "magic defense" in stats_text or "magic resist" in stats_text:
                nums = re.findall(r"(\d+)\s*(?:magic defense|magic resist)", stats_text)
                if nums:
                    mdef = int(nums[0])
            if "hp" in stats_text or "health" in stats_text:
                nums = re.findall(r"(\d+)\s*(?:hp|health)", stats_text)
                if nums:
                    hp_item = int(nums[0])
            
            # Passive
            passive_el = safe_find(row, "td", class_=lambda c: c and "passive" in c.lower())
            passive = safe_get_text(passive_el) if passive_el else ""
            if not passive:
                # Check for description cell
                desc_cells = [c for c in cells if len(safe_get_text(c)) > 50]
                if desc_cells:
                    passive = safe_get_text(desc_cells[0])[:200]
            
            # Image
            image_url = ""
            if img and img.get("src"):
                image_url = img["src"] if img["src"].startswith("http") else urljoin(BASE_URL, img["src"])
            
            # Tags
            tags = []
            counter_items_map = {
                "antique cuirass": ["physical_burst"],
                "blade armor": ["physical_auto_attack"],
                "athena shield": ["magic_burst"],
                "radiant armor": ["magic_sustain"],
                "twilight armor": ["burst", "crit"],
                "dominance ice": ["heal", "attack_speed", "physical"],
                "necklace of durance": ["heal", "lifesteal"],
                "sea halberd": ["heal", "lifesteal", "physical"],
                "cursed helmet": ["magic_sustain"],
                "immortality": ["burst", "pick_off"],
                "tough boots": ["cc", "magic"],
                "warrior boots": ["physical"],
                "magic shoes": ["mana_regen"],
            }
            for item_name, item_tags in counter_items_map.items():
                if item_name in name.lower():
                    tags.extend(item_tags)
                    break
            if not tags:
                if pdef > 0:
                    tags.append("physical_def")
                if mdef > 0:
                    tags.append("magic_def")
                if hp_item > 0:
                    tags.append("hp")

            items.append({
                "itemId": item_id_counter,
                "name": name,
                "type": item_type,
                "cost": cost,
                "stats": {
                    "physicalDef": pdef,
                    "magicDef": mdef,
                    "hp": hp_item,
                    "regen": regen,
                },
                "passive": passive,
                "tags": list(set(tags)),
                "imageUrl": image_url,
                "counters": [],  # To be filled via logic
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            })
            item_id_counter += 1

    # Fallback: Add known key items if scraping produced nothing
    if not items:
        logger.warning("No items scraped from wiki; using built-in item data as fallback.")
        items = _get_fallback_items()

    logger.info("Scraped %d items", len(items))
    return items


def _get_fallback_items() -> List[Dict[str, Any]]:
    """Fallback item data if scraping fails."""
    return [
        {"itemId": 1, "name": "Antique Cuirass", "type": "defense", "cost": 2170,
         "stats": {"physicalDef": 70, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Reduces enemy physical attack by 8% per stack (max 3).", "tags": ["physical_def", "anti_burst"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 2, "name": "Blade Armor", "type": "defense", "cost": 1960,
         "stats": {"physicalDef": 90, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Reflects 25% of basic attack damage taken as magic damage.", "tags": ["physical_def", "anti_auto"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 3, "name": "Athena's Shield", "type": "defense", "cost": 2150,
         "stats": {"physicalDef": 0, "magicDef": 62, "hp": 0, "regen": 0},
         "passive": "Gain a shield that blocks 50% of incoming magic damage.", "tags": ["magic_def", "anti_burst"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 4, "name": "Radiant Armor", "type": "defense", "cost": 1880,
         "stats": {"physicalDef": 0, "magicDef": 48, "hp": 1200, "regen": 20},
         "passive": "Reduces magic damage taken by 2-10 per stack.", "tags": ["magic_def", "anti_sustain"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 5, "name": "Twilight Armor", "type": "defense", "cost": 2200,
         "stats": {"physicalDef": 20, "magicDef": 20, "hp": 1500, "regen": 0},
         "passive": "Blocks damage exceeding 600 from a single hit.", "tags": ["hp", "anti_burst", "anti_crit"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 6, "name": "Dominance Ice", "type": "defense", "cost": 2010,
         "stats": {"physicalDef": 70, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Reduces enemy attack speed and shield/heal effect by 50%.", "tags": ["physical_def", "anti_heal", "anti_attack_speed"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 7, "name": "Necklace of Durance", "type": "magic", "cost": 2050,
         "stats": {"physicalDef": 0, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Reduces enemy healing and shield by 50% for 3s.", "tags": ["anti_heal"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 8, "name": "Sea Halberd", "type": "attack", "cost": 1950,
         "stats": {"physicalDef": 0, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Reduces enemy healing and shield by 50% for 3s.", "tags": ["anti_heal", "physical_attack"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 9, "name": "Cursed Helmet", "type": "defense", "cost": 1860,
         "stats": {"physicalDef": 0, "magicDef": 24, "hp": 1200, "regen": 0},
         "passive": "Deals magic damage equal to 4% of max HP to nearby enemies.", "tags": ["magic_def", "hp", "aoe_magic"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 10, "name": "Immortality", "type": "defense", "cost": 2200,
         "stats": {"physicalDef": 0, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Resurrects with 15% HP after 2.5s.", "tags": ["survival", "anti_burst"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 11, "name": "Tough Boots", "type": "boots", "cost": 720,
         "stats": {"physicalDef": 0, "magicDef": 22, "hp": 0, "regen": 0},
         "passive": "Reduces CC duration by 30%.", "tags": ["magic_def", "cc_reduction"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
        {"itemId": 12, "name": "Warrior Boots", "type": "boots", "cost": 720,
         "stats": {"physicalDef": 22, "magicDef": 0, "hp": 0, "regen": 0},
         "passive": "Increases physical defense.", "tags": ["physical_def"],
         "imageUrl": "", "counters": [], "updatedAt": datetime.now(timezone.utc).isoformat()},
    ]


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def save_json(data: Any, filepath: Path):
    """Save data as JSON."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info("Saved %d records to %s", len(data) if isinstance(data, list) else 1, filepath)


def main():
    parser = argparse.ArgumentParser(description="MLBB Fandom Wiki Scraper")
    parser.add_argument("--output", type=str, default="./data", help="Output directory for JSON files")
    parser.add_argument("--heroes-only", action="store_true", help="Only scrape heroes")
    parser.add_argument("--items-only", action="store_true", help="Only scrape items")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    scrape_heroes = not args.items_only
    scrape_items_flag = not args.heroes_only

    if scrape_heroes:
        logger.info("=" * 60)
        logger.info("Starting hero scrape...")
        logger.info("=" * 60)
        heroes = scrape_all_heroes()
        save_json(heroes, output_dir / "heroes.json")
        logger.info("Hero scrape complete: %d heroes", len(heroes))

    if scrape_items_flag:
        logger.info("=" * 60)
        logger.info("Starting item scrape...")
        logger.info("=" * 60)
        items = scrape_items()
        save_json(items, output_dir / "items.json")
        logger.info("Item scrape complete: %d items", len(items))

    logger.info("All done! Output saved to %s", output_dir.resolve())


if __name__ == "__main__":
    main()