// Get tiddlers by different fields

// This script provides functions to retrieve tiddlers based on various fields such as scholar CID, URL, and DOI.


async function getTiddlerByFilter(filter, host) {
    if (!filter) {
        // console.error("Filter is undefined or empty");
        return;
    }
    if (!host) {
        //console.error("Host is undefined or empty");
        return;
    }
    const tiddlers = await tiddlywikiGetTiddlers(filter, host);
    if (tiddlers.length === 0) {
        // console.warn("No tiddler found for filter: " + filter);
        return;
    }
    if (tiddlers.length > 1) {
        // console.warn("Multiple tiddlers found for filter: " + filter);
        return;
    }
    return tiddlers[0];
}

async function getTiddlerByScholarCID(cid, host) {
    if (!cid || cid.trim() === "") {
        // console.error("Scholar CID is undefined or empty");
        return;
    }
    const filter = "[tag[bibtex-entry]field:scholar-cid[" + cid + "]]";
    return getTiddlerByFilter(filter, host);
}

async function getTiddlerByURL(url, host) {
    if (!url || url.trim() === "") {
        //console.error("URL is undefined or empty");
        return;
    }
    
    const filter = "[tag[bibtex-entry]field:bibtex-url[" + url + "]]";
    return getTiddlerByFilter(filter, host);
}

async function getTiddlerByDOI(doi, host) {
    if (!doi || doi.trim() === "") {
        // console.error("DOI is undefined or empty");
        return;
    }
    const filter = "[tag[bibtex-entry]field:bibtex-doi[" + doi + "]]";
    return getTiddlerByFilter(filter, host);
}

