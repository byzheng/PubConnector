
function getElementByXpath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

var xpath = ["//meta[@name='dc.identifier']",
            "//meta[@name='dc.Identifier']",
            "//meta[@name='citation_doi']"];
var doi;
for (let i=0; i<xpath.length; i++) {
    let doi_element = getElementByXpath(xpath[i]);
    if (doi_element !== undefined && doi_element !== null) {
        doi = doi_element.getAttribute("content");
        doi = doi.replace('doi:','');
        break;
    }
}

async function gettiddler(doi) {
  let filter = encodeURIComponent("[tag[bibtex-entry]] :filter[get[bibtex-doi]search:title[" + 
  doi + "]]");
   const url = "http://localhost/recipes/default/tiddlers.json?filter=" +filter;
   try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const tiddler = await response.json();
    if (tiddler.length > 0) {
        var div = document.createElement("div"); 
        div.innerText = "TW";
        div.className = "tw-banner";
        document.body.appendChild(div); 
    }
  } catch (error) {
    console.error(error.message);
  }
}

if (doi !== undefined) {
    console.log(doi);
    gettiddler(doi);
}
// var button = document.getElementById("mybutton");
// button.person_name = "Roberto";