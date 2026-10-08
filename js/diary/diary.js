const SUPABASE_URL = "https://jzyymrjxlhyrqyedzkhu.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_oRajBPM63vSnkUbxGmOzSA_lkwRbFw3";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  const diaryList = document.getElementById("diary-list");

  const message = document.getElementById("diary-message");

  const loginForm = document.getElementById("diary-login-form");

  const emailInput = document.getElementById("diary-email");

  const passwordInput = document.getElementById("diary-password");

  const loginButton = document.getElementById("diary-login-button");

  const authStatus = document.getElementById("diary-auth-status");

  const logoutButton = document.getElementById("diary-logout-button");

  const newDiaryButton = document.getElementById("new-diary-button");

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString + "T00:00:00+09:00");

    return date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function renderMarkdown(source) {
    let html = DiaryMarkdown.render(source || "");

    if (typeof DOMPurify !== "undefined") {
      html = DOMPurify.sanitize(html);
    }

    return html;
  }

  async function getSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("getSession error:", error);

      return null;
    }

    return data.session;
  }

  function updateAuthUI(session) {
    if (session) {
      loginForm.style.display = "none";

      authStatus.textContent = "ログイン中";

      logoutButton.style.display = "inline-block";

      newDiaryButton.style.display = "inline-block";
    } else {
      loginForm.style.display = "flex";

      authStatus.textContent = "";

      logoutButton.style.display = "none";

      newDiaryButton.style.display = "none";
    }
  }

  async function loadDiaries(session) {
    diaryList.innerHTML = "";

    message.textContent = "読み込み中...";

    let query = supabaseClient
      .from("diaries")
      .select(
        "id, author_id, title, diary_date, content, published, created_at, updated_at",
      )
      .order("diary_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (session) {
      query = query.or("published.eq.true,author_id.eq." + session.user.id);
    } else {
      query = query.eq("published", true);
    }

    const { data: diaries, error } = await query;

    if (error) {
      console.error("loadDiaries error:", error);

      message.textContent = "日記の読み込みに失敗しました: " + error.message;

      return;
    }

    if (!diaries || diaries.length === 0) {
      message.textContent = "";

      const empty = document.createElement("div");

      empty.className = "diary-empty";

      empty.textContent = "まだ日記がありません。";

      diaryList.appendChild(empty);

      return;
    }

    message.textContent = "";

    diaries.forEach((diary) => {
      const card = document.createElement("a");

      card.className = "diary-card";

      card.href = "post.html?id=" + encodeURIComponent(diary.id);

      const title = document.createElement("h2");

      title.className = "diary-card-title";

      title.textContent = diary.title;

      const date = document.createElement("div");

      date.className = "diary-card-date";

      date.textContent = formatDate(diary.diary_date);

      const preview = document.createElement("div");

      preview.className = "diary-card-preview";

      preview.innerHTML = renderMarkdown(diary.content);

      card.appendChild(title);
      card.appendChild(date);
      card.appendChild(preview);

      diaryList.appendChild(card);
    });
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    if (!email) {
      authStatus.textContent = "メールアドレスを入力してください。";

      emailInput.focus();

      return;
    }

    if (!password) {
      authStatus.textContent = "パスワードを入力してください。";

      passwordInput.focus();

      return;
    }

    loginButton.disabled = true;

    authStatus.textContent = "ログイン中...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login error:", error);

      authStatus.textContent = "ログインに失敗しました: " + error.message;

      loginButton.disabled = false;

      return;
    }

    console.log("Login success:", data);

    passwordInput.value = "";

    authStatus.textContent = "ログインしました。";

    const session = await getSession();

    updateAuthUI(session);

    await loadDiaries(session);

    loginButton.disabled = false;
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    authStatus.textContent = "ログアウト中...";

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout error:", error);

      authStatus.textContent = "ログアウトに失敗しました: " + error.message;

      logoutButton.disabled = false;

      return;
    }

    authStatus.textContent = "ログアウトしました。";

    logoutButton.disabled = false;

    updateAuthUI(null);

    await loadDiaries(null);
  });

  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth state:", event);

    updateAuthUI(session);
  });

  const session = await getSession();

  updateAuthUI(session);

  await loadDiaries(session);
});
