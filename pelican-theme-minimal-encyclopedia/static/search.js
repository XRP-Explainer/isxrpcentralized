let articles = [];
let extractor;

// Load embeddings from the server
async function loadEmbeddings() {
    const response = await fetch("http://127.0.0.1:8000/embeddings.json");
    articles = await response.json();
}

// Load the transformer model dynamically
async function loadModel() {
    if (!window.pipeline) {
        console.error("Transformer pipeline not loaded!");
        return;
    }
    extractor = await window.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
}

// Generate embedding for a query
async function generateEmbedding(text) {
    if (!extractor) await loadModel();
    let embedding = await extractor(text, { pooling: 'mean', normalize: true });
    return embedding.data;
}

// Compute cosine similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0, normA = 0.0, normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] ** 2;
        normB += vecB[i] ** 2;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Perform search and sort the articles based on relevance
async function searchArticles(query) {
    const queryEmbedding = await generateEmbedding(query);

    let results = articles.map(article => ({
        ...article,
        score: cosineSimilarity(queryEmbedding, article.embedding)
    }));

    // Sort results by highest score first
    results.sort((a, b) => b.score - a.score);

    // Get all divs inside the article list section
    let articleSection = document.querySelector("section.article-list");
    let articleDivs = Array.from(articleSection.children);

    // Create a mapping of title to div for sorting
    let divMap = {};
    articleDivs.forEach(div => {
        let h2 = div.querySelector("h2 > a");
        if (h2) {
            divMap[h2.innerText.trim()] = div;
        }
    });

    // Sort the existing divs based on search ranking
    let sortedDivs = results
        .map(result => divMap[result.title])
        .filter(div => div !== undefined); // Ensure only existing divs are moved

    // Reorder the divs in the DOM
    sortedDivs.forEach(div => articleSection.appendChild(div));
}

// Attach search input event
document.getElementById("search-bar").addEventListener("input", async (event) => {
    searchArticles(event.target.value);
});

// Initialize
await loadEmbeddings();
await loadModel();
