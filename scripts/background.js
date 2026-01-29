
import { ScheduleTask, UpdateData } from './task_schedule.js';
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
        // Use the tab parameter if available (most reliable for context menu actions)
        let targetTab = tab;
        if (!targetTab) {
            // Fallback: try to get the active tab (may not work for popout/modal windows)
            const tabs = await chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            });
            targetTab = tabs[0];
        }
        if (targetTab) {
            // send message to content script to ask for details from the DOM about the context link
            await chrome.tabs.sendMessage(targetTab.id, {
                from: "context-menu",
                info: info
            });
        } else {
            console.warn("No active tab found for context menu action.");
        }
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

// Global schedule object
let scheduleTask = null;

// WebSocket connection for TiddlyWiki
let ws = null;

async function connectWebSocket() {
    const options = await loadOptions();
    const url = new URL(options.tiddlywikihost);
    
    // Use default port 80 if port is empty
    const port = url.port ? url.port : (url.protocol === "https:" ? "443" : "80");
    const wsUrl = `ws://${url.hostname}:${port}/ws`;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = function() {
            console.log("WebSocket connected to TiddlyWiki");
        };

        ws.onclose = function() {
            console.log("WebSocket disconnected, reconnecting...");
            // Reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = function(error) {
            console.error("WebSocket error:", error);
        };

        ws.onmessage = function(event) {
            console.log("Message from server:", event.data);
        };
    } catch (error) {
        console.error("Failed to create WebSocket:", error);
        setTimeout(connectWebSocket, 3000);
    }
}

chrome.action.onClicked.addListener(async () => {
    const options = await loadOptions();
    const updateData = await UpdateData(options);
    await updateData.doUpdate();
});


// Initialize scheduled updates on extension startup
(async function() {
    const options = await loadOptions();
    scheduleTask = await ScheduleTask(options);
    scheduleTask.Update();
    
    // Initialize WebSocket connection
    await connectWebSocket();
})();


// Listen for alarms to trigger scheduled tasks
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'tw-literature-schedule' && scheduleTask) {
        await scheduleTask.CheckAndRun();
    }
});

// Link to TiddlyWiki via WebSocket
function linkTiddlywiki(request) {
    // Send message via WebSocket
    console.log("linkTiddlywiki called with request:", request);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "open-tiddler",
            title: request.tiddler
        }));
        console.log("Sent open-tiddler message via WebSocket");
    } else {
        console.warn("WebSocket not connected, cannot send message");
        // Optionally, try to reconnect
        connectWebSocket();
    }
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






