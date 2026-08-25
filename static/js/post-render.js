function parseFrontmatter(raw) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(raw);

  if (!match) {
    return { data: {}, content: raw };
  }

  const data = {};

  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');

    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return {
    data,
    content: raw.slice(match[0].length)
  };
}


/*
 * Create a meta tag in <head>
 */
function createMeta(name, content) {
  if (!content) return;

  const meta = document.createElement('meta');

  meta.name = name;
  meta.content = content;

  document.head.appendChild(meta);
}


/*
 * Create an Open Graph meta tag
 */
function createOpenGraph(property, content) {
  if (!content) return;

  const meta = document.createElement('meta');

  meta.setAttribute('property', property);
  meta.setAttribute('content', content);

  document.head.appendChild(meta);
}


/*
 * Create/update the post metadata
 */
function setPostMeta(data, slug) {
  const title = data.title || 'Kiwi Kittwn';
  const description = data.description || 'A blog post from Kiwi Kittwn.';
  const tags = data.tags || '';

  /*
   * Page title
   */
  document.title = data.title
    ? `${data.title} — Kiwi Kittwn`
    : 'Kiwi Kittwn';


  /*
   * Standard SEO metadata
   */
  createMeta('description', description);
  createMeta('keywords', tags);


  /*
   * Open Graph metadata
   */
  createOpenGraph('og:type', 'article');
  createOpenGraph('og:title', title);
  createOpenGraph('og:description', description);
  createOpenGraph('og:site_name', 'Kiwi Kittwn');

  createOpenGraph(
    'og:url',
    window.location.href
  );


  /*
   * Twitter / X metadata
   */
  createMeta('twitter:card', 'summary_large_image');
  createMeta('twitter:title', title);
  createMeta('twitter:description', description);


  /*
   * Canonical URL
   */
  const canonical = document.createElement('link');

  canonical.rel = 'canonical';

  canonical.href =
    `https://kiwikittwn.space/post.html?slug=${encodeURIComponent(slug)}`;

  document.head.appendChild(canonical);
}


async function loadPost() {
  const root = document.getElementById('post-root');

  const slug =
    new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    root.innerHTML =
      '<p class="state-message is-error">No post specified.</p>';

    return;
  }

  try {
    const res =
      await fetch(`static/posts/${slug}.md`);

    if (!res.ok) {
      throw new Error(
        `Failed to load ${slug}.md (${res.status})`
      );
    }

    const raw = await res.text();

    const { data, content } =
      parseFrontmatter(raw);

    console.log('Post data:', data);

    /*
     * Generate metadata from frontmatter
     */
    setPostMeta(data, slug);


    /*
     * Render Markdown
     */
    const html = md.render(content);

    root.innerHTML = `
      <header class="post-header">
        <p class="post-eyebrow">Blog</p>

        <h1>${data.title || 'Untitled Post'}</h1>

        <div class="post-meta">
          <span>${formatDate(data.date)}</span>
        </div>
      </header>

      <div class="markdown-body">
        ${html}
      </div>
    `;

    enhanceCodeBlocks(root);

  } catch (err) {
    console.error(err);

    root.innerHTML =
      '<p class="state-message is-error">Couldn\'t load this post. Check the console.</p>';
  }
}


function enhanceCodeBlocks(root) {
  root.querySelectorAll('pre > code').forEach((codeEl) => {
    const pre = codeEl.parentElement;

    const langMatch =
      /language-(\w+)/.exec(codeEl.className);

    if (langMatch) {
      pre.setAttribute('data-lang', langMatch[1]);
    }

    pre.classList.add('code-block');

    const btn = document.createElement('button');

    btn.className = 'code-copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(
          codeEl.textContent
        );

        btn.textContent = 'Copied!';

        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 1500);

      } catch (err) {
        console.error('Failed to copy code:', err);

        btn.textContent = 'Failed';

        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 1500);
      }
    });

    pre.appendChild(btn);
  });
}


document.addEventListener(
  'DOMContentLoaded',
  loadPost
);
