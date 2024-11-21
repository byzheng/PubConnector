
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request);
        if (request === undefined) {
            return;
        }
        if (request.from !== "worker") {
            return;
        }
        
        var ele = document.querySelector("div#tw-research-message");
        if (ele === undefined || ele === null) {
            return;
        }

        var evt = new CustomEvent("research-message", {
            detail: request
        });
        ele.dispatchEvent(evt);
    }
);