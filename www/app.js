// FULL APP JS START
document.addEventListener("DOMContentLoaded", () => {
  try {
    startApp();
  } catch (e) {
    console.log("APP CRASH:", e);
  }
});

function startApp() {
  // ===============================
  // PART 1 / 3
  // ===============================

  // ===============================
  // CAPACITOR
  // ===============================
  const CapacitorLocalNotifications =
    window.Capacitor?.Plugins?.LocalNotifications || null;
  const CapacitorApp =
    window.Capacitor?.Plugins?.App || null;
  const AlarmBridge =
    window.Capacitor?.Plugins?.AlarmBridge || null;
  const AdMobPlugin =
    window.Capacitor?.Plugins?.AdMob || null;

  // ===============================
  // HELPERS
  // ===============================
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function safeParse(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function nowMs() {
    return Date.now();
  }

  function getSupportedInitialLanguage() {
    const supported = [
      "tr", "en", "de", "fr", "es", "ru", "ar", "it", "pt", "zh",
      "hi", "ja", "ko", "nl", "pl", "uk", "id", "ms"
    ];

    const raw = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    const short = raw.slice(0, 2);

    return supported.includes(short) ? short : "en";
  }

  function fileNameWithoutExt(name) {
    return String(name || "").replace(/\.(wav|mp3)$/i, "");
  }

  function getExistingSoundExtension(baseName) {
    const wav = `${baseName}.wav`;
    const mp3 = `${baseName}.mp3`;
    const all = window.__availableSoundFiles || [];

    if (all.includes(wav)) return wav;
    if (all.includes(mp3)) return mp3;

    return mp3;
  }

  function formatTime(sec) {
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(safeSec / 3600);
    const m = Math.floor((safeSec % 3600) / 60);
    const s = safeSec % 60;

    return [
      h.toString().padStart(2, "0"),
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0")
    ].join(":");
  }

  function getRemainingSecondsFromEndAt(endAt) {
    if (!endAt || endAt <= 0) return 0;
    return Math.max(0, Math.ceil((endAt - nowMs()) / 1000));
  }

  // ===============================
  // PREMIUM REMOVED
  // ===============================
  const premiumState = { isPremium: false };
  localStorage.removeItem("isPremium");

  function isPremiumUser() {
    return false;
  }

  function enablePremium() {
    premiumState.isPremium = false;
    localStorage.removeItem("isPremium");
    removePremiumUICompletely();
    updateAdsVisibility();
  }

  function disablePremium() {
    premiumState.isPremium = false;
    localStorage.removeItem("isPremium");
    removePremiumUICompletely();
    updateAdsVisibility();
  }

  function removePremiumUICompletely() {
    const premiumStatus = $("premiumStatusText");
    if (premiumStatus) premiumStatus.textContent = "Ücretsiz sürüm";

    const tabPremium = $("tabPremium");
    if (tabPremium) tabPremium.style.display = "none";

    const premiumPanel = $("premiumPanel");
    if (premiumPanel) premiumPanel.style.display = "none";

    document.querySelectorAll(".plan-buy-btn").forEach((btn) => {
      btn.style.display = "none";
    });

    document.querySelectorAll(".premium-plan-btn").forEach((btn) => {
      btn.style.display = "none";
    });
  }

  function updatePremiumUI() {
    removePremiumUICompletely();
  }

  async function initBilling() {
    premiumState.isPremium = false;
    localStorage.removeItem("isPremium");
    return false;
  }

  async function buyPremiumPlan() {
    return false;
  }

  async function restorePremiumPurchases() {
    return false;
  }

  // ===============================
  // REWARDED CUSTOM POMODORO STATE
  // ===============================
  let rewardedCustomPomodoroUnlocked =
    localStorage.getItem("tt_rewarded_custom_pomodoro") === "true";

  function saveRewardedCustomPomodoroState() {
    localStorage.setItem(
      "tt_rewarded_custom_pomodoro",
      rewardedCustomPomodoroUnlocked ? "true" : "false"
    );
  }

  function clearRewardedCustomPomodoroAccess() {
    rewardedCustomPomodoroUnlocked = false;
    saveRewardedCustomPomodoroState();
    updatePomodoroUI();
  }

  function unlockRewardedCustomPomodoroAccess() {
    rewardedCustomPomodoroUnlocked = true;
    saveRewardedCustomPomodoroState();
    updatePomodoroUI();
  }

  function isFreePomodoroPreset(work, brk) {
    const allowed = [
      { w: 15, b: 3 },
      { w: 25, b: 5 },
      { w: 50, b: 10 },
      { w: 60, b: 15 },
      { w: 90, b: 20 },
      { w: 120, b: 30 }
    ];

    return allowed.some((p) => p.w === work && p.b === brk);
  }

  function canUsePomodoroPair(work, brk) {
    return isFreePomodoroPreset(work, brk) || rewardedCustomPomodoroUnlocked;
  }

  // ===============================
  // STORAGE KEYS
  // ===============================
  const STORAGE_KEYS = {
    app: "tt_app_state",
    timer: "tt_timer_state",
    stopwatch: "tt_stopwatch_state",
    pomodoro: "tt_pomodoro_state",
    sound: "tt_sound"
  };

  // ===============================
  // STATE
  // ===============================
  const notificationState = {
    permissionGranted: false,
    exactAlarmGranted: false,
    listenersReady: false,
    scheduledTimerNotificationId: 1001
  };

  const visibilityState = {
    isForeground: document.visibilityState === "visible",
    listenersReady: false
  };

  const appState = {
    initialized: false,
    language: getSupportedInitialLanguage(),
    theme: "dark",
    lastTab: "timerPanel"
  };

  const timerState = {
    timerId: null,
    running: false,
    paused: false,
    timeLeft: 0,
    totalTime: 0,
    endAt: 0,
    mode: "timer",
    finishing: false,
    finishedHandled: false,
    lastFinishedAt: 0
  };

  const stopwatchState = {
    intervalId: null,
    running: false,
    elapsedMs: 0,
    lastStart: 0,
    laps: []
  };

  const pomodoroState = {
    enabled: false,
    phase: "work",
    workMinutes: 25,
    breakMinutes: 5,
    cycleCount: 0,
    autoAdvance: true
  };

  const alarmState = {
    pendingPomodoroAdvance: false,
    htmlAudio: null,
    previewAudio: null,
    repeatIntervalId: null,
    htmlAudioUnlocked: false,
    isActive: false
  };

  const adRuntime = {
    initialized: false,
    interstitialReady: false,
    rewardedReady: false,
    lastInterstitialAt: 0,
    interstitialCounter: 0,
    minInterstitialGapMs: 60000
  };

  const ADMOB_IDS = {
    banner: "ca-app-pub-9576973508771581/8701259937",
    interstitial: "ca-app-pub-9576973508771581/9381788346",
    rewarded: "ca-app-pub-9576973508771581/8139989327"
  };
  async function initAds() {
  if (!AdMobPlugin) return;

  try {
    await AdMobPlugin.initialize();

    // Banner
    await AdMobPlugin.showBanner({
      adId: ADMOB_IDS.banner,
      position: "BOTTOM_CENTER"
    });

    // preload interstitial
    await loadInterstitial();

    // preload rewarded
    await loadRewarded();

    adRuntime.initialized = true;

    console.log("ADS READY ✅");
  } catch (e) {
    console.log("Ad init error", e);
  }
}
  async function loadInterstitial() {
  try {
    await AdMobPlugin.prepareInterstitial({
      adId: ADMOB_IDS.interstitial
    });
    adRuntime.interstitialReady = true;
  } catch {
    adRuntime.interstitialReady = false;
  }
}

async function showInterstitialSmart() {
  if (!AdMobPlugin || !adRuntime.interstitialReady) return;

  const now = Date.now();

  if (now - adRuntime.lastInterstitialAt < adRuntime.minInterstitialGapMs) return;

  try {
    await AdMobPlugin.showInterstitial();
    adRuntime.lastInterstitialAt = now;
    adRuntime.interstitialReady = false;

    setTimeout(loadInterstitial, 1000);
  } catch {}
}
  async function loadRewarded() {
  try {
    await AdMobPlugin.prepareRewardVideoAd({
      adId: ADMOB_IDS.rewarded
    });
    adRuntime.rewardedReady = true;
  } catch {
    adRuntime.rewardedReady = false;
  }
}

async function showRewardedAd(onReward) {
  if (!AdMobPlugin || !adRuntime.rewardedReady) return;

  try {
    await AdMobPlugin.showRewardVideoAd();

    // kullanıcı izledi → ödül ver
    if (onReward) onReward();

    adRuntime.rewardedReady = false;
    setTimeout(loadRewarded, 1000);
  } catch {}
}
  

  // ===============================
  // FINISH / ALARM HELPERS
  // ===============================
  function isFinishLocked() {
    return timerState.finishing || timerState.finishedHandled;
  }

  function resetFinishLocks() {
    timerState.finishing = false;
    timerState.finishedHandled = false;
  }

  function markFinishHandled() {
    timerState.finishing = true;
    timerState.finishedHandled = true;
    timerState.lastFinishedAt = Date.now();
  }

  function hideAlarmOverlay() {
    const overlay = $("alarmOverlay");
    if (overlay) overlay.classList.add("hidden");
    document.body.classList.remove("alarm-active");
  }

  function showAlarmOverlay() {
    const overlay = $("alarmOverlay");
    const title = $("alarmTitle");
    const msg = $("alarmMessage");
    const btn = $("dismissAlarmBtn");

    if (title) title.textContent = t("done");
    if (msg) msg.textContent = t("alarmRinging");
    if (btn) btn.textContent = t("close");

    if (overlay) overlay.classList.remove("hidden");
    document.body.classList.add("alarm-active");
  }

  // ===============================
  // TRANSLATIONS
  // ===============================

  function t(key) {
    const lang = $("language")?.value || appState.language || "en";
    return I18N[lang]?.[key] || I18N.en[key] || key;
  }

  function setText(id, key) {
    const el = $(id);
    if (el) el.textContent = t(key);
  }

  // ===============================
  // SOUND LIBRARY
  // ===============================
  const SOUND_LIBRARY = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return {
      id: `s${n}`,
      rawName: `sound${n}`,
      assetPath: getExistingSoundExtension(`sound${n}`),
      name: {
        tr: `Ses ${n}`,
        en: `Sound ${n}`
      }
    };
  });

  let selectedSoundId = "s1";

  function getSelectedSound() {
    return SOUND_LIBRARY.find((s) => s.id === selectedSoundId) || SOUND_LIBRARY[0];
  }

  function getSelectedSoundRawName() {
    const selected = getSelectedSound();
    if (!selected) return "beep";
    return fileNameWithoutExt(selected.assetPath) || selected.rawName || "beep";
  }

  async function unlockAudioOnce() {
    if (alarmState.htmlAudioUnlocked) return true;

    try {
      const a = new Audio();
      a.src = getSelectedSound().assetPath;
      a.muted = true;
      await a.play();
      a.pause();
      a.currentTime = 0;
      a.muted = false;
      alarmState.htmlAudioUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  function stopPreviewSound() {
    try {
      if (alarmState.previewAudio) {
        alarmState.previewAudio.pause();
        alarmState.previewAudio.currentTime = 0;
        alarmState.previewAudio = null;
      }
    } catch {}
  }

  function stopPersistentAlarm() {
    alarmState.isActive = false;

    try {
      if (alarmState.repeatIntervalId) {
        clearInterval(alarmState.repeatIntervalId);
        alarmState.repeatIntervalId = null;
      }

      if (alarmState.htmlAudio) {
        alarmState.htmlAudio.pause();
        alarmState.htmlAudio.currentTime = 0;
        alarmState.htmlAudio.loop = false;
        alarmState.htmlAudio = null;
      }
    } catch {}
  }

  async function startPersistentAlarm() {
    stopPersistentAlarm();

    if ($("soundToggle")?.checked === false) return;

    alarmState.isActive = true;

    try {
      await unlockAudioOnce();

      const src = getSelectedSound().assetPath;

      if (!alarmState.htmlAudio) {
        alarmState.htmlAudio = new Audio(src);
      } else {
        alarmState.htmlAudio.pause();
        alarmState.htmlAudio.src = src;
      }

      alarmState.htmlAudio.loop = true;
      alarmState.htmlAudio.volume = 1;
      alarmState.htmlAudio.currentTime = 0;

      try {
        await alarmState.htmlAudio.play();
      } catch {}

      alarmState.repeatIntervalId = setInterval(async () => {
        if (!alarmState.isActive || !alarmState.htmlAudio) return;
        if (alarmState.htmlAudio.paused) {
          try {
            await alarmState.htmlAudio.play();
          } catch {}
        }
      }, 1200);
    } catch {}
  }
// ===============================
// PART 2 / 5
// TRANSLATIONS - FULL 18 LANG
// ===============================
const I18N = {
  tr: {
    start: "Başlat",
    pause: "Duraklat",
    reset: "Sıfırla",
    ready: "Hazır",
    running: "Çalışıyor",
    paused: "Duraklatıldı",
    done: "Süre doldu!",
    close: "Kapat",
    alarmRinging: "Alarm çalıyor",
    sounds: "Sesler",
    hours: "Saat",
    minutes: "Dakika",
    seconds: "Saniye",
    lap: "Tur",
    stopwatch: "Kronometre",
    timer: "Zamanlayıcı",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Satın Al",
    premiumActive: "Premium aktif",
    premiumDesc: "Reklamsız kullanım ve özel süreler",
    premiumLocked: "Bu özellik Premium içindir.",
    freePresetsInfo: "Hazır pomodoro süreleri ücretsizdir: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Ses açık",
    vibrationOn: "Titreşim açık",
    subtitle: "Odaklanma ve günlük kullanım için basit zamanlayıcı",
    soundsTitle: "Alarm sesleri",
    soundsDesc: "Bir ses seç ve önizlemesini dinle.",
    previewSound: "Sesi dinle",
    pomodoroDesc: "Bir odak süresi seç ve zamanlayıcıya uygula.",
    applyPomodoro: "Pomodoro uygula",
    lapsTitle: "Turlar",
    clearLaps: "Turları temizle",
    workLabel: "Çalışma",
    breakLabel: "Mola",
    resetPomodoro: "Pomodoroyu sıfırla",
    resetCycle: "Döngüyü sıfırla",
    cycle: "Döngü",
    presetClassic: "Klasik",
    presetQuick: "Derin Odak",
    presetShort: "Kısa",
    presetLong: "Uzun",
    presetUltra: "Ultra",
    presetBalanced: "Dengeli",
    premiumFeature1: "✅ Reklamsız kullanım",
    premiumFeature2: "✅ Özel pomodoro süreleri",
    premiumFeature3: "✅ Daha temiz kullanım deneyimi",
    premiumFeature4: "✅ Gelecekte premium özelliklere erişim",
    planMonthly: "Aylık",
    planQuarterly: "3 Aylık",
    planHalfyear: "6 Aylık",
    planYearly: "Yıllık"
  },

  en: {
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    ready: "Ready",
    running: "Running",
    paused: "Paused",
    done: "Time is up!",
    close: "Close",
    alarmRinging: "Alarm is ringing",
    sounds: "Sounds",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    lap: "Lap",
    stopwatch: "Stopwatch",
    timer: "Timer",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Buy",
    premiumActive: "Premium active",
    premiumDesc: "Ad-free usage and custom durations",
    premiumLocked: "This feature is for Premium.",
    freePresetsInfo: "Preset pomodoro times are free: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Sound on",
    vibrationOn: "Vibration on",
    subtitle: "Simple timer for focus and daily use",
    soundsTitle: "Alarm sounds",
    soundsDesc: "Select a sound and preview it.",
    previewSound: "Preview sound",
    pomodoroDesc: "Choose a focus preset and load it into timer.",
    applyPomodoro: "Apply Pomodoro",
    lapsTitle: "Laps",
    clearLaps: "Clear laps",
    workLabel: "Work",
    breakLabel: "Break",
    resetPomodoro: "Reset Pomodoro",
    resetCycle: "Reset cycle",
    cycle: "Cycle",
    presetClassic: "Classic",
    presetQuick: "Deep Focus",
    presetShort: "Short",
    presetLong: "Long",
    presetUltra: "Ultra",
    presetBalanced: "Balanced",
    premiumFeature1: "✅ Ad-free usage",
    premiumFeature2: "✅ Custom pomodoro durations",
    premiumFeature3: "✅ Cleaner user experience",
    premiumFeature4: "✅ Access to future premium features",
    planMonthly: "Monthly",
    planQuarterly: "3 Months",
    planHalfyear: "6 Months",
    planYearly: "Yearly"
  },

  de: {
    start: "Start",
    pause: "Pause",
    reset: "Zurücksetzen",
    ready: "Bereit",
    running: "Läuft",
    paused: "Pausiert",
    done: "Zeit ist um!",
    close: "Schließen",
    alarmRinging: "Alarm klingelt",
    sounds: "Töne",
    hours: "Stunden",
    minutes: "Minuten",
    seconds: "Sekunden",
    lap: "Runde",
    stopwatch: "Stoppuhr",
    timer: "Timer",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Kaufen",
    premiumActive: "Premium aktiv",
    premiumDesc: "Werbefrei und individuelle Zeiten",
    premiumLocked: "Diese Funktion ist nur für Premium.",
    freePresetsInfo: "Voreingestellte Pomodoro-Zeiten sind kostenlos: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Ton an",
    vibrationOn: "Vibration an",
    subtitle: "Einfacher Timer für Fokus und den Alltag",
    soundsTitle: "Alarmtöne",
    soundsDesc: "Wähle einen Ton und höre ihn an.",
    previewSound: "Ton anhören",
    pomodoroDesc: "Wähle eine Fokus-Voreinstellung und lade sie in den Timer.",
    applyPomodoro: "Pomodoro anwenden",
    lapsTitle: "Runden",
    clearLaps: "Runden löschen",
    workLabel: "Arbeit",
    breakLabel: "Pause",
    resetPomodoro: "Pomodoro zurücksetzen",
    resetCycle: "Zyklus zurücksetzen",
    cycle: "Zyklus",
    presetClassic: "Klassisch",
    presetQuick: "Tiefer Fokus",
    presetShort: "Kurz",
    presetLong: "Lang",
    presetUltra: "Ultra",
    presetBalanced: "Ausgewogen",
    premiumFeature1: "✅ Werbefreie Nutzung",
    premiumFeature2: "✅ Individuelle Pomodoro-Zeiten",
    premiumFeature3: "✅ Saubereres Nutzungserlebnis",
    premiumFeature4: "✅ Zugriff auf zukünftige Premium-Funktionen",
    planMonthly: "Monatlich",
    planQuarterly: "3 Monate",
    planHalfyear: "6 Monate",
    planYearly: "Jährlich"
  },

  fr: {
    start: "Démarrer",
    pause: "Pause",
    reset: "Réinitialiser",
    ready: "Prêt",
    running: "En cours",
    paused: "En pause",
    done: "Le temps est écoulé !",
    close: "Fermer",
    alarmRinging: "L’alarme sonne",
    sounds: "Sons",
    hours: "Heures",
    minutes: "Minutes",
    seconds: "Secondes",
    lap: "Tour",
    stopwatch: "Chronomètre",
    timer: "Minuteur",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Acheter",
    premiumActive: "Premium actif",
    premiumDesc: "Sans pub et durées personnalisées",
    premiumLocked: "Cette fonction est réservée au Premium.",
    freePresetsInfo: "Les durées prédéfinies sont gratuites : 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Son activé",
    vibrationOn: "Vibration activée",
    subtitle: "Minuteur simple pour la concentration et l'usage quotidien",
    soundsTitle: "Sons d'alarme",
    soundsDesc: "Sélectionnez un son et écoutez un aperçu.",
    previewSound: "Écouter le son",
    pomodoroDesc: "Choisissez un préréglage de concentration et appliquez-le au minuteur.",
    applyPomodoro: "Appliquer Pomodoro",
    lapsTitle: "Tours",
    clearLaps: "Effacer les tours",
    workLabel: "Travail",
    breakLabel: "Pause",
    resetPomodoro: "Réinitialiser Pomodoro",
    resetCycle: "Réinitialiser le cycle",
    cycle: "Cycle",
    presetClassic: "Classique",
    presetQuick: "Concentration profonde",
    presetShort: "Court",
    presetLong: "Long",
    presetUltra: "Ultra",
    presetBalanced: "Équilibré",
    premiumFeature1: "✅ Utilisation sans publicité",
    premiumFeature2: "✅ Durées pomodoro personnalisées",
    premiumFeature3: "✅ Expérience plus propre",
    premiumFeature4: "✅ Accès aux futures fonctionnalités premium",
    planMonthly: "Mensuel",
    planQuarterly: "3 Mois",
    planHalfyear: "6 Mois",
    planYearly: "Annuel"
  },

  es: {
    start: "Iniciar",
    pause: "Pausar",
    reset: "Restablecer",
    ready: "Listo",
    running: "En marcha",
    paused: "Pausado",
    done: "¡Se acabó el tiempo!",
    close: "Cerrar",
    alarmRinging: "La alarma está sonando",
    sounds: "Sonidos",
    hours: "Horas",
    minutes: "Minutos",
    seconds: "Segundos",
    lap: "Vuelta",
    stopwatch: "Cronómetro",
    timer: "Temporizador",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Comprar",
    premiumActive: "Premium activo",
    premiumDesc: "Sin anuncios y tiempos personalizados",
    premiumLocked: "Esta función es para Premium.",
    freePresetsInfo: "Los tiempos predefinidos son gratis: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Sonido activo",
    vibrationOn: "Vibración activa",
    subtitle: "Temporizador simple para concentración y uso diario",
    soundsTitle: "Sonidos de alarma",
    soundsDesc: "Selecciona un sonido y escúchalo.",
    previewSound: "Escuchar sonido",
    pomodoroDesc: "Elige un tiempo de enfoque y aplícalo al temporizador.",
    applyPomodoro: "Aplicar Pomodoro",
    lapsTitle: "Vueltas",
    clearLaps: "Borrar vueltas",
    workLabel: "Trabajo",
    breakLabel: "Descanso",
    resetPomodoro: "Restablecer Pomodoro",
    resetCycle: "Restablecer ciclo",
    cycle: "Ciclo",
    presetClassic: "Clásico",
    presetQuick: "Enfoque profundo",
    presetShort: "Corto",
    presetLong: "Largo",
    presetUltra: "Ultra",
    presetBalanced: "Equilibrado",
    premiumFeature1: "✅ Uso sin anuncios",
    premiumFeature2: "✅ Tiempos pomodoro personalizados",
    premiumFeature3: "✅ Experiencia más limpia",
    premiumFeature4: "✅ Acceso a futuras funciones premium",
    planMonthly: "Mensual",
    planQuarterly: "3 Meses",
    planHalfyear: "6 Meses",
    planYearly: "Anual"
  },

  ru: {
    start: "Старт",
    pause: "Пауза",
    reset: "Сброс",
    ready: "Готово",
    running: "Работает",
    paused: "На паузе",
    done: "Время вышло!",
    close: "Закрыть",
    alarmRinging: "Будильник звонит",
    sounds: "Звуки",
    hours: "Часы",
    minutes: "Минуты",
    seconds: "Секунды",
    lap: "Круг",
    stopwatch: "Секундомер",
    timer: "Таймер",
    pomodoro: "Помодоро",
    premium: "Премиум",
    buyPremium: "Купить",
    premiumActive: "Премиум активен",
    premiumDesc: "Без рекламы и свои интервалы",
    premiumLocked: "Эта функция доступна в Premium.",
    freePresetsInfo: "Бесплатные пресеты: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Звук включён",
    vibrationOn: "Вибрация включена",
    subtitle: "Простой таймер для концентрации и повседневного использования",
    soundsTitle: "Звуки будильника",
    soundsDesc: "Выберите звук и прослушайте его.",
    previewSound: "Прослушать звук",
    pomodoroDesc: "Выберите пресет фокуса и загрузите его в таймер.",
    applyPomodoro: "Применить Помодоро",
    lapsTitle: "Круги",
    clearLaps: "Очистить круги",
    workLabel: "Работа",
    breakLabel: "Перерыв",
    resetPomodoro: "Сбросить Помодоро",
    resetCycle: "Сбросить цикл",
    cycle: "Цикл",
    presetClassic: "Классический",
    presetQuick: "Глубокий фокус",
    presetShort: "Короткий",
    presetLong: "Длинный",
    presetUltra: "Ультра",
    presetBalanced: "Сбалансированный",
    premiumFeature1: "✅ Без рекламы",
    premiumFeature2: "✅ Пользовательские интервалы",
    premiumFeature3: "✅ Более чистый интерфейс",
    premiumFeature4: "✅ Доступ к будущим функциям",
    planMonthly: "Ежемесячно",
    planQuarterly: "3 месяца",
    planHalfyear: "6 месяцев",
    planYearly: "Годовой"
  },

  ar: {
    start: "ابدأ",
    pause: "إيقاف مؤقت",
    reset: "إعادة تعيين",
    ready: "جاهز",
    running: "قيد التشغيل",
    paused: "متوقف مؤقتًا",
    done: "انتهى الوقت!",
    close: "إغلاق",
    alarmRinging: "المنبه يرن",
    sounds: "الأصوات",
    hours: "الساعات",
    minutes: "الدقائق",
    seconds: "الثواني",
    lap: "لفة",
    stopwatch: "ساعة إيقاف",
    timer: "المؤقت",
    pomodoro: "بومودورو",
    premium: "بريميوم",
    buyPremium: "اشترِ",
    premiumActive: "البريميوم مفعل",
    premiumDesc: "بدون إعلانات ومدد مخصصة",
    premiumLocked: "هذه الميزة للبريميوم.",
    freePresetsInfo: "الأوقات الجاهزة مجانية: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "الصوت مفعل",
    vibrationOn: "الاهتزاز مفعل",
    subtitle: "مؤقت بسيط للتركيز والاستخدام اليومي",
    soundsTitle: "أصوات المنبه",
    soundsDesc: "اختر صوتًا واستمع إلى المعاينة.",
    previewSound: "معاينة الصوت",
    pomodoroDesc: "اختر وقت تركيز وطبقه على المؤقت.",
    applyPomodoro: "تطبيق بومودورو",
    lapsTitle: "اللفات",
    clearLaps: "مسح اللفات",
    workLabel: "عمل",
    breakLabel: "استراحة",
    resetPomodoro: "إعادة ضبط بومودورو",
    resetCycle: "إعادة ضبط الدورة",
    cycle: "دورة",
    presetClassic: "كلاسيكي",
    presetQuick: "تركيز عميق",
    presetShort: "قصير",
    presetLong: "طويل",
    presetUltra: "فائق",
    presetBalanced: "متوازن",
    premiumFeature1: "✅ بدون إعلانات",
    premiumFeature2: "✅ أوقات بومودورو مخصصة",
    premiumFeature3: "✅ تجربة أنظف",
    premiumFeature4: "✅ الوصول إلى ميزات بريميوم مستقبلية",
    planMonthly: "شهري",
    planQuarterly: "3 أشهر",
    planHalfyear: "6 أشهر",
    planYearly: "سنوي"
  },

  it: {
    start: "Avvia",
    pause: "Pausa",
    reset: "Reimposta",
    ready: "Pronto",
    running: "In esecuzione",
    paused: "In pausa",
    done: "Tempo scaduto!",
    close: "Chiudi",
    alarmRinging: "La sveglia sta suonando",
    sounds: "Suoni",
    hours: "Ore",
    minutes: "Minuti",
    seconds: "Secondi",
    lap: "Giro",
    stopwatch: "Cronometro",
    timer: "Timer",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Acquista",
    premiumActive: "Premium attivo",
    premiumDesc: "Senza pubblicità e durate personalizzate",
    premiumLocked: "Questa funzione è per Premium.",
    freePresetsInfo: "I tempi preimpostati sono gratuiti: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Suono attivo",
    vibrationOn: "Vibrazione attiva",
    subtitle: "Timer semplice per concentrazione e uso quotidiano",
    soundsTitle: "Suoni della sveglia",
    soundsDesc: "Seleziona un suono e ascolta l'anteprima.",
    previewSound: "Ascolta il suono",
    pomodoroDesc: "Scegli un preset di concentrazione e applicalo al timer.",
    applyPomodoro: "Applica Pomodoro",
    lapsTitle: "Giri",
    clearLaps: "Cancella giri",
    workLabel: "Lavoro",
    breakLabel: "Pausa",
    resetPomodoro: "Reimposta Pomodoro",
    resetCycle: "Reimposta ciclo",
    cycle: "Ciclo",
    presetClassic: "Classico",
    presetQuick: "Focus profondo",
    presetShort: "Breve",
    presetLong: "Lungo",
    presetUltra: "Ultra",
    presetBalanced: "Bilanciato",
    premiumFeature1: "✅ Senza pubblicità",
    premiumFeature2: "✅ Durate pomodoro personalizzate",
    premiumFeature3: "✅ Esperienza più pulita",
    premiumFeature4: "✅ Accesso a funzionalità premium future",
    planMonthly: "Mensile",
    planQuarterly: "3 Mesi",
    planHalfyear: "6 Mesi",
    planYearly: "Annuale"
  },

  pt: {
    start: "Iniciar",
    pause: "Pausar",
    reset: "Redefinir",
    ready: "Pronto",
    running: "Em andamento",
    paused: "Pausado",
    done: "O tempo acabou!",
    close: "Fechar",
    alarmRinging: "O alarme está tocando",
    sounds: "Sons",
    hours: "Horas",
    minutes: "Minutos",
    seconds: "Segundos",
    lap: "Volta",
    stopwatch: "Cronômetro",
    timer: "Temporizador",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Comprar",
    premiumActive: "Premium ativo",
    premiumDesc: "Sem anúncios e durações personalizadas",
    premiumLocked: "Este recurso é do Premium.",
    freePresetsInfo: "Os tempos predefinidos são grátis: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Som ligado",
    vibrationOn: "Vibração ligada",
    subtitle: "Temporizador simples para foco e uso diário",
    soundsTitle: "Sons de alarme",
    soundsDesc: "Selecione um som e ouça a prévia.",
    previewSound: "Ouvir som",
    pomodoroDesc: "Escolha um preset de foco e aplique ao temporizador.",
    applyPomodoro: "Aplicar Pomodoro",
    lapsTitle: "Voltas",
    clearLaps: "Limpar voltas",
    workLabel: "Trabalho",
    breakLabel: "Pausa",
    resetPomodoro: "Redefinir Pomodoro",
    resetCycle: "Redefinir ciclo",
    cycle: "Ciclo",
    presetClassic: "Clássico",
    presetQuick: "Foco profundo",
    presetShort: "Curto",
    presetLong: "Longo",
    presetUltra: "Ultra",
    presetBalanced: "Equilibrado",
    premiumFeature1: "✅ Sem anúncios",
    premiumFeature2: "✅ Durações pomodoro personalizadas",
    premiumFeature3: "✅ Experiência mais limpa",
    premiumFeature4: "✅ Acesso a recursos premium futuros",
    planMonthly: "Mensal",
    planQuarterly: "3 Meses",
    planHalfyear: "6 Meses",
    planYearly: "Anual"
  },

  zh: {
    start: "开始",
    pause: "暂停",
    reset: "重置",
    ready: "就绪",
    running: "运行中",
    paused: "已暂停",
    done: "时间到了！",
    close: "关闭",
    alarmRinging: "闹铃正在响",
    sounds: "声音",
    hours: "小时",
    minutes: "分钟",
    seconds: "秒",
    lap: "圈",
    stopwatch: "秒表",
    timer: "计时器",
    pomodoro: "番茄钟",
    premium: "高级版",
    buyPremium: "购买",
    premiumActive: "高级版已启用",
    premiumDesc: "无广告和自定义时长",
    premiumLocked: "此功能仅限高级版。",
    freePresetsInfo: "预设番茄钟时间免费：15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "声音开启",
    vibrationOn: "振动开启",
    subtitle: "适合专注和日常使用的简易计时器",
    soundsTitle: "闹铃声音",
    soundsDesc: "选择一个声音并试听。",
    previewSound: "试听声音",
    pomodoroDesc: "选择一个专注预设并应用到计时器。",
    applyPomodoro: "应用番茄钟",
    lapsTitle: "圈数",
    clearLaps: "清除圈数",
    workLabel: "工作",
    breakLabel: "休息",
    resetPomodoro: "重置番茄钟",
    resetCycle: "重置周期",
    cycle: "周期",
    presetClassic: "经典",
    presetQuick: "深度专注",
    presetShort: "短",
    presetLong: "长",
    presetUltra: "超长",
    presetBalanced: "均衡",
    premiumFeature1: "✅ 无广告使用",
    premiumFeature2: "✅ 自定义番茄时间",
    premiumFeature3: "✅ 更干净的体验",
    premiumFeature4: "✅ 访问未来高级功能",
    planMonthly: "每月",
    planQuarterly: "3个月",
    planHalfyear: "6个月",
    planYearly: "每年"
  },

  hi: {
    start: "शुरू करें",
    pause: "रोकें",
    reset: "रीसेट",
    ready: "तैयार",
    running: "चल रहा है",
    paused: "रुका हुआ",
    done: "समय समाप्त!",
    close: "बंद करें",
    alarmRinging: "अलार्म बज रहा है",
    sounds: "ध्वनियाँ",
    hours: "घंटे",
    minutes: "मिनट",
    seconds: "सेकंड",
    lap: "लैप",
    stopwatch: "स्टॉपवॉच",
    timer: "टाइमर",
    pomodoro: "पोमोडोरो",
    premium: "प्रीमियम",
    buyPremium: "खरीदें",
    premiumActive: "प्रीमियम सक्रिय",
    premiumDesc: "बिना विज्ञापन और कस्टम समय",
    premiumLocked: "यह सुविधा प्रीमियम के लिए है।",
    freePresetsInfo: "प्रीसेट समय मुफ्त हैं: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "ध्वनि चालू",
    vibrationOn: "वाइब्रेशन चालू",
    subtitle: "ध्यान और रोज़मर्रा उपयोग के लिए सरल टाइमर",
    soundsTitle: "अलार्म ध्वनियाँ",
    soundsDesc: "एक ध्वनि चुनें और उसका पूर्वावलोकन सुनें।",
    previewSound: "ध्वनि सुनें",
    pomodoroDesc: "एक फोकस प्रीसेट चुनें और उसे टाइमर में लागू करें।",
    applyPomodoro: "पोमोडोरो लागू करें",
    lapsTitle: "लैप्स",
    clearLaps: "लैप साफ करें",
    workLabel: "काम",
    breakLabel: "ब्रेक",
    resetPomodoro: "पोमोडोरो रीसेट",
    resetCycle: "चक्र रीसेट",
    cycle: "चक्र",
    presetClassic: "क्लासिक",
    presetQuick: "गहरा फोकस",
    presetShort: "छोटा",
    presetLong: "लंबा",
    presetUltra: "अल्ट्रा",
    presetBalanced: "संतुलित",
    premiumFeature1: "✅ बिना विज्ञापन उपयोग",
    premiumFeature2: "✅ कस्टम पोमोडोरो समय",
    premiumFeature3: "✅ साफ़ उपयोग अनुभव",
    premiumFeature4: "✅ भविष्य की प्रीमियम सुविधाओं तक पहुंच",
    planMonthly: "मासिक",
    planQuarterly: "3 महीने",
    planHalfyear: "6 महीने",
    planYearly: "वार्षिक"
  },

  ja: {
    start: "開始",
    pause: "一時停止",
    reset: "リセット",
    ready: "準備完了",
    running: "実行中",
    paused: "一時停止中",
    done: "時間切れ！",
    close: "閉じる",
    alarmRinging: "アラームが鳴っています",
    sounds: "サウンド",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    lap: "ラップ",
    stopwatch: "ストップウォッチ",
    timer: "タイマー",
    pomodoro: "ポモドーロ",
    premium: "プレミアム",
    buyPremium: "購入",
    premiumActive: "プレミアム有効",
    premiumDesc: "広告なしとカスタム時間",
    premiumLocked: "この機能はプレミアム専用です。",
    freePresetsInfo: "プリセット時間は無料です: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "サウンドオン",
    vibrationOn: "バイブレーションオン",
    subtitle: "集中と日常利用のためのシンプルなタイマー",
    soundsTitle: "アラーム音",
    soundsDesc: "サウンドを選んで試聴してください。",
    previewSound: "音を試聴",
    pomodoroDesc: "集中プリセットを選んでタイマーに適用します。",
    applyPomodoro: "ポモドーロを適用",
    lapsTitle: "ラップ",
    clearLaps: "ラップを消去",
    workLabel: "作業",
    breakLabel: "休憩",
    resetPomodoro: "ポモドーロをリセット",
    resetCycle: "サイクルをリセット",
    cycle: "サイクル",
    presetClassic: "クラシック",
    presetQuick: "深い集中",
    presetShort: "短い",
    presetLong: "長い",
    presetUltra: "ウルトラ",
    presetBalanced: "バランス",
    premiumFeature1: "✅ 広告なし利用",
    premiumFeature2: "✅ カスタムポモドーロ時間",
    premiumFeature3: "✅ よりクリーンな体験",
    premiumFeature4: "✅ 将来のプレミアム機能へのアクセス",
    planMonthly: "月額",
    planQuarterly: "3ヶ月",
    planHalfyear: "6ヶ月",
    planYearly: "年額"
  },

  ko: {
    start: "시작",
    pause: "일시정지",
    reset: "재설정",
    ready: "준비됨",
    running: "실행 중",
    paused: "일시정지됨",
    done: "시간 종료!",
    close: "닫기",
    alarmRinging: "알람이 울리고 있습니다",
    sounds: "소리",
    hours: "시간",
    minutes: "분",
    seconds: "초",
    lap: "랩",
    stopwatch: "스톱워치",
    timer: "타이머",
    pomodoro: "포모도로",
    premium: "프리미엄",
    buyPremium: "구매",
    premiumActive: "프리미엄 활성",
    premiumDesc: "광고 없음 및 사용자 시간",
    premiumLocked: "이 기능은 프리미엄 전용입니다.",
    freePresetsInfo: "기본 프리셋은 무료입니다: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "소리 켜짐",
    vibrationOn: "진동 켜짐",
    subtitle: "집중과 일상 사용을 위한 간단한 타이머",
    soundsTitle: "알람 소리",
    soundsDesc: "소리를 선택하고 미리 들어보세요.",
    previewSound: "소리 듣기",
    pomodoroDesc: "집중 프리셋을 선택해 타이머에 적용하세요.",
    applyPomodoro: "포모도로 적용",
    lapsTitle: "랩",
    clearLaps: "랩 지우기",
    workLabel: "작업",
    breakLabel: "휴식",
    resetPomodoro: "포모도로 재설정",
    resetCycle: "사이클 재설정",
    cycle: "사이클",
    presetClassic: "클래식",
    presetQuick: "깊은 집중",
    presetShort: "짧음",
    presetLong: "긴",
    presetUltra: "울트라",
    presetBalanced: "균형",
    premiumFeature1: "✅ 광고 없음",
    premiumFeature2: "✅ 사용자 설정 포모도로 시간",
    premiumFeature3: "✅ 더 깔끔한 경험",
    premiumFeature4: "✅ 향후 프리미엄 기능 이용",
    planMonthly: "월간",
    planQuarterly: "3개월",
    planHalfyear: "6개월",
    planYearly: "연간"
  },

  nl: {
    start: "Start",
    pause: "Pauze",
    reset: "Reset",
    ready: "Klaar",
    running: "Bezig",
    paused: "Gepauzeerd",
    done: "Tijd is om!",
    close: "Sluiten",
    alarmRinging: "Alarm gaat af",
    sounds: "Geluiden",
    hours: "Uren",
    minutes: "Minuten",
    seconds: "Seconden",
    lap: "Ronde",
    stopwatch: "Stopwatch",
    timer: "Timer",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Kopen",
    premiumActive: "Premium actief",
    premiumDesc: "Geen advertenties en aangepaste tijden",
    premiumLocked: "Deze functie is voor Premium.",
    freePresetsInfo: "Standaardtijden zijn gratis: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Geluid aan",
    vibrationOn: "Trillen aan",
    subtitle: "Eenvoudige timer voor focus en dagelijks gebruik",
    soundsTitle: "Alarmgeluiden",
    soundsDesc: "Kies een geluid en luister naar het voorbeeld.",
    previewSound: "Geluid beluisteren",
    pomodoroDesc: "Kies een focuspreset en laad deze in de timer.",
    applyPomodoro: "Pomodoro toepassen",
    lapsTitle: "Rondes",
    clearLaps: "Rondes wissen",
    workLabel: "Werk",
    breakLabel: "Pauze",
    resetPomodoro: "Pomodoro resetten",
    resetCycle: "Cyclus resetten",
    cycle: "Cyclus",
    presetClassic: "Klassiek",
    presetQuick: "Diepe focus",
    presetShort: "Kort",
    presetLong: "Lang",
    presetUltra: "Ultra",
    presetBalanced: "Gebalanceerd",
    premiumFeature1: "✅ Zonder advertenties",
    premiumFeature2: "✅ Aangepaste pomodoro-tijden",
    premiumFeature3: "✅ Schonere ervaring",
    premiumFeature4: "✅ Toegang tot toekomstige premiumfuncties",
    planMonthly: "Maandelijks",
    planQuarterly: "3 maanden",
    planHalfyear: "6 maanden",
    planYearly: "Jaarlijks"
  },

  pl: {
    start: "Start",
    pause: "Pauza",
    reset: "Resetuj",
    ready: "Gotowe",
    running: "Działa",
    paused: "Wstrzymano",
    done: "Czas minął!",
    close: "Zamknij",
    alarmRinging: "Alarm dzwoni",
    sounds: "Dźwięki",
    hours: "Godziny",
    minutes: "Minuty",
    seconds: "Sekundy",
    lap: "Okrążenie",
    stopwatch: "Stoper",
    timer: "Timer",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Kup",
    premiumActive: "Premium aktywne",
    premiumDesc: "Bez reklam i własne czasy",
    premiumLocked: "Ta funkcja jest dla Premium.",
    freePresetsInfo: "Gotowe presety są darmowe: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Dźwięk włączony",
    vibrationOn: "Wibracja włączona",
    subtitle: "Prosty timer do skupienia i codziennego użytku",
    soundsTitle: "Dźwięki alarmu",
    soundsDesc: "Wybierz dźwięk i odsłuchaj podgląd.",
    previewSound: "Odsłuchaj dźwięk",
    pomodoroDesc: "Wybierz preset skupienia i załaduj go do timera.",
    applyPomodoro: "Zastosuj Pomodoro",
    lapsTitle: "Okrążenia",
    clearLaps: "Wyczyść okrążenia",
    workLabel: "Praca",
    breakLabel: "Przerwa",
    resetPomodoro: "Resetuj Pomodoro",
    resetCycle: "Resetuj cykl",
    cycle: "Cykl",
    presetClassic: "Klasyczny",
    presetQuick: "Głęboka koncentracja",
    presetShort: "Krótki",
    presetLong: "Długi",
    presetUltra: "Ultra",
    presetBalanced: "Zrównoważony",
    premiumFeature1: "✅ Bez reklam",
    premiumFeature2: "✅ Własne czasy pomodoro",
    premiumFeature3: "✅ Czystsze doświadczenie",
    premiumFeature4: "✅ Dostęp do przyszłych funkcji premium",
    planMonthly: "Miesięczny",
    planQuarterly: "3 miesiące",
    planHalfyear: "6 miesięcy",
    planYearly: "Roczny"
  },

  uk: {
    start: "Почати",
    pause: "Пауза",
    reset: "Скинути",
    ready: "Готово",
    running: "Працює",
    paused: "На паузі",
    done: "Час вийшов!",
    close: "Закрити",
    alarmRinging: "Будильник дзвонить",
    sounds: "Звуки",
    hours: "Години",
    minutes: "Хвилини",
    seconds: "Секунди",
    lap: "Коло",
    stopwatch: "Секундомір",
    timer: "Таймер",
    pomodoro: "Помодоро",
    premium: "Преміум",
    buyPremium: "Купити",
    premiumActive: "Преміум активний",
    premiumDesc: "Без реклами та власні інтервали",
    premiumLocked: "Ця функція доступна в Premium.",
    freePresetsInfo: "Безкоштовні пресети: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Звук увімкнено",
    vibrationOn: "Вібрацію увімкнено",
    subtitle: "Простий таймер для концентрації та щоденного використання",
    soundsTitle: "Звуки будильника",
    soundsDesc: "Виберіть звук і прослухайте його.",
    previewSound: "Прослухати звук",
    pomodoroDesc: "Виберіть пресет фокусування та застосуйте його до таймера.",
    applyPomodoro: "Застосувати Помодоро",
    lapsTitle: "Кола",
    clearLaps: "Очистити кола",
    workLabel: "Робота",
    breakLabel: "Перерва",
    resetPomodoro: "Скинути Помодоро",
    resetCycle: "Скинути цикл",
    cycle: "Цикл",
    presetClassic: "Класичний",
    presetQuick: "Глибока концентрація",
    presetShort: "Короткий",
    presetLong: "Довгий",
    presetUltra: "Ультра",
    presetBalanced: "Збалансований",
    premiumFeature1: "✅ Без реклами",
    premiumFeature2: "✅ Користувацькі інтервали",
    premiumFeature3: "✅ Чистіший інтерфейс",
    premiumFeature4: "✅ Доступ до майбутніх преміум-функцій",
    planMonthly: "Щомісячно",
    planQuarterly: "3 місяці",
    planHalfyear: "6 місяців",
    planYearly: "Річний"
  },

  id: {
    start: "Mulai",
    pause: "Jeda",
    reset: "Reset",
    ready: "Siap",
    running: "Berjalan",
    paused: "Dijeda",
    done: "Waktu habis!",
    close: "Tutup",
    alarmRinging: "Alarm berbunyi",
    sounds: "Suara",
    hours: "Jam",
    minutes: "Menit",
    seconds: "Detik",
    lap: "Putaran",
    stopwatch: "Stopwatch",
    timer: "Timer",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Beli",
    premiumActive: "Premium aktif",
    premiumDesc: "Tanpa iklan dan durasi khusus",
    premiumLocked: "Fitur ini untuk Premium.",
    freePresetsInfo: "Waktu preset gratis: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Suara aktif",
    vibrationOn: "Getar aktif",
    subtitle: "Timer sederhana untuk fokus dan penggunaan sehari-hari",
    soundsTitle: "Suara alarm",
    soundsDesc: "Pilih suara dan dengarkan pratinjaunya.",
    previewSound: "Dengarkan suara",
    pomodoroDesc: "Pilih preset fokus dan terapkan ke timer.",
    applyPomodoro: "Terapkan Pomodoro",
    lapsTitle: "Putaran",
    clearLaps: "Hapus putaran",
    workLabel: "Kerja",
    breakLabel: "Istirahat",
    resetPomodoro: "Reset Pomodoro",
    resetCycle: "Reset siklus",
    cycle: "Siklus",
    presetClassic: "Klasik",
    presetQuick: "Fokus Dalam",
    presetShort: "Pendek",
    presetLong: "Panjang",
    presetUltra: "Ultra",
    presetBalanced: "Seimbang",
    premiumFeature1: "✅ Tanpa iklan",
    premiumFeature2: "✅ Durasi pomodoro khusus",
    premiumFeature3: "✅ Pengalaman lebih bersih",
    premiumFeature4: "✅ Akses fitur premium masa depan",
    planMonthly: "Bulanan",
    planQuarterly: "3 Bulan",
    planHalfyear: "6 Bulan",
    planYearly: "Tahunan"
  },

  ms: {
    start: "Mula",
    pause: "Jeda",
    reset: "Tetapkan semula",
    ready: "Sedia",
    running: "Sedang berjalan",
    paused: "Dijeda",
    done: "Masa tamat!",
    close: "Tutup",
    alarmRinging: "Penggera sedang berbunyi",
    sounds: "Bunyi",
    hours: "Jam",
    minutes: "Minit",
    seconds: "Saat",
    lap: "Pusingan",
    stopwatch: "Jam randik",
    timer: "Pemasa",
    pomodoro: "Pomodoro",
    premium: "Premium",
    buyPremium: "Beli",
    premiumActive: "Premium aktif",
    premiumDesc: "Tanpa iklan dan tempoh khas",
    premiumLocked: "Ciri ini untuk Premium.",
    freePresetsInfo: "Tempoh pratetap adalah percuma: 15/3 • 25/5 • 50/10 • 60/15 • 90/20 • 120/30",
    soundOn: "Bunyi aktif",
    vibrationOn: "Getaran aktif",
    subtitle: "Pemasa ringkas untuk fokus dan kegunaan harian",
    soundsTitle: "Bunyi penggera",
    soundsDesc: "Pilih bunyi dan dengar pratontonnya.",
    previewSound: "Dengar bunyi",
    pomodoroDesc: "Pilih pratetap fokus dan gunakannya pada pemasa.",
    applyPomodoro: "Guna Pomodoro",
    lapsTitle: "Pusingan",
    clearLaps: "Kosongkan pusingan",
    workLabel: "Kerja",
    breakLabel: "Rehat",
    resetPomodoro: "Tetapkan semula Pomodoro",
    resetCycle: "Tetapkan semula kitaran",
    cycle: "Kitaran",
    presetClassic: "Klasik",
    presetQuick: "Fokus Mendalam",
    presetShort: "Pendek",
    presetLong: "Panjang",
    presetUltra: "Ultra",
    presetBalanced: "Seimbang",
    premiumFeature1: "✅ Tanpa iklan",
    premiumFeature2: "✅ Tempoh pomodoro khas",
    premiumFeature3: "✅ Pengalaman lebih bersih",
    premiumFeature4: "✅ Akses ciri premium masa depan",
    planMonthly: "Bulanan",
    planQuarterly: "3 Bulan",
    planHalfyear: "6 Bulan",
    planYearly: "Tahunan"
  }
};

function t(key) {
  const lang = $("language")?.value || appState.language || "en";
  return I18N[lang]?.[key] || I18N.en[key] || key;
}

function setText(id, key) {
  const el = $(id);
  if (el) el.textContent = t(key);
}
// ===============================
// PART 3 / 5
// SOUND + AUDIO + UI (18 LANG SAFE)
// 

// ===============================
// AUDIO CONTROL
// ===============================
async function unlockAudioOnce() {
  if (alarmState.htmlAudioUnlocked) return true;

  try {
    const a = new Audio();
    a.src = getSelectedSound().assetPath;
    a.muted = true;
    await a.play();
    a.pause();
    a.currentTime = 0;
    a.muted = false;
    alarmState.htmlAudioUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

function stopPreviewSound() {
  try {
    if (alarmState.previewAudio) {
      alarmState.previewAudio.pause();
      alarmState.previewAudio.currentTime = 0;
      alarmState.previewAudio = null;
    }
  } catch {}
}

function stopPersistentAlarm() {
  alarmState.isActive = false;

  try {
    if (alarmState.repeatIntervalId) {
      clearInterval(alarmState.repeatIntervalId);
      alarmState.repeatIntervalId = null;
    }

    if (alarmState.htmlAudio) {
      alarmState.htmlAudio.pause();
      alarmState.htmlAudio.currentTime = 0;
      alarmState.htmlAudio.loop = false;
      alarmState.htmlAudio = null;
    }
  } catch {}
}

async function startPersistentAlarm() {
  stopPersistentAlarm();

  if ($("soundToggle")?.checked === false) return;

  alarmState.isActive = true;

  try {
    await unlockAudioOnce();

    const src = getSelectedSound().assetPath;

    if (!alarmState.htmlAudio) {
      alarmState.htmlAudio = new Audio(src);
    } else {
      alarmState.htmlAudio.pause();
      alarmState.htmlAudio.src = src;
    }

    alarmState.htmlAudio.loop = true;
    alarmState.htmlAudio.volume = 1;
    alarmState.htmlAudio.currentTime = 0;

    try {
      await alarmState.htmlAudio.play();
    } catch {}

    alarmState.repeatIntervalId = setInterval(async () => {
      if (!alarmState.isActive) return;
      if (alarmState.htmlAudio && alarmState.htmlAudio.paused) {
        try {
          await alarmState.htmlAudio.play();
        } catch {}
      }
    }, 1200);
  } catch {}
}

// ===============================
// UI HELPERS
// ===============================
function updateTimerStartButton() {
  const btn = $("timerStartBtn");
  if (!btn) return;
  btn.textContent = timerState.running ? t("running") : t("start");
}

function updateStopwatchStartButton() {
  const btn = $("swStartBtn");
  if (!btn) return;
  btn.textContent = stopwatchState.running ? t("pause") : t("start");
}

function updateSoundCount() {
  const el = $("soundCountLabel");
  if (!el) return;
  el.textContent = `${SOUND_LIBRARY.length} ${t("sounds")}`;
}

function getSoundDisplayName(sound) {
  const lang = $("language")?.value || appState.language;
  return sound.name?.[lang] || sound.name?.en || sound.rawName;
}

// ===============================
// LANGUAGE APPLY (18 LANG SAFE)
// ===============================
function applyLanguage() {
  const lang = $("language")?.value || appState.language;
  appState.language = lang;

  document.documentElement.lang = lang;

  if ($("language")) $("language").value = lang;

  // TABS
  setText("tabTimer", "timer");
  setText("tabPomodoro", "pomodoro");
  setText("tabStopwatch", "stopwatch");
  setText("tabSounds", "sounds");
  setText("tabPremium", "premium");

  // TITLES
  setText("timerTitle", "timer");
  setText("stopwatchTitle", "stopwatch");
  setText("premiumTitle", "premium");

  // TIMER
  updateTimerStartButton();
  setText("timerPauseBtn", "pause");
  setText("timerResetBtn", "reset");

  // STOPWATCH
  updateStopwatchStartButton();
  setText("swLapBtn", "lap");
  setText("swResetBtn", "reset");
  setText("swClearLapsBtn", "clearLaps");

  // GENERAL
  setText("dismissAlarmBtn", "close");
  setText("hoursLabel", "hours");
  setText("minutesLabel", "minutes");
  setText("secondsLabel", "seconds");
  setText("workLabel", "workLabel");
  setText("breakLabel", "breakLabel");
  setText("soundLabel", "soundOn");
  setText("vibrationLabel", "vibrationOn");
  setText("subtitle", "subtitle");

  // SOUND UI
  setText("soundsTitle", "soundsTitle");
  setText("soundsDesc", "soundsDesc");
  setText("previewSoundBtn", "previewSound");

  // POMODORO
  setText("pomodoroDesc", "pomodoroDesc");
  setText("applyPomodoroBtn", "applyPomodoro");
  setText("pomodoroResetBtn", "resetPomodoro");
  setText("pomodoroCycleResetBtn", "resetCycle");

  // PREMIUM
  const premiumDesc = $("premiumDesc");
  if (premiumDesc) premiumDesc.textContent = t("premiumDesc");

  // PRESETS
  const presets = [
    ["presetClassicText", "presetClassic"],
    ["presetQuickText", "presetQuick"],
    ["presetShortText", "presetShort"],
    ["presetUltraText", "presetUltra"],
    ["presetBalancedText", "presetBalanced"],
    ["presetLongText", "presetLong"]
  ];

  presets.forEach(([id, key]) => {
    const el = $(id);
    if (el) el.textContent = t(key);
  });

  // STATUS
  if (timerState.running) setText("timerStatus", "running");
  else if (timerState.paused) setText("timerStatus", "paused");
  else if (timerState.timeLeft <= 0 && timerState.totalTime > 0) setText("timerStatus", "done");
  else setText("timerStatus", "ready");

  if (stopwatchState.running) setText("stopwatchStatus", "running");
  else if (stopwatchState.elapsedMs > 0) setText("stopwatchStatus", "paused");
  else setText("stopwatchStatus", "ready");

  // AUTO I18N
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  updateSoundCount();
  renderSounds();
  updatePomodoroUI();
  updatePremiumUI();
}
// ===============================
// PART 4 / 5
// BACKGROUND + NOTIFICATION + TIMER ENGINE
// ===============================

// ===============================
// FOREGROUND / BACKGROUND
// ===============================
function isAppForeground() {
  return visibilityState.isForeground;
}

function shouldUseNativeAlarm() {
  return !isAppForeground();
}

function isTimerExpired() {
  return timerState.endAt > 0 && nowMs() >= timerState.endAt;
}

async function savePomodoroNativeState(enabledOverride = null, endAtOverride = null) {
  if (!AlarmBridge?.savePomodoroNativeState) return;

  try {
    const enabled = enabledOverride === null ? pomodoroState.enabled : enabledOverride;
    const endAt = endAtOverride === null ? timerState.endAt : endAtOverride;

    await AlarmBridge.savePomodoroNativeState({
      enabled,
      phase: pomodoroState.phase,
      work: pomodoroState.workMinutes,
      break: pomodoroState.breakMinutes,
      cycle: pomodoroState.cycleCount,
      autoAdvance: pomodoroState.autoAdvance,
      endAt
    });
  } catch (e) {
    console.error("savePomodoroNativeState error:", e);
  }
}

function advancePomodoroAfterAlarm() {
  const shouldAdvance =
    timerState.mode === "pomodoro" &&
    pomodoroState.enabled === true &&
    pomodoroState.autoAdvance === true;

  alarmState.pendingPomodoroAdvance = false;
  resetFinishLocks();

  if (!shouldAdvance) {
    timerState.mode = "timer";
    saveTimerState();
    savePomodoroState();
    savePomodoroNativeState(false, 0);
    return;
  }

  handlePomodoroSwitch();
}

async function syncPomodoroStateFromNative() {
  if (!AlarmBridge?.getPomodoroState) return false;

  try {
    const result = await AlarmBridge.getPomodoroState();
    const data = result || {};

    if (!data.enabled) return false;

    pomodoroState.enabled = !!data.enabled;
    pomodoroState.phase = data.phase || "work";
    pomodoroState.workMinutes = safeNumber(data.work, 25);
    pomodoroState.breakMinutes = safeNumber(data.break, 5);
    pomodoroState.cycleCount = safeNumber(data.cycle, 0);
    pomodoroState.autoAdvance = data.autoAdvance !== false;

    timerState.mode = "pomodoro";
    timerState.running = true;
    timerState.paused = false;
    timerState.endAt = safeNumber(data.endAt, 0);
    timerState.totalTime =
      (pomodoroState.phase === "work"
        ? pomodoroState.workMinutes
        : pomodoroState.breakMinutes) * 60;
    timerState.timeLeft = getRemainingSecondsFromEndAt(timerState.endAt);

    if (timerState.timeLeft <= 0 || timerState.endAt <= 0) {
      timerState.running = false;
      timerState.paused = false;
      timerState.timeLeft = 0;
      timerState.endAt = 0;
    }

    if ($("hours")) $("hours").value = 0;
    if ($("minutes")) {
      $("minutes").value =
        pomodoroState.phase === "work"
          ? pomodoroState.workMinutes
          : pomodoroState.breakMinutes;
    }
    if ($("seconds")) $("seconds").value = 0;

    if ($("pomodoroWork")) $("pomodoroWork").value = pomodoroState.workMinutes;
    if ($("pomodoroBreak")) $("pomodoroBreak").value = pomodoroState.breakMinutes;

    clearInterval(timerState.timerId);
    timerState.timerId = null;

    if (timerState.running) {
      timerState.timerId = setInterval(() => {
        timerTick();
      }, 250);
      setText("timerStatus", "running");
    } else {
      setText("timerStatus", "ready");
    }

    updateTimerDisplay();
    updatePomodoroUI();
    updateTimerStartButton();

    saveTimerState();
    savePomodoroState();

    return true;
  } catch (e) {
    console.error("syncPomodoroStateFromNative error:", e);
    return false;
  }
}

async function finalizeExpiredTimerFromBackgroundReturn() {
  if (isFinishLocked()) return;

  markFinishHandled();

  timerState.timeLeft = 0;
  timerState.running = false;
  timerState.paused = false;
  timerState.endAt = 0;

  clearInterval(timerState.timerId);
  timerState.timerId = null;

  updateTimerDisplay();
  setText("timerStatus", "done");
  updateTimerStartButton();

  await cancelNativeAlarm();

  saveTimerState();
  savePomodoroState();

  advancePomodoroAfterAlarm();
}

async function handleAppForeground() {
  visibilityState.isForeground = true;

  await cancelNativeAlarm();

  let stoppedFromNotification = false;
  try {
    if (AlarmBridge?.consumeAlarmStoppedFromNotification) {
      const res = await AlarmBridge.consumeAlarmStoppedFromNotification();
      stoppedFromNotification = !!res?.stopped;
    }
  } catch (e) {
    console.error("consumeAlarmStoppedFromNotification error:", e);
  }

  if (stoppedFromNotification) {
    resetFinishLocks();
    stopPersistentAlarm();
    alarmState.isActive = false;
    hideAlarmOverlay();

    const synced = await syncPomodoroStateFromNative();
    if (synced) return;
  }

  if (timerState.running && !isFinishLocked() && isTimerExpired()) {
    await finalizeExpiredTimerFromBackgroundReturn();
    return;
  }

  if (timerState.running && timerState.endAt > 0) {
    timerState.timeLeft = getRemainingSecondsFromEndAt(timerState.endAt);
    updateTimerDisplay();
  }

  if (alarmState.isActive) {
    try {
      showAlarmOverlay();
      await startPersistentAlarm();
    } catch (err) {
      console.error("resume alarm ui error:", err);
    }
  }
}

async function handleAppBackground() {
  visibilityState.isForeground = false;

  if (timerState.running && timerState.endAt > nowMs()) {
    await scheduleNativeAlarmAtEnd();
  }
}

async function setupVisibilityListeners() {
  if (visibilityState.listenersReady) return;

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      await handleAppForeground();
    } else {
      await handleAppBackground();
    }
  });

  if (CapacitorApp?.addListener) {
    try {
      await CapacitorApp.addListener("appStateChange", async ({ isActive }) => {
        if (isActive) {
          await handleAppForeground();
        } else {
          await handleAppBackground();
        }
      });
    } catch {}

    try {
      await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        if (alarmState.isActive) return;

        if (canGoBack && window.history.length > 1) {
          window.history.back();
        }
      });
    } catch {}
  }

  visibilityState.listenersReady = true;
}

// ===============================
// NOTIFICATION PERMISSIONS
// ===============================
async function requestNotificationPermission() {
  if (!CapacitorLocalNotifications) return false;

  try {
    const check = await CapacitorLocalNotifications.checkPermissions();

    if (check.display === "granted") {
      notificationState.permissionGranted = true;
      return true;
    }

    const req = await CapacitorLocalNotifications.requestPermissions();
    notificationState.permissionGranted = req.display === "granted";
    return notificationState.permissionGranted;
  } catch (e) {
    console.warn("request notification permission failed:", e);
    return false;
  }
}

async function ensureExactAlarmPermission() {
  if (!CapacitorLocalNotifications?.checkExactNotificationSetting) {
    notificationState.exactAlarmGranted = true;
    return true;
  }

  try {
    const exact = await CapacitorLocalNotifications.checkExactNotificationSetting();
    const granted = exact?.value === true || exact?.exact_alarm === "granted";

    if (granted) {
      notificationState.exactAlarmGranted = true;
      return true;
    }

    notificationState.exactAlarmGranted = false;

    if (CapacitorLocalNotifications.changeExactNotificationSetting) {
      await CapacitorLocalNotifications.changeExactNotificationSetting();
    }

    return false;
  } catch (e) {
    console.warn("Exact alarm permission check failed:", e);
    return false;
  }
}

async function previewSound(sound) {
  if ($("soundToggle")?.checked === false) return;

  try {
    stopPreviewSound();
    await unlockAudioOnce();

    const preview = new Audio(sound.assetPath);
    alarmState.previewAudio = preview;
    preview.currentTime = 0;
    preview.loop = false;
    preview.volume = 1;
    preview.preload = "auto";
    preview.playsInline = true;
    await preview.play();
  } catch (e) {
    console.warn("Preview sound failed:", e);
  }
}

function getSoundChannelId(soundId) {
  return `timer_alerts_v13_${soundId}`;
}

async function ensureNotificationChannels() {
  if (!CapacitorLocalNotifications) return;

  try {
    const existing = CapacitorLocalNotifications.listChannels
      ? await CapacitorLocalNotifications.listChannels()
      : { channels: [] };

    const existingIds = new Set((existing?.channels || []).map((c) => c.id));
    const vibrationEnabled = $("vibrationToggle")?.checked !== false;

    for (const sound of SOUND_LIBRARY) {
      const channelId = getSoundChannelId(sound.id);

      if (!existingIds.has(channelId)) {
        try {
          await CapacitorLocalNotifications.createChannel({
            id: channelId,
            name: `Timer ${sound.rawName}`,
            description: `Timer alerts - ${sound.rawName}`,
            importance: 5,
            visibility: 1,
            vibration: vibrationEnabled,
            sound: fileNameWithoutExt(sound.assetPath)
          });
        } catch (e) {
          console.warn("createChannel failed", channelId, e);
        }
      }
    }

    if (!existingIds.has("timer_alerts_fallback_v13")) {
      try {
        await CapacitorLocalNotifications.createChannel({
          id: "timer_alerts_fallback_v13",
          name: "Timer fallback",
          description: "Fallback timer alerts",
          importance: 5,
          visibility: 1,
          vibration: vibrationEnabled,
          sound: "beep"
        });
      } catch (e) {
        console.warn("fallback channel failed", e);
      }
    }
  } catch (e) {
    console.warn("ensureNotificationChannels failed:", e);
  }
}

async function registerNotificationActions() {
  if (!CapacitorLocalNotifications) return;

  try {
    await CapacitorLocalNotifications.registerActionTypes({
      types: [
        {
          id: "TIMER_DONE",
          actions: [{ id: "dismiss_timer", title: "Kapat" }]
        }
      ]
    });
  } catch {}
}

// ===============================
// NATIVE ALARM
// ===============================
async function scheduleNativeAlarmAtEnd() {
  if (!AlarmBridge) return false;
  if (!timerState.endAt || timerState.endAt <= nowMs()) return false;

  try {
    await AlarmBridge.scheduleAlarm({
      triggerAtMillis: timerState.endAt,
      title: "Süre doldu!",
      message: "Alarm çalıyor",
      soundName: getSelectedSoundRawName()
    });
    return true;
  } catch (e) {
    console.warn("Native alarm schedule failed:", e);
    return false;
  }
}

async function scheduleNativeAlarmAtEndNow() {
  if (!AlarmBridge) return false;

  try {
    await AlarmBridge.scheduleAlarm({
      triggerAtMillis: Date.now() + 100,
      title: "Süre doldu!",
      message: "Alarm çalıyor",
      soundName: getSelectedSoundRawName()
    });
    return true;
  } catch (e) {
    console.warn("Native immediate alarm failed:", e);
    return false;
  }
}

async function cancelNativeAlarm() {
  if (!AlarmBridge) return false;

  try {
    await AlarmBridge.cancelAlarm();
    return true;
  } catch (e) {
    console.warn("Native alarm cancel failed:", e);
    return false;
  }
}

async function cancelAlarmNotification() {
  await cancelNativeAlarm();

  if (!CapacitorLocalNotifications) return;

  try {
    await CapacitorLocalNotifications.cancel({
      notifications: [{ id: notificationState.scheduledTimerNotificationId }]
    });
  } catch {}

  try {
    if (CapacitorLocalNotifications.removeAllDeliveredNotifications) {
      await CapacitorLocalNotifications.removeAllDeliveredNotifications();
    }
  } catch {}
}

async function scheduleEndAlarmNotification() {
  if (!timerState.endAt || timerState.endAt <= nowMs()) return;

  try {
    await cancelNativeAlarm();
  } catch {}

  if (!shouldUseNativeAlarm()) return;
  await scheduleNativeAlarmAtEnd();
}

async function dismissAlarmFlow() {
  await cancelNativeAlarm();
  stopPersistentAlarm();
  alarmState.isActive = false;
  hideAlarmOverlay();

  try {
    await cancelAlarmNotification();
  } catch {}

  resetFinishLocks();
  advancePomodoroAfterAlarm();
}

async function setupNotificationListeners() {
  notificationState.listenersReady = true;
}

// ===============================
// TIMER UI
// ===============================
function updateTimerRing() {
  const ring = $("timerRing");
  if (!ring) return;

  if (!timerState.totalTime || timerState.totalTime <= 0) {
    ring.style.background = `conic-gradient(var(--ring-rest) 0deg 360deg)`;
    return;
  }

  const completed = timerState.totalTime - timerState.timeLeft;
  const progress = Math.max(0, Math.min(1, completed / timerState.totalTime));
  const deg = progress * 360;

  ring.style.background = `conic-gradient(
    var(--primary) 0deg,
    var(--secondary) ${deg}deg,
    var(--ring-rest) ${deg}deg 360deg
  )`;
}

function updateTimerDisplay() {
  const el = $("timerDisplay");
  if (el) el.textContent = formatTime(Math.max(0, timerState.timeLeft));
  updateTimerRing();
}

// ===============================
// TIMER ENGINE
// ===============================
async function timerTick() {
  if (!timerState.running) return;
  if (isFinishLocked()) return;

  try {
    timerState.timeLeft = Math.max(0, Math.ceil((timerState.endAt - nowMs()) / 1000));

    if (timerState.timeLeft <= 0) {
      markFinishHandled();

      timerState.timeLeft = 0;
      timerState.running = false;
      timerState.paused = false;
      timerState.endAt = 0;

      clearInterval(timerState.timerId);
      timerState.timerId = null;

      updateTimerDisplay();
      setText("timerStatus", "done");
      updateTimerStartButton();

      setTimeout(() => {
        onTimerFinished().catch((err) => {
          console.error("onTimerFinished deferred error:", err);
        });
      }, 0);

      return;
    }

    updateTimerDisplay();
  } catch (err) {
    console.error("timerTick error:", err);
    timerState.finishing = false;
  }
}

async function startTimer(fromPomodoro = false) {
  if (timerState.running) return;

  if (timerState.paused && timerState.timeLeft > 0) {
    await resumeTimer();
    return;
  }

  resetFinishLocks();
  await cancelNativeAlarm();

  stopPersistentAlarm();
  alarmState.isActive = false;
  hideAlarmOverlay();

  const h = safeNumber($("hours")?.value);
  const m = safeNumber($("minutes")?.value);
  const s = safeNumber($("seconds")?.value);
  const total = h * 3600 + m * 60 + s;

  if (total <= 0) return;

  clearInterval(timerState.timerId);
  timerState.timerId = null;

  if (fromPomodoro) {
    timerState.mode = "pomodoro";
  } else {
    timerState.mode = "timer";
    pomodoroState.enabled = false;
    alarmState.pendingPomodoroAdvance = false;
    savePomodoroState();
    await savePomodoroNativeState(false, 0);
  }

  const notifGranted = await requestNotificationPermission();
  if (!notifGranted) return;

  const exactGranted = await ensureExactAlarmPermission();
  if (!exactGranted) return;

  timerState.totalTime = total;
  timerState.timeLeft = total;
  timerState.running = true;
  timerState.paused = false;
  timerState.endAt = nowMs() + total * 1000;

  if (timerState.mode === "pomodoro") {
    await savePomodoroNativeState(true, timerState.endAt);
  }

  updateTimerDisplay();
  timerState.timerId = setInterval(() => {
    timerTick();
  }, 250);

  setText("timerStatus", "running");
  updateTimerStartButton();
  saveTimerState();

  await scheduleEndAlarmNotification();
}

async function pauseTimer() {
  if (!timerState.running) return;

  timerState.timeLeft = getRemainingSecondsFromEndAt(timerState.endAt);

  clearInterval(timerState.timerId);
  timerState.timerId = null;
  timerState.running = false;
  timerState.paused = true;
  timerState.endAt = 0;

  await cancelAlarmNotification();

  if (timerState.mode === "pomodoro" && pomodoroState.enabled) {
    await savePomodoroNativeState(true, 0);
  }

  updateTimerDisplay();
  setText("timerStatus", "paused");
  updateTimerStartButton();
  saveTimerState();
}

async function resumeTimer() {
  if (!timerState.paused && timerState.timeLeft <= 0) return;

  resetFinishLocks();
  await cancelNativeAlarm();

  const exactGranted = await ensureExactAlarmPermission();
  if (!exactGranted) return;

  clearInterval(timerState.timerId);
  timerState.timerId = null;

  timerState.running = true;
  timerState.paused = false;
  timerState.endAt = nowMs() + timerState.timeLeft * 1000;
  timerState.timerId = setInterval(() => {
    timerTick();
  }, 250);

  if (timerState.mode === "pomodoro" && pomodoroState.enabled) {
    await savePomodoroNativeState(true, timerState.endAt);
  }

  setText("timerStatus", "running");
  updateTimerStartButton();
  updateTimerDisplay();

  await scheduleEndAlarmNotification();
  saveTimerState();
}

async function resetTimer() {
  resetFinishLocks();

  clearInterval(timerState.timerId);
  timerState.timerId = null;

  timerState.running = false;
  timerState.paused = false;
  timerState.timeLeft = 0;
  timerState.totalTime = 0;
  timerState.endAt = 0;
  timerState.mode = "timer";

  pomodoroState.enabled = false;
  alarmState.pendingPomodoroAdvance = false;

  stopPersistentAlarm();
  alarmState.isActive = false;
  hideAlarmOverlay();

  if ($("hours")) $("hours").value = 0;
  if ($("minutes")) $("minutes").value = 0;
  if ($("seconds")) $("seconds").value = 0;

  updateTimerDisplay();
  await cancelAlarmNotification();
  await savePomodoroNativeState(false, 0);

  setText("timerStatus", "ready");
  updateTimerStartButton();

  saveTimerState();
  savePomodoroState();
}

async function onTimerFinished() {
  try {
    alarmState.pendingPomodoroAdvance =
      timerState.mode === "pomodoro" &&
      pomodoroState.enabled === true &&
      pomodoroState.autoAdvance === true;

    if (isAppForeground()) {
      await cancelNativeAlarm();

      alarmState.isActive = true;
      showAlarmOverlay();
      await startPersistentAlarm();
    } else {
      await scheduleNativeAlarmAtEndNow();
    }

    updateTimerStartButton();
    saveTimerState();
    savePomodoroState();
  } catch (err) {
    console.error("onTimerFinished error:", err);
  } finally {
    setTimeout(() => {
      timerState.finishing = false;
    }, 400);
  }
}
  // ===============================
// PART 5 / 5
// POMODORO + STOPWATCH + STATE + INIT + MULTI LANG FINAL
// ===============================

// ===============================
// POMODORO
// ===============================
function updatePomodoroUI() {
  const phaseEl = $("pomodoroPhase");
  const cycleEl = $("pomodoroCycle");

  if (phaseEl) {
    const key = pomodoroState.phase === "work" ? "work" : "break";
    phaseEl.textContent = t(key);
  }

  if (cycleEl) {
    cycleEl.textContent = `${t("cycle")}: ${pomodoroState.cycleCount}`;
  }
}

function handlePomodoroSwitch() {
  if (!pomodoroState.enabled) return;

  if (pomodoroState.phase === "work") {
    pomodoroState.phase = "break";
  } else {
    pomodoroState.phase = "work";
    pomodoroState.cycleCount++;
  }

  savePomodoroState();

  if ($("minutes")) {
    $("minutes").value =
      pomodoroState.phase === "work"
        ? pomodoroState.workMinutes
        : pomodoroState.breakMinutes;
  }

  if ($("seconds")) $("seconds").value = 0;
  if ($("hours")) $("hours").value = 0;

  updatePomodoroUI();

  startTimer(true);
}

function startPomodoro() {
  pomodoroState.enabled = true;
  pomodoroState.phase = "work";
  pomodoroState.cycleCount = 0;

  if ($("pomodoroWork"))
    pomodoroState.workMinutes = safeNumber($("pomodoroWork").value, 25);

  if ($("pomodoroBreak"))
    pomodoroState.breakMinutes = safeNumber($("pomodoroBreak").value, 5);

  if ($("minutes")) $("minutes").value = pomodoroState.workMinutes;
  if ($("seconds")) $("seconds").value = 0;
  if ($("hours")) $("hours").value = 0;

  updatePomodoroUI();
  savePomodoroState();

  startTimer(true);
}

function stopPomodoro() {
  pomodoroState.enabled = false;
  pomodoroState.phase = "work";
  pomodoroState.cycleCount = 0;

  savePomodoroState();
  savePomodoroNativeState(false, 0);
}

// ===============================
// STOPWATCH
// ===============================
function updateStopwatchDisplay() {
  const el = $("stopwatchDisplay");
  if (!el) return;

  el.textContent = formatTime(stopwatchState.elapsed);
}

function startStopwatch() {
  if (stopwatchState.running) return;

  stopwatchState.running = true;
  stopwatchState.startAt = nowMs() - stopwatchState.elapsed * 1000;

  stopwatchState.interval = setInterval(() => {
    stopwatchState.elapsed = Math.floor(
      (nowMs() - stopwatchState.startAt) / 1000
    );
    updateStopwatchDisplay();
  }, 250);
}

function pauseStopwatch() {
  if (!stopwatchState.running) return;

  stopwatchState.running = false;
  clearInterval(stopwatchState.interval);
}

function resetStopwatch() {
  stopwatchState.running = false;
  stopwatchState.elapsed = 0;
  clearInterval(stopwatchState.interval);
  updateStopwatchDisplay();
}

// ===============================
// TABS
// ===============================
function switchTab(tab) {
  const tabs = ["timer", "stopwatch", "pomodoro"];

  tabs.forEach((tName) => {
    const el = $(`${tName}Tab`);
    const content = $(`${tName}Content`);

    if (el) el.classList.toggle("active", tName === tab);
    if (content) content.style.display = tName === tab ? "block" : "none";
  });
}

// ===============================
// STATE SAVE / LOAD
// ===============================
function saveTimerState() {
  localStorage.setItem("timerState", JSON.stringify(timerState));
}

function savePomodoroState() {
  localStorage.setItem("pomodoroState", JSON.stringify(pomodoroState));
}

function saveSettings() {
  const settings = {
    sound: selectedSoundId,
    vibration: $("vibrationToggle")?.checked,
    soundEnabled: $("soundToggle")?.checked,
    language: currentLang
  };

  localStorage.setItem("settings", JSON.stringify(settings));
}

function loadSettings() {
  const s = JSON.parse(localStorage.getItem("settings") || "{}");

  if (s.sound) selectedSoundId = s.sound;
  if ($("vibrationToggle")) $("vibrationToggle").checked = s.vibration !== false;
  if ($("soundToggle")) $("soundToggle").checked = s.soundEnabled !== false;

  if (s.language) {
    currentLang = s.language;
    applyTranslations();
  }
}

function loadState() {
  try {
    const t = JSON.parse(localStorage.getItem("timerState") || "{}");
    const p = JSON.parse(localStorage.getItem("pomodoroState") || "{}");

    Object.assign(timerState, t);
    Object.assign(pomodoroState, p);

    if (timerState.running && timerState.endAt > nowMs()) {
      timerState.timerId = setInterval(timerTick, 250);
    }

    updateTimerDisplay();
    updatePomodoroUI();
  } catch (e) {
    console.warn("load state error", e);
  }
}

// ===============================
// MULTI LANGUAGE APPLY
// ===============================
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });
}

// ===============================
// INIT APP
// ===============================
async function initApp() {
  try {
    loadSettings();
    loadState();

    applyTranslations();

    await setupVisibilityListeners();
    await setupNotificationListeners();

    await requestNotificationPermission();
    await ensureExactAlarmPermission();
    await ensureNotificationChannels();
    await registerNotificationActions();

    updateTimerDisplay();
    updateStopwatchDisplay();
    updatePomodoroUI();

    switchTab("timer");

    console.log("APP READY 🚀");
  } catch (e) {
    console.error("INIT ERROR:", e);
  }
}

// ===============================
// EVENTS
// ===============================
window.addEventListener("load", initApp);

// Timer Buttons
$("startBtn")?.addEventListener("click", startTimer);
$("pauseBtn")?.addEventListener("click", pauseTimer);
$("resetBtn")?.addEventListener("click", resetTimer);

// Stopwatch
$("swStart")?.addEventListener("click", startStopwatch);
$("swPause")?.addEventListener("click", pauseStopwatch);
$("swReset")?.addEventListener("click", resetStopwatch);

// Pomodoro
$("pomodoroStart")?.addEventListener("click", startPomodoro);
$("pomodoroStop")?.addEventListener("click", stopPomodoro);

// Tabs
$("tabTimer")?.addEventListener("click", () => switchTab("timer"));
$("tabStopwatch")?.addEventListener("click", () => switchTab("stopwatch"));
$("tabPomodoro")?.addEventListener("click", () => switchTab("pomodoro"));

// Settings
$("soundSelect")?.addEventListener("change", (e) => {
  selectedSoundId = e.target.value;
  saveSettings();
});

$("languageSelect")?.addEventListener("change", (e) => {
  currentLang = e.target.value;
  applyTranslations();
  saveSettings();
});

$("vibrationToggle")?.addEventListener("change", saveSettings);
$("soundToggle")?.addEventListener("change", saveSettings);
// ===============================
// 🔥 SAFE EXTENSIONS (NO BREAK)
// ===============================

// -------- REWARDED LOCK UI --------
function updatePomodoroRewardUI() {
  const status = document.getElementById("pomodoroRewardStatus");
  const btn = document.getElementById("rewardUnlockBtn");

  if (status) {
    status.textContent = rewardedCustomPomodoroUnlocked
      ? "Custom Açık"
      : "Custom Kilitli";
  }

  if (btn) {
    btn.style.display = rewardedCustomPomodoroUnlocked ? "none" : "inline-block";
  }
}

// -------- REWARD FLOW --------
async function rewardUnlockPomodoroFlow() {
  await showRewardedAd(() => {
    unlockRewardedCustomPomodoroAccess();
    updatePomodoroRewardUI();
    saveSettingsSafe();
  });
}

// -------- SAFE SETTINGS --------
function saveSettingsSafe() {
  try {
    const s = JSON.parse(localStorage.getItem("settings") || "{}");

    s.rewardPomodoro = rewardedCustomPomodoroUnlocked;

    localStorage.setItem("settings", JSON.stringify(s));
  } catch {}
}

// -------- SAFE LOAD --------
function loadRewardSafe() {
  try {
    const s = JSON.parse(localStorage.getItem("settings") || "{}");

    if (typeof s.rewardPomodoro === "boolean") {
      rewardedCustomPomodoroUnlocked = s.rewardPomodoro;
    }
  } catch {}
}

// -------- HOOK INIT --------
document.addEventListener("DOMContentLoaded", () => {
  try {
    loadRewardSafe();
    updatePomodoroRewardUI();

    const btn = document.getElementById("rewardUnlockBtn");
    if (btn) {
      btn.addEventListener("click", rewardUnlockPomodoroFlow);
    }
  } catch (e) {
    console.log("Reward init error", e);
  }
});
window.addEventListener("error", (e) => {
  console.log("GLOBAL ERROR:", e.message);
});

window.addEventListener("unhandledrejection", (e) => {
  console.log("PROMISE ERROR:", e.reason);
});
