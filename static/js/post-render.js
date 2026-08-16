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

    // strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, content: raw.slice(match[0].length) };
}


async function loadPost() {
  const root = document.getElementById('post-root');
  const slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    root.innerHTML = '<p class="state-message is-error">No post specified.</p>';
    return;
  }

  try {
    const res = await fetch(`static/posts/${slug}.md`);
    if (!res.ok) throw new Error(`Failed to load ${slug}.md (${res.status})`);
    const raw = await res.text();

    const { data, content } = parseFrontmatter(raw);
    console.log(parseFrontmatter(raw));
    const html = md.render(content);

    document.title = data.title ? `${data.title} — Kiwi Kittwn` : 'Kiwi Kittwn';

    root.innerHTML = `
      <header class="post-header">
        <p class="post-eyebrow">Blog</p>
        <h1>${data.title}</h1>
        <div class="post-meta">
          <span>${formatDate(data.date)}</span>
        </div>
      </header>
      <div class="markdown-body">${html}</div>
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

    const langMatch = /language-(\w+)/.exec(codeEl.className);
    if (langMatch) {
      pre.setAttribute('data-lang', langMatch[1]);
    }
    pre.classList.add("code-block");

    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(codeEl.textContent);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 1500);
    });

    pre.appendChild(btn);
  });
}


document.addEventListener('DOMContentLoaded', loadPost);