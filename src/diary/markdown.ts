function convertUnderline(source: string): string {
  if (!source) {
    return "";
  }

  return source.replace(/__([^_\n]+?)__/g, "<u>$1</u>");
}

function looksLikeHtml(source: string): boolean {
  return /<([a-z][^>]*)>/i.test(source);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(source: string): string {
  if (!source) {
    return "";
  }

  if (looksLikeHtml(source)) {
    return source;
  }

  const underlineConverted = convertUnderline(source);

  if (typeof marked === "undefined") {
    return escapeHtml(underlineConverted).replace(/\n/g, "<br>");
  }

  return marked.parse(underlineConverted, {
    breaks: true,
    gfm: true,
  }) as string;
}

const DiaryMarkdown: DiaryMarkdownApi = {
  render: renderMarkdown,
};

window.DiaryMarkdown = DiaryMarkdown;
