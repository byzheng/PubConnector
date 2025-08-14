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
    async function AutoCloseTab() {
        const enabledText = await this_tw.getTiddlerText("$:/config/tw-connector/authoring/scholar/auto-close");
        if (!enabledText || typeof enabledText !== "string") {
            return false;
        }
        return enabledText.trim().toLowerCase() === "enable" ? true : false;
        
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
            return limit;
        }
        const limitedPendingIds = pendingIds.slice(0, Math.min(limit, pendingIds.length));
        const autoClose = await AutoCloseTab();
        for (const scholarId of limitedPendingIds) {
            const url = `https://scholar.google.com/citations?user=${encodeURIComponent(scholarId)}`;
            const tab = await chrome.tabs.create({ url, active: false });
            await waitForTabToLoad(tab.id);
            await helper.delay(2000);
            if (autoClose) {
                chrome.tabs.remove(tab.id);
            }
        }
        const remainingLimit = Math.max(0, limit - limitedPendingIds.length);
        return remainingLimit;
    }

    async function DoUpdateCites(limit) {
        if (limit === undefined || isNaN(limit) || limit < 0) {
            console.error("Invalid limit for scholar updates:", limit);
            return;
        }
        if (limit === 0) {
            return;
        }
        const autoClose = await AutoCloseTab();
        
        const filter = `[tag[bibtex-entry]has[bibtex-doi]!has:field[scholar-cites]] [tag[bibtex-entry]has[bibtex-doi]!has:field[scholar-cid]] +[limit[${limit}]]`;

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
            if (autoClose) {
                chrome.tabs.remove(tab.id);
            }
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


export async function ScheduleTask(options) {
    const this_options = options;
    const this_tw = await Tiddlywiki(options.tiddlywikihost);
    const this_update = await UpdateData(options);

    const ENABLE_TIDDLER = "$:/config/tw-connector/authoring/auto-update/enable";
    const HOUR_TIDDLER = "$:/config/tw-connector/authoring/auto-update/hour";
    const MINUTE_TIDDLER = "$:/config/tw-connector/authoring/auto-update/minute";

    async function Enable() {
        const enabledText = await this_tw.getTiddlerText(ENABLE_TIDDLER);
        if (!enabledText || typeof enabledText !== "string") {
            return false;
        }
        return enabledText.trim().toLowerCase() === "enable" ? true : false;
    }
    async function Hour() {
        const hourText = await this_tw.getTiddlerText(HOUR_TIDDLER);
        if (!hourText || typeof hourText !== "string") {
            return "-1";
        }
        return hourText.trim();
    }

    async function Minute() {
        const minuteText = await this_tw.getTiddlerText(MINUTE_TIDDLER);
        if (!minuteText || typeof minuteText !== "string") {
            return "-1";
        }
        return minuteText.trim();
    }

    let lastRun = "";

    function isValidHour(hour) {
        return hour === -1 || (Number.isInteger(hour) && hour >= 0 && hour <= 23);
    }

    function isValidMinute(minute) {
        return minute === -1 || (Number.isInteger(minute) && minute >= 0 && minute <= 58);
    }

    function shouldRunNow(now, hourStr, minuteStr) {
        const hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);
        const nowHour = now.getHours();
        const nowMinute = now.getMinutes();
        const key = `${now.toDateString()} ${nowHour}:${nowMinute}`;
    
        if (!isValidHour(hour) || !isValidMinute(minute)) {
            console.warn(`⚠️ Invalid schedule time: hour=${hourStr}, minute=${minuteStr}`);
            return false;
        }

        // Prevent repeated execution
        if (lastRun === key) return false;

        const matchHour = (hour === -1 || nowHour === hour);
        const matchMinute = (minute === -1 || nowMinute === minute + 1); // Allow one minute grace period
        
        if (matchHour && matchMinute) {
            lastRun = key;
            return true;
        }
        return false;
    }
    async function Update() {
        console.log("⏰ Auto update scheduled to run daily at", await Hour(), ":", await Minute());
        setInterval(async () => {
            const enabled = await Enable();
            if (!enabled) return;

            const now = new Date();
            const hour = await Hour();
            const minute = await Minute();

            if (shouldRunNow(now, hour, minute)) {
                console.log("⏰ Auto update triggered at", now.toLocaleString());
                await this_update.doUpdate();
                console.log("✅ Auto update caches started successfully.");
                return;
            }

       }, 60 * 1000); // Check every minute
    }
    return {
        Update: Update
    };  
}