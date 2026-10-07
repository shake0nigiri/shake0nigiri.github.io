/* =========================
   COMING SOON
========================= */

const comingSoonButtons =
  document.querySelectorAll(".coming-soon-button");

const comingSoonPopup =
  document.getElementById("comingSoonPopup");

let popupTimer;

comingSoonButtons.forEach((button) => {

  button.addEventListener("click", () => {

    clearTimeout(popupTimer);

    comingSoonPopup.classList.remove("show");

    /*
     * アニメーションをリセット
     */
    void comingSoonPopup.offsetWidth;

    comingSoonPopup.classList.add("show");

    popupTimer = setTimeout(() => {

      comingSoonPopup.classList.remove("show");

    }, 2000);

  });

});


/* =========================
   BACK TO TOP
========================= */

const backToTop =
  document.getElementById("backToTop");


function updateBackToTop() {

  /*
   * 120px以上スクロールしたら表示
   */
  if (window.scrollY > 120) {

    backToTop.classList.add("show");

  } else {

    backToTop.classList.remove("show");

  }

}


window.addEventListener(
  "scroll",
  updateBackToTop,
  { passive: true }
);


/*
 * ページ読み込み直後にも状態を確認
 */
updateBackToTop();


/*
 * TOPボタンを押したら最上部へ
 */
backToTop.addEventListener("click", () => {

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

});


/* =========================
   OSHAKE LOGO
   PAGE TRANSITION
========================= */

const siteLogo =
  document.getElementById("siteLogo");

const pageTransition =
  document.getElementById("pageTransition");


siteLogo.addEventListener("click", () => {

  /*
   * 連打防止
   */
  if (
    pageTransition.classList.contains("is-leaving")
  ) {
    return;
  }


  /*
   * 画面全体を黒で覆う
   */
  pageTransition.classList.add("is-leaving");


  /*
   * 演出が終わってから
   * index.html を再読み込み
   */
  setTimeout(() => {

    window.location.href =
      window.location.pathname +
      window.location.search;

  }, 650);

});
