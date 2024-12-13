// Functions to scopus.com

// Main functions for scopus
async function run_scopus(options) {
    var page_ele = document.querySelector("div#documents-panel");
    var page_type = "publication";
    if (page_ele !== null) {
        page_type = "authorpage";
    }
    if (page_type === "authorpage") {
        scopus_authorpage_await(options);
    } else {
        scopus_otherpages(options);
    }
}

// Helper function for author page
async function scopus_authorpage_await(options) {
    // Create author banner
    let aid = URL.parse(window.location.href).searchParams.get("authorId");
    if (aid !== undefined) {
        getColleague(aid, "scopus", options.tiddlywikihost);
    }

    //await timeout(2000);
    let element = document.querySelector("div#documents-panel");
    scopus_authorpage(element, options);
    const observer = new MutationObserver(mutationList =>
        mutationList.filter(m => m.type === 'childList').forEach(m => {
            m.addedNodes.forEach(function (element) {
                scopus_authorpage(element, options)
            });
        }));
    const targetElements = document.querySelectorAll("div#documents-panel");
    targetElements.forEach((i) => {
        observer.observe(i, {
            childList: true,
            subtree: true
        })
    })
    return;
}

// create span in the author page
function scopus_authorpage(element, options, page_type) {


    // Check all items in the authorpage and create button to link to tiddlywiki
    var items = element.querySelectorAll("li[data-testid='results-list-item']");
    if (items === null || items.length === 0) {
        return;
    }
    // for each item in the page
    for (let i = 0; i < items.length; i++) {
        if (items[i].querySelector("span.tw-icon") !== null ||
            items[i].dataset.working === true) {
            continue;
        }
        var eid;
        // for author profile
        var btn = items[i].querySelector("button[class*='Button-module']");
        if (btn === null) {
            // Not find a button, i.e. no links for this publication
            // insert an empty element 
            var span = twspan("tw-svg-small", true);
            items[i].appendChild(span);
            continue;
        }
        eid = btn.dataset.testid.replace('button-abstract-', '');
        if (eid === undefined) {
            // insert an empty element 
            var span = twspan("tw-svg-small", true);
            items[i].appendChild(span);
            continue;
        }
        addIconTW(eid, items[i], options.tiddlywikihost, "authorpage");
        items[i].dataset.working = true;
        //console.log(eid);
    }


}

// Helper functions to create banner in other pages, e.g. search list, citation list
function scopus_otherpages(options) {
    // Whole page to add a bar with EID
    var url = new URL(window.location.href);
    var eid = url.searchParams.get("eid") || url.searchParams.get("cite");
    if (eid) {
        addBannerScopusPublication(eid, options);
    }
    // var eid_el = document.querySelector("input#currentRecordPageEID, input#cite");
    // if (eid_el !== undefined && eid_el !== null) {
    //     var eid = eid_el.value;
    //     addBannerScopusPublication(eid, options);
    // }

    // Find page types for list of items
    var selector_scopus = [
        "tr.referencesUL", // for reference list 
        "tr.searchArea", // for citation list
        "tr[class*='TableItems-module']:has( > td > label)" // for search list
    ];
    var page_types = ["reference", "citation", "search"];
    var items;
    var page_type;
    for (let i = 0; i < selector_scopus.length; i++) {
        items = document.querySelectorAll(selector_scopus[i]);
        if (items.length > 0) {
            page_type = page_types[i];
            break;
        }
    }
    if (items === undefined || page_type === undefined) {
        return;
    }


    // Process for each item
    for (let i = 0; i < items.length; i++) {
        // skip if already added
        if (items[i].querySelector("span.tw-icon") !== null) {
            continue;
        }
        var eid;
        if (page_type === "reference" || page_type === "citation") {
            eid = items[i].querySelector("input").value;
        } else if (page_type === "search") {
            var label = items[i].querySelector("td > label[for]");
            eid = label.getAttribute("for").replace("document-", '');
        }
        if (eid === undefined) {
            continue;
        }
        addIconTW(eid, items[i], options.tiddlywikihost, page_type);
        //console.log(eid);
    }

    //console.log(items.length);
}


// Helper function to get tiddler by EID
async function getTiddlerByEID(eid, host) {
    let filter = `[tag[bibtex-entry]field:scopus-eid[${eid}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, host);
    return tiddlers;
}

// Helper function to render span to items by eid
async function addIconTW(eid, item, host, page_type) {
    const tiddlers = await getTiddlerByEID(eid, host);
    // not found, insert an hidden element. Skip to check next time
    if (tiddlers.length === 0) {
        var span = twspan("tw-svg-small", true);
        item.appendChild(span);
        return;
    }

    var span = tw_link(tiddlers[0].title, "tw-svg-small", host);
    if (page_type === "authorpage") {
        item.appendChild(span);
    } else {
        var label = item.querySelector("label");
        if (label !== null) {
            if (label.querySelector("span")) {
                label.appendChild(span);
            } else {
                label.parentNode.insertBefore(span, label.nextSibling);
            }
        } else {
            var icon_ele = item.querySelector("div.refAuthorTitle, td[data-type='docTitle']");
            if (icon_ele !== null) {
                icon_ele.prepend(span);
            } else {
                item.appendChild(span);
            }
        }
    }
    setItemStyle(item);
}

// Add banner to scopus publication
async function addBannerScopusPublication(eid, options) {
    var banner = createBanner(); // Create a banner
    const tiddlers = await getTiddlerByEID(eid, options.tiddlywikihost);
    // if tiddler is found, add icons link to Tiddlywiki and Reading
    if (tiddlers.length > 0) {
        banner.appendChild(tw_link(tiddlers[0].title, "tw-svg", options.tiddlywikihost)); // Add link back to TiddlyWiki 
        // Add Reading tag icon if applicable
        if (tiddlers[0].tags.includes("Reading")) {
            banner.appendChild(reading_span());
        }
        // Insert colleague and domain info
        insertColleagueAndDomainInfo(tiddlers[0], options.tiddlywikihost);
    } else {
        banner.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
    }
    let doi = getDOI(); // Get DOI if available
    if (doi !== undefined) {
        banner.appendChild(scholara(doi)); // add link to google scholar
        banner.appendChild(publisher_doi(doi)); // add link to publisher
        // Add Zotero related icons
        await addZoteroIconsDOI(banner, doi, options.zoterohost);

    }
    bannerSetWidth(banner);
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

