
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
                
    if (request.from == "webpage"){
        chrome.tabs.query ({url:"http://localhost/"}, function(tabs) {
                chrome.windows.update(tabs[0].windowId, {focused:true});
                chrome.tabs.update(tabs[0].id,{active:true});
                const response = chrome.tabs.sendMessage(tabs[0].id, {
                    from: "worker", 
                    tiddler: request.tiddler});
            });
        // (async () => {
          
          // const response = await chrome.tabs.sendMessage(tab.id, {
            // from: "worker", 
            // message: request.title});
          // // // do something with response here, not outside the function
          // // console.log(response);
        // })();
      
      
    }
  }
);