(function () {
  var ua = navigator.userAgent;
  var loadingEl = document.getElementById("loading");
  var contentEl = document.getElementById("content");

  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Derived client-side from the current host. This file is served statically
  // (so the CSP can drop 'unsafe-inline'), meaning the server-side template
  // substitution that fills EXPS_URL_PLACEHOLDER in the HTML does not run here.
  var deepLink = "exps://" + window.location.host;

  var appStoreBtn = document.getElementById("app-store-btn");
  var playStoreBtn = document.getElementById("play-store-btn");
  var storeButtonsContainer = document.getElementById("store-buttons");

  if (isIOS) {
    playStoreBtn.className = "store-link";
    storeButtonsContainer.appendChild(playStoreBtn);
  } else if (isAndroid) {
    appStoreBtn.className = "store-link";
    storeButtonsContainer.insertBefore(playStoreBtn, appStoreBtn);
  }

  var qrCode = new QRCodeStyling({
    width: 400,
    height: 400,
    data: deepLink,
    dotsOptions: { color: "#333333", type: "rounded" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "extra-rounded" },
    cornersDotOptions: { type: "dot" },
    qrOptions: { errorCorrectionLevel: "H" },
  });

  qrCode.append(document.getElementById("qr-code"));

  if (isAndroid || isIOS) {
    loadingEl.style.display = "flex";
    contentEl.style.display = "none";
    window.location.href = deepLink;
    setTimeout(function () {
      loadingEl.style.display = "none";
      contentEl.style.display = "block";
    }, 500);
  }
})();
