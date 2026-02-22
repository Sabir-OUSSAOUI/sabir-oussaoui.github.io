// ===== ARTICLE PAGE SCRIPT =====

// Get article ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// Load article data
document.addEventListener('DOMContentLoaded', () => {
    if (articleId && window.articlesData && window.articlesData[articleId]) {
        loadArticle(articleId);
        loadRelatedArticles(articleId);
    } else {
        // If no article ID or invalid ID, redirect to home
        window.location.href = 'index.html#publications';
    }
});

function loadArticle(id) {
    const article = window.articlesData[id];

    // Set page title
    document.title = `${article.title} - Sabir OUSSAOUI`;

    // Breadcrumb
    document.getElementById('breadcrumb-title').textContent = article.title.substring(0, 50) + '...';

    // Article header
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-authors').textContent = article.authors;
    document.getElementById('article-year').textContent = article.year;

    // Check if it's a journal article or conference
    const isJournal = article.journal && !article.conference;
    const isConference = article.conference !== undefined;

    if (isJournal) {
        document.getElementById('journal-meta').style.display = 'flex';
        document.getElementById('article-journal').textContent = article.journal;
        document.getElementById('article-type').textContent = 'Journal Article';

        // Impact factor and citations
        if (article.impactFactor) {
            document.getElementById('article-if').style.display = 'inline-flex';
            document.getElementById('if-value').textContent = article.impactFactor;
            document.getElementById('sidebar-if').style.display = 'block';
            document.getElementById('sidebar-if-value').textContent = article.impactFactor;
        }

        if (article.citations) {
            document.getElementById('article-citations').style.display = 'inline-flex';
            document.getElementById('citations-value').textContent = article.citations;
            document.getElementById('sidebar-citations').style.display = 'block';
            document.getElementById('sidebar-citations-value').textContent = article.citations;
        }

        if (article.doi) {
            document.getElementById('article-doi-badge').style.display = 'inline-flex';
            const doiElement = document.getElementById('doi-value');
            doiElement.innerHTML = `<a href="${article.doi}" target="_blank" style="color: inherit; text-decoration: none;">${article.doi.replace('https://doi.org/', '')}</a>`;

            document.getElementById('sidebar-doi').style.display = 'block';
            const sidebarDoiElement = document.getElementById('sidebar-doi-value');
            sidebarDoiElement.innerHTML = `<a href="${article.doi}" target="_blank" style="color: #2563eb; text-decoration: none; word-break: break-all;">${article.doi}</a>`;
        }

        // Sidebar
        document.getElementById('sidebar-journal').style.display = 'block';
        document.getElementById('sidebar-journal-value').textContent = article.journal;
    }

    if (isConference) {
        document.getElementById('conference-meta').style.display = 'flex';
        document.getElementById('article-conference').textContent = article.conference;
        document.getElementById('article-type').textContent = 'Conference Presentation';

        document.getElementById('sidebar-conference').style.display = 'block';
        document.getElementById('sidebar-conference-value').textContent = article.conference;

        // Show conference description
        document.getElementById('conference-description-section').style.display = 'block';
        document.getElementById('conference-description').textContent = article.description || article.abstract;

        if (article.location) {
            document.getElementById('conference-location').style.display = 'flex';
            document.getElementById('location-text').textContent = article.location;
        }

        if (article.type) {
            document.getElementById('conference-type').style.display = 'flex';
            document.getElementById('type-text').textContent = article.type;
        }
    }

    // Sidebar year
    document.getElementById('sidebar-year-value').textContent = article.year;

    // Abstract
    document.getElementById('article-abstract').textContent = article.abstract;

    // Keywords (for journal articles)
    if (article.keywords && article.keywords.length > 0) {
        document.getElementById('keywords-section').style.display = 'block';
        const keywordsContainer = document.getElementById('article-keywords');
        keywordsContainer.innerHTML = '';
        article.keywords.forEach(keyword => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag';
            tag.textContent = keyword;
            keywordsContainer.appendChild(tag);
        });
    }

    // Methodology (for journal articles)
    if (article.methodology) {
        document.getElementById('methodology-section').style.display = 'block';
        document.getElementById('article-methodology').textContent = article.methodology;
    }

    // Results (for journal articles)
    if (article.results) {
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('article-results').textContent = article.results;
    }

    // Conclusions (for journal articles)
    if (article.conclusions) {
        document.getElementById('conclusions-section').style.display = 'block';
        document.getElementById('article-conclusions').textContent = article.conclusions;
    }
}

function loadRelatedArticles(currentId) {
    const relatedContainer = document.getElementById('related-publications');
    const allArticles = Object.entries(window.articlesData);

    // Filter out current article and get up to 3 related ones
    const relatedArticles = allArticles
        .filter(([id]) => id !== currentId)
        .slice(0, 3);

    relatedArticles.forEach(([id, article]) => {
        const card = document.createElement('div');
        card.className = 'related-card';
        card.onclick = () => {
            window.location.href = `article.html?id=${id}`;
        };

        const isJournal = article.journal && !article.conference;
        const badge = isJournal ? 'Journal Article' : 'Conference';

        card.innerHTML = `
            <div class="pub-badge" style="margin-bottom: 1rem;">${badge}</div>
            <h3>${article.title}</h3>
            <p class="authors">${article.authors.substring(0, 100)}...</p>
            <span class="year">${article.year}</span>
        `;

        relatedContainer.appendChild(card);
    });
}

// ===== SHARE FUNCTIONS =====
function shareArticle(platform) {
    const article = window.articlesData[articleId];
    const url = window.location.href;
    const title = article.title;
    const text = `Check out this publication: ${title}`;

    switch (platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'email':
            window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
            break;
    }
}

function copyLink() {
    const url = window.location.href;

    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    // Show feedback
    const button = event.target.closest('.share-btn');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.background = '#10b981';
    button.style.color = 'white';

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
        button.style.color = '';
    }, 2000);
}

// ===== SCROLL ANIMATIONS =====
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.article-section');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
});

// Initialize section animations
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.article-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
});

console.log('Article script loaded successfully!');
