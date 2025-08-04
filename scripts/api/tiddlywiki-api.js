// Perform a request to TiddlyWiki via background script
function tiddlywikiRequest(url, method = "GET", data = null) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                from: "fetchTiddlyWikiData",
                url: url,
                method: method,
                data: data
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Message error:", chrome.runtime.lastError.message);
                    reject(chrome.runtime.lastError);
                    return;
                }

                if (response && response.success) {
                    resolve(response.data); // ✅ Success
                } else {
                    console.error("TiddlyWiki request failed:", response?.error);
                    reject(response?.error || "Unknown error");
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



/**
 * Fetch or update a tiddler in TiddlyWiki.
 * @param {string} title - The title of the tiddler to check or update.
 * @param {Array<string>} tags - An array of tags to update/assign to the tiddler.
 * @param {Object} fields - The fields to update or create in the tiddler.
 * @param {string} host - The TiddlyWiki server host URL.
 * @returns {Promise<Object>} - A promise resolving to the updated tiddler object.
 */
async function tiddlywikiPutTiddler(title, tags = [], fields = {}, host) {
    const url = `${host}/recipes/default/tiddlers/${encodeURIComponent(title)}`;

    // Check if the tiddler exists
    const existingTiddler = await tiddlywikiRequest(url);

    // Use TiddlyWiki's built-in tag parser
    const normalizeTags = (input) => parseStringArray(input || []);

    if (existingTiddler) {
        const existingTags = normalizeTags(existingTiddler.tags);
        const mergedTags = [...new Set([...existingTags, ...tags])];
        const existingFields = existingTiddler.fields || {};
        const mergedFields = { ...existingFields, ...fields };
        const updatedTiddler = {
            ...existingTiddler,
            fields: mergedFields,
            tags: mergedTags // ensure tags is always the mergedTags array
        };

        return tiddlywikiRequest(url, "PUT", updatedTiddler);
    } else {
        const newTiddler = {
            title,
            tags: Array.isArray(tags) ? tags : normalizeTags(tags),
            ...fields
        };

        return tiddlywikiRequest(url, "PUT", newTiddler);
    }
}


/**
 * parseStringArray - Parses a TiddlyWiki-style string array into a JS array.
 * 
 * Adapted from: TiddlyWiki5 $tw.utils.parseStringArray
 * Source: https://github.com/TiddlyWiki/TiddlyWiki5
 * License: BSD 3-Clause (https://github.com/TiddlyWiki/TiddlyWiki5/blob/master/LICENSE)
 * 
 * Copyright (c) 2011–2024 Jeremy Ruston
 */
function parseStringArray(value, allowDuplicate = false) {
    if (typeof value === "string") {
        const memberRegExp = /(?:^|[^\S\xA0])(?:\[\[(.*?)\]\])(?=[^\S\xA0]|$)|([\S\xA0]+)/mg;
        const results = [];
        const names = {};
        let match;
        do {
            match = memberRegExp.exec(value);
            if (match) {
                const item = match[1] || match[2];
                if (item !== undefined && (!names.hasOwnProperty(item) || allowDuplicate)) {
                    results.push(item);
                    names[item] = true;
                }
            }
        } while (match);
        return results;
    } else if (Array.isArray(value)) {
        return value;
    } else {
        return null;
    }
}

export function Tiddlywiki(host) {
    const this_host = host || "http://localhost:8080";
        
    const CONTEXT = (() => {
        // Service worker (background in MV3)
        if (typeof self !== "undefined" && self.registration) {
            return "background";
        }

        // Popup (check for extension protocol and window context)
        if (typeof window !== "undefined" && window.location?.protocol === "chrome-extension:") {
            return "popup";
        }

        // Content script (has access to document and window)
        if (typeof window !== "undefined" && typeof document !== "undefined") {
            return "content";
        }

        return "unknown";
    })();



        
    // Perform a TiddlyWiki API request (supports GET and PUT)
    async function do_request(request) {
        const { url, method = "GET", data = null } = request;

        try {
            const options = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-requested-with": "TiddlyWiki"
                }
            };

            // Only include body for methods that allow it
            if (method === "PUT" || method === "POST") {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Failed TiddlyWiki ${method} request: ${response.status}`);
            }

            if (response.status === 204) {
                return { success: true, data: null }
            }
            //const result = await response.status === 204 ? null : response.json();
            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }



    function request(path, method = "GET", data = null) {
        if (typeof path !== "string" || path.trim() === "") {
            return Promise.reject(new Error("Invalid path: Path must be a non-empty string."));
        }
        let url = this_host + (path.startsWith("/") ? "" : "/") + path;
        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            return Promise.reject(new Error("Invalid URL: " + url));
        }
        if (CONTEXT == "content" || CONTEXT == "popup") {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    {
                        from: "fetchTiddlyWikiData",
                        url: url,
                        method: method,
                        data: data
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Message error:", chrome.runtime.lastError.message);
                            reject(chrome.runtime.lastError);
                            return;
                        }

                        if (response && response.success) {
                            resolve(response.data); // ✅ Success
                        } else {
                            console.error("TiddlyWiki request failed:", response?.error);
                            reject(response?.error || "Unknown error");
                        }
                    }
                );
            });
        } else if (CONTEXT == "background") {
            return do_request({
                        from: "fetchTiddlyWikiData",
                        url: url,
                        method: method,
                        data: data
                    }).then(response => {
                        if (response.success) {
                            return response.data;
                        } else {
                            return Promise.reject(response.error || "Unknown error");
                        }
                    });
        } else {
            // Handle unknown context
            return Promise.reject(new Error("Unknown context: " + CONTEXT));
        }
    }
    async function status() {
        const url = `${this_host}/status`;
        return request(url);
    }

    
    async function getTiddler(title) {
        if (!title || typeof title !== "string" || title.trim() === "") {
            return Promise.reject(new Error("Invalid title: Title must be a non-empty string."));
        }
        const path = `/recipes/default/tiddlers/${encodeURIComponent(title)}`;
        try {
            return await request(path);
        } catch (e) {
            return null;
        }
    }

    async function getTiddlers(filter) {
        if (!filter || typeof filter !== "string" || filter.trim() === "") {
            return Promise.reject(new Error("Invalid filter: Filter must be a non-empty string."));
        }
        const path = `/recipes/default/tiddlers.json?filter=${encodeURIComponent(filter)}`;
        return request(path);
    }


    async function getTiddlerByFilter(filter) {
        const tiddlers = await getTiddlers(filter);
        if (tiddlers.length === 0) {
            return;
        }
        if (tiddlers.length > 1) {
            return;
        }
        return tiddlers[0];
    }


    async function putTiddler(title, tags = [], fields = {}) {
        const path = `/recipes/default/tiddlers/${encodeURIComponent(title)}`;

        // Check if the tiddler exists
        const existingTiddler = await request(path);

        // Use TiddlyWiki's built-in tag parser
        const normalizeTags = (input) => parseStringArray(input || []);

        if (existingTiddler) {
            const existingTags = normalizeTags(existingTiddler.tags);
            const mergedTags = [...new Set([...existingTags, ...tags])];
            const existingFields = existingTiddler.fields || {};
            const mergedFields = { ...existingFields, ...fields };
            const updatedTiddler = {
                ...existingTiddler,
                fields: mergedFields,
                tags: mergedTags // ensure tags is always the mergedTags array
            };

            return request(path, "PUT", updatedTiddler);
        } else {
            const newTiddler = {
                title,
                tags: Array.isArray(tags) ? tags : normalizeTags(tags),
                ...fields
            };

            return request(path, "PUT", newTiddler);
        }
    }


    async function saveScholarAuthorCites(author, cites) {
        const path = "authors/scholar/update";
        return request(path, "POST", {
            id: author,
            works: cites
        });
    }


    async function getTiddlerByDOI(doi) {
        if (!doi || doi.trim() === "") {
            // console.error("DOI is undefined or empty");
            return;
        }
        const filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
        //console.log("getTiddlerByDOI filter: " + filter);
        return getTiddlerByFilter(filter);
    }

    async function getTiddlerText(title) {
        if (!title || title.trim() === "") {
            // console.error("Title is undefined or empty");
            return;
        }
        const tiddler = await getTiddler(title);
        if (!tiddler) {
            // console.error("Tiddler not found for title: " + title);
            return;
        }
        return tiddler.text;
    }



    async function getTiddlerByURL(url) {
        if (!url || url.trim() === "") {
            //console.error("URL is undefined or empty");
            return;
        }

        const filter = "[tag[bibtex-entry]field:bibtex-url[" + url + "]]";
        return getTiddlerByFilter(filter);
    }


    return {
        do_request:do_request,
        request: request,
        status: status,
        getTiddler: getTiddler,
        getTiddlers: getTiddlers,
        getTiddlerByFilter: getTiddlerByFilter,
        getTiddlerByDOI: getTiddlerByDOI,
        getTiddlerByURL: getTiddlerByURL,
        getTiddlerText: getTiddlerText,
        putTiddler: putTiddler,
        saveScholarAuthorCites: saveScholarAuthorCites
    };
}

