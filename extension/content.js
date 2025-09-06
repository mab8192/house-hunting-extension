function scrapeHouseData() {
    const pageUrl = window.location.href;

    const addrDiv = document.querySelector(".prop___overview");
    const street = addrDiv.querySelector("h2").textContent;
    const cityStateZip = addrDiv.querySelector("p").textContent;

    const address = `${street}, ${cityStateZip}`;

    const topElements = document.querySelectorAll('.prop-details-overview li');
    const price = topElements[0].querySelector('span').textContent;
    const beds = topElements[1].querySelector('span').textContent;
    const baths = topElements[2].querySelector('span').textContent;
    const sqft = topElements[3].querySelector('span').textContent;

    const lotSizeUl = document.querySelector("#prop_size");
    let lotSize = null;
    if (lotSizeUl) {
        const lotLi = Array.from(lotSizeUl.querySelectorAll("li"))
            .find(li => li.textContent.trim().startsWith("Lot Size: "));
        if (lotLi) {
            lotSize = lotLi.textContent.replace("Lot Size: ", "").trim();
        }
    }


    // Return the data as a single object
    return {
        price,
        address,
        sqft,
        lotSize,
        beds,
        baths,
        url: pageUrl
    };
}

// Send the scraped data back to the extension's popup script
scrapeHouseData();
