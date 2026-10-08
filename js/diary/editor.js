const SUPABASE_URL = "https://jzyymrjxlhyrqyedzkhu.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_oRajBPM63vSnkUbxGmOzSA_lkwRbFw3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("editor-form");

  const editorTitle = document.getElementById("editor-title");

  const titleInput = document.getElementById("diary-title");

  const preview = document.getElementById("markdown-preview");

  const publishedInput = document.getElementById("published");

  const message = document.getElementById("editor-message");

  const draftButton = document.getElementById("draft-button");

  const saveButton = document.getElementById("save-button");

  const params = new URLSearchParams(window.location.search);

  const editId = params.get("id");

  const isEditMode = Boolean(editId);

  /*
   * Quill editor
   */

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

  /*
   * 画像挿入
   *
   * Supabase Storageを使わず、
   * ブラウザ側で画像を縮小して
   * HTML内へ埋め込みます。
   */

  function imageHandler() {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";

    input.click();

    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];

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

      message.textContent = "画像を処理中...";

      try {
        const dataUrl = await resizeImage(file);

        const range = quill.getSelection(true);

        const index = range ? range.index : quill.getLength();

        quill.insertEmbed(index, "image", dataUrl, "user");

        quill.setSelection(index + 1, 0, "silent");

        updatePreview();

        message.textContent = "";
      } catch (error) {
        console.error("Image error:", error);

        message.textContent = "画像の挿入に失敗しました。";
      }
    });
  }

  /*
   * 大きすぎる画像を縮小
   */

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxSize = 1600;

          let width = image.width;

          let height = image.height;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);

              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);

              height = maxSize;
            }
          }

          const canvas = document.createElement("canvas");

          canvas.width = width;

          canvas.height = height;

          const context = canvas.getContext("2d");

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

  /*
   * Markdown / HTMLをQuillへ読み込む
   */

  function setEditorContent(source) {
    if (!source) {
      quill.setText("");

      return;
    }

    /*
     * 新しい日記はHTML。
     * 過去のMarkdown日記は
     * markedでHTMLに変換する。
     */

    let html;

    if (looksLikeHtml(source)) {
      html = source;
    } else {
      html = DiaryMarkdown.render(source);
    }

    if (typeof DOMPurify !== "undefined") {
      html = DOMPurify.sanitize(html, {
        ADD_TAGS: ["img"],

        ADD_ATTR: ["src", "alt", "width", "height"],
      });
    }

    quill.clipboard.dangerouslyPasteHTML(html);
  }

  function looksLikeHtml(source) {
    return /<([a-z][^>]*)>/i.test(source);
  }

  /*
   * プレビュー
   */

  function updatePreview() {
    let html = quill.root.innerHTML;

    if (!html || html === "<p><br></p>") {
      preview.innerHTML = '<span style="opacity:.4;">プレビュー</span>';

      return;
    }

    if (typeof DOMPurify !== "undefined") {
      html = DOMPurify.sanitize(html, {
        ADD_TAGS: ["img"],

        ADD_ATTR: ["src", "alt", "width", "height"],
      });
    }

    preview.innerHTML = html;
  }

  quill.on("text-change", updatePreview);

  /*
   * 新規 / 編集
   */

  if (isEditMode) {
    document.title = "EDIT DIARY - OSHAKE";

    editorTitle.textContent = "EDIT DIARY";
  }

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error(sessionError);

    message.textContent =
      "ログイン情報の取得に失敗しました: " + sessionError.message;

    form.style.display = "none";

    return;
  }

  const session = sessionData.session;

  if (!session) {
    message.textContent = "ログインしてください。";

    form.style.display = "none";

    return;
  }

  /*
   * 編集する日記を読み込む
   */

  if (isEditMode) {
    message.textContent = "日記を読み込み中...";

    const { data: diary, error } = await supabaseClient
      .from("diaries")
      .select("id, author_id, title, content, published")
      .eq("id", editId)
      .eq("author_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);

      message.textContent = "日記の読み込みに失敗しました: " + error.message;

      form.style.display = "none";

      return;
    }

    if (!diary) {
      message.textContent = "編集できる日記が見つかりません。";

      form.style.display = "none";

      return;
    }

    titleInput.value = diary.title;

    publishedInput.checked = diary.published;

    setEditorContent(diary.content);

    message.textContent = "";
  } else {
    updatePreview();
  }

  /*
   * 保存
   */

  async function saveDiary(shouldPublish) {
    const title = titleInput.value.trim();

    const content = quill.root.innerHTML;

    const plainText = quill.getText().trim();

    if (!title) {
      message.textContent = "タイトルを入力してください。";

      titleInput.focus();

      return;
    }

    if (!plainText) {
      message.textContent = "本文を入力してください。";

      quill.focus();

      return;
    }

    saveButton.disabled = true;

    draftButton.disabled = true;

    if (isEditMode) {
      message.textContent = "更新中...";
    } else if (shouldPublish) {
      message.textContent = "投稿中...";
    } else {
      message.textContent = "下書きを保存中...";
    }

    let result;

    if (isEditMode) {
      result = await supabaseClient
        .from("diaries")
        .update({
          title: title,

          content: content,

          published: shouldPublish,

          updated_at: new Date().toISOString(),
        })
        .eq("id", editId)
        .eq("author_id", session.user.id);
    } else {
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Tokyo",
      });

      result = await supabaseClient.from("diaries").insert({
        author_id: session.user.id,

        title: title,

        diary_date: today,

        content: content,

        published: shouldPublish,
      });
    }

    if (result.error) {
      console.error(result.error);

      message.textContent = "保存に失敗しました: " + result.error.message;

      saveButton.disabled = false;

      draftButton.disabled = false;

      return;
    }

    if (isEditMode) {
      message.textContent = "更新しました。";
    } else if (shouldPublish) {
      message.textContent = "投稿しました。";
    } else {
      message.textContent = "下書きを保存しました.";
    }

    setTimeout(() => {
      if (isEditMode) {
        window.location.href = "post.html?id=" + encodeURIComponent(editId);
      } else {
        window.location.href = "index.html";
      }
    }, 700);
  }

  /*
   * PUBLISH
   */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveDiary(publishedInput.checked);
  });

  /*
   * SAVE DRAFT
   */

  draftButton.addEventListener("click", async () => {
    await saveDiary(false);
  });
});
