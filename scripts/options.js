// Saves options to chrome.storage
const defaultConfig = { 
  tiddlywikihost: 'http://localhost:8080',
  zoterohost: 'http://localhost:23119/api/',
  singlefileid: ''
};
const saveOptions = () => {
  const tiddlywikihost = document.getElementById('tiddlywikihost').value;
  const zoterohost = document.getElementById('zoterohost').value;
  const singlefileid = document.getElementById('singlefileid').value;

  chrome.storage.sync.set(
    { 
      tiddlywikihost: tiddlywikihost,
      zoterohost: zoterohost,
      singlefileid: singlefileid
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    defaultConfig,
    (items) => {
      document.getElementById('tiddlywikihost').value = items.tiddlywikihost;
      document.getElementById('zoterohost').value = items.zoterohost;
      document.getElementById('singlefileid').value = items.singlefileid;
    }
  );
};

const resetOptions = () => {
  document.getElementById('tiddlywikihost').value = defaultConfig.tiddlywikihost;
  document.getElementById('zoterohost').value = defaultConfig.zoterohost;
  document.getElementById('singlefileid').value = defaultConfig.singlefileid;
  saveOptions();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);