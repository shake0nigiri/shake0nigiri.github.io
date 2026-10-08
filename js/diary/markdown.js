"use strict";
function convertUnderline(source) {
    if (!source) {
        return "";
    }
    return source.replace(/__([^_\n]+?)__/g, "<u>$1</u>");
}
function looksLikeHtml(source) {
    return /<([a-z][^>]*)>/i.test(source);
}
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
function renderMarkdown(source) {
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
    });
}
const DiaryMarkdown = {
    render: renderMarkdown,
};
window.DiaryMarkdown = DiaryMarkdown;
