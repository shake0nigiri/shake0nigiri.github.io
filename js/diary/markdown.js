window.DiaryMarkdown = (() => {
  function convertUnderline(source) {
    if (!source) {
      return "";
    }

    return source.replace(/__([^_\n]+?)__/g, "<u>$1</u>");
  }

  function render(source) {
    const underlineConverted = convertUnderline(source);

    if (typeof marked === "undefined") {
      return escapeHtml(source).replace(/\n/g, "<br>");
    }

    return marked.parse(underlineConverted, {
      breaks: true,
      gfm: true,
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
  }

  return {
    render,
  };
})();
