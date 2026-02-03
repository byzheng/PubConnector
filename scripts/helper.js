
export function extractDOIs(text) {
    const doiPattern = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
    const matches = text.match(doiPattern) || [];
    // Remove trailing .pdf if present
    const cleaned = matches.map(doi =>
        doi
            .replace(/([/.]?(full\.pdf|pdf|full|abstract|meta))$/i, '')
            .toLowerCase()
    );
    return [...new Set(cleaned)];
}

export async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

export function domainType(href) {
    if (!href) {
        return "unknown";
    }
    if (href.contains("scopus.com")) {
        return "scopus";
    } else if (href.contains("scholar.google")) {
        return "google-scholar";
    }
    return "publisher"
}


export function getDOI() {
    var doi_sel = [
        "meta[name='dc.Identifier' i][scheme='doi' i]",
        "meta[name='dc.Identifier' i]",
        "meta[name='citation_doi' i]",
        "meta[property='citation_doi' i]",
        "meta[name='DC.Identifier.DOI' i]",
        'ul.nova-legacy-e-list li +li a.nova-legacy-e-link[href*="doi.org"]', // for researchgate
        'div strong +a[href*="doi.org"]', // for IEEE
        'li[data-test-id="paper-doi"] .doi__link' // for sematic
    ];

    function isValidDOI(doi) {
        const doiRegex = /^10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/;
        return doiRegex.test(doi);
    }
    var doi;
    for (let i = 0; i < doi_sel.length; i++) {

        var ele = document.querySelector(doi_sel[i]);
        if (ele === undefined || ele === null) {
            continue;
        }
        var attributes = ["content", "href"];
        for (let j = 0; j < attributes.length; j++) {
            doi = ele.getAttribute(attributes[j]);
            if (doi !== undefined && doi !== null) {
                break;
            }
        }
        if (!doi) {
            continue;
        }
        doi = doi.replace('doi:', '');
        doi = doi.replace(/^(https?:\/\/.*?doi\.org\/)?/, '');
        if (isValidDOI(doi)) {
            return doi.toLowerCase();
        }
    }

    return;
}
