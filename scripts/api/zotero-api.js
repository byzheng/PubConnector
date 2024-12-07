// Helper function to build a url
function buildZoteroApiUrl(host, path, query = {}) {
    // Ensure the host does not have a trailing slash
    const normalizedHost = host.replace(/\/+$/, "");

    // Ensure the path starts with a single slash
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Convert query object to URL search parameters
    const queryString = new URLSearchParams(query).toString();

    // Construct the full URL
    return `${normalizedHost}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}


// Perform a request to zotero
function zoteroRequest(url) {

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                from: "fetchZoteroData",  // Identifier to tell background script the type of request
                url: url                  // The URL to be passed to Zotero API
            },
            function(response) {
                if (response.success) {
                    //console.log("Zotero data fetched successfully:", response.data);
                    resolve(response.data); // Resolve with the data
                } else {
                    //console.error("Failed to fetch Zotero data:", response.error);
                    reject(new Error(response.error)); // Reject with the error message
                }
            }
        );
    });
}

// Fetch metadata from Zotero API by item key or identifier
function zoteroSearchItemsByDOI(doi, host) {
    const path = "/users/0/items";
    const query = {
        q: doi,
        qmode: "everything",
    };

    const url = buildZoteroApiUrl(host, path, query);

    return zoteroRequest(url);
}


// Fetch first PDF attachment for an item
function zoteroChildren(key, host) {
    const path = "/users/0/items/" + key + "/children";
    const query = {};

    const url = buildZoteroApiUrl(host, path, query);
    return zoteroRequest(url);
}



// get zotero item key
function getZoteroItemKey(item) {
    if (item === undefined || item === null) {
        return null;
    }
    if (item.data === undefined || item.data === null) {
        return null;
    }
    if (item.data.key === undefined || item.data.key === null) {
        return null;
    }
    return item.data.key;
}