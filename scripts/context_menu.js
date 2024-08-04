
function context_menu(options) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if(request.from ==  "context-menu") {
                if (request.menu === "citation-hidden") {
                    citation_hidden()
                }
            }
        }
    );

    function citation_hidden() {
        // var selector_col = [
            // "sup:has(>a[data-test='citation-ref'])" // nature.com
        // ]
        let selectors = JSON.parse(options.filters)
            .map(function(item) {
                return item.filter.citation;
            })
            .join(",");
        //var selectors = options.citationsfilter.split(/\n/).join(",");
        var elements = document.querySelectorAll(selectors);
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].hidden === undefined || elements[i].hidden === false) {
                elements[i].hidden = true;
            } else {
                elements[i].hidden = false;
            }
        }
    }
}