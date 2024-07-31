
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    // if (request.from == "webpage"){
        // chrome.runtime.sendMessage({
            // from: "worker", 
            // message: request.title});
    // }
  }
);