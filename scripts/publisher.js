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
function addTiddlyWikiIconsDOI(div, tiddler, doi, host) {

    div.appendChild(tw_copy_citation(tiddler.title));
    div.appendChild(tw_link(tiddler.title, "tw-svg", host, "images/Tiddlywiki.svg"));
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



function generateShortReference(tiddler) {
    let title = tiddler["bibtex-title"];
    let author = tiddler["bibtex-author"];
    let year = tiddler["bibtex-year"];
    let journal = tiddler["bibtex-journaltitle"];
    // Split authors and get the first author
    const authorsArray = author.split(" and ");
    const firstAuthor = authorsArray[0];
    const formattedAuthors = `${firstAuthor} et al.`;

    // Generate the short reference format
    const shortRef = `${formattedAuthors}, ${year}. "${title}". ${journal}.`;

    return shortRef;
}


// Helper function to add TiddlyWiki icons and links to the banner
function addTiddlyWikiIconsDOIinText(divs, tiddler, host) {
    const divList = Array.isArray(divs) ? divs : [divs];
    let tw_class = "tw-svg-inline";
    divList.forEach(div => {

        const nextElement = div.nextElementSibling;
        const hasTwSvgNext = nextElement &&
            nextElement.tagName === 'A' &&
            nextElement.classList.contains("tw-icon");
        if (hasTwSvgNext) {
            return;
        }
        //tw_svgs = div.querySelectorAll("." + tw_class);
        // if (tw_svgs.length > 0) {
        //     return;
        // }
        let a_ele = tw_link(tiddler.title, tw_class, host, "images/TiddlywikiSmall.svg");
        //a_ele.setAttribute("title", title);
        a_ele.classList.add("tw-icon-tooltip");
        // var ele_tooltip = document.createElement("span");
        // ele_tooltip.classList.add("tw-tooltip-text");
        // ele_tooltip.textContent = generateShortReference(tiddler);
        // ele_tooltip.addEventListener('mouseenter', function () {
        //     const tooltipText = item.querySelector('.tw-tooltip-text');
        //     const tooltipRect = tooltipText.getBoundingClientRect();
        //     const windowWidth = window.innerWidth;

        //     // Check if the tooltip goes off the right side
        //     if (tooltipRect.right > windowWidth) {
        //         tooltipText.style.left = 'auto';
        //         tooltipText.style.right = '0'; // Align to the right edge
        //     } else {
        //         tooltipText.style.left = '50%';
        //         tooltipText.style.transform = 'translateX(-50%)';
        //     }
        // });

        // ele_tooltip.addEventListener('mouseleave', function () {
        //     const tooltipText = item.querySelector('.tw-tooltip-text');
        //     tooltipText.style.left = '50%'; // Reset position
        //     tooltipText.style.right = 'auto';
        // });


        // a_ele.appendChild(ele_tooltip);
        //div.appendChild(a_ele);
        div.parentElement.insertBefore(a_ele, div.nextSibling);
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

async function injectReference(thisdoi, options) {

    const crossref_work = await crossrefWorks(thisdoi); // Get works from crossref
    let crossref_reference;
    if (crossref_work.message && crossref_work.message.reference) {
        crossref_reference = crossref_work.message.reference;
    }

    let href = window.location.href;
    if (!href) return;

    function get_href_id(element) {
        let ref_href = element.getAttribute("href");
        if (!ref_href.includes("#")) return null;
        ref_href = ref_href.split("#")[1];
        return ref_href;
    }
    // Mapping of site-specific settings
    // Mapping of site-specific settings
    const siteConfig = {
        "sciencedirect.com": {
            css_reference: 'a.anchor.anchor-primary[data-xocs-content-type="reference"]',
            getRefSelector: element => `li:has(span > a.anchor.anchor-primary[href="#${element.getAttribute("name")}"])`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element))),
            extractEID: extractScopusEID
        },
        "link.springer.com": {
            css_reference: 'a[data-track-action="reference anchor"]',
            getRefSelector: element => `li.c-article-references__item:has(p[id="${get_href_id(element)}"])`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element).replace('ref-', '')))
        },
        "mdpi.com": {
            css_reference: 'a.html-bibr',
            getRefSelector: element => `ol > li[id=${get_href_id(element)}]`
        },
        "nature.com": {
            css_reference: 'a[data-track-action="reference anchor"]',
            getRefSelector: element => `li:has(> p[id=${get_href_id(element)}])`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element).replace('ref-', '')))
        },
        "cell.com": {
            css_reference: 'span.reference-citations > a[role="doc-biblioref"]',
            getRefSelector: element => `div.citations:has(a[href="#${element.getAttribute("id")}"])`
        },
        "wiley.com": {
            css_reference: 'span > a.bibLink',
            getRefSelector: element => `li[data-bib-id="${get_href_id(element)}"]`
        },
        "biomedcentral.com": {
            css_reference: 'a[data-track-action="reference anchor"]',
            getRefSelector: element => `li:has(p[id="${get_href_id(element)}"])`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element).replace('ref-', '')))
        },
        "academic.oup.com": {
            css_reference: 'a.link.link-ref',
            getRefSelector: element => `div[content-id="${element.getAttribute("reveal-id")}"]`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(element.getAttribute("reveal-id")))
        },
        "publish.csiro.au": {
            css_reference: 'a.reftools',
            getRefSelector: element => `div#${get_href_id(element)} ~ a.reftools`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element)))
        },
        "frontiersin.org": {
            css_reference: 'a[href^="#B"]',
            getRefSelector: element => `div.References:has(a[id="${get_href_id(element)}"])`,
            getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element)))
        }
    };

    // Find matching site configuration
    let siteKey = Object.keys(siteConfig).find(site => href.includes(site));
    if (!siteKey) return;
    let { css_reference, getRefSelector, getCrossRefKey, extractEID } = siteConfig[siteKey];

    // Query reference elements
    const elements = document.querySelectorAll(css_reference);
    elements.forEach(element => {
        let dois_reference = [];
        let dois_crossref = [];
        // get DOI from reference elements
        let reference_element;
        let reference_text;

        if (getRefSelector) {
            let ref_selector = getRefSelector(element);
            if (!ref_selector) return;
            reference_element = document.querySelector(ref_selector);
            if (!reference_element) return;
            reference_text = reference_element.outerHTML;
        }

        if (!reference_text || !reference_element) return;

        // Special handling for Scopus EID on ScienceDirect
        if (extractEID) {
            let eid = extractEID(reference_text);
            if (eid !== null) {
                injectReferenceByEID([element, reference_element], eid, options);
                return;
            }
        }

        // Extract and process DOIs
        dois_reference = extractDOIs(reference_text);
        // get doi from from crossres
        if (getCrossRefKey) {
            let items_crossref = getCrossRefKey(element, crossref_reference);
            if (items_crossref && items_crossref.DOI) dois_crossref = [items_crossref.DOI];
        }
        let dois =  [...new Set([...dois_reference, ...dois_crossref])];
        //dois = dois_crossref;
        //console.log(get_href_id(element), ": ", dois);
        dois.forEach(doi => {
            if (doi !== thisdoi) {
                injectReferenceByDOI([element, reference_element], doi, options);
            }
        });
    });
}

async function injectReferenceByDOI(element, doi, options) {
    // Make the request to TiddlyWiki
    var filter = `[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[${doi}]]`;
    const tiddlers = await tiddlywikiGetTiddlers(filter, options.tiddlywikihost);
    if (tiddlers.length !== 1) {
        return;
    }
    addTiddlyWikiIconsDOIinText(element, tiddlers[0], options.tiddlywikihost);
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
    addTiddlyWikiIconsDOIinText(element, tiddlers[0], options.tiddlywikihost);
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