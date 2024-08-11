
// transfer message
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
    console.log(request);

    if (request.from == "webpage") {
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
                        tiddler: request.tiddler
                    });
                }

            }
            active_tab();
        });
    }
});

// Popup menu
chrome.runtime.onInstalled.addListener(async() => {
    chrome.contextMenus.create({
        title: "TW Research",
        id: "tw-research"
    });
    chrome.contextMenus.create({
        parentId: "tw-research",
        id: "item-hidden",
        title: "Show/Hide Exist Item"
    })
    // chrome.contextMenus.create({
    // parentId: "tw-research",
    // id: "citation-hidden",
    // title: "Citation Hidden"
    // })
});

chrome.contextMenus.onClicked.addListener(async(info, tab) => {
    let context_menus = ['item-hidden', 'citation-hidden'];
    if (context_menus.includes(info.menuItemId)) {
        //console.log('link info clicked ', info);

        (async() => {
            const [tab] = await chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            });
            // send message to console.js to ask for details from the DOM about the context link
            const response = await chrome.tabs.sendMessage(tab.id, {
                from: "context-menu",
                menu: info.menuItemId
            });

        })();
    }
});
