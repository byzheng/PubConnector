
function getDOI() {
    var ele = document.querySelector("meta[name='dc.Identifier' i], meta[name='citation_doi' i]");
    var doi;
    if (ele !== undefined && ele !== null) {
        doi = ele.getAttribute("content");
        doi = doi.replace('doi:', '');
    }
    return doi;
}


async function update_story(title, host) {
    const url = host + "/recipes/default/tiddlers/" + 
            encodeURIComponent("$:/StoryList");
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const story_tiddler = await response.json();
        var story_list = "";
        if (story_tiddler !== undefined && story_tiddler.fields !== undefined) {
            story_list = story_tiddler.fields.list;
        }
        story_list += " " + title;
        try {
                const url2 = host + "/recipes/default/tiddlers/" + 
            encodeURIComponent("test_test")
                const response_put = await fetch(url2,
                {
                     method: 'PUT',
                     headers: {
                         "Access-Control-Allow-Origin": "*",
                         "Access-Control-Allow-Methods": "DELETE, PUT, POST, GET, OPTIONS",
                         "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
                         'Accept': 'application/json',
                         'Content-Type': 'application/json',
                         'x-requested-with': 'TiddlyWiki'
                     },
                     body: JSON.stringify({
                                'title': "test_test",
                                'text': ''
                              })
                });
                if (!response_put.ok) {
                    throw new Error(`Response status: ${response_put.status}`);
                }

            } catch (error) {
                console.error(error.message);
            }
        
        
        
    } catch (error) {
        //console.error(error.message);
    }
    
    
}