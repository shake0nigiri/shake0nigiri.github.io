"use strict";
document.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.body.classList.add("is-built");
        }, 100);
    });
    document.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
    const hoverSoundPath = "sounds/click.mp3";
    let lastHoverTarget = null;
    document.querySelectorAll("button, a").forEach((element) => {
        element.addEventListener("mouseenter", () => {
            if (lastHoverTarget === element) {
                return;
            }
            lastHoverTarget = element;
            const sound = new Audio(hoverSoundPath);
            sound.volume = 0.35;
            sound.play().catch(() => { });
        });
        element.addEventListener("mouseleave", () => {
            if (lastHoverTarget === element) {
                lastHoverTarget = null;
            }
        });
    });
    const comingSoonButtons = document.querySelectorAll(".coming-soon-button");
    const popup = document.getElementById("coming-soon-popup");
    comingSoonButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!popup) {
                return;
            }
            popup.classList.remove("show");
            requestAnimationFrame(() => {
                popup.classList.add("show");
            });
            setTimeout(() => {
                popup.classList.remove("show");
            }, 2000);
        });
    });
    const topButton = document.getElementById("top-button");
    if (topButton) {
        const topButtonElement = topButton;
        function updateTopButton() {
            if (window.scrollY > 120) {
                topButtonElement.classList.add("visible");
            }
            else {
                topButtonElement.classList.remove("visible");
            }
        }
        window.addEventListener("scroll", updateTopButton, {
            passive: true,
        });
        updateTopButton();
        topButtonElement.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        });
    }
    const siteLogo = document.querySelector(".site-logo");
    const transition = document.getElementById("page-transition");
    if (siteLogo && transition) {
        siteLogo.addEventListener("click", (event) => {
            event.preventDefault();
            transition.classList.add("active");
            setTimeout(() => {
                const href = siteLogo.getAttribute("href");
                if (href) {
                    window.location.href = href;
                }
            }, 500);
        });
    }
    const holdLinks = document.querySelectorAll(".hold-link");
    holdLinks.forEach((link) => {
        const progress = link.querySelector(".hold-progress");
        if (!progress) {
            return;
        }
        const progressElement = progress;
        const HOLD_TIME = 800;
        let holding = false;
        let completed = false;
        let startTime = 0;
        let animationFrame = null;
        function createProgressEdges() {
            progressElement.innerHTML = "";
            const top = document.createElement("span");
            top.className = "edge-top";
            const right = document.createElement("span");
            right.className = "edge-right";
            const bottom = document.createElement("span");
            bottom.className = "edge-bottom";
            const left = document.createElement("span");
            left.className = "edge-left";
            progressElement.append(top, right, bottom, left);
            return { top, right, bottom, left };
        }
        const edges = createProgressEdges();
        function resetProgress() {
            edges.top.style.width = "0%";
            edges.right.style.height = "0%";
            edges.bottom.style.width = "0%";
            edges.left.style.height = "0%";
        }
        function drawProgress(ratio) {
            const value = Math.max(0, Math.min(1, ratio));
            if (value <= 0.25) {
                edges.top.style.width = `${value * 4 * 100}%`;
                edges.right.style.height = "0%";
                edges.bottom.style.width = "0%";
                edges.left.style.height = "0%";
            }
            else if (value <= 0.5) {
                edges.top.style.width = "100%";
                edges.right.style.height =
                    `${(value - 0.25) * 4 * 100}%`;
                edges.bottom.style.width = "0%";
                edges.left.style.height = "0%";
            }
            else if (value <= 0.75) {
                edges.top.style.width = "100%";
                edges.right.style.height = "100%";
                edges.bottom.style.width =
                    `${(value - 0.5) * 4 * 100}%`;
                edges.left.style.height = "0%";
            }
            else {
                edges.top.style.width = "100%";
                edges.right.style.height = "100%";
                edges.bottom.style.width = "100%";
                edges.left.style.height =
                    `${(value - 0.75) * 4 * 100}%`;
            }
        }
        function cancelHold() {
            holding = false;
            completed = false;
            if (animationFrame !== null) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            resetProgress();
        }
        function animateHold() {
            if (!holding) {
                return;
            }
            const elapsed = performance.now() - startTime;
            const ratio = elapsed / HOLD_TIME;
            drawProgress(ratio);
            if (ratio >= 1) {
                holding = false;
                completed = true;
                drawProgress(1);
                window.open(link.href, "_blank", "noopener,noreferrer");
                setTimeout(() => {
                    completed = false;
                    resetProgress();
                }, 150);
                return;
            }
            animationFrame = requestAnimationFrame(animateHold);
        }
        function startHold(event) {
            if (event.pointerType === "mouse" &&
                event.button !== 0) {
                return;
            }
            event.preventDefault();
            cancelHold();
            holding = true;
            startTime = performance.now();
            try {
                link.setPointerCapture(event.pointerId);
            }
            catch {
                // Pointer Captureが使えない環境では無視する。
            }
            animationFrame = requestAnimationFrame(animateHold);
        }
        link.addEventListener("pointerdown", startHold);
        link.addEventListener("pointerup", (event) => {
            if (completed) {
                return;
            }
            try {
                link.releasePointerCapture(event.pointerId);
            }
            catch {
                // すでに解放されている場合は無視する。
            }
            cancelHold();
        });
        link.addEventListener("pointercancel", cancelHold);
        link.addEventListener("pointerleave", (event) => {
            if (event.pointerType === "mouse" &&
                !completed) {
                cancelHold();
            }
        });
        link.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            document
                .querySelectorAll(".hold-link")
                .forEach(() => {
                // ページ非表示時はリンクの進行表示をリセットする。
            });
        }
    });
});
