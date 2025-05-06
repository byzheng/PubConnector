// Functions to scopus.com

// Main functions for scopus
async function run_lens(options) {
    lens_searchlist(options);
}


function lens_searchlist(options) {
    let lastUrl = location.href;
    // Run once initially
    lens_searchlist_period_check(options);

    // Poll for URL changes (e.g., p or n)
    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            lens_searchlist_period_check(options);
        }
    }, 1000); // check every 0.5s
}


async function lens_searchlist_period_check(options) {
    const selector = [
        "main.lf-main-panel.internal-results-container", // for search list
        "div.div-table-results-body" // for article page
    ].join(", ");
    const contentSelector = [
        "div.div-table-results-row.ng-scope h1.listing-title", // for search list
        "div.div-table-results-row.ng-scope h3.listing-result-title" // for article page
    ].join(", ");
    const maxAttempts = 30;      // e.g., try for 20 seconds
    const interval = 1000;       // in milliseconds
    let attempts = 0;

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    while (attempts < maxAttempts) {
        const container = document.querySelector(selector);
        const items = document.querySelectorAll(contentSelector);

        if (container && items.length > 0) {
            // Found the actual results, apply your processing
            //console.log(`✅ Found ${items.length} result items`);
            lens_items(container, options);
            break;
        }

        //console.log(`⏳ Waiting for content... Attempt ${attempts + 1}`);
        await sleep(interval);
        attempts++;
    }

    if (attempts === maxAttempts) {
        //console.warn("❌ Timeout: content not found");
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
    ].join(", ");
    var items = element.querySelectorAll(selector_lens);
    if (items === undefined || items.length === 0) {
        return;
    }
    // Process for each item
    for (let i = 0; i < items.length; i++) {
        if (items[i].querySelector("span.tw-lens-icon") !== null) {
            continue;
        }
        let dois = extractDOIs(items[i].outerHTML);
        if (dois === undefined || dois === null || dois.length !== 1) {
            continue;
        }
        //console.log(dois);
        inject_lens_doi(items[i], dois, options);
        //addIconTW(eid, items[i], options.tiddlywikihost, page_type);
        //console.log(eid);
    }
}


async function inject_lens_doi(element, doi, options) {

    var span = document.createElement("span");
    span.classList.add("tw-lens-icon");

    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);
    if (tiddlers.length === 1) {
        span.appendChild(tw_link(tiddlers[0].title, "tw-svg-small", options.tiddlywikihost));
    }
    span.appendChild(publisher_doi(doi, a_class = "tw-icon-tiny", img_class = "tw-svg-small"));

    var qry = "h1.listing-title,h3.listing-result-title";
    const h1 = element.querySelector(qry);
    if (h1 === undefined) {
        return;
    }
    h1.classList.add("listing-title-flex");
    h1.appendChild(span);
    if (tiddlers.length === 1) {
        setItemStyle(h1);
    }
    const lens_id = getLensID(element);
    console.log(lens_id);
    if (tiddlers.length === 1 && tiddlers[0].lens === undefined) {
        await tiddlywikiPutTiddler(title = tiddlers[0].title, 
            tags = [], 
            fields = {lens: lens_id}, host = options.tiddlywikihost);
    }
    //setItemStyle(element);
}


function getLensID(element) {

    // Get the id attribute
    if (element == null) {
        return;
        
    } 
    const articleId = element.id;
    const pattern = /^article-(\d{3}-){4}\d{3}$/;
    if (!pattern.test(articleId)) {
        return;
    }
    return articleId;
}