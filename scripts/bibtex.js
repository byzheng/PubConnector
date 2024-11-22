
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
    sa.addEventListener("click", function (event) {
        event.preventDefault();
        chrome.runtime.sendMessage({
            from: "webpage",
            tiddler: title,
            method: "open_tiddler",
            host: host
        });
    });

    return sa;
}


function reading_span() {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/ReadOutlined.svg");
    img.classList.add("tw-svg");
    var span = document.createElement("span");
    span.classList.add("tw-icon");
    span.appendChild(img);
    return span;
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



function twTagsEle(tiddler, type, host) {
    var span = document.createElement("span");
    span.classList.add("tw-tag");
    span.classList.add("tw-" + type.toLowerCase());

    // icon for colleague

    if (type === "Colleague" && tiddler.image !== undefined && tiddler.image !== "") {
        // let img_path = "";
        // img_path = tiddler.image;
        // var img = document.createElement("img");
        // let url_img = new URL(img_path, host);
        // img.src = url_img;
        // img.style.width = "16px";
        // img.style.height = "16px";

        // img.addEventListener('mouseenter', function() {

        //     img.style.width = "200px";
        //     img.style.height = "200px";
        // }, false);

        // img.addEventListener('mouseleave', function() {

        //     img.style.width = "16px";
        //     img.style.height = "16px";
        // }, false);

        //span.appendChild(img);
    }


    // link back to tiddlywiki
    var sa = document.createElement("a");
    sa.innerHTML = tiddler.title;
    var url = new URL("#" + tiddler.title, host);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-link");
    sa.addEventListener("click", function (event) {
        event.preventDefault();
        chrome.runtime.sendMessage({
            from: "webpage",
            tiddler: tiddler.title,
            method: "open_tiddler",
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

async function tiddlerTags(title, element, type, host) {
    var filter = "[[" + title + "]tags[]tag[" + type + "]]";
    filter = encodeURIComponent(filter);
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddlers = await response.json();
        if (tiddlers.length > 0) {
            var span_col = document.createElement("span");
            for (let i = 0; i < tiddlers.length; i++) {
                span_col.appendChild(twTagsEle(tiddlers[i], type, host));
            }
            element.appendChild(span_col);
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
    // Always create a banner in any page if DOI and EID are found
    var div = document.createElement("div");
    div.id = "tw-banner";

    document.body.appendChild(div);
    dragElement(div);


    filter = encodeURIComponent(filter);
    const url = host + "/recipes/default/tiddlers.json?filter=" + filter;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const tiddler = await response.json();

        if (tiddler.length == 0) {
            // Cannot find the tiddler. Add buttons to 
            // * search from google scholar
            // * search from Scopus according to DOI
            if (type === "doi") {
                div.appendChild(scholara(id));
                div.appendChild(scopus_search_doi(id));
            } else {
                // Add a link to Scholar anyway
                let doi = getDOI();
                div.appendChild(scholara(doi));
                // add a link to publisher
                div.appendChild(publisher_doi(doi));
            }
            div.style.backgroundColor = "#8f928f";
            return;
        }

        // Add a link back to Tiddlywiki
        div.appendChild(tw_link(tiddler[0].title, "tw-svg", host));

        // Add a link to google scholar
        if (type === "eid") {
            let doi = getDOI();
            div.appendChild(scholara(doi));
        } else {
            div.appendChild(scholara(id));
        }
        // Add a link to scopus according EID
        if (type !== "eid" &&
            tiddler[0]["scopus-eid"] !== undefined &&
            tiddler[0]["scopus-eid"] !== "") {
            div.appendChild(scopusa(tiddler[0]["scopus-eid"]));
        } else {
            // If missing, add a button to search by DOI
            div.appendChild(scopus_search_doi(id));
        }

        // Add a tag reading
        if (tiddler[0].tags.includes("Reading")) {
            div.appendChild(reading_span());
        }


        // insert authors and research domain into pages 
        var selector_col = [
            "div[data-testid='author-list']", // scopus.com
            "ul[data-test='authors-list']", // nature.com
            "ul[class*='c-article-author-list']", // biomedcentral.com
            "div[class*='art-authors']", // mdpi.com
            "ul.author-list", // plos.org
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
            var div_col = document.createElement("div");
            tiddlerTags(tiddler[0].title, div_col, "Colleague", host);
            tiddlerTags(tiddler[0].title, div_col, "Domain", host);
            tiddlerTags(tiddler[0].title, div_col, "Place", host);
            ele.parentNode.insertBefore(div_col, ele);
        }
        let totalWidth = 0;
        for (const child of div.children) {
            totalWidth += child.offsetWidth;
        }

        // Optionally add padding or margins
        const padding = 100; // Example padding
        div.style.width = `${totalWidth + padding}px`;

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

        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // pos1 = Math.max(0, Math.min(pos1, viewportWidth - elmnt.offsetWidth));
        // pos2 = Math.max(0, Math.min(pos2, viewportHeight - elmnt.offsetHeight));
        var ele_top = elmnt.offsetTop - pos2;
        var ele_left = elmnt.offsetLeft - pos1;
        ele_left = Math.max(0, Math.min(ele_left, viewportWidth - elmnt.offsetWidth));
        ele_top = Math.max(0, Math.min(ele_top, viewportHeight - elmnt.offsetHeight));

        console.log(ele_top, " ", ele_left)

        // set the element's new position:
        elmnt.style.top = ele_top + "px";
        elmnt.style.left = ele_left + "px";
        elmnt.style.right = "auto";
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
    host: 'http://localhost:8080',
    selectors: ""
},
    (options) => {
        var href = window.location.href;
        // For google scholar
        if (href.includes("scholar.google")) {
            window.addEventListener('load', function load(e) {
                window.removeEventListener('load', load, false);
                this.setTimeout(() => {
                    run_scholar(options.host)
                }, 500)
            }, false);

        } else if (href.includes("scopus.com")) {
            window.addEventListener('load', function load(e) {
                window.removeEventListener('load', load, false);
                this.setTimeout(() => {
                    run_scopus(options.host)
                }, 2000)
            }, false);
        } else {
            publisher(options.host);
        }
        colleague(options.host);
        //context_menu(options);

    });
