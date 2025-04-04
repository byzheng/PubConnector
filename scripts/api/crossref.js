// Perform a request to crossref
function buildCrossRefApiUrl(path, query = {}) {
    const host = "https://api.crossref.org/"
    const normalizedHost = host.replace(/\/+$/, "");

    // Ensure the path starts with a single slash
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Convert query object to URL search parameters
    const queryString = new URLSearchParams(query).toString();

    // Construct the full URL
    return `${normalizedHost}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}


function crossrefRequest(url) {

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                from: "fetchCorssRefWorks",
                url: url
            },
            function(response) {
                if (response.success) {
                    resolve(response.data);
                } else {
                    resolve(null);
                }
            }
        );
    });
}

// Fetch first PDF attachment for an item
function crossrefWorks(doi) {
    const path = "/works/" + doi;
    const query = {};

    const url = buildCrossRefApiUrl(path, query);
    return crossrefRequest(url);
}
