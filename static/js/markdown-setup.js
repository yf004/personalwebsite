const md = window.markdownit({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});


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

    // "tags: a, b, c" -> ["a", "b", "c"]
    if (key === 'tags' && value.includes(',')) {
      data[key] = value.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (key === 'tags') {
      data[key] = [value];
    } else {
      data[key] = value;
    }
  }

  return { data, content: raw.slice(match[0].length) };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', {  
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}