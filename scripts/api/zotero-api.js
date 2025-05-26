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
            function (response) {
                if (response.success) {
                    //console.log("Zotero data fetched successfully:", response.data);
                    resolve(response.data); // Resolve with the data
                } else {
                    //console.error("Failed to fetch Zotero data:", response.error);
                    resolve(null);
                }
            }
        );
    });
}

// Fetch metadata from Zotero API by item key or identifier
async function zoteroSearchItemsByDOI(doi, host) {
    const path = "/users/0/items";
    const query = {
        q: doi,
        qmode: "everything",
    };

    const url = buildZoteroApiUrl(host, path, query);

    const items = await zoteroRequest(url);

    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    const item = items.find(item =>
        item.data.itemType !== 'attachment' &&
        typeof item.data.DOI === 'string' &&
        item.data.DOI.toLowerCase() === doi.toLowerCase()
    );

    return item

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




// Fectch site key from better-bibtex

// Perform a request to zotero
function bibtexRpcRequest(zoteroRPC, method, params, id = 1) {
    if (typeof method !== "string") {
        throw new Error("method must be a single character");
    }
    if (!zoteroRPC.endsWith("better-bibtex/json-rpc")) {
        throw new Error("zoteroRPC must end with 'better-bibtex/json-rpc'");
    }
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                from: "fetchBibtexData",
                zoteroRPC: zoteroRPC,
                method: method,
                params: params,
                id: id
            },
            function (response) {
                if (response.success) {
                    resolve(response.data);
                } else {
                    resolve(null);
                }
            }
        );
    });
}



async function getBibtexCiteKey(zoteroRPC, items) {
    if (!Array.isArray(items)) {
        if (items == null) return null;
        items = [items];
    }
    if (items.length === 0) return null;
    // Call the RPC method "item.citationkey" with the correct params
    const response = await bibtexRpcRequest(
        zoteroRPC,
        "item.citationkey",
        { item_keys: items }
    );

    if (response && typeof response === "object" && response.result) {
        return response.result;
    }
    return null;
}

async function getBibtexByCiteKey(zoteroRPC, citekey) {
    if (!Array.isArray(citekey)) {
        if (citekey == null) return null;
        citekey = [citekey];
    }
    if (citekey.length === 0) return null;
    // Call the RPC method "item.citationkey" with the correct params
    const response = await bibtexRpcRequest(
        zoteroRPC,
        "item.export",
        {
            "translator": "Better BibLaTeX",
            "citekeys": citekey
        }
    );

    if (response && typeof response === "object" && response.result) {
        return response.result;
    }
    return null;
}