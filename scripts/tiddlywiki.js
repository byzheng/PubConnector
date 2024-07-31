
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.from == "worker") {
        console.log(request);
    }
  }
);