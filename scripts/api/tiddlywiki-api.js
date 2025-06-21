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



function Tiddlywiki(host) {
    const this_host = host || "http://localhost:8080";
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
    async function status() {
        const url = `${this_host}/status`;
        return request(url);
    }

    async function getTiddlers(filter) {
        if (!filter || typeof filter !== "string" || filter.trim() === "") {
            return Promise.reject(new Error("Invalid filter: Filter must be a non-empty string."));
        }
        const path = `/recipes/default/tiddlers.json?filter=${encodeURIComponent(filter)}`;
        return request(path);
    }


    async function getTiddler(filter) {
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


    saveScholarAuthorCites = async function (author, cites) {
        const path = "authors/scholar/update";
        return request(path, "POST",
            data = {
                id: author,
                works: cites
            });
    }


    async function getTiddlerByDOI(doi) {
        if (!doi || doi.trim() === "") {
            // console.error("DOI is undefined or empty");
            return;
        }
        const filter = "[tag[bibtex-entry]field:bibtex-doi[" + doi + "]]";
        return getTiddler(filter);
    }
    return {
        status: status,
        getTiddlers: getTiddlers,
        getTiddler: getTiddler,
        getTiddlerByDOI: getTiddlerByDOI,
        putTiddler: putTiddler,
        saveScholarAuthorCites: saveScholarAuthorCites
    };
}


