window.DiaryMarkdown = (() => {
  function convertUnderline(source) {
    if (!source) {
      return "";
    }

    return source.replace(/__([^_\n]+?)__/g, "<u>$1</u>");
  }

  function looksLikeHtml(source) {
    return /<([a-z][^>]*)>/i.test(source);
  }

  function render(source) {
    if (!source) {
      return "";
    }

    /*
     * 新しいエディタで保存した
     * HTMLはそのまま返す。
     */

    if (looksLikeHtml(source)) {
      return source;
    }

    /*
     * 以前のMarkdown日記は
     * これまで通り表示する。
     */

    const underlineConverted = convertUnderline(source);

    if (typeof marked === "undefined") {
      return escapeHtml(underlineConverted).replace(/\n/g, "<br>");
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
