let colleague_fields = [
    {
        name: "scopus",
        icon: "images/Scopus.svg"
    },
    {
        name: "google-scholar",
        icon: "images/GoogleScholarSquare.svg"
    },
    {
        name: "orcid",
        icon: "images/Orcid.svg"
    }
    
];


function getDOI() {
    var doi_sel = [
        "meta[name='dc.Identifier' i][scheme='doi' i]",
        "meta[name='dc.Identifier' i]",
        "meta[name='citation_doi' i]",
        "meta[property='citation_doi' i]",
        'ul.nova-legacy-e-list li +li a.nova-legacy-e-link[href*="doi.org"]', // for researchgate
        'div strong +a[href*="doi.org"]', // for IEEE
        'li[data-test-id="paper-doi"] .doi__link' // for sematic
    ];
    
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

        doi = doi.replace('doi:', '');
        doi = doi.replace(/^(https?:\/\/.*?doi\.org\/)?/, '');
        break;
    }
    function isValidDOI(doi) {
        const doiRegex = /^10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/;
        return doiRegex.test(doi);
    }
    
    if (!isValidDOI(doi)) {
        return;
    }
    return doi;
}



function imgURL(url, icon) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL(icon);
    img.classList.add("tw-svg");
    var sa = document.createElement("a");
    sa.appendChild(img);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    return sa;
}


async function getColleague(id, type, host) {
    if (document.querySelector("#tw-banner") !== null) {  
        return;
    }
    var filter;
    if (type === "scopus") {
        filter = "[tag[Colleague]search:scopus[" + id + "]]";
    } else if (type === "scholar") {
        filter = "[tag[Colleague]search:google-scholar[" + id + "]]";
    } else if (type === "url") {
        filter = "[tag[Colleague]search:url[" + id + "]]";
    } else{
        console.error("Not support type " + type); 
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
          
            for (let i = 0; i < colleague_fields.length; i++) {
                if (tiddler[0][colleague_fields[i].name] == undefined) {
                    continue;
                }
                if (tiddler[0][colleague_fields[i].name].length === 0) {
                    continue;
                }
                let ele = imgURL(tiddler[0][colleague_fields[i].name],
                    colleague_fields[i].icon);
                div.appendChild(ele);
            
            }
            dragElement(div);
            document.body.appendChild(div);
        }
    } catch (error) {
        //console.error(error.message);
    }
}
