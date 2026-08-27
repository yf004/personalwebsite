function enhanceCodeBlocks(root) {
  if (!root) return;

  root.querySelectorAll('pre > code').forEach((codeEl) => {
    const pre = codeEl.parentElement;

    const langMatch = /language-(\w+)/.exec(codeEl.className);
    if (langMatch) pre.setAttribute('data-lang', langMatch[1]);

    pre.classList.add('code-block');

    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent);
        btn.textContent = 'Copied!';
      } catch (err) {
        console.error('Failed to copy code:', err);
        btn.textContent = 'Failed';
      }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });

    pre.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  enhanceCodeBlocks(document.getElementById('post-root'));
  if (window.hljs) hljs.highlightAll();
});
