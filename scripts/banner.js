// Function to create and append the banner to the document
function createBanner() {
    var div = document.createElement("div");
    div.id = "tw-banner";
    document.body.appendChild(div);
    // Enable dragging functionality for the banner
    dragElement(div);

    return div;
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


// Helper function to add default icons when no TiddlyWiki tiddler is found
function addDefaultIconsDOI(div, id) {
    div.appendChild(scholara(id)); // Add Scholar search link for DOI
    div.appendChild(scopus_search_doi(id)); // Add Scopus search button by DOI
    div.appendChild(publisher_doi(id)); // Add Publisher link for DOI
    div.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
}


// Helper function to add default icons when no TiddlyWiki tiddler is found
function addDefaultIconsEID(div) {
    let doi = getDOI(); // Get DOI if available
    div.appendChild(scholara(doi));
    div.appendChild(publisher_doi(doi));
    div.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
}


// Helper function to add TiddlyWiki icons and links to the banner
function addTiddlyWikiIconsDOI(div, tiddler, doi, host) {
    div.appendChild(tw_link(tiddler.title, "tw-svg", host)); // Add link back to TiddlyWiki 
    div.appendChild(scholara(doi)); // Add Scholar link through searching DOI
    
    if (tiddler["scopus-eid"]) {
        div.appendChild(scopusa(tiddler["scopus-eid"])); // Add Scopus link if scopus-eid is found
    } else {
        div.appendChild(scopus_search_doi(doi)); // Add link to search Scopus by DOI
    }
    // Add Reading tag icon if applicable
    if (tiddler.tags.includes("Reading")) {
        div.appendChild(reading_span()); 
    }
}




// Helper function to add TiddlyWiki icons and links to the banner
function addTiddlyWikiIconsEID(div, tiddler, eid, host) {
    div.appendChild(tw_link(tiddler.title, "tw-svg", host)); // Add TiddlyWiki link
    let doi = getDOI(); // Get DOI if it's EID
    div.appendChild(scholara(doi));
    div.appendChild(publisher_doi(doi));

    if (tiddler.tags.includes("Reading")) {
        div.appendChild(reading_span()); // Add Reading tag icon if applicable
    }
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

// Helper function to create an icon link to publisher by DOI
function publisher_doi(doi) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/LinkOut.svg");
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", "https://doi.org/" + doi);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");


    return sa;
}


// Helper function to create an icon link to tiddlywiki by title
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
