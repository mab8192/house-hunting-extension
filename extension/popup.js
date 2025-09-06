
// Notion API key and Database ID will be loaded from chrome.storage.local
let NOTION_API_KEY = "";
let DATABASE_ID = "";
console.log("popup.js loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    const statusElement = document.getElementById('status');
    const saveCredentialsButton = document.getElementById('saveCredentialsButton');
    const notionApiKeyInput = document.getElementById('notionApiKey');
    const databaseIdInput = document.getElementById('databaseId');

    console.error("ements", statusElement, saveCredentialsButton, notionApiKeyInput, databaseIdInput);

    function showStatus(message) {
        statusElement.textContent = message;
    }

    // Load credentials from chrome.storage.local on popup open
    chrome.storage.local.get(["notionApiKey", "databaseId"], (result) => {
        if (result.notionApiKey) {
            NOTION_API_KEY = result.notionApiKey;
            notionApiKeyInput.value = result.notionApiKey;
        }
        if (result.databaseId) {
            DATABASE_ID = result.databaseId;
            databaseIdInput.value = result.databaseId;
        }
        // Only run if both credentials are present
        if (NOTION_API_KEY && DATABASE_ID) {
            runAutoSave();
        }
    });

    saveCredentialsButton.addEventListener('click', () => {
        showStatus("TESTING");
        const apiKey = notionApiKeyInput.value.trim();
        const dbId = databaseIdInput.value.trim();
        if (!apiKey || !dbId) {
            showStatus('Please enter both API key and Database ID.');
            return;
        }
        chrome.storage.local.set({ notionApiKey: apiKey, databaseId: dbId }, () => {
            showStatus('Credentials saved!');
            NOTION_API_KEY = apiKey;
            DATABASE_ID = dbId;
        });
    });

    // Automatically run scraping and saving when popup loads, if credentials are present
    function runAutoSave() {
        if (!NOTION_API_KEY || !DATABASE_ID) {
            showStatus('Please enter and save your Notion credentials first.');
            return;
        }
        showStatus('Scraping data...');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }, (injectionResults) => {
                if (chrome.runtime.lastError || !injectionResults || !injectionResults.length) {
                    showStatus('Error: Could not scrape page.');
                    return;
                }
                const scrapedData = injectionResults[0].result;
                if (scrapedData) {
                    showStatus('Data scraped! Saving to Notion...');
                    addToNotion(scrapedData);
                } else {
                    showStatus('Failed to scrape data. Check selectors.');
                }
            });
        });
    }

    async function addToNotion(data) {
        // Clean up the scraped data
        const priceNum = data.price ? parseInt(data.price.replace(/[$,]/g, ''), 10) : null;
        const sqftNum = data.sqft ? parseInt(data.sqft.replace(/,/g, ''), 10) : null;
        // The Notion API endpoint for creating a page
        const url = 'https://api.notion.com/v1/pages';
        // The data payload, structured according to the Notion API
        const payload = {
            parent: { database_id: DATABASE_ID },
            properties: {
                'Address': {
                    title: [
                        {
                            text: {
                                content: data.address || 'Untitled House'
                            }
                        }
                    ]
                },
                "Status": {
                    status: {
                        name: "Considering"
                    }
                },
                'URL': {
                    url: data.url
                },
                'Price': {
                    number: priceNum
                },
                'Beds': {
                    number: data.beds ? parseInt(data.beds, 10) : null
                },
                'Baths': {
                    number: data.baths ? parseInt(data.baths, 10) : null
                },
                'SqFt': {
                    number: sqftNum
                }
            }
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28' // Use a recent, stable version
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showStatus('Successfully saved to Notion!');
            } else {
                const error = await response.json();
                showStatus(`Error: ${error.message}`);
                console.error('Notion API Error:', error);
            }
        } catch (error) {
            showStatus('Network error. See console.');
            console.error('Fetch Error:', error);
        }
    }
});
