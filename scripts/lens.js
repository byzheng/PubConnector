// Functions to scopus.com

// Main functions for scopus
async function run_lens(options) {
    
    let lastUrl = location.href;
    // article page
    lens_banner(options);

    // Run once initially
    if (!shouldSkipUrl(lastUrl)) {
        lens_articlelist_period_check(options);
    }

    // Poll for URL changes (e.g., p or n)
    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            if (!shouldSkipUrl(currentUrl)) {
                lens_articlelist_period_check(options);
            }
            // article page
            lens_banner(options);

        }
    }, 1000); // check every 0.5s
    
}

async function lens_banner(options) {
    var url = window.location.href;
    const articleID = extractLensArticleID(url);

    if (!articleID) {
        // delete banner
        removeTwBanner();
        return;
    }

    const doi_ele = document.querySelector("a.linkouts-website.ng-scope, header[lens-article-item-meta]");
    if (!doi_ele) {
        return;
    }

    let doi = extractDOIs(doi_ele.outerHTML);

    if (doi === undefined || doi === null || doi.length !== 1) {
        return;
    }

    doi = doi[0];

    var banner = createBanner();
    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);


    if (tiddlers.length > 0) {
        const tiddler = tiddlers[0];
        banner.appendChild(tw_copy_citation(tiddler.title));
        banner.appendChild(tw_link(tiddler.title, "tw-svg", options.tiddlywikihost, "images/Tiddlywiki.svg"));
        banner.appendChild(scholara(doi)); // Add Scholar link through searching DOI
        banner.appendChild(publisher_doi(doi)); // add link to publisher
        if (tiddler["scopus-eid"]) {
            banner.appendChild(scopusa(tiddler["scopus-eid"])); // Add Scopus link if scopus-eid is found
        } else {
            banner.appendChild(scopus_search_doi(doi)); // Add link to search Scopus by DOI
        }
    
        // Add Reading tag icon if applicable
        if (tiddler.tags.includes("Reading")) {
            banner.appendChild(reading_span());
        }

    } else {
        banner.appendChild(scholara(doi)); // Add Scholar search link for DOI
        banner.appendChild(scopus_search_doi(doi)); // Add Scopus search button by DOI
        banner.appendChild(publisher_doi(doi)); // Add Publisher link for DOI
        banner.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
    }
    // Add Zotero related icons
    await addZoteroIconsDOI(banner, doi, options.zoterohost);
    // Set finally width of banner
    bannerSetWidth(banner);

    // Add other information into pages

    // Wait to load page as some website will render the whole page later
    await waitForLoading();

    // Insert author and domain information
    if (tiddlers.length > 0) {
        insertColleagueAndDomainInfo(tiddlers[0], options.tiddlywikihost);
    }
}


function shouldSkipUrl(url) {
    const skipSuffixes = ['/main', '/collections']; // Add more suffixes as needed
    return skipSuffixes.some(suffix => url.endsWith(suffix));
}

async function lens_articlelist_period_check(options) {
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
    //console.log(dois);
    inject_lens_doi(element, dois, options)
}


// Helper functions to create banner in other pages, e.g. search list, citation list
function lens_items(element, options) {
    // Whole page to add a bar with EID

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
    //console.log(lens_id);

    if (tiddlers.length === 1 && tiddlers[0].lens === undefined) {
        if (lens_id.length === 1) {
            await tiddlywikiPutTiddler(title = tiddlers[0].title, 
                tags = [], 
                fields = {lens: lens_id[0]}, host = options.tiddlywikihost);
        }
    } 
    //setItemStyle(element);
}


function getLensID(element) {
    const pattern = /\b(article[\/-]\d{3}-\d{3}-\d{3}-\d{3}-\d{2,3}[A-Z]?)\b/g;
    const matches = [...element.outerHTML.matchAll(pattern)];
    const normalized = matches.map(match =>
        match[1].replace(/^article-/, 'article/')
    );
    return [...new Set(normalized)];
}

function extractLensArticleID(url) {
    const match = url.match(/article\/(\d{3}-\d{3}-\d{3}-\d{3}-\d{3}[A-Z]?)/);
    return match ? `article/${match[1]}` : null;
}

// function getLensID(element) {
//     const pattern = /\b\d{3}-\d{3}-\d{3}-\d{3}-\d{3}\b/;
//     const match = element.outerHTML.match(pattern);
//     return match ? match[0] : null;
// }
