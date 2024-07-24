// Saves options to chrome.storage
const saveOptions = () => {
  const host = document.getElementById('host').value;
  
  chrome.storage.sync.set(
    { host: host},
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
    { host: 'http://localhost:8080'},
    (items) => {
      document.getElementById('host').value = items.host;
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);