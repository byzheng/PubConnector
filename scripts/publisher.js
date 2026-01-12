// Functions for publisher pages except scholar.google.com and scopus.com

async function Publisher(options) {
    const helper = await dynamicLoadScript('scripts/helper.js');
    const this_options = options;
    const tiddlywikiHost = this_options.tiddlywikihost;
    const this_href = window.location.href;
    const tw_api = await dynamicLoadScript('scripts/api/tiddlywiki-api.js');
    const this_tw = tw_api.Tiddlywiki(options.tiddlywikihost);
    
    async function execute() {
        var doi = helper.getDOI();
        if (doi === undefined) {
            return;
        }
        const banner = await Banner(this_options);
        // remove old banner if exists
        banner.remove();
        // Add publisher banner
        await banner.publisher(doi);
        // Add Zotero related icons
        // await addZoteroIconsDOI(banner.container(), doi, this_options.zoterohost);

        // Add other information into pages

        // Wait to load page as some website will render the whole page later
        await waitForLoading();

        // Insert author and domain information
        if (banner.tiddler()) {
            const tag_widget = await TagWidget(options);
            tag_widget.create(banner.tiddler());
        }
        // banner.setWidth();
        // inject reference
        injectReference(doi, this_options);

    }

    // Helper function to add TiddlyWiki icons and links to the banner
    function addTiddlyWikiIconsDOIinText(divs, tiddler, host) {
        const divList = Array.isArray(divs) ? divs : [divs];
        let tw_class = "tw-svg-inline";
        divList.forEach(div => {

            const nextElement = div.nextElementSibling;
            const hasTwSvgNext = nextElement &&
                nextElement.tagName === 'A' &&
                nextElement.classList.contains("tw-icon-tiny");
            if (hasTwSvgNext) {
                return;
            }
            //tw_svgs = div.querySelectorAll("." + tw_class);
            // if (tw_svgs.length > 0) {
            //     return;
            // }
            const icon = Icon(this_options).openTwItem(tiddler.title, undefined,
                "tw-svg-inline");
            //icon.classList.add(tw_class);
            div.parentElement.insertBefore(icon, div.nextSibling);
        })
    }


    function addPublisherLinkByDOI(element, doi) {
        var img = document.createElement("img");
        img.src = chrome.runtime.getURL("images/LinkOut.svg");
        img.classList.add("tw-svg-inline");
        var sa = document.createElement("a");
        sa.appendChild(img);
        sa.setAttribute("href", "https://doi.org/" + doi);
        sa.setAttribute("target", "_blank");
        sa.classList.add("tw-icon-tiny");

        element.parentElement.insertBefore(sa, element.nextSibling);
    }


    async function injectReference(thisdoi, options) {

        const crossref_work = await crossrefWorks(thisdoi); // Get works from crossref
        let crossref_reference;
        if (crossref_work.message && crossref_work.message.reference) {
            crossref_reference = crossref_work.message.reference;
        }
        if (!crossref_reference) {
            console.warn("No crossref reference found for DOI: " + thisdoi);
            return;
        }

        let href = window.location.href;
        if (!href) return;

        let url = new URL(href);
        let twHost = new URL(options.tiddlywikihost);

        if (url.hostname === twHost.hostname) {
            href = getURL();
        }

        function get_href_id(element) {
            let ref_href = element.getAttribute("href");
            if (!ref_href.includes("#")) return null;
            ref_href = ref_href.split("#")[1];
            return ref_href;
        }
        function get_href_id_mdpi(element) {
            let str = get_href_id(element);
            const match = str.match(/^B(\d+)-/);
            return match ? `ref_${match[1]}` : null;
        }
        function get_href_id_connectsci(element) {
            const refId = element.getAttribute('data-modal-source-id');
            return refId ? refId : null;            
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
                getRefSelector: element => `ol > li[id=${get_href_id(element)}]`,
                getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id_mdpi(element)))
            },
            "nature.com": {
                css_reference: 'a[data-track-action="reference anchor"]',
                getRefSelector: element => `li:has(> p[id=${get_href_id(element)}])`,
                getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id(element).replace('ref-', '')))
            },
            "cell.com": {
                css_reference: 'span.reference-citations > a[role="doc-biblioref"]',
                getRefSelector: element => `div.citations:has(a[href="#${element.getAttribute("id")}"])`,
                getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(element.getAttribute("data-xml-rid")))
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
            },
            "connectsci.au": {
                css_reference: 'a.link.link-ref[data-modal-source-id',
                getRefSelector: element => `div[data-content-id="${get_href_id_connectsci(element)}" i]`,
                getCrossRefKey: (element, crossref_work) => crossref_work.find(item => item.key.endsWith(get_href_id_connectsci(element)))
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

            // // Special handling for Scopus EID on ScienceDirect
            // if (extractEID) {
            //     let eid = extractEID(reference_text);
            //     if (eid !== null) {
            //         injectReferenceByEID([element, reference_element], eid, options);
            //         return;
            //     }
            // }

            // Extract and process DOIs
            dois_reference = extractDOIs(reference_text);
            // get doi from from crossres
            if (getCrossRefKey) {
                let items_crossref = getCrossRefKey(element, crossref_reference);
                if (items_crossref && items_crossref.DOI) dois_crossref = [items_crossref.DOI];
            }
            let dois = [...new Set([...dois_reference, ...dois_crossref])];
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
        const tiddlers = await this_tw.getTiddlers(filter);
        if (tiddlers.length !== 1) {
            addPublisherLinkByDOI(element[0], doi);
        } else {
            addTiddlyWikiIconsDOIinText(element, tiddlers[0], options.tiddlywikihost);
        }
    }


    async function injectReferenceByEID(element, eid, options) {
        eid = eid.toLowerCase();
        var filter = `[tag[bibtex-entry]] :filter[get[scopus-eid]lowercase[]match[${eid}]]`;
        const tiddlers = await this_tw.getTiddlers(filter);
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
    return {
        execute: execute
    };
}

