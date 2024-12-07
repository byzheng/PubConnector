// Function for zotero


async function searchZoteroByDOI(doi) {
    const apiUrl = `http://localhost:23119/api/users/0/items?q=${encodeURIComponent(doi)}&qmode=everything`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Zotero-API-Version': 3,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch from Zotero API:', error);
        return null;
    }
}
searchZoteroByDOI(doi, apiKey, libraryType, libraryID).then(data => {
    if (data && data.length > 0) {
        console.log('Items found:', data);
    } else {
        console.log('No items found for the DOI:', doi);
    }
});
