
function tw_link(title, cls, host, hidden = false) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Tiddlywiki.svg");
    img.classList.add(cls);
    var sa = document.createElement("a");
    sa.appendChild(img);
    var url = new URL("#" + title, host);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    sa.addEventListener("click", function(event){ 
        event.preventDefault();
        chrome.runtime.sendMessage({
            from: "webpage",
            tiddler: title,
            host: host
        });       
    });
    
    return sa;
}

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

function twColleagueEle(tiddler, host) {
    var span = document.createElement("span");
    span.classList.add("tw-colleague");
    var sa = document.createElement("a");
    sa.innerHTML = tiddler.title;
    var url = new URL("#" + tiddler.title, host);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-link");
    sa.addEventListener("click", function(event){ 
        event.preventDefault();
        chrome.runtime.sendMessage({
            from: "webpage",
            tiddler: tiddler.title,
            host: host
        });       
    });
    
    span.appendChild(sa);
 
    return span;
}

function setItemStyle(item) {
    item.style.background = "#e6e6e666";
    item.style["box-shadow"] = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
    item.style.padding = "0.2em 0.4em";
}
async function tiddlerColleagues(title, element, host) {
    var filter = "[[" + title + "]tags[]tag[Colleague]]";
    filter = encodeURIComponent(filter);
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddlers = await response.json();
        if (tiddlers.length > 0) {
            var div_col = document.createElement("div");
            for (let i = 0; i < tiddlers.length; i++) {
                div_col.appendChild(twColleagueEle(tiddlers[i], host));
            }
            element.parentNode.insertBefore(div_col, element);
        }
    } catch (error) {
        //console.error(error.message);
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
            div.appendChild(tw_link(tiddler[0].title, "tw-svg", host));
            if (type === "eid") {
                var doi = getDOI();
                if (doi !== undefined) {
                    div.appendChild(scholara(doi));
                }
            } else {
                div.appendChild(scholara(id));
                if (tiddler[0]["scopus-eid"] !== undefined) {
                    div.appendChild(scopusa(tiddler[0]["scopus-eid"]));
                }
            }
            dragElement(div);
            document.body.appendChild(div);
            
            // insert authors
            var selector_col = [
                "div[data-testid='author-list']", // scopus.com
                "ul[data-test='authors-list']", // nature.com
                "ul[class*='c-article-author-list']", // biomedcentral.com
                "div[class*='art-authors']", // mdpi.com
                "div.literatumAuthors", // tandfonline.com
                "div.contributors", // science.com
                "div.app-overview-section", // springer.com
                "div.authors", // frontiersin.org
                "span.editors", // publish.csiro.au
                "div.accordion-tabbed", // wiley.com
                "div.al-authors-list", // oup.com
                "div.AuthorGroups" // sciencedirect.com
            ]
            var ele = document.querySelector(selector_col.join(", "));
            if (ele !== undefined || ele !== null) {
                tiddlerColleagues(tiddler[0].title, ele, host)
            }
        }
    } catch (error) {
        //console.error(error.message);
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
    (options) => {
    var href = window.location.href;
    // For google scholar
    if (href.includes("scholar.google")) {
        scholar(href, options.host);
    } else if (href.includes("scopus.com")) {
        window.addEventListener('load', function load(e){
              window.removeEventListener('load', load, false);
              this.setTimeout(() => {
                run_scopus(options.host)
              }, 2000)
            }, false);
    } else {
        publisher(options.host);
        citation_hidden();
    }

});
