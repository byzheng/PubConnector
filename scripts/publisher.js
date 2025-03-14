// Functions for publisher pages except scholar.google.com and scopus.com

async function publisher(options) {
    var doi = getDOI();
    if (doi === undefined) {
        return;
    }
    var banner = createBanner();
    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);


    if (tiddlers.length > 0) {
        // Add TiddlyWiki-related icons or actions
        addTiddlyWikiIconsDOI(banner, tiddlers[0], doi, options.tiddlywikihost);
        // Insert colleague and domain info
        // insertColleagueAndDomainInfo(tiddlers[0], options.tiddlywikihost);
    } else {
        addDefaultIconsDOI(banner, doi);
    }
    // Add Zotero related icons
    await addZoteroIconsDOI(banner, doi, options.zoterohost);
    // Set finally width of banner
    bannerSetWidth(banner);

    // Add other information into pages
    
    // Wait to load page as some website will render the whole page later
    await waitForLoading();

    // Insert author and domain information
    if (tiddlers.length > 0) {
        insertColleagueAndDomainInfo(tiddlers[0], options.tiddlywikihost);
    }    

    // inject reference
    injectReference(doi, options);
}


// Helper function to add TiddlyWiki icons and links to the banner
function addTiddlyWikiIconsDOI(divs, tiddler, doi, host, tiddly_only = false, tw_class="tw-svg") {
    const divList = Array.isArray(divs) ? divs : [divs];
    divList.forEach(div => {
        tw_svgs = div.querySelectorAll("." + tw_class);
        if (tw_svgs.length > 0) {
            return;
        }
        div.appendChild(tw_link(tiddler.title, tw_class, host)); // Add link back to TiddlyWiki 
        if (tiddly_only) {
            return;
        }
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
    })
}


// Helper function to add TiddlyWiki icons and links to the banner
async function addZoteroIconsDOI(div, doi, host) {

    const items = await zoteroSearchItemsByDOI(doi, host);
    if (!Array.isArray(items) || items.length === 0) {
        return;
    }

    var item_key = getZoteroItemKey(items[0]);
    if (item_key === null) {
        return;
    }
    div.appendChild(addZeteroSpan(item_key));

    // Get children for pdfs
    const items_children = await zoteroChildren(item_key, host);
    if (!Array.isArray(items_children) || items_children.length === 0) {
        return;
    }
    for (let i = 0; i < items_children.length; i++) {
        const item = items_children[i];

        // Check if the contentType is "application/pdf"
        if (item.data && item.data.contentType === "application/pdf") {
            var pdf_key = getZoteroItemKey(item);
            if (pdf_key === null) {
                return;
            }
            div.appendChild(addZeteroPDFSpan(pdf_key));
        }
    }

}




// Helper function to add default icons when no TiddlyWiki tiddler is found
function addDefaultIconsDOI(div, id) {
    div.appendChild(scholara(id)); // Add Scholar search link for DOI
    div.appendChild(scopus_search_doi(id)); // Add Scopus search button by DOI
    div.appendChild(publisher_doi(id)); // Add Publisher link for DOI
    div.style.backgroundColor = "#8f928f"; // Set background color to indicate no TiddlyWiki data
}

function injectReference(thisdoi, options) {
    let href = window.location.href;
    if (href == undefined) {
        return;
    }
    let css_reference;
    if (href.includes("sciencedirect.com")) {
        css_reference = 'a.anchor.anchor-primary[data-xocs-content-type="reference"]';
    } else if (href.includes("link.springer.com")) {
        css_reference = 'a[data-track-action="reference anchor"]';
    } else {
        return;
    }
    if (css_reference === undefined) {
        return;
    }
    const elements = document.querySelectorAll(css_reference);
    elements.forEach(element => {

        let reference_text;
        let reference_element;
        if (href.includes("sciencedirect.com")) {
            let ref_href = element.getAttribute("name");
            let css_reference_element = 'li:has(span > a.anchor.anchor-primary[href="#' + ref_href + '"])';
            reference_element = document.querySelector(css_reference_element);
            if (reference_element === undefined || reference_element === null) {
                return;
            }
            // Check scopus eid first, if find skip it. 
            reference_text = reference_element.innerHTML;
            let eid = extractScopusEID(reference_text);
            if (eid !== null) {
                injectReferenceByEID([element, reference_element], eid, options);
                return;
            }
        } else if (href.includes("link.springer.com")) {
            reference_element = element;
            reference_text = element.title;
        } else {
            return;
        }

        if (reference_text === undefined || reference_element === undefined) {
            return;
        }
        // Then check doi
        let dois = extractDOIs(reference_text);
        dois.forEach(doi => {
            if (doi === thisdoi) {
                return;
            }
            injectReferenceByDOI([element, reference_element], doi, options);
        })
    });
}

async function injectReferenceByDOI(element, doi, options) {
    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);
    if (tiddlers.length !== 1) {
        return;
    }
    addTiddlyWikiIconsDOI(element, tiddlers[0], doi, options.tiddlywikihost, 
        tiddly_only = true, tw_class="tw-svg-small");
}


async function injectReferenceByEID(element, eid, options) {
    eid = eid.toLowerCase();
    var filter = `[tag[bibtex-entry]] :filter[get[scopus-eid]lowercase[]match[${eid}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);
    if (tiddlers.length !== 1) {
        return;
    }
    const bibtex_doi = tiddlers[0]["bibtex-doi"];
    let doi = extractDOIs(bibtex_doi);
    if (doi.length !== 1) {
        return;
    }
    addTiddlyWikiIconsDOI(element, tiddlers[0], doi, options.tiddlywikihost, 
        tiddly_only = true, tw_class="tw-svg-small");
}

function waitForLoading() {

    let href = window.location.href;
    if (href == undefined) {
        return;
    }
    let timeout = 0;
    if (href.includes("sciencedirect.com")) {
        timeout = 1500;
    } else {
        return;
    }
    return new Promise(resolve => setTimeout(resolve, timeout));
}