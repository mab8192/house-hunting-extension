# Notion House Hunter Chrome Extension

## Overview
Notion House Hunter is a Chrome extension that helps you save house listings from URE (Utah Real Estate) directly to your Notion database. It scrapes property details from the current tab and sends them to your Notion workspace for easy tracking and comparison.

## Features
- Scrapes house data (address, price, beds, baths, square footage, lot size, URL) from URE listings
- Allows editing scraped data before saving
- Saves listings to a Notion database using the Notion API
- Credentials (API key and database ID) are securely stored in Chrome local storage
- Simple popup UI for quick access

## Installation
1. Clone or download this repository.
2. Go to `chrome://extensions` in your browser.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `extension` folder inside this project.

## Configuration
1. Click the extension icon in Chrome to open the popup.
2. Click "Edit Credentials" and enter your Notion API key and Database ID.
	- Your API key can be generated from [Notion Integrations](https://www.notion.so/my-integrations).
	- Your Database ID can be found in your Notion database URL.
3. Save your credentials.

## Usage
1. Navigate to a house listing on URE.
2. Open the extension popup.
3. The extension will automatically scrape the listing details and populate the form.
4. Edit any fields if needed.
5. Click "Save to Notion" to add the listing to your Notion database.

## Permissions
- `activeTab`, `scripting`, `storage` — Required for scraping and saving data
- Host permission for `https://api.notion.com/*`

## Troubleshooting
- Make sure your Notion integration has access to the target database.
- If scraping fails, check that you are on a supported URE listing page.
- For API errors, verify your credentials and database schema.

## License
MIT
