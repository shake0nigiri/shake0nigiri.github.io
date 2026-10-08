"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const titleElement = document.getElementById("post-title");
    const dateElement = document.getElementById("post-date");
    const contentElement = document.getElementById("post-content");
    const messageElement = document.getElementById("post-message");
    const actionsElement = document.getElementById("post-actions");
    const editButton = document.getElementById("edit-button");
    const deleteButton = document.getElementById("delete-button");
    if (!titleElement ||
        !dateElement ||
        !contentElement ||
        !messageElement ||
        !actionsElement ||
        !editButton ||
        !deleteButton) {
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");
    if (!postId) {
        titleElement.textContent = "日記が見つかりません。";
        return;
    }
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const session = sessionData.session;
    const { data: diary, error } = await supabaseClient
        .from("diaries")
        .select("id, author_id, title, diary_date, content, published, created_at, updated_at")
        .eq("id", postId)
        .maybeSingle();
    if (error) {
        console.error(error);
        titleElement.textContent = "読み込みに失敗しました。";
        messageElement.textContent = error.message;
        return;
    }
    if (!diary) {
        titleElement.textContent = "日記が見つかりません。";
        return;
    }
    const isOwner = Boolean(session && session.user.id === diary.author_id);
    if (!diary.published && !isOwner) {
        titleElement.textContent = "この日記は公開されていません。";
        return;
    }
    titleElement.textContent = diary.title;
    if (diary.diary_date) {
        const date = new Date(`${diary.diary_date}T00:00:00+09:00`);
        dateElement.textContent = date.toLocaleDateString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
    let html = DiaryMarkdown.render(diary.content);
    if (typeof DOMPurify !== "undefined") {
        html = DOMPurify.sanitize(html, {
            ADD_TAGS: ["img"],
            ADD_ATTR: ["src", "alt", "width", "height", "style"],
        });
    }
    contentElement.innerHTML = html;
    if (isOwner && session) {
        actionsElement.style.display = "flex";
        editButton.href = `editor.html?id=${encodeURIComponent(diary.id)}`;
        deleteButton.addEventListener("click", async () => {
            if (!window.confirm("この日記を削除しますか？")) {
                return;
            }
            deleteButton.disabled = true;
            messageElement.textContent = "削除中...";
            const { error: deleteError } = await supabaseClient
                .from("diaries")
                .delete()
                .eq("id", diary.id)
                .eq("author_id", session.user.id);
            if (deleteError) {
                console.error(deleteError);
                messageElement.textContent =
                    "削除に失敗しました: " + deleteError.message;
                deleteButton.disabled = false;
                return;
            }
            window.location.href = "index.html";
        });
    }
});
