async function Scopus(options) {
    const helper = await dynamicLoadScript('scripts/helper.js');
    const this_options = options;
    const tiddlywikiHost = this_options.tiddlywikihost;
    let tiddlerColleague;
    const tw_api = await dynamicLoadScript('scripts/api/tiddlywiki-api.js');
    const tw = tw_api.Tiddlywiki(options.tiddlywikihost);

    // Main function for Scopus
    async function execute() {
        var href = window.location.href;
        var page_ele = document.querySelector("div#documents-panel");
        
        if (page_ele !== null) {
            // Author page
            let aid = URL.parse(href).searchParams.get("authorId");
            if (aid !== undefined && aid !== null) {
                await authorPage(aid);
            }
        } if (href.includes("/pages/publications/")) {
            // Publication page 
            // treat as a normal publication page
            const publisher = await Publisher(options);
            await publisher.execute();

        } else {
            // Other pages (search, citation, reference)
            await processOtherPages();
        }
    }

    async function authorPage(aid) {
        // Add colleague banner for scopus
        const banner = await Banner(this_options);
        await banner.colleague(aid, "scopus");
        tiddlerColleague = banner.tiddler();

        // Process items in the author page
        await authorPageItemsAwait();
    }

    async function authorPageItemsAwait() {
        let element = document.querySelector("div#documents-panel");
        if (element) {
            processAuthorPageItems(element);
        }

        const observer = new MutationObserver(mutationList =>
            mutationList.filter(m => m.type === 'childList').forEach(m => {
                m.addedNodes.forEach(function (element) {
                    processAuthorPageItems(element);
                });
            }));
        
        const targetElements = document.querySelectorAll("div#documents-panel");
        targetElements.forEach((i) => {
            observer.observe(i, {
                childList: true,
                subtree: true
            })
        });
    }

    function processAuthorPageItems(element) {
        const items = element.querySelectorAll("li[data-testid='results-list-item']");
        if (!items || items.length === 0) {
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const hidden = Hidden();
            // skip if already added
            if (hidden.has(items[i])) {
                continue;
            }
            hidden.create(items[i]);

            // Get EID from button
            const btn = items[i].querySelector("button[class*='Button-module']");
            if (!btn) {
                continue;
            }

            const eid = btn.dataset.testid ? btn.dataset.testid.replace('button-abstract-', '') : undefined;
            if (!eid) {
                continue;
            }

            addIconToItem(eid, items[i], "authorpage");
        }
    }

    async function processOtherPages() {
        // Whole page to add a banner with EID
        var url = new URL(window.location.href);
        var eid = url.searchParams.get("eid") || url.searchParams.get("cite");
        if (eid) {
            await addBannerScopusPublication(eid);
        }

        // Find page types for list of items
        const selector_scopus = [
            "tr.referencesUL", // for reference list 
            "tr.searchArea", // for citation list
            "tr[class*='TableItems-module']:has( > td > label)" // for search list
        ];
        const page_types = ["reference", "citation", "search"];
        let items;
        let page_type;
        
        for (let i = 0; i < selector_scopus.length; i++) {
            items = document.querySelectorAll(selector_scopus[i]);
            if (items.length > 0) {
                page_type = page_types[i];
                break;
            }
        }

        if (!items || !page_type) {
            return;
        }

        // Process for each item
        for (let i = 0; i < items.length; i++) {
            const hidden = Hidden();
            // skip if already added
            if (hidden.has(items[i])) {
                continue;
            }
            hidden.create(items[i]);

            let eid;
            if (page_type === "reference" || page_type === "citation") {
                const input = items[i].querySelector("input");
                eid = input ? input.value : undefined;
            } else if (page_type === "search") {
                const label = items[i].querySelector("td > label[for]");
                eid = label ? label.getAttribute("for").replace("document-", '') : undefined;
            }

            if (!eid) {
                continue;
            }

            addIconToItem(eid, items[i], page_type);
        }
    }

    async function getTiddlerByEID(eid) {
        if (!eid || eid.trim() === "") {
            return;
        }
        const filter = `[tag[bibtex-entry]field:scopus-eid[${eid}]]`;
        return tw.getTiddlerByFilter(filter);
    }

    async function addIconToItem(eid, item, page_type) {
        const tiddler = await getTiddlerByEID(eid);
        
        if (!tiddler) {
            return;
        }

        // Authoring this item if there are missing colleague (for author page)
        if (tiddlerColleague && page_type === "authorpage") {
            if (!(tiddler.tags && tiddler.tags.includes(tiddlerColleague.title))) {
                const oldTags = tw.parseStringArray(tiddler.tags);
                const mergedTags = Array.from(new Set([...oldTags, tiddlerColleague.title]));
                await tw.putTiddler(tiddler.title, tags = mergedTags, fields = []);
            }
        }

        const span = Icon(this_options).openTwItem(tiddler.title, undefined, "tw-svg-small");

        if (page_type === "authorpage") {
            item.appendChild(span);
        } else {
            const label = item.querySelector("label");
            if (label !== null) {
                if (label.querySelector("span")) {
                    label.appendChild(span);
                } else {
                    label.parentNode.insertBefore(span, label.nextSibling);
                }
            } else {
                const icon_ele = item.querySelector("div.refAuthorTitle, td[data-type='docTitle']");
                if (icon_ele !== null) {
                    icon_ele.prepend(span);
                } else {
                    item.appendChild(span);
                }
            }
        }
        setItemStyle(item);
    }

    async function addBannerScopusPublication(eid) {
        const banner = await Banner(this_options);
        const tiddler = await getTiddlerByEID(eid);
        
        // if tiddler is found, add icons link to Tiddlywiki
        if (tiddler) {
            await banner.publication(tiddler);
        }

        // Get DOI if available
        let doi = helper.extractDOIs(window.location.href + " " + document.body.outerHTML);
        if (doi && doi.length > 0) {
            await banner.addScholarLink(doi[0]);
            await banner.addPublisherLink(doi[0]);
            await banner.addZoteroIcons(doi[0]);
        }
    }

    return {
        execute: execute
    };
}

