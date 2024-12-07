/**
 * Fetch tiddlers from TiddlyWiki based on a filter.
 * @param {string} filter - The filter string for querying tiddlers.
 * @param {string} host - The TiddlyWiki server host URL.
 * @returns {Promise<Object[]>} - A promise resolving to an array of tiddler objects.
 */
async function tiddlywikiGetTiddlers(filter, host) {
    const url = `${host}/recipes/default/tiddlers.json?filter=${encodeURIComponent(filter)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
    } catch (error) {
        //console.error("TiddlyWiki fetch error:", error.message);
        return [];
    }
}

