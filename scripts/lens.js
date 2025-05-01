// Functions to scopus.com

// Main functions for scopus
async function run_lens(options) {
    lens_searchlist(options);
}


function lens_searchlist(options) {
    let lastUrl = location.href;
    let lastParams = new URLSearchParams(window.location.search);
    let lastPage = lastParams.get("p");
    let lastCount = lastParams.get("n");

    // Run once initially
    lens_searchlist_period_check(options);

    // Poll for URL changes (e.g., p or n)
    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;

            const params = new URLSearchParams(window.location.search);
            const currentPage = params.get("p");
            const currentCount = params.get("n");

            // Only re-run if p or n changed
            if (currentPage !== lastPage || currentCount !== lastCount) {
                console.log(`🔁 Detected change (p=${currentPage}, n=${currentCount}), reinjecting...`);
                lens_searchlist_period_check(options);

                lastPage = currentPage;
                lastCount = currentCount;
            }
        }
    }, 500); // check every 0.5s
}


async function lens_searchlist_period_check(options) {
    const selector = "main.lf-main-panel.internal-results-container";
    const contentSelector = "div.div-table-results-row.ng-scope h1.listing-title"; // <-- Adjust this to match the final content
    
    const maxAttempts = 20;      // e.g., try for 20 seconds
    const interval = 1000;       // in milliseconds
    let attempts = 0;

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    while (attempts < maxAttempts) {
        const container = document.querySelector(selector);
        const items = document.querySelectorAll(contentSelector);

        if (container && items.length > 0) {
            // Found the actual results, apply your processing
            console.log(`✅ Found ${items.length} result items`);
            lens_items(container, options);
            break;
        }

        console.log(`⏳ Waiting for content... Attempt ${attempts + 1}`);
        await sleep(interval);
        attempts++;
    }

    if (attempts === maxAttempts) {
        console.warn("❌ Timeout: content not found");
    }
}


// Helper functions to create banner in other pages, e.g. search list, citation list
function lens_item(element, options) {

    if (element.querySelector("a.tw-icon-tiny") !== null) {
        return;
    }
    let dois = extractDOIs(element.outerHTML);
    if (dois === undefined || dois === null || dois.length !== 1) {
        return;
    }
    console.log(dois);
    inject_lens_doi(element, dois, options)
}


// Helper functions to create banner in other pages, e.g. search list, citation list
function lens_items(element, options) {
    // Whole page to add a bar with EID
    var url = new URL(window.location.href);
    
    var selector_lens = [
        "div.div-table-results-row.ng-scope" // for search list
    ];
    var items;
    for (let i = 0; i < selector_lens.length; i++) {
        items = element.querySelectorAll(selector_lens[i]);
        if (items.length > 0) {
            break;
        }
    }
    if (items === undefined) {
        return;
    }


    // Process for each item
    for (let i = 0; i < items.length; i++) {
        if (items[i].querySelector("a.tw-icon-tiny") !== null) {
            continue;
        }
        let dois = extractDOIs(items[i].outerHTML);
        if (dois === undefined || dois === null || dois.length !== 1) {
            continue;
        }
        console.log(dois);
        inject_lens_doi(items[i], dois, options)
        //addIconTW(eid, items[i], options.tiddlywikihost, page_type);
        //console.log(eid);
    }
}


async function inject_lens_doi(element, doi, options) {
    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);
    if (tiddlers.length !== 1) {
        return;
    }
    var span = tw_link(tiddlers[0].title, "tw-svg-small", options.tiddlywikihost);
    var qry = "h1.listing-title";
    element.querySelector(qry).appendChild(span);
    //setItemStyle(element);
}
