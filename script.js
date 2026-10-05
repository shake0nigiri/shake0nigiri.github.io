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
     * アニメーションをリセットして
     * 毎回下から出てくるようにする
     */
    void comingSoonPopup.offsetWidth;

    comingSoonPopup.classList.add("show");

    popupTimer = setTimeout(() => {

      comingSoonPopup.classList.remove("show");

    }, 2000);

  });

});
