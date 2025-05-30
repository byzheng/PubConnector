

// Main function for Google Scholar
async function run_scholar(host) {

    var href = window.location.href;

    // Add colleague banner for google scholar
    let sid = URL.parse(href).searchParams.get("user");
    if (sid !== undefined && sid !== null) {
        getColleague(sid, "scholar", host);
    }
    await scholar_items(host);
    await scholar_await(host);

}


// Helper function to add tiddlywiki icon to exist items
async function scholar_items(host) {
    // get page type
    var href = window.location.href;
    var page_type = "scholar"; // search page
    let sid = URL.parse(href).searchParams.get("user");
    if (sid !== undefined && sid !== null) {
        page_type = "citation"; // for user home page
    }
    //get all items
    var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl, div.gs_ora, tr.gsc_a_tr");
    for (let i = 0; i < items.length; i++) {
        // skip if already added
        if (items[i].querySelector("span.tw-icon")) {
            continue;
        }
        var spanHide = twspan("tw-svg-small", true);
        items[i].appendChild(spanHide);


        let tiddler;
        if (page_type === "scholar") {
            tiddler = await getTiddlerForScholarItem(items[i], host);
        } else if (page_type === "citation") {
            tiddler = await getTiddlerForCitationItem(items[i], host);
        }
        
        if (!tiddler) {
            continue;
        }

        var span = tw_link(tiddler.title, "tw-svg-small", host);
        var qry;
        if (page_type === "scholar") {
            qry = "div.gs_fl, h3.gs_ora_tt";
        } else if (page_type === "citation") {
            qry = "td.gsc_a_x";
        }
        if (qry === undefined) {
            return;
        }
        items[i].querySelector(qry).appendChild(span);
        setItemStyle(items[i]);
    }

}



async function getTiddlerForCitationItem(item, host) {
    var href_cites = item.querySelector("td.gsc_a_c > a").getAttribute("href");
    if (!href_cites) {
        return;
    }
    var href_parse = URL.parse(href_cites);
    if (!href_parse) {
        return;
    }
    var cites = href_parse.searchParams.get("cites");
    if (!cites) {
        return;
    }
    
    let tiddler = await getTiddlerByScholarCites(cites, host);
    if (!tiddler) {
        return;
    }
    return tiddler;
}


async function getTiddlerForScholarItem(item, host) {
    // get tiddler by cid
    var cid = item.dataset.cid;
    if (!cid) {
        cid = item.dataset.did;
    }

    if (!cid) {
        return;
    }
    let tiddler;
    let cidNotSet = false;

    tiddler = await getTiddlerByScholarCID(cid, host);
    if (!tiddler) {
        cidNotSet = true; // if tiddler not found, we will set cid later
    }
    const cites = getScholarCites(item, cid);
    console.log(cites);
    // get tiddler by matching url
    if (!tiddler) {
        const elementHref = item.querySelector(`a[id="${cid}"]`);
        if (elementHref) {
            tiddler = await getTiddlerByURL(elementHref.getAttribute("href"), host);
        }
    }
    // get tiddler by matching DOI
    if (!tiddler) {
        // Extract DOIs from item.outerHTML and from the "q" parameter in href
        const href = window.location.href;
        // Merge item.outerHTML and href for DOI extraction
        const mergedText = item.outerHTML + " " + href;
        const dois = extractDOIs(mergedText);
        console.log(dois);
        if (dois.length === 1) {
            tiddler = await getTiddlerByDOI(dois[0], host);
        }
    }
    // inject scholar CID if a tiddler is found and cid is not set
    if ((cidNotSet && tiddler) ||
        (tiddler || !tiddler.fields["scholar-cid"] || tiddler.fields["scholar-cid"] === "")) {
        await tiddlywikiPutTiddler(tiddler.title, [], { "scholar-cid": cid, "scholar-cites" : cites }, host);
    }
    return tiddler;
}

function getScholarCites(item, cid) {
    let cites = "";
    const elementHref = item.querySelector(`a[id="${cid}"]`);
    if (elementHref && elementHref.hasAttribute("data-clk")) {
        const dataClk = elementHref.getAttribute("data-clk");
        const match = dataClk.match(/[?&]d=([^&]+)/);
        if (match) {
            cites = match[1];
        }
    }
    return cites;
}

async function scholar_await(host) {

    scholar_items(host);
    const observer = new MutationObserver(mutationList =>
        mutationList.filter(m => m.type === 'childList').forEach(m => {
            m.addedNodes.forEach(function (element) {
                scholar_items(host);
            });
        }));
    //const targetElements = document.querySelectorAll("tbody#gsc_a_b,div#gs_ra_b");
    const targetElements = document.querySelectorAll("tbody#gsc_a_b");
    targetElements.forEach((i) => {
        observer.observe(i, {
            childList: true,
            subtree: true
        })
    })
    return;
}
