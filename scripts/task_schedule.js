import * as helper from './helper.js';
import { Tiddlywiki } from './api/tiddlywiki-api.js';


export async function ScheduleTask(options) {
    const this_options = options;
    const this_tw = await Tiddlywiki(options.tiddlywikihost);

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

        const tiddlers = await this_tw.getTiddlers(filter);


        for (const tiddler of tiddlers) {
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
