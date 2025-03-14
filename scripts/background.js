
// transfer message
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // console.log(request);

        if (request.from == "webpage") {
            linkTiddlywiki(request);
        }
        
        if (request.from === "fetchTiddlyWikiData") {
            performTiddlyWikiRequest(request)
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



// link to tiddlywiki
function linkTiddlywiki(request) {
    let url = new URL("/", request.host);
    url = url.toString();
    chrome.tabs.query({
        url: url
    }, function (tabs) {
        async function active_tab() {
            let tab;
            if (tabs.length == 0) {
                tab = await chrome.tabs.create({
                    url: url
                });
            } else {
                tab = tabs[0];
                chrome.windows.update(tab.windowId, {
                    focused: true
                });
                chrome.tabs.update(tab.id, {
                    active: true
                });
                const response = await chrome.tabs.sendMessage(tab.id, {
                    from: "worker",
                    request: request
                });
            }

        }
        active_tab();
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




// Perform a tiddlywiki api request
async function performTiddlyWikiRequest(request) {
    const url = request.url;
    try {
        const response = await fetch(url, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch TiddlyWiki data: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };  // Return the data as a resolved result
    } catch (error) {
        //console.error("Error in background fetch:", error);
        return { success: false, error: error.message };  // Return error as a result
    }
}
