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
    sa.addEventListener("click", function (event) {
        event.preventDefault();
        let data;
        if (url.includes("people-my.csiro.au")) {
            data = colleague_csiro(url, host)
        }
        if (data === undefined) {
            return;
        }
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

function colleague_csiro(url, host) {
    let title = getElementAttribute('meta[name="CSIROPeople.ProfileName"]', 'content');
    let bio = getElementAttribute('meta[name="CSIROpeople.Biography"]', 'content');
    let email = getElementAttribute('meta[name="CSIROPeople.Email"]', 'content');
    let position = getElementAttribute('meta[name="CSIROPeople.JobTitle"]', 'content');
    let phone = getElementAttribute('meta[name="CSIROPeople.Phone"]', 'content');


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
        google_scholar < - xml_attr(scholor_node, "href")
        if (!isValidGoogleScholarID(google_scholar)) {
            google_scholar = "";
        }
    }
    return {
        title: title,
        text: bio,
        type: "text/vnd.tiddlywiki",
        tags: ["Colleague", "CSIRO Agriculture & Food"],
        email: email,
        phone: phone,
        color: "#ecf8ec",
        position: position,
        researchgate: "",
        orcid: orcid,
        scopus: "",
        "google-scholar": google_scholar,
        url: url,
        icon: "$:/images/svg-icon/people-multiple"

    }
}