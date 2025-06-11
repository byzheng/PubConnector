

function Scholar(options) {
    const this_options = options;
    const tiddlywikiHost = this_options.tiddlywikihost;
    let tiddlerColleague;

    // Main function for Google Scholar
    async function execute() {
        var href = window.location.href;

        // Add colleague banner for google scholar
        let sid = URL.parse(href).searchParams.get("user");
        if (sid !== undefined && sid !== null) {
            tiddlerColleague = await getColleague(sid, "scholar", tiddlywikiHost);
        }
        await scholarItems();
        await scholarAwait();

    }

    async function scholarAwait() {

        scholarItems();
        const observer = new MutationObserver(mutationList =>
            mutationList.filter(m => m.type === 'childList').forEach(m => {
                m.addedNodes.forEach(function (element) {
                    scholarItems();
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


    // Helper function to add tiddlywiki icon to exist items
    async function scholarItems() {
        // get page type
        var href = window.location.href;
        var page_type = "scholar"; // search page
        let sid = URL.parse(href).searchParams.get("user");
        if (sid !== undefined && sid !== null) {
            page_type = "citation"; // for user home page
        }
        if (page_type === "scholar") {
            await processScholarItems();
        } else if (page_type === "citation") {
            await processCitationItems();
        }
    }

    async function processScholarItems() {
        var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl, div.gs_ora");
        for (let i = 0; i < items.length; i++) {
            // skip if already added
            if (items[i].querySelector("span.tw-icon")) {
                continue;
            }
            var spanHide = twspan("tw-svg-small", true);
            items[i].appendChild(spanHide);

            let tiddler = await getTiddlerForScholarItem(items[i], tiddlywikiHost);
            if (!tiddler) {
                continue;
            }

            var span = tw_link(tiddler.title, "tw-svg-small", tiddlywikiHost);
            var qry = "div.gs_fl, h3.gs_ora_tt";
            let target = items[i].querySelector(qry);
            if (!target) {
                continue;
            }
            target.appendChild(span);
            setItemStyle(items[i]);
        }
    }

    async function processCitationItems() {
        var items = document.querySelectorAll("tr.gsc_a_tr");
        for (let i = 0; i < items.length; i++) {
            // skip if already added
            if (items[i].querySelector("span.tw-icon")) {
                continue;
            }
            var spanHide = twspan("tw-svg-small", true);
            items[i].appendChild(spanHide);

            let tiddler = await getTiddlerForCitationItem(items[i]);
            if (!tiddler) {
                continue;
            }

            var span = tw_link(tiddler.title, "tw-svg-small", tiddlywikiHost);
            var qry = "td.gsc_a_x";
            let target = items[i].querySelector(qry);
            if (!target) {
                continue;
            }
            // Authoring this item if there are missing colleague
            if (!(tiddlerColleague && tiddler.tags && tiddler.tags.includes(tiddlerColleague.title))) {
                const oldTags = parseStringArray(tiddler.tags);
                const mergedTags = Array.from(new Set([...oldTags, tiddlerColleague.title]));
                console.log(mergedTags);
                await tiddlywikiPutTiddler(tiddler.title, tags = mergedTags, fields= [], tiddlywikiHost);   
            }
            target.appendChild(span);
            setItemStyle(items[i]);
        }
    }



    async function getTiddlerForCitationItem(item) {
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

        let tiddler = await getTiddlerByScholarCites(cites);
        if (!tiddler) {
            return;
        }
        return tiddler;
    }


    async function getTiddlerForScholarItem(item) {
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

        tiddler = await getTiddlerByScholarCID(cid);
        if (!tiddler) {
            cidNotSet = true; // if tiddler not found, we will set cid later
        }
        const cites = getScholarCites(item, cid);
        //console.log(cites);
        // get tiddler by matching url
        if (!tiddler) {
            const elementHref = item.querySelector(`a[id="${cid}"]`);
            if (elementHref) {
                tiddler = await getTiddlerByURL(elementHref.getAttribute("href"), tiddlywikiHost);
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
                tiddler = await getTiddlerByDOI(dois[0], tiddlywikiHost);
            }
        }
        // inject scholar CID if a tiddler is found and cid is not set
        if ((cidNotSet && tiddler) ||
            (tiddler && (!tiddler["scholar-cites"] || tiddler["scholar-cites"] === ""))) {
            await tiddlywikiPutTiddler(tiddler.title, [], { "scholar-cid": cid, "scholar-cites": cites }, tiddlywikiHost);
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


    async function getTiddlerByScholarCID(cid) {
        if (!cid || cid.trim() === "") {
            // console.error("Scholar CID is undefined or empty");
            return;
        }
        const filter = "[tag[bibtex-entry]field:scholar-cid[" + cid + "]]";
        return getTiddlerByFilter(filter, tiddlywikiHost);
    }


    async function getTiddlerByScholarCites(cites) {
        if (!cites || cites.trim() === "") {
            return;
        }
        const filter = "[tag[bibtex-entry]field:scholar-cites[" + cites + "]]";
        return getTiddlerByFilter(filter, tiddlywikiHost);
    }


    return {
        execute: execute
    };
}


