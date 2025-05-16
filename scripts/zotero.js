async function importBibtexToTiddlyWikiByDOI(doi, options) {

    // Get Zotero items
    const items = await zoteroSearchItemsByDOI(doi, options.zoterohost);
    if (!Array.isArray(items) || items.length === 0) {
        return;
    }

    // get item key
    var item_key = getZoteroItemKey(items[0]);
    if (item_key === null) {
        return;
    }
    const zotero_bibtex_host = options.zoterohost.replace(/api\//, 'better-bibtex/json-rpc');
    const cite_key = await getBibtexCiteKey(zotero_bibtex_host, item_key); 

    if (cite_key === null) {
        return;
    }
    const foundCiteKey = cite_key[item_key];
    if (foundCiteKey === null) {
        return;
    }
    // get bibtex entry according to cite key
    const bibtex = await getBibtexByCiteKey(zotero_bibtex_host, foundCiteKey);
    if (bibtex === null) {
        return;
    }
    //console.log("bibtex", bibtex);
    // send bibtex entry to tiddlywiki
    chrome.runtime.sendMessage({
        from: "webpage",
        doi: doi,
        method: "new_bibtex_entry",
        bibtex: bibtex,
        title: foundCiteKey,
        host: options.tiddlywikihost
    });
}