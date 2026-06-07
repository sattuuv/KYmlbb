# Scraper Repair & Automation Protocol

## 1. The Cloudflare 403 Problem
The MLBB Fandom Wiki uses Cloudflare Turnstile bot protection. Standard HTTP client handshakes (like the default Python `requests`) lack real browser TLS fingerprints and are instantly dropped with a `403 Forbidden` error.

## 2. The Solution: TLS Impersonation Bypass
We resolve this natively in our automated GitHub Actions pipeline by using `curl_cffi`. This library securely mimics the TLS fingerprints of modern desktop browsers (Chrome/Firefox), bypassing Cloudflare's bot detection for free without needing external API credits.

### Dependencies (`requirements.txt`)
Ensure these packages are defined for the scripting environment:
` ` `text
curl_cffi==0.6.2
beautifulsoup4==4.12.3
pymongo==4.6.3
` ` `

### Refactored Scraper Code (`scripts/mlbb_scraper.py`)
` ` `python
import os
from curl_cffi import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient

def get_mongo_client():
    # Reads the URI securely from GitHub Secrets
    mongo_uri = os.environ.get("MONGODB_URI")
    if not mongo_uri:
        raise ValueError("MONGODB_URI environment variable is missing!")
    return MongoClient(mongo_uri)

def scrape_and_sync():
    print("Initializing secure browser impersonation session...")
    # Impersonate Chrome 124 to bypass Cloudflare signatures
    session = requests.Session(impersonate="chrome124")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    target_url = "https://mobile-legends.fandom.com/wiki/Hero_List"
    response = session.get(target_url, headers=headers)
    
    if response.status_code != 200:
        print(f"Extraction failed. Status Code: {response.status_code}")
        return
        
    print("Page source grabbed successfully! Parsing DOM...")
    soup = BeautifulSoup(response.text, "html.parser")
    
    # -------------------------------------------------------------
    # PLACE YOUR SPECIFIC DATA EXTRACTION LOGIC FOR HEROES HERE
    # -------------------------------------------------------------
    extracted_heroes = [] 
    
    # Database Upsert Sync
    if extracted_heroes:
        client = get_mongo_client()
        db = client["mlbb_db"]
        heroes_collection = db["heroes"]
        
        for hero in extracted_heroes:
            # Upsert prevents duplicate rows by matching hero_id
            heroes_collection.update_one(
                {"hero_id": hero["hero_id"]},
                {"$set": hero},
                upsert=True
            )
        print(f"Successfully synced {len(extracted_heroes)} heroes to MongoDB Atlas.")

if __name__ == "__main__":
    scrape_and_sync()
` ` `

---

## 3. The Automation Pipeline (GitHub Actions)
To run this automatically every day and push data directly to MongoDB Atlas, use this workflow file:

### File Path: `.github/workflows/schedule_sync.yml`
` ` `yaml
name: Automated MLBB Database Sync

on:
  schedule:
    # Runs at 00:00 UTC every single day
    - cron: '0 0 * * *'
  workflow_dispatch: # Allows manual triggering via GitHub UI

jobs:
  sync-database:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository Code
      uses: actions/checkout@v4

    - name: Set up Python Runtime
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
        cache: 'pip'

    - name: Install Dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Execute Scraper & Sync to Atlas
      env:
        # Securely maps your Mongo Connection string from GitHub Secrets
        MONGODB_URI: ${{ secrets.MONGODB_URI }}
      run: python scripts/mlbb_scraper.py
` ` `