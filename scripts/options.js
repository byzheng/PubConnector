// Saves options to chrome.storage
const defaultConfig = { 
  tiddlywikihost: 'http://localhost:8080'
};
const saveOptions = () => {
  const tiddlywikihost = document.getElementById('tiddlywikihost').value;

  chrome.storage.sync.set(
    { 
      tiddlywikihost: tiddlywikihost
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
    }
  );
};

const resetOptions = () => {
  document.getElementById('tiddlywikihost').value = defaultConfig.tiddlywikihost;
  saveOptions();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);