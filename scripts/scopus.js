
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