
function loadOptions() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            tiddlywikihost: 'http://localhost:8080',
            zoterohost: 'http://localhost:23119/api/',
            singlefileid: ''
        }, resolve);
    });
}


async function main() {
    options = await loadOptions();
    var href = window.location.href;
    // For google scholar
    if (href.includes("scholar.google")) {
        window.addEventListener('load', function load(e) {
            window.removeEventListener('load', load, false);
            this.setTimeout(() => {
                (async () => {
                    const scholar = await Scholar(options);
                    await scholar.execute();
                })();
            }, 1000)
        }, false);

    } else if (href.includes("scopus.com")) {
        window.addEventListener('load', function load(e) {
            window.removeEventListener('load', load, false);
            this.setTimeout(() => {
                run_scopus(options)
            }, 1000)
        }, false);
    } else if (href.includes("lens.org")) {
        window.addEventListener('load', function load(e) {
            window.removeEventListener('load', load, false);
            this.setTimeout(() => {
                run_lens(options);
            }, 1000)
        }, false);
    } else {
        publisher(options);
    }
    colleague(options.tiddlywikihost);
    context_menu(options);

}

// Start the main function
main();
