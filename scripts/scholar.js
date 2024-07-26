

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

async function gettiddlerCID(cid, item, host) {
    let filter = encodeURIComponent("[tag[bibtex-entry]field:scholar-cid[" + cid + "]]");
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddler = await response.json();
        if (tiddler.length > 0) {
            var span = twspan("tw-svg-small");
            item.querySelector("div.gs_fl, h3.gs_ora_tt").appendChild(span);
            setItemStyle(item);
        }
    } catch (error) {
        console.error(error.message);
    }
}


function scholar(host) {
    
    var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl, div.gs_ora");
    for (let i = 0; i < items.length; i++) {
        var cid = items[i].dataset.cid;
        if (cid === undefined) {
            cid = items[i].dataset.did;
            if (cid === undefined) {
                continue;
            }
        }
        gettiddlerCID(cid, items[i], host);
        //console.log(cid);
    }
    //console.log(items.length);
}


