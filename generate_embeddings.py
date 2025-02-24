import os
import json
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer

# Configuration
HTML_DIR = "./output/"  # Directory containing HTML files
OUTPUT_FILE = "./embeddings.json"  # Output file
BASE_URL = "https://isxrpcentralized.com/"  # Change to your actual website URL

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def extract_text_from_html(html_file):
    """Extracts title, summary, and main content from an HTML file."""
    with open(html_file, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    # Extract title (from first <h1> inside <article>)
    article = soup.find("article")
    title = article.find("h1").get_text(strip=True) if article and article.find("h1") else None

    # Extract summary (from <div class="summary">)
    summary = soup.find("div", class_="summary")
    summary_text = summary.get_text(strip=True) if summary else ""

    # Extract main content (excluding summary)
    main_content = article.get_text(separator=" ", strip=True) if article else ""
    
    return title, summary_text, main_content

# Process all HTML files
embeddings_data = []
for filename in os.listdir(HTML_DIR):
    if filename.endswith(".html"):
        if filename in ['index.html']:
            continue
        filepath = os.path.join(HTML_DIR, filename)
        url = BASE_URL + filename  # Construct URL based on filename

        title, summary, content = extract_text_from_html(filepath)

        if not title:
            title = filename.replace(".html", "").replace("-", " ").title()  # Fallback title

        # Generate embedding for full content
        embedding = model.encode(content).tolist()

        embeddings_data.append({
            "title": title,
            "summary": summary,
            "content": content,
            "url": url,
            "embedding": embedding
        })

# Save embeddings as JSON
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(embeddings_data, f, indent=2)

print(f"✅ Embeddings saved to {OUTPUT_FILE}")
