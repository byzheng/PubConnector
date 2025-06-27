async function Banner(options) {
    const this_helper = await dynamicLoadScript('scripts/helper.js');

    const this_options = options || {};
    const this_tw = Tiddlywiki(options.tiddlywikihost);
    const this_icon = Icon(options);
    const this_href = window.location.href;
    let this_container, this_tiddler;

    // Function to create and append the banner to the document
    function initContainer() {
        this_container = document.createElement("div");
        this_container.id = "tw-banner";
        document.body.appendChild(this_container);
        // Enable dragging functionality for the banner
        dragElement(this_container);
        this_icon.setContainer(this_container);
    }



    async function getTiddlerByID(id, field) {
        var filter = `[tag[Colleague]search:${field}[${id}]]`;
        this_tiddler = await this_tw.getTiddler(filter);
        if (!this_tiddler) {
            console.error("No tiddler found for filter: " + filter);
            return;
        }
    }
    async function colleague(id, field) {
        if (!id) {
            console.error("Banner requires an id");
            return;
        }
        if (!field) {
            console.error("Banner requires a field");
            return;
        }
        await getTiddlerByID(id, field);
        if (!this_tiddler) {
            console.error("No tiddler found for id: " + id);
            return;
        }
        initContainer(); // Initialize the container
        this_icon.openTwItem(this_tiddler.title);
        this_icon.scholarAuthor(this_tiddler["google-scholar"]); // create an icon to link to google scholar author page
        this_icon.orcidAuthor(this_tiddler["orcid"]); // create an icon to link to ORCID author page
        this_icon.scopusAuthor(this_tiddler["scopus"]); // create an icon to link to Scopus author page
        setWidth(); // Set the width of the banner
    }

    async function publisher(doi) {
        if (!doi) {
            console.error("Banner requires a DOI");
            return;
        }
        this_tiddler = await this_tw.getTiddlerByDOI(doi);
        initContainer();
        if (this_tiddler) {
            this_icon.copyTwCitation(this_tiddler.title);
            this_icon.openTwItem(this_tiddler.title);
            this_icon.scholarSearchDOI(doi);
            this_icon.scopusItem(doi, this_tiddler["scopus-eid"]);
            //this_icon.lensItem(doi, this_tiddler["lens"]);
        } else {
            // If no tiddler found, create default links
            this_icon.scholarSearchDOI(doi);
            this_icon.scopusItem(doi);
            this_icon.publisherByDOI(doi);
            //this_icon.lensItem(doi);
            this_icon.saveTwItem(doi);
            this_container.style.backgroundColor = "#8f928f";
        }
        await iconZotero(doi);
        setWidth(); // Set the width of the banner
        return;
    }

    // remove
    function remove() {
        const banner = this_container || document.getElementById('tw-banner');
        if (banner) {
            banner.remove(); // Removes the element from the DOM
        }
    }





    // Helper function to set width of banner
    function setWidth() {
        let totalWidth = 0;
        for (const child of this_container.children) {
            totalWidth += child.offsetWidth;
        }

        // Optionally add padding or margins
        const padding = 100; // Example padding
        this_container.style.width = `${totalWidth + padding}px`;
    }



    // Helper function to add TiddlyWiki icons and links to the banner
    async function iconZotero(doi) {

        const zotero = Zotero(this_options.zoterohost);
        const item = await zotero.searchItemsByDOI(doi);
        if (!item) {
            return;
        }

        var item_key = zotero.getItemKey(item);
        if (item_key === null) {
            return;
        }
        this_icon.zeteroItem(item_key); // Add icon to zotero item

        // Get children for pdfs
        const items_children = await zotero.children(item_key);
        if (!Array.isArray(items_children) || items_children.length === 0) {
            return;
        }
        for (let i = 0; i < items_children.length; i++) {
            const item = items_children[i];

            // Check if the contentType is "application/pdf"
            if (item.data && item.data.contentType === "application/pdf") {
                var pdf_key = zotero.getItemKey(item);
                if (pdf_key === null) {
                    return;
                }
                this_icon.zeteroPDF(pdf_key);
            }

        }
    }



    return {
        colleague: colleague,
        publisher: publisher,
        remove: remove,
        tiddler: () => this_tiddler,
        container: () => this_container,
        setWidth: setWidth,
        iconZotero: iconZotero
    }
}


// Helper function to create an icon link to tiddlywiki by title
// Will remove it when all functions are moved to icon.js
function tw_link(title, cls, host, icon = "images/Tiddlywiki.svg", hidden = false) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL(icon);
    img.classList.add(cls);
    var sa = document.createElement("a");
    sa.appendChild(img);
    var url = new URL("#" + title, host);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon-tiny");
    sa.addEventListener("click", function (event) {
        event.preventDefault();
        chrome.runtime.sendMessage({
            from: "webpage",
            tiddler: title,
            method: "open_tiddler",
            host: host
        });
    });

    return sa;
}
