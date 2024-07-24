


function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
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
            var span = document.createElement("span");
            span.class = "tw-icon";
            span.innerText = "📖";
            item.querySelector("div.gs_fl").appendChild(span);
        }
    } catch (error) {
        console.error(error.message);
    }
}


async function gettiddler(doi, host) {
    let filter = encodeURIComponent("[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[" +
            doi + "]]");
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddler = await response.json();
        if (tiddler.length > 0) {
            var div = document.createElement("div");
            div.id = "tw-banner";
            div.innerText = "📖";
            dragElement(div);
            document.body.appendChild(div);
        }
    } catch (error) {
        console.error(error.message);
    }
}

function dragElement(elmnt) {
    var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
function publisher(host) {
    var xpath = ["//meta[@name='dc.identifier']",
        "//meta[@name='dc.Identifier']",
        "//meta[@name='citation_doi']"];
    var doi;
    for (let i = 0; i < xpath.length; i++) {
        let doi_element = getElementByXpath(xpath[i]);
        if (doi_element !== undefined && doi_element !== null) {
            doi = doi_element.getAttribute("content");
            doi = doi.replace('doi:', '');
            break;
        }
    }
    if (doi !== undefined) {

        gettiddler(doi, host);

    }
}

function scholar(host) {

    var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl");
    for (let i = 0; i < items.length; i++) {
        var cid = items[i].dataset.cid;
        gettiddlerCID(cid, items[i], host);
        console.log(cid);
    }
    console.log(items.length);
}
chrome.storage.sync.get({
    host: 'http://localhost:8080'
},
    (items) => {
    var href = window.location.href;
    // For google scholar
    if (href.includes("scholar.google.")) {
        scholar(items.host);
    } else {
        publisher(items.host);
    }

});
