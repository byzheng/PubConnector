
// Main function for chrome extension
chrome.storage.sync.get({
    tiddlywikihost: 'http://localhost:8080',
    zoterohost: 'http://localhost:23119/api/'
},
    (options) => {
        var href = window.location.href;
        // For google scholar
        if (href.includes("scholar.google")) {
            window.addEventListener('load', function load(e) {
                window.removeEventListener('load', load, false);
                this.setTimeout(() => {
                    run_scholar(options.tiddlywikihost)
                }, 500)
            }, false);

        } else if (href.includes("scopus.com")) {
            window.addEventListener('load', function load(e) {
                window.removeEventListener('load', load, false);
                this.setTimeout(() => {
                    run_scopus(options)
                }, 2000)
            }, false);
        } else {
            publisher(options);
        }
        colleague(options.tiddlywikihost);
        context_menu(options);

    });
