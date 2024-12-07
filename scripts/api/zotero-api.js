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


// Fetch metadata from Zotero API by item key or identifier
async function zoteroSearchItemsByDOI(doi, host) {
    const path = "/users/7515/items";
    const query = {
        q: doi,
        qmode: "everything",
    };

    const url = buildZoteroApiUrl(host, path, query);
    chrome.runtime.sendMessage(
        {
            from: "fetchZoteroData",  // Identifier to tell background script the type of request
            url: url                  // The URL to be passed to Zotero API
        },
        function(response) {
            // Handle the response here
            if (response.success) {
                console.log("Zotero data fetched successfully:", response.data);
            } else {
                console.error("Failed to fetch Zotero data:", response.error);
            }
        }
    );
}
