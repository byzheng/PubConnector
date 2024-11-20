

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


async function gettiddlerCID(id, item, page_type, host) {
    var filter;
    if (page_type === "scholar") {
        filter = "[tag[bibtex-entry]field:scholar-cid[" + id + "]]";
    } else if (page_type === "citation") {
        filter = "[tag[bibtex-entry]field:scholar-cites[" + id + "]]";
    }
    if (filter === undefined) {
        return;
    }
    const url = host + "/recipes/default/tiddlers.json?filter=" + encodeURIComponent(filter);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddler = await response.json();
        if (tiddler.length > 0) {
            var span = tw_link(tiddler[0].title, "tw-svg-small", host);
            var qry;
            if (page_type === "scholar") {
                qry = "div.gs_fl, h3.gs_ora_tt";
            } else if (page_type === "citation") {
                qry = "td.gsc_a_y";
            }
            if (qry === undefined) {
                return;
            }
            item.querySelector(qry).appendChild(span);
            setItemStyle(item);
        }
    } catch (error) {
        //console.error(error.message);
    }
}

function scholar_items(host) {
    var href = window.location.href;
    var page_type = "scholar";
    let sid = URL.parse(href).searchParams.get("user");
    if (sid !== undefined && sid !== null) {
        page_type = "citation";
    }
    var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl, div.gs_ora, tr.gsc_a_tr");
    for (let i = 0; i < items.length; i++) {
        // skip if already added
        if (items[i].querySelector("span.tw-icon") !== null) {
            continue;
        }
        var id;
        if (page_type === "scholar") {
            var cid = items[i].dataset.cid;
            if (cid === undefined) {
                cid = items[i].dataset.did;
                if (cid === undefined) {
                    continue;
                }
            }
            id = cid;
        } else if (page_type === "citation") {
            var href_cites = items[i].querySelector("td.gsc_a_c > a").getAttribute("href");
            if (href_cites === undefined) {
                continue;
            }
            var href_parse = URL.parse(href_cites);
            if (href_parse === null) {
                continue;
            }
            var cites = href_parse.searchParams.get("cites");
            if (cites === undefined) {
                continue;
            }
            id = cites;
        }
        var span = twspan("tw-svg-small", true);
        items[i].appendChild(span);
        if (id === undefined) {
            continue;
        }
        gettiddlerCID(id, items[i], page_type, host);
        //console.log(cid);
    }

}

// async function scholar_await(host) {

//     scholar_items(host);
//     // let element = document.querySelector("div#documents-panel");
//     // scopus_authorpage(element, host, page_type);
//     const observer = new MutationObserver(mutationList =>
//         mutationList.filter(m => m.type === 'childList').forEach(m => {
//             m.addedNodes.forEach(function (element) {
//                 scholar_items(host);
//             });
//         }));
//     const targetElements = document.querySelectorAll("tbody#gsc_a_b,div#gs_ra_b");
//     targetElements.forEach((i) => {
//         observer.observe(i, {
//             childList: true,
//             subtree: true
//         })
//     })
//     return;
// }


async function run_scholar(host) {

    var href = window.location.href;

    // Add colleague banner for google scholar
    let sid = URL.parse(href).searchParams.get("user");
    if (sid !== undefined && sid !== null) {
        getColleague(sid, "scholar", host);
    }
    scholar_items(host);
    //await scholar_await(host);

}





