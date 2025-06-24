async function Banner(options) {
    const this_helper = await dynamicLoadScript('scripts/helper.js');

    const this_options = options || {};
    const this_tw = Tiddlywiki(options.tiddlywikihost);
    const this_href = window.location.href;
    let this_container, this_tiddler;

    // Function to create and append the banner to the document
    function initContainer() {
        this_container = document.createElement("div");
        this_container.id = "tw-banner";
        document.body.appendChild(this_container);
        // Enable dragging functionality for the banner
        dragElement(this_container);

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
        iconTiddlywiki(); // create an icon to link back to Tiddlywiki
        iconScholarAuthor(this_tiddler["google-scholar"]); // create an icon to link to google scholar author page
        iconORCIDAuthor(this_tiddler["orcid"]); // create an icon to link to ORCID author page
        iconScopusAuthor(this_tiddler["scopus"]); // create an icon to link to Scopus author page
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
            twCopyCitation();
            iconTiddlywiki();
            iconScholarSearchDOI(doi);
            iconScopusItem(doi);
            iconLensItem(doi);
        } else {
            // If no tiddler found, create default links
            iconScholarSearchDOI(doi);
            iconScopusItem(doi);
            iconPublisherByDOI(doi);
            iconLensItem(doi);
            iconTWSave(doi);
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


    // Helper function to create an icon link to tiddlywiki by title
    function iconTiddlywiki() {
        var img = document.createElement("img");
        img.src = chrome.runtime.getURL("images/Tiddlywiki.svg");
        img.classList.add("tw-svg");
        var sa = document.createElement("a");
        sa.appendChild(img);
        var url = new URL("#" + this_tiddler.title, this_options.tiddlywikihost);
        sa.setAttribute("href", url);
        sa.setAttribute("target", "_blank");
        sa.classList.add("tw-icon-tiny");
        sa.addEventListener("click", function (event) {
            event.preventDefault();
            chrome.runtime.sendMessage({
                from: "webpage",
                tiddler: this_tiddler.title,
                method: "open_tiddler",
                host: this_options.tiddlywikihost
            });
        });
        this_container.appendChild(sa);
    }

    function iconScholarAuthor(url) {
        if (!url) {
            return;
        }
        if (this_href.includes("scholar.google")) {
            return;
        }
        const elements = this_helper.iconURL(url, "images/GoogleScholarSquare.svg")
        elements.forEach(element => this_container.appendChild(element));
    }

    function iconORCIDAuthor(url) {
        if (!url) {
            return;
        }
        if (this_href.includes("orcid.org")) {
            return;
        }
        const elements = this_helper.iconURL(url, "images/Orcid.svg")
        elements.forEach(element => this_container.appendChild(element));
    }

    function iconScopusAuthor(url) {
        if (!url) {
            return;
        }
        if (this_href.includes("scopus.com")) {
            return;
        }
        const elements = this_helper.iconURL(url, "images/Scopus.svg")
        elements.forEach(element => this_container.appendChild(element));
    }


    // Helper function to create an icon link to publisher by DOI
    function iconPublisherByDOI(doi) {
        if (!doi) {
            return;
        }
        const url = `https://doi.org/${encodeURIComponent(doi)}`;

        const elements = this_helper.iconURL(url, "images/LinkOut.svg");
        elements.forEach(element => this_container.appendChild(element));
    }

    function iconScholarSearchDOI(doi) {
        if (!doi) {
            return;
        }
        const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(doi)}`;
        const elements = this_helper.iconURL(url, "images/GoogleScholarSquare.svg")
        elements.forEach(element => this_container.appendChild(element));
    }

    function iconScopusItem(doi) {
        let url;
        if (this_tiddler && this_tiddler["scopus-eid"]) {
            const eid = this_tiddler["scopus-eid"];
            url = `https://www.scopus.com/record/display.uri?eid=${eid}&origin=resultslist`;
        } else {
            url = `https://www.scopus.com/results/results.uri?s=DOI(${encodeURIComponent(doi)})`;
        }
        const elements = this_helper.iconURL(url, "images/Scopus.svg")
        elements.forEach(element => this_container.appendChild(element));
    }


    // Helper function to create a icon to scholar.google.com
    function iconLensItem(doi) {
        let url;
        if (this_tiddler && this_tiddler["lens"]) {
            const id = this_tiddler["lens"];
            url = `https://www.lens.org/lens/scholar/${id}/main`;
        } else {
            url = `https://www.lens.org/lens/search/scholar/list?q=${encodeURIComponent(doi)}`;
        }
        const elements = this_helper.iconURL(url, "images/Googlelens.svg")
        elements.forEach(element => this_container.appendChild(element));
    }



    function iconTWSave(doi) {
        const elements = this_helper.iconURL("#", "images/Save.svg")
        elements.forEach(element => this_container.appendChild(element));
        elements[0].addEventListener("click", function (event) {
            event.preventDefault();
            importBibtexToTiddlyWikiByDOI(doi, options);
        });
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


    // Helper function to create an icon link to tiddlywiki by title
    function twCopyCitation() {
        if (!this_tiddler || !this_tiddler.title) {
            //console.error("No tiddler found to copy citation.");
            return;
        }
        const title = this_tiddler.title; // Replace spaces with underscores for TiddlyWiki format
        const elements = this_helper.iconURL("#", "images/Copy.svg")
        elements.forEach(element => this_container.appendChild(element));
        elements[0].addEventListener("click", function (event) {
            event.preventDefault();
            const textToCopy = "<<ref2 " + title + ">>"
            if (!document.hasFocus()) {
                console.warn("Document is not focused. Clipboard copy may fail.");
                return;
            }
            navigator.clipboard.writeText(textToCopy).then(() => {

                let notification = document.getElementById("tw-notification");
                if (!notification) {
                    notification = notication_box();
                }
                notification.textContent = `Copied: ${textToCopy}`;
                notification.style.display = "block";

                // Hide after 1 second
                setTimeout(() => {
                    notification.style.display = "none";
                }, 1500);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
            });
        });
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
        iconZeteroItem(item_key); // Add icon to zotero item

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
                iconZeteroPDF(pdf_key); 
            }

        }
    }


    // Helper function to create a icon to zotero item
    function iconZeteroItem(key) {
        if (!key) {
            return;
        }
        const url = "zotero://select/library/items/" + key;
        const elements = this_helper.iconURL(url, "images/ZoteroSquare.svg")
        elements.forEach(element => this_container.appendChild(element));
    }

    // Helper function to create a icon to open zotero pdf
    function iconZeteroPDF(key) {
        if (!key) {
            return; 
        }
        const url = "zotero://open-pdf/library/items/" + key;
        const elements = this_helper.iconURL(url, "images/FilePdfFilled.svg")
        elements.forEach(element => this_container.appendChild(element));
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



function notication_box() {
    const notification = document.createElement("div");
    notification.id = "tw-notification";
    notification.classList.add("tw-notification");

    document.body.appendChild(notification);
    return notification;
}
// Function to create and append the banner to the document
function createBanner() {
    var div = document.createElement("div");
    div.id = "tw-banner";
    document.body.appendChild(div);
    // Enable dragging functionality for the banner
    dragElement(div);

    return div;
}


function removeTwBanner() {
    const banner = document.getElementById('tw-banner');
    if (banner) {
        banner.remove(); // Removes the element from the DOM
    }
}

// Helper function to set width of banner
function bannerSetWidth(div) {
    let totalWidth = 0;
    for (const child of div.children) {
        totalWidth += child.offsetWidth;
    }

    // Optionally add padding or margins
    const padding = 100; // Example padding
    div.style.width = `${totalWidth + padding}px`;
}




// ---------------------------------------
// Icons in the banner


// Helper function to create a icon to scholar.google.com
function scholara(doi) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/GoogleScholarSquare.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://scholar.google.com/scholar?q=" + doi);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}


// Helper function to create a icon to scholar.google.com
function lens_icon_id(id) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Googlelens.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://www.lens.org/lens/scholar/" + id + "/main");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}

// Helper function to create a icon to scholar.google.com
function lens_icon_doi(doi) {
    const encodedDOI = encodeURIComponent(doi);
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Googlelens.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", `https://www.lens.org/lens/search/scholar/list?q=${encodedDOI}`);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}



// Helper function to create an icon link to publisher by DOI
function publisher_doi(doi, a_class = "tw-icon", img_class = "tw-svg") {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/LinkOut.svg");
    img.classList.add(img_class);
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://doi.org/" + doi);
    sa.setAttribute("target", "_blank");
    sa.classList.add(a_class);


    return sa;
}


// Helper function to create an icon link to tiddlywiki by title
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


function tw_save(doi, options) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Save.svg");
    img.classList.add("tw-svg");

    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "#");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");


    sa.addEventListener("click", function (event) {
        event.preventDefault();
        importBibtexToTiddlyWikiByDOI(doi, options);
    });

    return sa;
}


// Helper function to create an icon link to tiddlywiki by title
function tw_copy_citation(title) {

    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Copy.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "#");

    sa.addEventListener("click", function (event) {
        event.preventDefault();
        const textToCopy = "<<ref2 " + title + ">>"
        if (!document.hasFocus()) {
            console.warn("Document is not focused. Clipboard copy may fail.");
            return;
        }
        navigator.clipboard.writeText(textToCopy).then(() => {

            let notification = document.getElementById("tw-notification");
            if (!notification) {
                notification = notication_box();
            }
            notification.textContent = `Copied: ${textToCopy}`;
            notification.style.display = "block";

            // Hide after 1 second
            setTimeout(() => {
                notification.style.display = "none";
            }, 1500);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });
    sa.classList.add("tw-icon");
    return sa;
}




// Helper function to create an icon of reading
function reading_span() {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/ReadOutlined.svg");
    img.classList.add("tw-svg");
    var span = document.createElement("span");
    span.classList.add("tw-icon");
    span.appendChild(img);
    return span;
}

// Helper function to create a span to link back to Tiddlywiki
function twspan(cls, hidden = false) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Tiddlywiki.svg");
    img.classList.add(cls);
    var span = document.createElement("span");
    span.classList.add("tw-icon");
    span.appendChild(img);
    span.hidden = hidden;
    return span;
}


// Helper function to create an icon to search in scopus by doi
function scopus_search_doi(doi) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Scopus.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://www.scopus.com/results/results.uri?s=DOI%28" + doi + "%29");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");


    return sa;
}

// Helper function to create an icon to link to scopus by eid
function scopusa(eid) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Scopus.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://www.scopus.com/record/display.uri?eid=" + eid + "&origin=resultslist");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}


// Helper function to create a icon to zotero item
function addZeteroSpan(key) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/ZoteroSquare.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "zotero://select/library/items/" + key);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}


// Helper function to create a icon to open zotero pdf
function addZeteroPDFSpan(key) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/FilePdfFilled.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "zotero://open-pdf/library/items/" + key);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}




// Helper function to drag banner
function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {

        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // pos1 = Math.max(0, Math.min(pos1, viewportWidth - elmnt.offsetWidth));
        // pos2 = Math.max(0, Math.min(pos2, viewportHeight - elmnt.offsetHeight));
        var ele_top = elmnt.offsetTop - pos2;
        var ele_left = elmnt.offsetLeft - pos1;
        ele_left = Math.max(0, Math.min(ele_left, viewportWidth - elmnt.offsetWidth));
        ele_top = Math.max(0, Math.min(ele_top, viewportHeight - elmnt.offsetHeight));
        // set the element's new position:
        elmnt.style.top = ele_top + "px";
        elmnt.style.left = ele_left + "px";
        elmnt.style.right = "auto";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}



