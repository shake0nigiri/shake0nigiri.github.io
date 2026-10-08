const SUPABASE_URL = "https://jzyymrjxlhyrqyedzkhu.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_oRajBPM63vSnkUbxGmOzSA_lkwRbFw3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("editor-form");

  const editorTitle = document.getElementById("editor-title");

  const titleInput = document.getElementById("diary-title");

  const contentInput = document.getElementById("diary-content");

  const preview = document.getElementById("markdown-preview");

  const publishedInput = document.getElementById("published");

  const message = document.getElementById("editor-message");

  const draftButton = document.getElementById("draft-button");

  const saveButton = document.getElementById("save-button");

  const params = new URLSearchParams(window.location.search);

  const editId = params.get("id");

  const isEditMode = Boolean(editId);

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

    contentInput.value = diary.content;

    publishedInput.checked = diary.published;

    message.textContent = "";
  }

  function updatePreview() {
    let html = DiaryMarkdown.render(contentInput.value);

    if (typeof DOMPurify !== "undefined") {
      html = DOMPurify.sanitize(html);
    }

    preview.innerHTML = html;
  }

  contentInput.addEventListener("input", updatePreview);

  updatePreview();

  async function saveDiary(shouldPublish) {
    const title = titleInput.value.trim();

    const content = contentInput.value;

    if (!title) {
      message.textContent = "タイトルを入力してください。";

      titleInput.focus();

      return;
    }

    if (!content.trim()) {
      message.textContent = "本文を入力してください。";

      contentInput.focus();

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
      message.textContent = "下書きを保存しました。";
    }

    setTimeout(() => {
      if (isEditMode) {
        window.location.href = "post.html?id=" + encodeURIComponent(editId);
      } else {
        window.location.href = "index.html";
      }
    }, 700);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveDiary(publishedInput.checked);
  });

  draftButton.addEventListener("click", async () => {
    await saveDiary(false);
  });
});
