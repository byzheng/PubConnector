// render banner at the publishers
async function publisher(options) {
    var doi = getDOI();
    if (doi === undefined) {
        return;
    }
    var banner = createBanner();
    // Make the request to TiddlyWiki
    var filter = buildTiddlyWikiFilter(doi, "doi");
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

    //gettiddler(doi, "doi", options.tiddlywikihost);
}


// Helper function to build TiddlyWiki filter based on type and ID
function buildTiddlyWikiFilter(id, type) {
    if (type === "doi") {
        return `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${id}]]`;
    } else if (type === "eid") {
        return `[tag[bibtex-entry]field:scopus-eid[${id}]]`;
    }
    return "";
}

