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

    // House property fields
    const addressInput = document.getElementById('address');
    const priceInput = document.getElementById('price');
    const bedsInput = document.getElementById('beds');
    const bathsInput = document.getElementById('baths');
    const sqftInput = document.getElementById('sqft');
    const urlInput = document.getElementById('url');
    const statusFieldInput = document.getElementById('statusField');
    const saveHouseButton = document.getElementById('saveHouseButton');

    // Toggle credentials form visibility
    const toggleCredentialsButton = document.getElementById('toggleCredentials');
    const credentialsForm = document.getElementById('credentialsForm');
    toggleCredentialsButton.addEventListener('click', () => {
        if (credentialsForm.style.display === 'none') {
            credentialsForm.style.display = 'block';
        } else {
            credentialsForm.style.display = 'none';
        }
    });

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
            runAutoScrape();
        }
    });

    saveCredentialsButton.addEventListener('click', () => {
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

    // Scrape and populate house fields
    function runAutoScrape() {
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
                const scrapedData = injectionResults[0].result || {};
                addressInput.value = scrapedData.address || '';
                priceInput.value = scrapedData.price || '';
                bedsInput.value = scrapedData.beds || '';
                bathsInput.value = scrapedData.baths || '';
                sqftInput.value = scrapedData.sqft || '';
                urlInput.value = scrapedData.url || '';
                showStatus('Edit any field and click Save to Notion.');
            });
        });
    }

    // Save to Notion with edited data
    saveHouseButton.addEventListener('click', () => {
        const houseData = {
            address: addressInput.value,
            price: priceInput.value,
            beds: bedsInput.value,
            baths: bathsInput.value,
            sqft: sqftInput.value,
            url: urlInput.value
        };
        addToNotion(houseData);
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

    // Replace autosave with autoscrape
    if (NOTION_API_KEY && DATABASE_ID) {
        runAutoScrape();
    }

    // Update addToNotion to use edited data
    async function addToNotion(data) {
        const priceNum = data.price ? parseInt(data.price.replace(/[$,]/g, ''), 10) : null;
        const sqftNum = data.sqft ? parseInt(data.sqft.replace(/,/g, ''), 10) : null;
        const url = 'https://api.notion.com/v1/pages';
        const payload = {
            parent: { database_id: DATABASE_ID },
            properties: {
                'Address': {
                    title: [
                        {
                            text: {
                                content: data.address || 'Address Unknown'
                            }
                        }
                    ]
                },
                "Status": {
                    status: {
                        name: 'Considering'
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
                    number: data.baths ? parseFloat(data.baths) : null
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
