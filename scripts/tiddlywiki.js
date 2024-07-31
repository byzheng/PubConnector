
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (message.from == "worker") {
        console.log(message);
    }
  }
);