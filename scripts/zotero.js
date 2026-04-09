async function importBibtexToTiddlyWikiByDOI(doi, options, tw_api) {
    console.info('Starting DOI import to TiddlyWiki', { doi });

    // Get Zotero items
    const item = await zoteroSearchItemsByDOI(doi, options.zoterohost);

    if (!item) {
        console.warn('No Zotero item found with matching DOI', { doi });
        return null;
    }
    // get item key
    var item_key = getZoteroItemKey(item);
    if (item_key === null) {
        console.warn('Zotero item key was missing', { doi });
        return null;
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
        console.warn('Could not retrieve Better BibTeX cite key', { doi, item_key });
        return null;
    }
    const foundCiteKey = cite_key[item_key];
    if (foundCiteKey === null) {
        console.warn('Better BibTeX cite key not found for item', { doi, item_key });
        return null;
    }
    // get bibtex entry according to cite key
    const bibtex = await getBibtexByCiteKey(zotero_bibtex_host, foundCiteKey);
    if (bibtex === null) {
        console.warn('Could not retrieve BibTeX entry for cite key', { doi, foundCiteKey });
        return null;
    }
    
    
    // send bibtex entry to tiddlywiki

    console.info('Sending BibTeX entry to TiddlyWiki', { doi, foundCiteKey });
    await tw_api.addNewBibtex(bibtex);
    console.info('BibTeX entry saved to TiddlyWiki', { doi, foundCiteKey });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    chrome.runtime.sendMessage({
        from: "webpage",
        method: "open-tiddler",
        tiddler: foundCiteKey
    });

    
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    //console.log("bibtex", bibtex);
    // trigger single file save
    const singlefileid = options.singlefileid;
    if (singlefileid) {
        console.info('Requesting SingleFile page save', { doi, foundCiteKey });
        chrome.runtime.sendMessage(singlefileid, "save-page")
    }
    // Pause for 1 second before proceeding
    console.info('Completed DOI import to TiddlyWiki', { doi, foundCiteKey });
    return foundCiteKey;
}

async function requestSingleFileSave(singlefileid) {
    try {
        const response = await Promise.race([
            chrome.runtime.sendMessage(singlefileid, "save-page"),
            new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 10000))
        ]);

        if (response?.timeout) {
            console.warn('SingleFile did not finish within 10 seconds. Continuing without waiting longer.');
            return true;
        }

        if (response === undefined) {
            console.warn('SingleFile did not provide a completion response. Page reload skipped.');
            return false;
        }

        if (response?.ok === false) {
            console.warn('SingleFile reported a save failure:', response);
            return false;
        }

        return true;
    } catch (error) {
        console.warn('Failed to send save request to SingleFile:', error);
        return false;
    }
}
