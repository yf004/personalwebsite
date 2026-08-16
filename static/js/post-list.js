
async function loadPostList() {
  const container = document.getElementById('post-list');

  try {
    const res = await fetch('static/posts/posts.json');
    if (!res.ok) throw new Error(`Failed to load posts.json (${res.status})`);
    const posts = await res.json();

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = '';

    if (posts.length === 0) {
      container.innerHTML = '<p class="state-message">No posts yet.</p>';
      return;
    }

    for (const post of posts) {
      container.appendChild(renderPostCard(post));
    }
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<p class="state-message is-error">Couldn\'t load posts. Check the console.</p>';
  }
}

function renderPostCard(post) {
  const card = document.createElement('article');
  card.className = 'card';

  const url = `post.html?slug=${encodeURIComponent(post.slug)}`;

  // card clickable
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    window.location.href = url;
  });

  // keyboard accessibility
  card.tabIndex = 0;
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = url;
    }
  });

  card.innerHTML = `
    <h2 class="post-title">${escapeHtml(post.title)}</h2>
    <p class="info">${formatDate(post.date)}</p>
    <p class="info">${escapeHtml(post.excerpt || '')}</p>
  `;

  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', loadPostList);