// Perform a request to zotero
function tiddlywikiRequest(url) {

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                from: "fetchTiddlyWikiData",  // Identifier to tell background script the type of request
                url: url                  // The URL to be passed to TiddlyWiki API
            },
            function(response) {
                if (response.success) {
                    //console.log("TiddlyWiki data fetched successfully:", response.data);
                    resolve(response.data); // Resolve with the data
                } else {
                    //console.error("Failed to fetch TiddlyWiki data:", response.error);
                    resolve(null);
                }
            }
        );
    });
}


/**
 * Fetch tiddlers from TiddlyWiki based on a filter.
 * @param {string} filter - The filter string for querying tiddlers.
 * @param {string} host - The TiddlyWiki server host URL.
 * @returns {Promise<Object[]>} - A promise resolving to an array of tiddler objects.
 */
async function tiddlywikiGetTiddlers(filter, host) {
    const url = `${host}/recipes/default/tiddlers.json?filter=${encodeURIComponent(filter)}`;
    return tiddlywikiRequest(url);
}

