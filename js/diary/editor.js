"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("editor-form");
    const editorTitle = document.getElementById("editor-title");
    const titleInput = document.getElementById("diary-title");
    const preview = document.getElementById("markdown-preview");
    const publishedInput = document.getElementById("published");
    const message = document.getElementById("editor-message");
    const draftButton = document.getElementById("draft-button");
    const saveButton = document.getElementById("save-button");
    if (!form ||
        !editorTitle ||
        !titleInput ||
        !preview ||
        !publishedInput ||
        !message ||
        !draftButton ||
        !saveButton) {
        return;
    }
    const formElement = form;
    const editorTitleElement = editorTitle;
    const titleInputElement = titleInput;
    const previewElement = preview;
    const publishedInputElement = publishedInput;
    const messageElement = message;
    const draftButtonElement = draftButton;
    const saveButtonElement = saveButton;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("id");
    const isEditMode = Boolean(editId);
    const quill = new Quill("#editor", {
        theme: "snow",
        modules: {
            toolbar: {
                container: "#toolbar",
                handlers: {
                    image: imageHandler,
                },
            },
        },
        placeholder: "ここに日記を書いてください...",
    });
    function imageHandler() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif";
        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }
            if (!file.type.startsWith("image/")) {
                alert("画像ファイルを選択してください。");
                return;
            }
            if (file.size > 15 * 1024 * 1024) {
                alert("画像は15MB以下にしてください。");
                return;
            }
            messageElement.textContent = "画像を処理中...";
            try {
                const dataUrl = await resizeImage(file);
                const range = quill.getSelection(true);
                const index = range ? range.index : quill.getLength();
                quill.insertEmbed(index, "image", dataUrl, "user");
                quill.setSelection(index + 1, 0, "silent");
                updatePreview();
                messageElement.textContent = "";
            }
            catch (error) {
                console.error("Image error:", error);
                messageElement.textContent = "画像の挿入に失敗しました。";
            }
        });
        input.click();
    }
    function resizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result !== "string") {
                    reject(new Error("画像データを読み込めませんでした。"));
                    return;
                }
                const image = new Image();
                image.onload = () => {
                    const maxSize = 1600;
                    let width = image.width;
                    let height = image.height;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                        else {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    if (!context) {
                        reject(new Error("Canvasを使用できません。"));
                        return;
                    }
                    context.drawImage(image, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/webp", 0.82));
                };
                image.onerror = () => {
                    reject(new Error("画像を読み込めませんでした。"));
                };
                image.src = reader.result;
            };
            reader.onerror = () => {
                reject(new Error("画像ファイルを読み込めませんでした。"));
            };
            reader.readAsDataURL(file);
        });
    }
    function setEditorContent(source) {
        if (!source) {
            quill.setText("");
            return;
        }
        let html;
        if (looksLikeHtml(source)) {
            html = source;
        }
        else {
            html = DiaryMarkdown.render(source);
        }
        if (typeof DOMPurify !== "undefined") {
            html = DOMPurify.sanitize(html, {
                ADD_TAGS: ["img"],
                ADD_ATTR: ["src", "alt", "width", "height", "style"],
            });
        }
        quill.clipboard.dangerouslyPasteHTML(html);
    }
    function looksLikeHtml(source) {
        return /<([a-z][^>]*)>/i.test(source);
    }
    function updatePreview() {
        let html = quill.root.innerHTML;
        if (!html || html === "<p><br></p>") {
            previewElement.innerHTML =
                '<span style="opacity:.4;">プレビュー</span>';
            return;
        }
        if (typeof DOMPurify !== "undefined") {
            html = DOMPurify.sanitize(html, {
                ADD_TAGS: ["img"],
                ADD_ATTR: ["src", "alt", "width", "height", "style"],
            });
        }
        previewElement.innerHTML = html;
    }
    quill.on("text-change", updatePreview);
    if (isEditMode) {
        document.title = "EDIT DIARY - OSHAKE";
        editorTitleElement.textContent = "EDIT DIARY";
    }
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) {
        console.error(sessionError);
        messageElement.textContent =
            "ログイン情報の取得に失敗しました: " + sessionError.messageElement;
        formElement.style.display = "none";
        return;
    }
    const session = sessionData.session;
    if (!session) {
        messageElement.textContent = "ログインしてください。";
        formElement.style.display = "none";
        return;
    }
    if (isEditMode && editId) {
        messageElement.textContent = "日記を読み込み中...";
        const { data: diary, error } = await supabaseClient
            .from("diaries")
            .select("id, author_id, title, content, published")
            .eq("id", editId)
            .eq("author_id", session.user.id)
            .maybeSingle();
        if (error) {
            console.error(error);
            messageElement.textContent =
                "日記の読み込みに失敗しました: " + error.messageElement;
            formElement.style.display = "none";
            return;
        }
        if (!diary) {
            messageElement.textContent = "編集できる日記が見つかりません。";
            formElement.style.display = "none";
            return;
        }
        titleInputElement.value = diary.title;
        publishedInputElement.checked = diary.published;
        setEditorContent(diary.content);
        messageElement.textContent = "";
    }
    else {
        updatePreview();
    }
    async function saveDiary(shouldPublish) {
        const title = titleInputElement.value.trim();
        const content = quill.root.innerHTML;
        const plainText = quill.getText().trim();
        if (!title) {
            messageElement.textContent = "タイトルを入力してください。";
            titleInputElement.focus();
            return;
        }
        if (!plainText) {
            messageElement.textContent = "本文を入力してください。";
            quill.focus();
            return;
        }
        saveButtonElement.disabled = true;
        draftButtonElement.disabled = true;
        if (isEditMode) {
            messageElement.textContent = "更新中...";
        }
        else if (shouldPublish) {
            messageElement.textContent = "投稿中...";
        }
        else {
            messageElement.textContent = "下書きを保存中...";
        }
        let result;
        if (isEditMode && editId) {
            result = await supabaseClient
                .from("diaries")
                .update({
                title,
                content,
                published: shouldPublish,
                updated_at: new Date().toISOString(),
            })
                .eq("id", editId)
                .eq("author_id", session.user.id);
        }
        else {
            const today = new Date().toLocaleDateString("en-CA", {
                timeZone: "Asia/Tokyo",
            });
            result = await supabaseClient.from("diaries").insert({
                author_id: session.user.id,
                title,
                diary_date: today,
                content,
                published: shouldPublish,
            });
        }
        if (result.error) {
            console.error(result.error);
            messageElement.textContent =
                "保存に失敗しました: " + result.error.messageElement;
            saveButtonElement.disabled = false;
            draftButtonElement.disabled = false;
            return;
        }
        if (isEditMode) {
            messageElement.textContent = "更新しました。";
        }
        else if (shouldPublish) {
            messageElement.textContent = "投稿しました。";
        }
        else {
            messageElement.textContent = "下書きを保存しました。";
        }
        setTimeout(() => {
            if (isEditMode && editId) {
                window.location.href =
                    "post.html?id=" + encodeURIComponent(editId);
            }
            else {
                window.location.href = "index.html";
            }
        }, 700);
    }
    formElement.addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveDiary(publishedInputElement.checked);
    });
    draftButtonElement.addEventListener("click", async () => {
        await saveDiary(false);
    });
});
