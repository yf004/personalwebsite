const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  // ---- Markdown engine: same options the old client-side setup used ----
  const md = markdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  });
  eleventyConfig.setLibrary("md", md);

  // ---- Static assets: copy src/static -> _site/static, plus root files ----
  eleventyConfig.addPassthroughCopy("src/static");
  eleventyConfig.addPassthroughCopy("src/favicon-32x32.png");
  eleventyConfig.addPassthroughCopy("src/favicon-16x16.png");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/CNAME");

  eleventyConfig.addFilter("readableDate", (dateInput) => {
    const d = new Date(dateInput);
    if (isNaN(d)) return dateInput;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
