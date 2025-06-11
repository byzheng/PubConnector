import * as helper from './helper.js';


export function ScheduleTask(options) {
    const this_options = options;

    // Perform a TiddlyWiki API request (supports GET and PUT)
    async function performTiddlyWikiRequest(url, method = "GET", data = null) {

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



    /**
     * Fetch tiddlers from TiddlyWiki based on a filter.
     * @param {string} filter - The filter string for querying tiddlers.
     * @param {string} host - The TiddlyWiki server host URL.
     * @returns {Promise<Object[]>} - A promise resolving to an array of tiddler objects.
     */
    async function tiddlywikiGetTiddlers(filter, host) {
        const url = `${host}/recipes/default/tiddlers.json?filter=${encodeURIComponent(filter)}`;
        console.log(url);
        return performTiddlyWikiRequest(url);
    }


    async function waitForTabToLoad(tabId) {
        return new Promise(resolve => {
            const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    async function scholarSearchDOI() {

        const filter = "[tag[bibtex-entry]has[bibtex-doi]!has:field[scholar-cid]limit[2]]";

        const tiddlers = await tiddlywikiGetTiddlers(filter, this_options.tiddlywikihost);


        for (const tiddler of tiddlers.data) {
            const doi = helper.extractDOIs(tiddler["bibtex-doi"]);
            if (!doi || doi.length === 0) {
                continue;
            }
            const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(doi[0])}`;
            console.log(url);
            const tab = await chrome.tabs.create({ url, active: false });
            await waitForTabToLoad(tab.id);
            await helper.delay(2000);
            // chrome.tabs.remove(tab.id);
        }
    }
    return ({
        scholarSearchDOI: scholarSearchDOI
    });

}
