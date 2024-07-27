
function getDOI() {
    var ele = document.querySelector("meta[name='dc.Identifier' i], meta[name='citation_doi' i]");
    var doi;
    if (ele !== undefined && ele !== null) {
        doi = ele.getAttribute("content");
        doi = doi.replace('doi:', '');
    }
    return doi;
}