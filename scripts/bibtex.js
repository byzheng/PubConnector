

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

function scopusa(eid) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Scopus.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://www.scopus.com/record/display.uri?eid=" + eid + "&origin=resultslist");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    
    
    return sa;
}

function twspan(cls) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Tiddlywiki.svg");
    img.classList.add(cls);
    var span = document.createElement("span");
    span.classList.add("tw-icon");
    span.appendChild(img);
    return span;
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function setItemStyle(item) {
    item.style.background = "#e6e6e666";
    item.style["box-shadow"] = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
    item.style.padding = "0.4em 0.4em";
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
            item.querySelector("div.gs_fl").appendChild(span);
            setItemStyle(item);
        }
    } catch (error) {
        console.error(error.message);
    }
}


async function gettiddlerEID(eid, item, host) {
    let filter = encodeURIComponent("[tag[bibtex-entry]field:scopus-eid[" + eid + "]]");
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddler = await response.json();
        if (tiddler.length > 0) {
            var span = twspan("tw-svg-small");
            var label = item.querySelector("label");
            if (label !== null) {
                if (label.querySelector("span")) {
                    label.appendChild(span);
                } else {
                    label.parentNode.insertBefore(span, label.nextSibling);
                }
            } else {
                item.querySelector("div.refAuthorTitle, td[data-type='docTitle']").prepend(span);
            }
            setItemStyle(item);
        }
    } catch (error) {
        console.error(error.message);
    }
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

function getDOI() {
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
    return doi;
}

function publisher(host) {
    var doi = getDOI();
    if (doi !== undefined) {
        gettiddler(doi, "doi", host);
    }
}

function scholar(host) {
    
    var items = document.querySelectorAll("div.gs_r.gs_or.gs_scl");
    for (let i = 0; i < items.length; i++) {
        var cid = items[i].dataset.cid;
        gettiddlerCID(cid, items[i], host);
        //console.log(cid);
    }
    //console.log(items.length);
}


function scopus(host) {
    // Whole page
    var eid_el = document.querySelector("input#currentRecordPageEID, input#cite");
    if (eid_el !== undefined && eid_el !== null) {
        var eid = eid_el.value;
        gettiddler(eid, "eid", host);
    }
    // for reference and citation
    var items = document.querySelectorAll("tr.referencesUL, tr.searchArea, tr[class*='TableItems-module']:has( > td > label)");
    for (let i = 0; i < items.length; i++) {
        var eid;
        var label = items[i].querySelector("td > label[for]");
        if (label !== null) {
            eid = label.getAttribute("for").replace("document-",'');
        } else {
            eid = items[i].querySelector("input").value;
        }
        gettiddlerEID(eid, items[i], host);
        //console.log(eid);
    }
    // for doi
    let infos = document.querySelectorAll("div[class*='SourceInfo-module'] > div > dl > dt");
    for (let i = 0; i < infos.length; i++) {
        if (infos[i].innerText == "DOI") {
            let doi_ele = infos[i].nextSibling;
            let doi = doi_ele.innerText;
            let doi_link = document.createElement("a");
            doi_link.innerHTML  = doi;
            doi_link.setAttribute("href", "https://doi.org/" + doi);
            doi_link.setAttribute("target", "_blank");
            var dt_ele = doi_ele.parentElement;
            dt_ele.removeChild(dt_ele.lastElementChild);
            dt_ele.appendChild(doi_link);
            
        }
    }
    //console.log(items.length);
}
async function run (host) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      //console.log(mutation.target.textContent)
    })
  })
  
  scopus(host);
  const targetElements = document.querySelectorAll('.referencesUL')
  targetElements.forEach((i) => {
    observer.observe(i, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    })
  })
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
                run(items.host)
              }, 3000)
            }, false);
    } else {
        publisher(items.host);
    }

});
