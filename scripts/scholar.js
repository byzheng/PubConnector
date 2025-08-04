async function Scholar(options) {
    const helper = await dynamicLoadScript('scripts/helper.js');
    const this_options = options;
    const tiddlywikiHost = this_options.tiddlywikihost;
    let tiddlerColleague;
    const tw_api = await dynamicLoadScript('scripts/api/tiddlywiki-api.js');
    const tw = tw_api.Tiddlywiki(options.tiddlywikihost);
    // Main function for Google Scholar
    async function execute() {
        var href = window.location.href;

        // Add colleague banner for google scholar
        let sid = URL.parse(href).searchParams.get("user");
        if (sid !== undefined && sid !== null) {
            authorPage(sid);
        } else {
            await processScholarItems();
        }
        // open all links in new tab
        document.querySelectorAll('a').forEach(link => {
            link.setAttribute('target', '_blank');
        });

    }
    async function authorPage(sid) {
        // Add colleague banner for google scholar
        const banner = await Banner(this_options);
        await banner.colleague(sid, "google-scholar");
        tiddlerColleague = banner.tiddler()
        //tiddlerColleague = await getColleague(sid, "scholar", tiddlywikiHost);
        // For items in the author page
        await authorPageItemsAwait();
        await saveAuthorCites(sid);
    }
    async function saveAuthorCites(sid) {
        // Click show clickShowMore
        await new Promise(resolve => {
            (function clickShowMore() {
                const button = document.querySelector("button#gsc_bpf_more:not([disabled])");
                if (button) {
                    button.click();
                    setTimeout(clickShowMore, 1000); // Adjust the delay as needed
                } else {
                    console.log("All publications loaded.");
                    resolve();
                }
            })();
        });
        const items = document.querySelectorAll("tr.gsc_a_tr");
        const allCites = [];
        for (let item of items) {
            const cites = getCitesFromAuthorPage(item);
            if (!cites) {
                continue;
            }

            allCites.push(...cites);
        }
        await tw.saveScholarAuthorCites(sid, allCites);
    }
    async function authorPageItemsAwait() {

        processCitationItems();
        const observer = new MutationObserver(mutationList =>
            mutationList.filter(m => m.type === 'childList').forEach(m => {
                m.addedNodes.forEach(function (element) {
                    processCitationItems();
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

    async function processScholarItems() {
        var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl, div.gs_ora");
        for (let i = 0; i < items.length; i++) {
            const hidden = Hidden();
            // skip if already added
            if (hidden.has(items[i])) {
                continue;
            }
            hidden.create(items[i]);

            let tiddler = await getTiddlerForScholarItem(items[i]);
            if (!tiddler) {
                continue;
            }
            var span = Icon(this_options).openTwItem(tiddler.title, undefined,
                "tw-svg-small");
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
            const hidden = Hidden();
            if (hidden.has(items[i])) {
                continue;
            }
            hidden.create(items[i]);

            let tiddler = await getTiddlerForCitationItem(items[i]);
            if (!tiddler) {
                continue;
            }

            var span = Icon(this_options).openTwItem(tiddler.title, undefined,
                "tw-svg-small");
            var qry = "td.gsc_a_y";

            let target = items[i].querySelector(qry);
            if (!target) {
                continue;
            }
            // Authoring this item if there are missing colleague
            if (!(tiddlerColleague && tiddler.tags && tiddler.tags.includes(tiddlerColleague.title))) {
                const oldTags = parseStringArray(tiddler.tags);
                const mergedTags = Array.from(new Set([...oldTags, tiddlerColleague.title]));
                await tw.putTiddler(tiddler.title, tags = mergedTags, fields = []);
            }
            target.appendChild(span);
            setItemStyle(items[i]);
        }
    }


    function getCitesFromAuthorPage(item) {
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
        if (cites.includes(",")) {
            return cites.split(",").map(s => s.trim());
        }
        return [cites];
    }
    async function getTiddlerForCitationItem(item) {
        const cites = getCitesFromAuthorPage(item);
        if (!cites) {
            return;
        }
        // if cites is an array, we will get the first one
        if (!Array.isArray(cites)) {
            return;
        }
        if (cites.length === 0) {
            return;
        }
        for (let cite of cites) {
            if (!cite || cite.trim() === "") {
                continue;
            }
            //console.log("getTiddlerForCitationItem", cite);
            // get tiddler by matching cites
            let tiddler = await getTiddlerByScholarCites(cite);
            if (tiddler) {
                return tiddler;
            }
        }
        return;
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
                tiddler = await tw.getTiddlerByURL(elementHref.getAttribute("href"));
            }
        }
        // get tiddler by matching DOI
        if (!tiddler) {
            // Extract DOIs from item.outerHTML and from the "q" parameter in href
            const href = window.location.href;
            // Merge item.outerHTML and href for DOI extraction
            const mergedText = item.outerHTML + " " + href;
            const dois = helper.extractDOIs(mergedText);
            if (dois.length === 1) {
                tiddler = await tw.getTiddlerByDOI(dois[0]);
            }
        }
        // inject scholar CID if a tiddler is found and cid is not set
        if ((cidNotSet && tiddler) ||
            (tiddler && (!tiddler["scholar-cites"] || tiddler["scholar-cites"] === ""))) {
            await tw.putTiddler(tiddler.title, [], { "scholar-cid": cid, "scholar-cites": cites });
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
        return tw.getTiddler(filter);
    }


    async function getTiddlerByScholarCites(cites) {
        if (!cites || cites.trim() === "") {
            return;
        }
        const filter = "[tag[bibtex-entry]field:scholar-cites[" + cites + "]]";
        return tw.getTiddler(filter);
    }


    return {
        execute: execute
    };
}


