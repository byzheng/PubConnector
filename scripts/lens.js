// Functions to scopus.com

// Main functions for scopus
async function lens(options) {
    lens_items(options);
}

// Helper functions to create banner in other pages, e.g. search list, citation list
function lens_items(options) {
    // Whole page to add a bar with EID
    var url = new URL(window.location.href);
    
    var selector_lens = [
        "div.div-table-results-row.ng-scope" // for search list
    ];
    var items;
    for (let i = 0; i < selector_lens.length; i++) {
        items = document.querySelectorAll(selector_lens[i]);
        if (items.length > 0) {
            break;
        }
    }
    if (items === undefined) {
        return;
    }


    // Process for each item
    for (let i = 0; i < items.length; i++) {
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
