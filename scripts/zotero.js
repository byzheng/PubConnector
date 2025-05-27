async function importBibtexToTiddlyWikiByDOI(doi, options) {

    // Get Zotero items
    const item = await zoteroSearchItemsByDOI(doi, options.zoterohost);

    if (!item) {
        console.log('No item found with matching DOI');
        return;
    }
    // get item key
    var item_key = getZoteroItemKey(item);
    if (item_key === null) {
        return;
    }
    // get the pdf attachement key
    const attachmentHref = item?.links?.attachment?.href;
    let pdf_key = null;
    if (attachmentHref) {
        const parts = attachmentHref.split('/');
        pdf_key = parts[parts.length - 1];
    }
    //console.log("pdf_key", pdf_key);

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
        host: options.tiddlywikihost,
        pdf_key: pdf_key
    });

    // trigger single file save
    const singlefileid = options.singlefileid;
    if (singlefileid) {
        chrome.runtime.sendMessage(singlefileid, "save-page");
    }


}