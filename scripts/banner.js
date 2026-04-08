async function Banner(options) {
    const this_helper = await dynamicLoadScript('scripts/helper.js');

    const this_options = options || {};
    const collapseDelayMs = this_options.bannerCollapseDelayMs || 3000;
    const collapsedAttentionMs = this_options.bannerAttentionMs || 5000;
    
    const tw_api = await dynamicLoadScript('scripts/api/tiddlywiki-api.js');
    const this_tw = tw_api.Tiddlywiki(options.tiddlywikihost);
    const this_icon = Icon(options);
    const this_href = window.location.href;
    let this_container, this_content, this_toggle, this_tiddler, collapseTimer, attentionTimer, expandedWidth;

    // Function to create and append the banner to the document
    function initContainer(toggleIconPath = "images/Tiddlywiki.svg", toggleAlt = "PubConnector") {
        this_container = document.createElement("div");
        this_container.id = "tw-banner";
        this_toggle = document.createElement("button");
        this_toggle.type = "button";
        this_toggle.className = "tw-banner-toggle";
        this_toggle.setAttribute("aria-label", "Toggle PubConnector banner");

        const toggleIcon = document.createElement("img");
        toggleIcon.src = chrome.runtime.getURL(toggleIconPath);
        toggleIcon.alt = toggleAlt;
        toggleIcon.className = "tw-banner-toggle-icon";
        this_toggle.appendChild(toggleIcon);

        this_content = document.createElement("div");
        this_content.className = "tw-banner-content";

        this_toggle.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
        });

        this_container.addEventListener("mouseenter", function () {
            clearAutoCollapse();
            if (isCollapsed()) {
                setCollapsed(false);
            }
        });
        this_container.addEventListener("mouseleave", function () {
            if (!isCollapsed()) {
                scheduleAutoCollapse(200);
            }
        });

        this_container.appendChild(this_toggle);
        this_container.appendChild(this_content);
        document.body.appendChild(this_container);
        // Enable dragging functionality for the banner
        dragElement(this_container);
        this_icon.setContainer(this_content);
        setCollapsed(false);
    }

    function isCollapsed() {
        return this_container && this_container.classList.contains("tw-banner-collapsed");
    }

    function clearAutoCollapse() {
        if (collapseTimer) {
            clearTimeout(collapseTimer);
            collapseTimer = undefined;
        }
    }

    function clearAttentionTimer() {
        if (attentionTimer) {
            clearTimeout(attentionTimer);
            attentionTimer = undefined;
        }
    }

    function startCollapsedAttention() {
        if (!this_container) {
            return;
        }
        clearAttentionTimer();
        this_container.classList.add("tw-banner-attention");
        attentionTimer = window.setTimeout(function () {
            if (this_container) {
                this_container.classList.remove("tw-banner-attention");
            }
            attentionTimer = undefined;
        }, collapsedAttentionMs);
    }

    function scheduleAutoCollapse(delay = collapseDelayMs) {
        clearAutoCollapse();
        collapseTimer = window.setTimeout(function () {
            setCollapsed(true);
        }, delay);
    }

    function setCollapsed(collapsed) {
        if (!this_container || !this_toggle) {
            return;
        }
        this_container.classList.toggle("tw-banner-collapsed", collapsed);
        this_toggle.setAttribute("aria-expanded", String(!collapsed));
        this_toggle.title = collapsed ? "Expand PubConnector banner" : "Collapse PubConnector banner";
        if (collapsed) {
            this_container.style.width = "";
            startCollapsedAttention();
            clearAutoCollapse();
            return;
        }
        clearAttentionTimer();
        this_container.classList.remove("tw-banner-attention");
        if (expandedWidth) {
            this_container.style.width = `${expandedWidth}px`;
        }
    }



    async function getTiddlerByID(id, field) {
        var filter = `[tag[Colleague]search:${field}[${id}]]`;
        this_tiddler = await this_tw.getTiddlerByFilter(filter);
        if (!this_tiddler) {
            //console.error("No tiddler found for filter: " + filter);
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
            console.log("No tiddler found for id: " + id);
            return;
        }
        initContainer(); // Initialize the container
        this_icon.openTwItem(this_tiddler.title);
        this_icon.scholarAuthor(this_tiddler["google-scholar"]); // create an icon to link to google scholar author page
        this_icon.orcidAuthor(this_tiddler["orcid"]); // create an icon to link to ORCID author page
        this_icon.scopusAuthor(this_tiddler["scopus"]); // create an icon to link to Scopus author page
        setWidth(); // Set the width of the banner
        scheduleAutoCollapse();
    }

    async function publisher(doi) {
        if (!doi) {
            console.error("Banner requires a DOI");
            return;
        }
        this_tiddler = await this_tw.getTiddlerByDOI(doi);
        initContainer();
        if (this_tiddler) {

            this_icon.openTwItem(this_tiddler.title);
            this_icon.copyTwCitation(this_tiddler.title);
            this_icon.scholarSearchDOI(doi);
            //this_icon.scopusItem(doi, this_tiddler["scopus-eid"]);
            //this_icon.lensItem(doi, this_tiddler["lens"]);
        } else {
            this_toggle.querySelector("img").src = chrome.runtime.getURL("images/Save.svg");
            this_toggle.querySelector("img").alt = "Save to TiddlyWiki";
            // If no tiddler found, create default links
            //this_icon.lensItem(doi);
            this_icon.saveTwItem(doi, undefined, this_tw);
            this_icon.scholarSearchDOI(doi);
            //this_icon.scopusItem(doi);
            this_icon.publisherByDOI(doi);
            
        }
        await iconZotero(doi);
        setWidth(); // Set the width of the banner
        scheduleAutoCollapse();
        return;
    }

    // remove
    function remove() {
        clearAutoCollapse();
        clearAttentionTimer();
        const banner = this_container || document.getElementById('tw-banner');
        if (banner) {
            banner.remove(); // Removes the element from the DOM
        }
    }





    // Helper function to set width of banner
    function setWidth() {
        if (!this_content) {
            return;
        }
        const styles = window.getComputedStyle(this_container);
        const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const horizontalBorder = parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
        expandedWidth = Math.ceil(this_content.scrollWidth + horizontalPadding + horizontalBorder + 2);
        if (!isCollapsed()) {
            this_container.style.width = `${expandedWidth}px`;
        }
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
