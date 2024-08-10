
function getDOI() {
    var doi_sel = [
        "meta[name='dc.Identifier' i][scheme='doi' i]",
        "meta[name='dc.Identifier' i]",
        "meta[name='citation_doi' i]"
    ];
    
    var doi;
    for (let i = 0; i < doi_sel.length; i++) {
            
        var ele = document.querySelector(doi_sel[i]);
        if (ele === undefined || ele === null) {
            continue;
        }
        doi = ele.getAttribute("content");
        doi = doi.replace('doi:', '');
        break;
    }
    return doi;
}