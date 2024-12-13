

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


function isValidORCID(url) {
    const orcidPattern = /\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
    return orcidPattern.test(url);
}
function isValidGoogleScholarID(url) {
    const scholarPattern = /user=[a-zA-Z0-9_-]{12}/;
    return scholarPattern.test(url);
}


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


// Helper function to create icon to different platforms
function imgURL(url, icon) {
    let links = url.split(" ");
    let sas = [];
    for (let i = 0; i < links.length; i++) {
        var img = document.createElement("img");
        img.src = chrome.runtime.getURL(icon);
        img.classList.add("tw-svg");
        var sa = document.createElement("a");
        sa.appendChild(img);
        sa.setAttribute("href", links[i]);
        sa.setAttribute("target", "_blank");
        sa.classList.add("tw-icon");
        sas.push(sa);
    }

    return sas;
}

// Helper function to get colleague information
async function getColleague(id, type, host) {
    // skip if banner is already existed 
    if (document.querySelector("#tw-banner") !== null) {
        return;
    }
    // create filter
    var filter;
    if (type === "scopus") {
        filter = "[tag[Colleague]search:scopus[" + id + "]]";
    } else if (type === "scholar") {
        filter = "[tag[Colleague]search:google-scholar[" + id + "]]";
    } else if (type === "url") {
        filter = "[tag[Colleague]] :filter[get[url]match:caseinsensitive[" + id + "]]";
    } else {
        console.error("Not support type " + type);
    }
    const tiddlers = await tiddlywikiGetTiddlers(filter, host);
    // not found
    if (tiddlers === null) {
        return;
    }
    if (tiddlers.length === 0) {
        return;
    }
    var banner = createBanner();
    // create an icon to link back to Tiddlywiki
    banner.appendChild(tw_link(tiddlers[0].title, "tw-svg", host));

    // create link to other platforms
    for (let i = 0; i < colleague_fields.length; i++) {
        if (tiddlers[0][colleague_fields[i].name] == undefined) {
            continue;
        }
        if (tiddlers[0][colleague_fields[i].name].length === 0) {
            continue;
        }
        let elements = imgURL(tiddlers[0][colleague_fields[i].name],
            colleague_fields[i].icon);
        elements.forEach(element => banner.appendChild(element));
    }
    return;
}



function setItemStyle(item) {
    item.style.background = "#e6e6e666";
    item.style["box-shadow"] = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
    item.style.padding = "0.2em 0.4em";
}

// Convert Image to base64 format
async function convertImageToBase64(imageUrl) {
    try {
        // Fetch the image as a Blob
        const response = await fetch(imageUrl);
        
        // Check if the response is OK (status code 200)
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }

        const blob = await response.blob();

        // Convert Blob to base64 using FileReader
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                resolve(reader.result);  // Resolve with base64 string
            };

            reader.onerror = (error) => {
                reject('Error reading the image blob: ' + error);
            };

            reader.readAsDataURL(blob);  // Start reading the Blob as base64
        });

    } catch (error) {
        throw new Error('Error fetching the image: ' + error.message);
    }
}
