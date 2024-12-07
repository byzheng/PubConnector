// Functions for publisher pages except scholar.google.com and scopus.com

async function publisher(options) {
    var doi = getDOI();
    if (doi === undefined) {
        return;
    }
    var banner = createBanner();
    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);


    if (tiddlers.length > 0) {
        // Add TiddlyWiki-related icons or actions
        addTiddlyWikiIconsDOI(banner, tiddlers[0], doi, options.tiddlywikihost);
        // Insert colleague and domain info
        insertColleagueAndDomainInfo(tiddlers[0], options.tiddlywikihost);
    } else {
        addDefaultIconsDOI(banner, doi);
    }
    // Add Zotero related icons
    await addZoteroIconsDOI(banner, doi, options.zoterohost);

    // Set finally width of banner
    bannerSetWidth(banner);

}


// Helper function to add TiddlyWiki icons and links to the banner
function addTiddlyWikiIconsDOI(div, tiddler, doi, host) {
    div.appendChild(tw_link(tiddler.title, "tw-svg", host)); // Add link back to TiddlyWiki 
    div.appendChild(scholara(doi)); // Add Scholar link through searching DOI

    if (tiddler["scopus-eid"]) {
        div.appendChild(scopusa(tiddler["scopus-eid"])); // Add Scopus link if scopus-eid is found
    } else {
        div.appendChild(scopus_search_doi(doi)); // Add link to search Scopus by DOI
    }
    // Add Reading tag icon if applicable
    if (tiddler.tags.includes("Reading")) {
        div.appendChild(reading_span());
    }
}


// Helper function to add TiddlyWiki icons and links to the banner
async function addZoteroIconsDOI(div, doi, host) {

    const items = await zoteroSearchItemsByDOI(doi, host);
    if (!Array.isArray(items) || items.length === 0) {
        return;
    }

    var item_key = getZoteroItemKey(items[0]);
    if (item_key === null) {
        return;
    }
    div.appendChild(addZeteroSpan(item_key)); 

    // Get children for pdfs
    const items_children = await zoteroChildren(item_key, host);
    if (!Array.isArray(items_children) || items_children.length === 0) {
        return;
    }
    for (let i = 0; i < items_children.length; i++) {
        const item = items_children[i];

        // Check if the contentType is "application/pdf"
        if (item.data && item.data.contentType === "application/pdf") {
            var pdf_key = getZoteroItemKey(item);
            if (pdf_key === null) {
                return;
            }
            div.appendChild(addZeteroPDFSpan(pdf_key));
        }
    }

}




// Helper function to add default icons when no TiddlyWiki tiddler is found
function addDefaultIconsDOI(div, id) {
    div.appendChild(scholara(id)); // Add Scholar search link for DOI
    div.appendChild(scopus_search_doi(id)); // Add Scopus search button by DOI
    div.appendChild(publisher_doi(id)); // Add Publisher link for DOI
    div.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
}

