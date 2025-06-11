
export function extractDOIs(text) {
    const doiPattern = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
    const matches = text.match(doiPattern) || [];
    // Remove trailing .pdf if present
    console.log(matches)
    const cleaned = matches.map(doi => doi.replace(/([/.]?(full\.pdf|pdf|full|abstract|meta))$/i, ''));
    return [...new Set(cleaned)];
}

export async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}