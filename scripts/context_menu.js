
function context_menu(options) {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.from == "context-menu") {
                var info = request.info;
                if (info.menuItemId === "tw-send-image") {
                    tiddlywiki_send_image(info.srcUrl)
                } 
            }
        }
    );

    async function tiddlywiki_send_image(srcUrl) {
        if (srcUrl === undefined || srcUrl === null) {
            return;
        }
        let image = await convertImageToBase64(srcUrl);
        chrome.runtime.sendMessage({
            from: "webpage",
            image: image,
            url: srcUrl,
            method: "new_image",
            host: options.tiddlywikihost
        });
    }
    // function item_hidden() {
    //     var href = window.location.href;
    //     console.log(href);
    //     let selector;
    //     if (href.includes("scholar.google")) {
    //         selector = "div.gs_r.gs_or:has(>div>a.tw-icon)";
    //     } else if (href.includes("scopus.com")) {
    //         selector = [
    //             "tr.referencesUL:has(>th>div>a.tw-icon)", // for reference list
    //             "tr.searchArea:has(>th>div>a.tw-icon)", //for citation list
    //             "tr.searchArea:has(>th>div>a.tw-icon) + tr", //for citation list
    //             "li[data-testid='results-list-item']:has(>a.tw-icon)", // for author list
    //             "tr[class*='TableItems-module']:has(>td>label>a.tw-icon)", // for search list
    //             "tr[class*='TableItems-module']:has(>td>label>a.tw-icon) + tr" // for search list
    //         ].join(",");
    //     }
    //     if (selector === undefined) {
    //         return;
    //     }
    //     let items = document.querySelectorAll(selector);
    //     for (let i = 0; i < items.length; i++) {
    //         if (items[i].hidden === undefined ||
    //             items[i].hidden === false) {
    //             items[i].hidden = true;
    //         } else {
    //             items[i].hidden = false;
    //         }
    //     }
    // }

    // function citation_hidden() {
    //     let selectors = JSON.parse(options.selectors)
    //         .map(function (item) {
    //             return item.selector.citation;
    //         })
    //         .join(",");
    //     var elements = document.querySelectorAll(selectors);
    //     for (let i = 0; i < elements.length; i++) {
    //         if (elements[i].hidden === undefined || elements[i].hidden === false) {
    //             elements[i].hidden = true;
    //         } else {
    //             elements[i].hidden = false;
    //         }
    //     }
    // }
}