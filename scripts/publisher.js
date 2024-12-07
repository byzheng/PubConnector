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


// Helper function to add default icons when no TiddlyWiki tiddler is found
function addDefaultIconsDOI(div, id) {
    div.appendChild(scholara(id)); // Add Scholar search link for DOI
    div.appendChild(scopus_search_doi(id)); // Add Scopus search button by DOI
    div.appendChild(publisher_doi(id)); // Add Publisher link for DOI
    div.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
}

