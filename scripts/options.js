// Saves options to chrome.storage
const defaultConfig = { 
    host: 'http://localhost:8080',
    filters: [
        {
            'url': "nature.com",
            'filter': {
                'citation': "sup:has(>a[data-test='citation-ref'])"
            }
        }, 
        {
            'url': "sciencedirect.com",
            'filter': {
                'citation': "a[data-xocs-content-type='reference'] > span"
            }
        }
    ]
};
const saveOptions = () => {
  const host = document.getElementById('host').value;
  const filters = document.getElementById('filters').value;
  
  chrome.storage.sync.set(
    { 
        host: host,
        filters: filters
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
      document.getElementById('host').value = items.host;
      document.getElementById('filters').value = items.filters;
    }
  );
};

const resetOptions = () => {
  document.getElementById('host').value = defaultConfig.host;
  let filters = JSON.stringify(defaultConfig.filters, null, 2);
  document.getElementById('filters').value = filters;
  saveOptions();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);