async function colleague(host) {
    let url = window.location.href;
    if (url == undefined) {
        return;
    }
    let col_known = await getColleague(url, "url", host);
    // no further process if colleague is in the TW
    if (col_known) {
        return;
    }
    // for csiro colleague
    if (url.includes("people-my.csiro.au")) {
        var div = document.createElement("div");
        div.id = "tw-banner";
        div.appendChild(save_colleague("tw-svg", url, host));
        dragElement(div);
        document.body.appendChild(div);

    }
}


function save_colleague(cls, url, host) {
    var img = document.createElement("img");
    img.src = chrome.runtime.getURL("images/Save.svg");
    img.classList.add(cls);
    var sa = document.createElement("a");

    sa.appendChild(img);
    var sa_url = new URL(host);
    sa.setAttribute("href", sa_url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-icon");
    sa.addEventListener("click", async function (event) {
        event.preventDefault();
        let data;
        
        if (url.includes("people-my.csiro.au")) {
            data = await colleague_csiro(url, host);  
        }
        
        if (data === undefined) {
            return;  // Exit if no data is returned
        }
    
        data.type = "text/vnd.tiddlywiki";
        data.color = "#ecf8ec";
        data.icon = "$:/images/svg-icon/people-multiple";
    
        chrome.runtime.sendMessage({
            from: "webpage",
            data: data,
            method: "new_colleague",
            host: host
        });
    });
    

    return sa;
}

function getElementAttribute(cssSelector, attributeName) {
    const element = document.querySelector(cssSelector);

    if (element !== null) {
        return element.getAttribute(attributeName);
    } else {
        //console.warn(`Element with selector "${cssSelector}" not found.`);
        return null;
    }
}

async function colleague_csiro(url, host) {
    let title = getElementAttribute('meta[name="CSIROPeople.ProfileName"]', 'content');
    let bio = getElementAttribute('meta[name="CSIROpeople.Biography"]', 'content');
    let email = getElementAttribute('meta[name="CSIROPeople.Email"]', 'content');
    let position = getElementAttribute('meta[name="CSIROPeople.JobTitle"]', 'content');
    let phone = getElementAttribute('meta[name="CSIROPeople.Phone"]', 'content');
    
    // Get business unit
    let bu_string = getElementAttribute('meta[name="CSIROPeople.BusinessUnit"]', 'content').toLowerCase();
    bu = "CSIRO Agriculture & Food"
    if (bu_string === "data61") {
        bu = "CSIRO Data61"
    }
    // Get location
    let location = getElementAttribute('meta[name="CSIROPeople.Location"]', 'content');
    location = location.replace(/ WA$/, '');
    

    let orcid_node = document.querySelector('a[href*="orcid.org"]');

    let orcid = "";
    if (orcid_node !== null) {
        orcid = orcid_node.getAttribute("href");
        if (!isValidORCID(orcid)) {
            orcid = "";
        }
    }

    let scholor_node = document.querySelector('a[href*="scholar.google"]');
    let google_scholar = "";
    if (scholor_node !== null) {
        google_scholar = scholor_node.getAttribute("href");
        if (!isValidGoogleScholarID(google_scholar)) {
            google_scholar = "";
        }
    }


    let image_ele = getElementAttribute('div.image-cropper.bgi', "style");
    const urlMatch = image_ele.match(/url\((.*?)\)/);
    const imageUrl = urlMatch ? urlMatch[1] : null;

    let image = null;
    // Check if a URL was found and open it in a new tab
    if (imageUrl) {
        // Extract the file extension using a regular expression
        const extensionMatch = imageUrl.match(/\.(\w+)(?=\?|$)/);
        const fileExtension = extensionMatch ? extensionMatch[1] : null;
        image = await convertImageToBase64(imageUrl);
    } 
    
    return {
        title: title,
        text: bio,
        tags: ["Colleague", bu, location],
        email: email,
        phone: phone,
        position: position,
        researchgate: "",
        orcid: orcid,
        scopus: "",
        "google-scholar": google_scholar,
        url: url,
        image: image

    }
}

