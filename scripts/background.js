
import { UpdateData } from './task_schedule.js';
import { Tiddlywiki } from './api/tiddlywiki-api.js';

const this_tw = Tiddlywiki();
// transfer message
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.from == "webpage") {
            linkTiddlywiki(request);
        }

        if (request.from === "fetchTiddlyWikiData") {
            this_tw.do_request(request)
                .then(response => {
                    sendResponse(response);  // Send the result back to the sender
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });  // Handle any errors
                });

            // Return true to indicate asynchronous response
            return true;
        }

        if (request.from === "fetchZoteroData") {
            performZoteroRequest(request)
                .then(response => {
                    sendResponse(response);  // Send the result back to the sender
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });  // Handle any errors
                });

            // Return true to indicate asynchronous response
            return true;
        }

        if (request.from === "fetchBibtexData") {
            performBibtexRequest(request)
                .then(response => {
                    sendResponse(response);  // Send the result back to the sender
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });  // Handle any errors
                });

            // Return true to indicate asynchronous response
            return true;
        }

        if (request.from === "fetchCorssRefWorks") {
            performZoteroRequest(request)
                .then(response => {
                    sendResponse(response);
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });

            // Return true to indicate asynchronous response
            return true;
        }
    });


// Popup menu
chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        title: "Send image to Tiddlywiki",
        id: "tw-send-image",
        contexts: ["image"]
    });
    // chrome.contextMenus.create({
    //     parentId: "tw-research",
    //     id: "item-hidden",
    //     title: "Show/Hide Exist Item"
    // })
    // chrome.contextMenus.create({
    // parentId: "tw-research",
    // id: "citation-hidden",
    // title: "Citation Hidden"
    // })
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    let context_menus = ['tw-send-image'];
    if (context_menus.includes(info.menuItemId)) {
        (async () => {
            const [tab] = await chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            });
            // send message to console.js to ask for details from the DOM about the context link
            const response = await chrome.tabs.sendMessage(tab.id, {
                from: "context-menu",
                info: info
            });

        })();
    }
});

function loadOptions() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            tiddlywikihost: 'http://localhost:8080',
            zoterohost: 'http://localhost:23119/api/',
            singlefileid: ''
        }, resolve);
    });
}


chrome.action.onClicked.addListener(async () => {
    const options = await loadOptions();
    const updateDate = await UpdateData(options);
    await updateDate.doUpdate();
    // const schedule = await ScheduleTask(options);
    // schedule.scholarSearchDOI();
});

// Link to TiddlyWiki
function linkTiddlywiki(request) {
    let url = new URL("/", request.host).toString();

    chrome.tabs.query({ url: url }, async function (tabs) {
        let tab;

        if (tabs.length === 0) {
            tab = await new Promise((resolve) => {
                chrome.tabs.create({ url: url }, resolve);
            });
        } else {
            tab = tabs[0];
        }

        // Ensure tab has a windowId before updating
        if (!tab.windowId) {
            tab = await new Promise((resolve) => {
                chrome.tabs.get(tab.id, resolve);
            });
        }

        // Ensure window and tab are focused
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.update(tab.id, { active: true });

        // Check tab status before waiting
        let tabInfo = await new Promise((resolve) => chrome.tabs.get(tab.id, resolve));

        if (tabInfo.status !== "complete") {
            // Wait only if the tab is still loading
            await new Promise((resolve) => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === tab.id && changeInfo.status === "complete") {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                });
            });
        }
        // Now send the message
        chrome.tabs.sendMessage(tab.id, {
            from: "worker",
            request: request
        });
    });
}


// Perform a zotero api request
async function performZoteroRequest(request) {
    const url = request.url;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Zotero-API-Version": "3",
                "Content-Type": "application/json",
                "x-zotero-connector-api-version": "2",
                "zotero-allowed-request": ""

            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Zotero data: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };  // Return the data as a resolved result
    } catch (error) {
        //console.error("Error in background fetch:", error);
        return { success: false, error: error.message };  // Return error as a result
    }
}




// Perform a zotero better bibtex api request
async function performBibtexRequest(request) {
    if (typeof request.method !== "string") {
        throw new Error("method must be a single character");
    }
    if (!request.zoteroRPC.endsWith("better-bibtex/json-rpc")) {
        throw new Error("zoteroRPC must end with 'better-bibtex/json-rpc'");
    }
    try {
        const response = await fetch(request.zoteroRPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "jsonrpc": "2.0",
                "method": request.method,
                "params": request.params,
                "id": request.id
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch RPC: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        //console.error("Error in background fetch:", error);
        return { success: false, error: error.message };  // Return error as a result
    }
}



// // Perform a TiddlyWiki API request (supports GET and PUT)
// async function performTiddlyWikiRequest(request) {
//     const { url, method = "GET", data = null } = request;

//     try {
//         const options = {
//             method,
//             headers: {
//                 "Content-Type": "application/json",
//                 "x-requested-with": "TiddlyWiki"
//             }
//         };

//         // Only include body for methods that allow it
//         if (method === "PUT" || method === "POST") {
//             options.body = JSON.stringify(data);
//         }

//         const response = await fetch(url, options);

//         if (!response.ok) {
//             throw new Error(`Failed TiddlyWiki ${method} request: ${response.status}`);
//         }

//         if (response.status === 204) {
//             return { success: true, data: null }
//         }
//         //const result = await response.status === 204 ? null : response.json();
//         const result = await response.json();
//         return { success: true, data: result };
//     } catch (error) {
//         return { success: false, error: error.message };
//     }
// }






