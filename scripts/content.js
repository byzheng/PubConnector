
function loadOptions() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            tiddlywikihost: 'http://localhost:8080',
            zoterohost: 'http://localhost:23119/api/',
            singlefileid: ''
        }, resolve);
    });
}

function onPageLoad(callback, delay = 1000) {
    const run = () => setTimeout(callback, delay);

    if (document.readyState === "complete") {
        run();
    } else {
        window.addEventListener("load", function loadHandler() {
            window.removeEventListener("load", loadHandler, false);
            run();
        }, false);
    }
}

async function main() {

    options = await loadOptions();
    // const tw = Tiddlywiki(options.tiddlywikihost);
    // try {
    //     const status = await tw.status();
    //     if (!status) {
    //         console.error("TiddlyWiki is not running at the specified host.");
    //         return;
    //     }
    // } catch (error) {
    //     console.error("Tiddlywiki Server is not running");
    //     return;
    // }
    var href = window.location.href;



    if (href.includes("scholar.google")) {
        onPageLoad(async () => {
            const scholar = await Scholar(options);
            await scholar.execute();
        });

    } else {
        const publisher = await Publisher(options);
        await publisher.execute();
    }

    colleague(options.tiddlywikihost);
    context_menu(options);

}

// Start the main function
main();
