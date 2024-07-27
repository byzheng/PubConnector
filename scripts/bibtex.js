
function twspan(cls, hidden = false) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Tiddlywiki.svg");
    img.classList.add(cls);
    var span = document.createElement("span");
    span.classList.add("tw-icon");
    span.appendChild(img);
    span.hidden = hidden;
    return span;
}

function setItemStyle(item) {
    item.style.background = "#e6e6e666";
    item.style["box-shadow"] = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
    item.style.padding = "0.4em 0.4em";
}


async function gettiddler(id, type, host) {
    var filter;
    if (type === "doi") {
        filter = "[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[" +
            id + "]]";
    } else if (type === "eid") {
        filter = "[tag[bibtex-entry]field:scopus-eid[" + id + "]]";
    } 
    filter = encodeURIComponent(filter);
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
            div.appendChild(twspan("tw-svg"));
            if (type === "eid") {
                var doi = getDOI();
                div.appendChild(scholara(doi));
            } else {
                div.appendChild(scholara(id));
                if (tiddler[0]["scopus-eid"] !== undefined) {
                    div.appendChild(scopusa(tiddler[0]["scopus-eid"]));
                }
            }
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
    var doi = getDOI();
    if (doi !== undefined) {
        gettiddler(doi, "doi", host);
    }
}


chrome.storage.sync.get({
    host: 'http://localhost:8080'
},
    (items) => {
    var href = window.location.href;
    // For google scholar
    if (href.includes("scholar.google")) {
        scholar(items.host);
    } else if (href.includes("scopus.com")) {
        window.addEventListener('load', function load(e){
              window.removeEventListener('load', load, false);
              this.setTimeout(() => {
                run_scopus(items.host)
              }, 2000)
            }, false);
    } else {
        publisher(items.host);
    }

});
