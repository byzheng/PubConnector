// Create spans for tags of colleagues, domains, places

// Helper function to create colleague, domain and place
function insertColleagueAndDomainInfo(tiddler, host) {
    // insert authors and research domain into pages 
    var selector_col = [
        "div[data-testid='author-list']", // scopus.com
        "ul[data-test='authors-list']", // nature.com
        "ul[class*='c-article-author-list']", // biomedcentral.com
        "div[class*='art-authors']", // mdpi.com
        "ul.author-list", // plos.org
        "div.literatumAuthors", // tandfonline.com
        "div.contributors", // science.com
        "div.app-overview-section", // springer.com
        "div.authors", // frontiersin.org
        "span.editors", // publish.csiro.au
        "div.accordion-tabbed", // wiley.com
        "div.al-authors-list", // oup.com
        "div.AuthorGroups" // sciencedirect.com
    ]
    var ele = document.querySelector(selector_col.join(", "));
    if (ele !== undefined || ele !== null) {
        var div_col = document.createElement("div");
        tiddlerTags(tiddler.title, div_col, "Colleague", host);
        tiddlerTags(tiddler.title, div_col, "Domain", host);
        tiddlerTags(tiddler.title, div_col, "Place", host);
        ele.parentNode.insertBefore(div_col, ele);
    }

}





// Helper function to create a span to show tags and colleagues
async function tiddlerTags(title, element, type, host) {
    var filter = "[[" + title + "]tags[]tag[" + type + "]]";
    const tiddlers = await tiddlywikiGetTiddlers(filter, host);
    if (tiddlers.length === 0) {
        return;
    }
    var span_col = document.createElement("span");
    for (let i = 0; i < tiddlers.length; i++) {
        span_col.appendChild(twTagsEle(tiddlers[i], type, host));
    }
    element.appendChild(span_col);
}



// Helper function to create a span to show tag
function twTagsEle(tiddler, type, host) {
    var span = document.createElement("span");
    span.classList.add("tw-tag");
    span.classList.add("tw-" + type.toLowerCase());

    // icon for colleague

    if (type === "Colleague" && tiddler.image !== undefined && tiddler.image !== "") {
        // let img_path = "";
        // img_path = tiddler.image;
        // var img = document.createElement("img");
        // let url_img = new URL(img_path, host);
        // img.src = url_img;
        // img.style.width = "16px";
        // img.style.height = "16px";

        // img.addEventListener('mouseenter', function() {

        //     img.style.width = "200px";
        //     img.style.height = "200px";
        // }, false);

        // img.addEventListener('mouseleave', function() {

        //     img.style.width = "16px";
        //     img.style.height = "16px";
        // }, false);

        //span.appendChild(img);
    }


    // link back to tiddlywiki
    var sa = document.createElement("a");
    sa.innerHTML = tiddler.title;
    var url = new URL("#" + tiddler.title, host);
    sa.setAttribute("href", url);
    sa.setAttribute("target", "_blank");
    sa.classList.add("tw-link");
    sa.addEventListener("click", function (event) {
        event.preventDefault();
        chrome.runtime.sendMessage({
            from: "webpage",
            tiddler: tiddler.title,
            method: "open_tiddler",
            host: host
        });
    });
    span.appendChild(sa);




    return span;
}
