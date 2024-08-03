
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
                
    if (request.from == "webpage"){
        let url = new URL("/", request.host);
        url = url.toString();
        chrome.tabs.query ({url: url}, function(tabs) {
            async function active_tab() {
                let tab;
                if (tabs.length == 0) {
                    tab = await chrome.tabs.create({url: url});
                } else {
                    tab = tabs[0];
                    chrome.windows.update(tab.windowId, {focused:true});
                    chrome.tabs.update(tab.id,{active:true});
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        from: "worker", 
                        tiddler: request.tiddler});
                }
                
            }
            active_tab();
        });
    }
  }
);