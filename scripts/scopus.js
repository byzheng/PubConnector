


async function gettiddlerEID2(eid, item, host, page_type) {
    let filter = encodeURIComponent("[tag[bibtex-entry]field:scopus-eid[" + eid + "]]");
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddler = await response.json();
        if (tiddler.length > 0) {
            var span = tw_link(tiddler[0].title, "tw-svg-small", host);
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
        } else {
            // not found, insert an hidden element
            var span = twspan("tw-svg-small", true);
            item.appendChild(span);
        }
        item.removeAttribute('data-working');
    } catch (error) {
        //console.error(error.message);
    }
}

function scopus_otherpages(host) {
    // Whole page to add a bar with EID
    var eid_el = document.querySelector("input#currentRecordPageEID, input#cite");
    if (eid_el !== undefined && eid_el !== null) {
        var eid = eid_el.value;
        gettiddler(eid, "eid", host);
    }

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
    // For DOI
    if (page_type === "reference") {
        // for doi
        let infos = document.querySelectorAll("div[class*='SourceInfo-module'] > div > dl > dt");
        for (let i = 0; i < infos.length; i++) {
            if (infos[i].innerText == "DOI") {
                let doi_ele = infos[i].nextSibling;
                let doi = doi_ele.innerText;
                let doi_link = document.createElement("a");
                doi_link.innerHTML = doi;
                let url = "https://doi.org/" + doi;
                if (doi.startsWith("10.1071")) {
                    let prefix = doi.substring(8, 10);
                    let pid = doi.substring(8);
                    url = "https://www.publish.csiro.au/" +
                        prefix + "/Fulltext/" + pid;
                }
                doi_link.setAttribute("href", url);
                doi_link.setAttribute("target", "_blank");
                doi_link.style.color = "#007398";
                var dt_ele = doi_ele.parentElement;
                dt_ele.removeChild(dt_ele.lastElementChild);
                dt_ele.appendChild(doi_link);

            }
        }
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
        gettiddlerEID2(eid, items[i], host, page_type);
        //console.log(eid);
    }

    //console.log(items.length);
}

function scopus_authorpage(element, host, page_type) {
    // Create author toolbar
    let aid = URL.parse(window.location.href).searchParams.get("authorId");
    if (aid !== undefined) {
        getColleague(aid, "scopus", host);
    }

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
        if (page_type === "authorpage") {
            var btn = items[i].querySelector("button[class*='Button-module']");
            if (btn === null) {
                // Not find a button, i.e. no links for this publication
                // insert an empty element 
                var span = twspan("tw-svg-small", true);
                items[i].appendChild(span);
                continue;
            }
            eid = btn.dataset.testid.replace('button-abstract-', '');
        }
        if (eid === undefined) {
            // insert an empty element 
            var span = twspan("tw-svg-small", true);
            items[i].appendChild(span);
            continue;
        }
        gettiddlerEID2(eid, items[i], host, page_type);
        items[i].dataset.working = true;
        //console.log(eid);
    }
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scopus_authorpage_await(page_type, host) {
    await timeout(2000);
    let element = document.querySelector("div#documents-panel");
    scopus_authorpage(element, host, page_type);
    const observer = new MutationObserver(mutationList =>
        mutationList.filter(m => m.type === 'childList').forEach(m => {
            m.addedNodes.forEach(function (element) {
                scopus_authorpage(element, host, page_type)
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

async function run_scopus(host) {
    var page_ele = document.querySelector("div#documents-panel");
    var page_type = "publication";
    if (page_ele !== null) {
        page_type = "authorpage";
    }
    if (page_type === "authorpage") {
        scopus_authorpage_await(page_type, host);
    } else {
        scopus_otherpages(host);
    }
}