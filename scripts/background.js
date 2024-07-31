
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.from == "webpage"){
      
        (async () => {
          const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
          const response = await chrome.tabs.sendMessage(tab.id, {
            from: "worker", 
            message: request.title});
          // do something with response here, not outside the function
          console.log(response);
        })();
    }
  }
);