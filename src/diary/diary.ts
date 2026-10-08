document.addEventListener("DOMContentLoaded", async () => {
  const diaryList = document.getElementById("diary-list") as HTMLElement | null;
  const message = document.getElementById("diary-message") as HTMLElement | null;
  const loginForm = document.getElementById("diary-login-form") as HTMLFormElement | null;
  const emailInput = document.getElementById("diary-email") as HTMLInputElement | null;
  const passwordInput = document.getElementById("diary-password") as HTMLInputElement | null;
  const loginButton = document.getElementById("diary-login-button") as HTMLButtonElement | null;
  const authStatus = document.getElementById("diary-auth-status") as HTMLElement | null;
  const logoutButton = document.getElementById("diary-logout-button") as HTMLButtonElement | null;
  const newDiaryButton = document.getElementById("new-diary-button") as HTMLElement | null;

  if (
    !diaryList ||
    !message ||
    !loginForm ||
    !emailInput ||
    !passwordInput ||
    !loginButton ||
    !authStatus ||
    !logoutButton ||
    !newDiaryButton
  ) {
    return;
  }

  const diaryListElement = diaryList;
  const messageElement = message;
  const loginFormElement = loginForm;
  const emailInputElement = emailInput;
  const passwordInputElement = passwordInput;
  const loginButtonElement = loginButton;
  const authStatusElement = authStatus;
  const logoutButtonElement = logoutButton;
  const newDiaryButtonElement = newDiaryButton;

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return "";
    }

    const date = new Date(`${dateString}T00:00:00+09:00`);

    return date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function renderMarkdown(source: string | null | undefined): string {
    let html = DiaryMarkdown.render(source ?? "");

    if (typeof DOMPurify !== "undefined") {
      html = DOMPurify.sanitize(html);
    }

    return html;
  }

  async function getSession(): Promise<any | null> {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("getSession error:", error);
      return null;
    }

    return data.session;
  }

  function updateAuthUI(session: any | null): void {
    if (session) {
      loginFormElement.style.display = "none";
      authStatusElement.textContent = "ログイン中";
      logoutButtonElement.style.display = "inline-block";
      newDiaryButtonElement.style.display = "inline-block";
    } else {
      loginFormElement.style.display = "flex";
      authStatusElement.textContent = "";
      logoutButtonElement.style.display = "none";
      newDiaryButtonElement.style.display = "none";
    }
  }

  async function loadDiaries(session: any | null): Promise<void> {
    diaryListElement.innerHTML = "";
    messageElement.textContent = "読み込み中...";

    let query = supabaseClient
      .from("diaries")
      .select(
        "id, author_id, title, diary_date, content, published, created_at, updated_at",
      )
      .order("diary_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (session) {
      query = query.or(`published.eq.true,author_id.eq.${session.user.id}`);
    } else {
      query = query.eq("published", true);
    }

    const { data: diaries, error } = await query;

    if (error) {
      console.error("loadDiaries error:", error);
      messageElement.textContent =
        "日記の読み込みに失敗しました: " + error.messageElement;
      return;
    }

    if (!diaries || diaries.length === 0) {
      messageElement.textContent = "";

      const empty = document.createElement("div");
      empty.className = "diary-empty";
      empty.textContent = "まだ日記がありません.";
      diaryListElement.appendChild(empty);

      return;
    }

    messageElement.textContent = "";

    diaries.forEach((diary: any) => {
      const card = document.createElement("a");
      card.className = "diary-card";
      card.href = `post.html?id=${encodeURIComponent(diary.id)}`;

      const title = document.createElement("h2");
      title.className = "diary-card-title";
      title.textContent = diary.title;

      const date = document.createElement("div");
      date.className = "diary-card-date";
      date.textContent = formatDate(diary.diary_date);

      const preview = document.createElement("div");
      preview.className = "diary-card-preview";
      preview.innerHTML = renderMarkdown(diary.content);

      card.append(title, date, preview);
      diaryListElement.appendChild(card);
    });
  }

  loginFormElement.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    const email = emailInputElement.value.trim();
    const password = passwordInputElement.value;

    if (!email) {
      authStatusElement.textContent = "メールアドレスを入力してください。";
      emailInputElement.focus();
      return;
    }

    if (!password) {
      authStatusElement.textContent = "パスワードを入力してください。";
      passwordInputElement.focus();
      return;
    }

    loginButtonElement.disabled = true;
    authStatusElement.textContent = "ログイン中...";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      authStatusElement.textContent =
        "ログインに失敗しました: " + error.messageElement;
      loginButtonElement.disabled = false;
      return;
    }

    passwordInputElement.value = "";
    authStatusElement.textContent = "ログインしました。";

    const session = await getSession();

    updateAuthUI(session);
    await loadDiaries(session);

    loginButtonElement.disabled = false;
  });

  logoutButtonElement.addEventListener("click", async () => {
    logoutButtonElement.disabled = true;
    authStatusElement.textContent = "ログアウト中...";

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      authStatusElement.textContent =
        "ログアウトに失敗しました: " + error.messageElement;
      logoutButtonElement.disabled = false;
      return;
    }

    authStatusElement.textContent = "ログアウトしました。";
    logoutButtonElement.disabled = false;

    updateAuthUI(null);
    await loadDiaries(null);
  });

  supabaseClient.auth.onAuthStateChange((event: string, session: any | null) => {
    console.log("Auth state:", event);
    updateAuthUI(session);
  });

  const session = await getSession();

  updateAuthUI(session);
  await loadDiaries(session);
});
