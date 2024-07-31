
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
        console.log(request);
    if (request.from == "worker") {
        if (request.tiddler === undefined) {
            return;
        }
        var ele = document.querySelector("div#tw-research-message");
        if (ele === undefined || ele === null) {
            return;
        }
        
        var evt = new CustomEvent("research-message", {
              detail: {tiddler: request.tiddler}
        });
        ele.dispatchEvent(evt);
    }
  }
);