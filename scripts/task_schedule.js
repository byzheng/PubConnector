import * as helper from './helper.js';
import { Tiddlywiki } from './api/tiddlywiki-api.js';


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


export async function UpdateScholar(options) {
    const this_options = options;
    const this_tw = await Tiddlywiki(options.tiddlywikihost);
    async function Enable() {
        const enabledText = await this_tw.getTiddlerText("$:/config/tw-connector/authoring/scholar/enable");
        if (!enabledText || typeof enabledText !== "string") {
            return false;
        }
        return enabledText.trim().toLowerCase() === "enable" ? true : false;
    }
    async function Limit() {
        const limitText = await this_tw.getTiddlerText("$:/config/tw-connector/authoring/scholar/limit");
        return limitText && !isNaN(parseInt(limitText)) ? parseInt(limitText) : 5;
    }
    async function Pending() {
        const path =  "/authors/scholar/pending";
        try {
            const response = await this_tw.request(path);
            if (!response || response.status !== "success" || !Array.isArray(response.data?.pending)) {
                return [];
            }
            console.log("Pending scholar IDs:", response.data.pending);
            const pendingIds = response.data.pending;
            return pendingIds;
        } catch (error) {
            console.error("Error fetching pending scholar IDs:", error);
            return [];
        }
    }
    async function DoUpdateUser(limit) {
        const pendingIds = await Pending();
        if (!pendingIds || pendingIds.length === 0) {
            console.log("No pending scholar IDs to process.");
            return;
        }
        const limitedPendingIds = pendingIds.slice(0, Math.min(limit, pendingIds.length));
        for (const scholarId of limitedPendingIds) {
            const url = `https://scholar.google.com/citations?user=${encodeURIComponent(scholarId)}`;
            const tab = await chrome.tabs.create({ url, active: false });
            await waitForTabToLoad(tab.id);
            await helper.delay(2000);
            // Optionally: chrome.tabs.remove(tab.id);
        }
        const remainingLimit = Math.max(0, limit - limitedPendingIds.length);
        return remainingLimit;
    }

    async function DoUpdateCites(limit) {
        if (!limit || isNaN(limit) || limit <= 0) {
            console.error("Invalid limit for scholar updates:", limit);
            return;
        }
        const filter = `[tag[bibtex-entry]has[bibtex-doi]!has:field[scholar-cid]limit[${limit}]]`;

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
    async function DoUpdate() {
        const enabled = await Enable();
        if (!enabled) {
            return;
        }
        const limit = await Limit();
        if (!limit || isNaN(limit) || limit <= 0) {
            console.error("Invalid limit for scholar updates:", limit);
            return;
        }

        const remainingLimit = await DoUpdateUser(limit);
        await DoUpdateCites(remainingLimit);
    }
    return {
        enable: Enable,
        limit: Limit,
        pending: Pending,
        doUpdate: DoUpdate
    };
}

export async function UpdateData(options) {
    const this_options = options;
    const this_scholar = await UpdateScholar(options);
    async function DoUpdate() {
        await this_scholar.doUpdate();
    }
    return {
        doUpdate: DoUpdate
    };
}


// export async function ScheduleTask(options) {
//     const this_options = options;
//     const this_tw = await Tiddlywiki(options.tiddlywikihost);

//     async function scholarSearchDOI() {

//         const filter = "[tag[bibtex-entry]has[bibtex-doi]!has:field[scholar-cid]limit[2]]";

//         const tiddlers = await this_tw.getTiddlers(filter);


//         for (const tiddler of tiddlers) {
//             const doi = helper.extractDOIs(tiddler["bibtex-doi"]);
//             if (!doi || doi.length === 0) {
//                 continue;
//             }
//             const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(doi[0])}`;
//             console.log(url);
//             const tab = await chrome.tabs.create({ url, active: false });
//             await waitForTabToLoad(tab.id);
//             await helper.delay(2000);
//             // chrome.tabs.remove(tab.id);
//         }
//     }
//     return ({
//         scholarSearchDOI: scholarSearchDOI,
//         processPendingScholars: processPendingScholars
//     });

// }
