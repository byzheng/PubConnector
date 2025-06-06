
function notication_box() {
    const notification = document.createElement("div");
    notification.id = "tw-notification";
    notification.classList.add("tw-notification");

    document.body.appendChild(notification);
    return notification;
}
// Function to create and append the banner to the document
function createBanner() {
    var div = document.createElement("div");
    div.id = "tw-banner";
    document.body.appendChild(div);
    // Enable dragging functionality for the banner
    dragElement(div);

    return div;
}


function removeTwBanner() {
    const banner = document.getElementById('tw-banner');
    if (banner) {
        banner.remove(); // Removes the element from the DOM
    }
}

// Helper function to set width of banner
function bannerSetWidth(div) {
    let totalWidth = 0;
    for (const child of div.children) {
        totalWidth += child.offsetWidth;
    }

    // Optionally add padding or margins
    const padding = 100; // Example padding
    div.style.width = `${totalWidth + padding}px`;
}




// ---------------------------------------
// Icons in the banner


// Helper function to create a icon to scholar.google.com
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


// Helper function to create a icon to scholar.google.com
function lens_icon_id(id) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Googlelens.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://www.lens.org/lens/scholar/" + id + "/main");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}

// Helper function to create a icon to scholar.google.com
function lens_icon_doi(doi) {
    const encodedDOI = encodeURIComponent(doi);
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Googlelens.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", `https://www.lens.org/lens/search/scholar/list?q=${encodedDOI}`);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}



// Helper function to create an icon link to publisher by DOI
function publisher_doi(doi, a_class = "tw-icon", img_class = "tw-svg") {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/LinkOut.svg");
    img.classList.add(img_class);
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://doi.org/" + doi);
    sa.setAttribute("target", "_blank");
    sa.classList.add(a_class);


    return sa;
}


// Helper function to create an icon link to tiddlywiki by title
function tw_link(title, cls, host, icon = "images/Tiddlywiki.svg", hidden = false) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL(icon);
    img.classList.add(cls);
    var sa = document.createElement("a");
    sa.appendChild(img);
    var url = new URL("#" + title, host);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon-tiny");
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


function tw_save(doi, options) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Save.svg");
    img.classList.add("tw-svg");

    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "#");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");


    sa.addEventListener("click", function (event) {
        event.preventDefault();
        importBibtexToTiddlyWikiByDOI(doi, options);
    });

    return sa;
}


// Helper function to create an icon link to tiddlywiki by title
function tw_copy_citation(title) {

    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Copy.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "#");

    sa.addEventListener("click", function (event) {
        event.preventDefault();
        const textToCopy = "<<ref2 " + title + ">>"
        if (!document.hasFocus()) {
            console.warn("Document is not focused. Clipboard copy may fail.");
            return;
        }
        navigator.clipboard.writeText(textToCopy).then(() => {

            let notification = document.getElementById("tw-notification");
            if (!notification) {
                notification = notication_box();
            }
            notification.textContent = `Copied: ${textToCopy}`;
            notification.style.display = "block";

            // Hide after 1 second
            setTimeout(() => {
                notification.style.display = "none";
            }, 1500);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });
    sa.classList.add("tw-icon");
    return sa;
}




// Helper function to create an icon of reading
function reading_span() {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/ReadOutlined.svg");
    img.classList.add("tw-svg");
    var span = document.createElement("span");
    span.classList.add("tw-icon");
    span.appendChild(img);
    return span;
}

// Helper function to create a span to link back to Tiddlywiki
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


// Helper function to create an icon to search in scopus by doi
function scopus_search_doi(doi) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Scopus.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://www.scopus.com/results/results.uri?s=DOI%28" + doi + "%29");
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");


    return sa;
}

// Helper function to create an icon to link to scopus by eid
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


// Helper function to create a icon to zotero item
function addZeteroSpan(key) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/ZoteroSquare.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "zotero://select/library/items/" + key);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}


// Helper function to create a icon to open zotero pdf
function addZeteroPDFSpan(key) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/FilePdfFilled.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "zotero://open-pdf/library/items/" + key);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}




// Helper function to drag banner
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



