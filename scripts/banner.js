async function Banner(options) {
    const this_helper = await dynamicLoadScript('scripts/helper.js');

    const this_options = options || {};
    const collapseDelayMs = this_options.bannerCollapseDelayMs || 3000;
    const collapsedAttentionMs = this_options.bannerAttentionMs || 5000;
    
    const tw_api = await dynamicLoadScript('scripts/api/tiddlywiki-api.js');
    const this_tw = tw_api.Tiddlywiki(options.tiddlywikihost);
    const this_icon = Icon(options);
    const this_href = window.location.href;
    let this_container, this_shadow, this_panel, this_content, this_toggle, this_tiddler, collapseTimer, attentionTimer, expandedWidth, resizeObserver;

    function bannerStyles() {
        return `
            .tw-banner-shell {
                all: initial;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 0.4em;
                white-space: nowrap;
                overflow: hidden;
                transition: width 0.18s ease, padding 0.18s ease, border-radius 0.18s ease;
                min-width: 0;
                height: 55px;
                box-sizing: border-box;
                padding: 0.1em 0.3em;
                border: 1px solid #ccc;
                border-radius: 1.5em;
                background-color: #c8ccc9;
                box-shadow: 0 4px 8px rgba(0,0,0,.2), 0 6px 20px rgba(0,0,0,.19);
                font-size: 14px;
                line-height: 1;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .tw-banner-shell.tw-banner-collapsed {
                width: 44px !important;
                height: 44px;
                padding: 0.2em;
                border-radius: 999px;
                border-color: #2f3133;
                background: linear-gradient(135deg, #f7f8f7 0%, #c8ccc9 100%);
                box-shadow: 0 0 0 3px rgba(47, 49, 51, 0.12), 0 10px 24px rgba(0, 0, 0, 0.22);
            }

            .tw-banner-shell.tw-banner-collapsed.tw-banner-attention {
                animation: tw-banner-pulse 1.8s ease-in-out infinite;
            }

            .tw-banner-content {
                all: initial;
                display: flex;
                align-items: center;
                gap: 0.4em;
                box-sizing: border-box;
            }

            .tw-banner-shell.tw-banner-collapsed .tw-banner-content {
                display: none;
            }

            .tw-banner-toggle {
                all: unset;
                width: 40px;
                height: 40px;
                border-radius: 999px;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                background-color: rgba(255, 255, 255, 0.45);
            }

            .tw-banner-shell.tw-banner-collapsed .tw-banner-toggle {
                display: inline-flex;
                background-color: rgba(47, 49, 51, 0.08);
            }

            .tw-banner-toggle:hover {
                background-color: rgba(255, 255, 255, 0.7);
            }

            .tw-banner-shell.tw-banner-collapsed .tw-banner-toggle:hover {
                background-color: rgba(47, 49, 51, 0.16);
            }

            .tw-banner-toggle-icon {
                display: block;
                width: 24px;
                height: 24px;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
            }

            .tw-icon {
                all: initial;
                color: #7096b3;
                margin: 0em 0.2em;
                padding: 0em 0.2em;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                vertical-align: middle;
                text-decoration: none;
                line-height: 0;
                cursor: pointer;
                box-sizing: border-box;
            }

            .tw-svg {
                display: block;
                width: 40px;
                height: 50px;
                max-width: none;
            }

            @keyframes tw-banner-pulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 3px rgba(47, 49, 51, 0.12), 0 10px 24px rgba(0, 0, 0, 0.22);
                }
                50% {
                    transform: scale(1.06);
                    box-shadow: 0 0 0 6px rgba(47, 49, 51, 0.08), 0 12px 28px rgba(0, 0, 0, 0.28);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 3px rgba(47, 49, 51, 0.12), 0 10px 24px rgba(0, 0, 0, 0.22);
                }
            }
        `;
    }

    // Function to create and append the banner to the document
    function initContainer(toggleIconPath = "images/Tiddlywiki.svg", toggleAlt = "PubConnector") {
        this_container = document.createElement("div");
        this_container.id = "tw-banner";
        this_container.style.all = "initial";
        this_container.style.position = "fixed";
        this_container.style.top = "1em";
        this_container.style.right = "2em";
        this_container.style.zIndex = "99999";
        this_container.style.display = "block";
        this_container.style.padding = "0";
        this_container.style.margin = "0";
        this_container.style.border = "0";
        this_container.style.background = "transparent";
        this_container.style.overflow = "visible";
        this_shadow = this_container.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        style.textContent = bannerStyles();

        this_panel = document.createElement("div");
        this_panel.className = "tw-banner-shell";

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

        this_shadow.addEventListener("mousedown", function (event) {
            if (event.target.closest("a, button")) {
                event.stopPropagation();
            }
        });

        this_panel.addEventListener("mouseenter", function () {
            clearAutoCollapse();
            if (isCollapsed()) {
                setCollapsed(false);
            }
        });
        this_panel.addEventListener("mouseleave", function () {
            if (!isCollapsed()) {
                scheduleAutoCollapse(200);
            }
        });

        this_panel.appendChild(this_toggle);
        this_panel.appendChild(this_content);
        this_shadow.appendChild(style);
        this_shadow.appendChild(this_panel);
        document.body.appendChild(this_container);
        // Enable dragging functionality for the banner
        dragElement(this_container);
        this_icon.setContainer(this_content);
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(function () {
                if (!isCollapsed()) {
                    setWidth();
                }
            });
            resizeObserver.observe(this_content);
        }
        setCollapsed(true, true);
    }

    function isCollapsed() {
        return this_panel && this_panel.classList.contains("tw-banner-collapsed");
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
        if (!this_panel) {
            return;
        }
        clearAttentionTimer();
        this_panel.classList.add("tw-banner-attention");
        attentionTimer = window.setTimeout(function () {
            if (this_panel) {
                this_panel.classList.remove("tw-banner-attention");
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

    function setCollapsed(collapsed, suppressAttention = false) {
        if (!this_panel || !this_toggle) {
            return;
        }
        this_panel.classList.toggle("tw-banner-collapsed", collapsed);
        this_toggle.setAttribute("aria-expanded", String(!collapsed));
        this_toggle.title = collapsed ? "Expand PubConnector banner" : "Collapse PubConnector banner";
        if (collapsed) {
            this_panel.style.width = "";
            if (!suppressAttention) {
                startCollapsedAttention();
            }
            clearAutoCollapse();
            return;
        }
        clearAttentionTimer();
        this_panel.classList.remove("tw-banner-attention");
        window.requestAnimationFrame(function () {
            setWidth();
        });
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
        return;
    }

    // remove
    function remove() {
        clearAutoCollapse();
        clearAttentionTimer();
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = undefined;
        }
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
        const styles = window.getComputedStyle(this_panel);
        const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const horizontalBorder = parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
        expandedWidth = Math.ceil(this_content.scrollWidth + horizontalPadding + horizontalBorder + 2);
        if (!isCollapsed()) {
            this_panel.style.width = `${expandedWidth}px`;
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
