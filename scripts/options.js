// Saves options to chrome.storage
const defaultConfig = { 
    host: 'http://localhost:8080',
    selectors: [
        {
            'url': "nature.com",
            'selector': {
                'citation': "sup:has(>a[data-test='citation-ref'])"
            }
        }, 
        {
            'url': "sciencedirect.com",
            'selector': {
                'citation': "a[data-xocs-content-type='reference'] > span"
            }
        }, 
        {
            'url': "frontiersin.org",
            'selector': {
                'citation': "a[href^='#B']"
            }
        }
    ]
};
const saveOptions = () => {
  const host = document.getElementById('host').value;
  const selectors = document.getElementById('selectors').value;
  
  chrome.storage.sync.set(
    { 
        host: host,
        selectors: selectors
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
      document.getElementById('selectors').value = items.selectors;
    }
  );
};

const resetOptions = () => {
  document.getElementById('host').value = defaultConfig.host;
  let selectors = JSON.stringify(defaultConfig.selectors, null, 2);
  document.getElementById('selectors').value = selectors;
  saveOptions();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);