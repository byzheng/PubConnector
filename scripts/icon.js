function Hidden() {
    const hidden_class = "tw-connector-hidden";
    // Helper function to create a span to link back to Tiddlywiki
    function create(element) {
        var span = document.createElement("span");
        span.classList.add(hidden_class);
        span.hidden = true;
        element.appendChild(span);
        return span;
    }
    function has(element) {
        return element.querySelector("span." + hidden_class) !== null;
    }
    return {
        create,
        has
    };
}



function Icon(options, container) {
    const this_options = options || {};
    let this_container = container;
    const this_href = window.location.href;
    function setContainer(container) {
        if (container) {
            this_container = container;
        }
    }
    function createElementByURL(url, icon, container, 
        img_class = "tw-svg",
        a_class = "tw-icon") {
        if (!container) {
            container = this_container;
        }
        let links = url.split(" ");
        let sas = [];
        for (let i = 0; i < links.length; i++) {
            var img = document.createElement("img");
            img.src = chrome.runtime.getURL(icon);
            img.classList.add(img_class);
            var sa = document.createElement("a");
            sa.appendChild(img);
            sa.setAttribute("href", links[i]);
            sa.setAttribute("target", "_blank");
            sa.classList.add(a_class);
            sas.push(sa);
        }
        if (container) {
            sas.forEach(element => container.appendChild(element));
        }
        return sas;
    }
    function noticationBox() {
        const notification = document.createElement("div");
        notification.id = "tw-notification";
        notification.classList.add("tw-notification");

        document.body.appendChild(notification);
        return notification;
    }

    function copyTwCitation(title, container) {
        if (!title) {

            return;
        }
        const elements = createElementByURL("#", "images/Copy.svg", container)
        elements[0].addEventListener("click", function (event) {
            event.preventDefault();
            const textToCopy = "<<ref2 " + title + ">>"
            if (!document.hasFocus()) {
                console.warn("Document is not focused. Clipboard copy may fail.");
                return;
            }
            navigator.clipboard.writeText(textToCopy).then(() => {

                let notification = document.getElementById("tw-notification");
                if (!notification) {
                    notification = noticationBox();
                }
                notification.textContent = `Copied: ${textToCopy}`;
                notification.style.display = "block";

                // Hide after 1 second
                setTimeout(() => {
                    notification.style.display = "none";
                }, 1500);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
            });
        });
    }
    // Helper function to create an icon link to tiddlywiki by title
    function openTwItem(title, container,
        img_class = "tw-svg",
        a_class = "tw-icon") {
        var url = new URL("#" + title, this_options.tiddlywikihost);
        const elements = createElementByURL("#", "images/Tiddlywiki.svg", 
            container, img_class, a_class)
        elements[0].addEventListener("click", function (event) {
            event.preventDefault();
            chrome.runtime.sendMessage({
                from: "webpage",
                tiddler: title,
                method: "open_tiddler",
                host: this_options.tiddlywikihost
            });
        });
        return elements[0]
    }

    function scholarSearchDOI(doi, container) {
        if (!doi) {
            return;
        }
        const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(doi)}`;
        createElementByURL(url, "images/GoogleScholarSquare.svg", container);
    }
    function scopusItem(doi, eid, container) {
        let url;
        if (eid) {
            url = `https://www.scopus.com/record/display.uri?eid=${eid}&origin=resultslist`;
        } else {
            url = `https://www.scopus.com/results/results.uri?s=DOI(${encodeURIComponent(doi)})`;
        }
        createElementByURL(url, "images/Scopus.svg", container);
    }
    // Helper function to create a icon to scholar.google.com
    function lensItem(doi, id, container) {
        let url;
        if (id) {
            url = `https://www.lens.org/lens/scholar/${id}/main`;
        } else {
            url = `https://www.lens.org/lens/search/scholar/list?q=${encodeURIComponent(doi)}`;
        }
        createElementByURL(url, "images/Googlelens.svg", container);
    }
    // Helper function to create an icon link to publisher by DOI
    function publisherByDOI(doi, container) {
        if (!doi) {
            return;
        }
        const url = `https://doi.org/${encodeURIComponent(doi)}`;

        createElementByURL(url, "images/LinkOut.svg", container);
    }

    function saveTwItem(doi, container) {
        const elements = createElementByURL("#", "images/Save.svg", container)
        elements[0].addEventListener("click", function (event) {
            event.preventDefault();
            importBibtexToTiddlyWikiByDOI(doi, this_options);
        });
    }

     // Helper function to create a icon to zotero item
    function zeteroItem(key, container) {
        if (!key) {
            return;
        }
        const url = "zotero://select/library/items/" + key;
        createElementByURL(url, "images/ZoteroSquare.svg", container)
    }

    // Helper function to create a icon to open zotero pdf
    function zeteroPDF(key, container) {
        if (!key) {
            return; 
        }
        const url = "zotero://open-pdf/library/items/" + key;
        createElementByURL(url, "images/FilePdfFilled.svg", container);
    }


    
    function scholarAuthor(url, container) {
        if (!url) {
            return;
        }
        if (this_href.includes("scholar.google")) {
            return;
        }
        const elements = createElementByURL(url, "images/GoogleScholarSquare.svg", container);
    }

    function orcidAuthor(url, container) {
        if (!url) {
            return;
        }
        if (this_href.includes("orcid.org")) {
            return;
        }
        createElementByURL(url, "images/Orcid.svg", container);
    }

    function scopusAuthor(url, container) {
        if (!url) {
            return;
        }
        if (this_href.includes("scopus.com")) {
            return;
        }
        createElementByURL(url, "images/Scopus.svg", container);
    }


    return ({
        setContainer,
        copyTwCitation,
        openTwItem,
        scholarSearchDOI,
        scopusItem,
        lensItem,
        publisherByDOI,
        saveTwItem,
        zeteroItem,
        zeteroPDF,
        scholarAuthor,
        orcidAuthor,
        scopusAuthor
    })
}