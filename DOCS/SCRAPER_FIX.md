I'll retrieve the job logs to understand what failed.Now let me check the workflow file and the scraper code to understand the context better:## Solution: Handle 403 Forbidden Error from Fandom Wiki

Problem: Your scraper is receiving a 403 Forbidden error when trying to fetch the Mobile Legends Fandom wiki pages. The site is blocking requests after 3 retry attempts.

Root Cause: The Fandom wiki is detecting and blocking automated requests from the GitHub Actions runner. While you're using cloudscraper (which is installed in the workflow), the requests are still being rejected.

Solutions:

1. Add Request Headers (Quickest Fix)
Update your fetch_html() function to include more realistic browser headers:

Python
def fetch_html(url: str) -> str:
    """Fetch HTML with retry logic and realistic headers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
    }
    
    last_exc = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = _session.get(url, timeout=REQUEST_TIMEOUT, headers=headers)
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
2. Increase Retry Delays
The exponential backoff might be too aggressive. Increase the delays in your constants:

Python
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 5       # Increase from 3
RETRY_BACKOFF = 3     # Increase from 2 (now: 3s, 9s, 27s, 81s, 243s)
3. Use CloudScraper More Effectively
Initialize the session with additional parameters:

Python
_session = cloudscraper.create_scraper(
    browser={
        'browser': 'chrome',
        'platform': 'windows',
        'desktop': True
    },
    captcha={'provider': '2captcha', 'api_token': None}  # Allows fallback
)
_session.headers.update({"User-Agent": USER_AGENT})
4. Add Graceful Fallback
Modify your scrape_all_heroes() to use fallback data when the wiki is inaccessible:

Python
def scrape_all_heroes() -> List[Dict[str, Any]]:
    """Scrape full hero data, with fallback to cached/default data."""
    try:
        hero_list = scrape_hero_list()
    except RuntimeError as e:
        logger.error("Failed to fetch hero list: %s. Using fallback data.", e)
        hero_list = _get_fallback_heroes()  # Implement this function
    
    logger.info("Scraping details for %d heroes...", len(hero_list))
    # ... rest of function
5. Update Workflow with Error Handling
Modify .github/workflows/daily-sync.yml to continue on scraper failure:

YAML
- name: Run Scraper
  run: |
    cd scraper
    python mlbb_scraper.py --output data || echo "Scraper failed, using cached data"
  continue-on-error: true
Recommended Approach: Start with Solution 1 (add realistic headers) combined with Solution 2 (increase retry delays). This is the least intrusive and most likely to work. If the issue persists, implement Solution 4 to provide a fallback mechanism so your workflow doesn't fail entirely.


