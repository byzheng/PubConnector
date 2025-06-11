
export function extractDOIs(text) {
    const doiPattern = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
    const matches = text.match(doiPattern) || [];
    // Remove trailing .pdf if present
    const cleaned = matches.map(doi => doi.replace(/(\.abstract|\.full|\.pdf|\/pdf|\/full|\.)$/i, ''));
    return [...new Set(cleaned)];
}

export async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}