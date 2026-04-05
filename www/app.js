// ===============================
// TIMER TRINK PRO - FINAL CLEAN
// PART 1 / 5
// CORE + STATE + HELPERS
// ===============================

(() => {
"use strict";

// ===============================
// DOM
// ===============================
const $ = (id) => document.getElementById(id);
const $$ = (q) => document.querySelectorAll(q);

// ===============================
// TIME
// ===============================
const now = () => Date.now();

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ===============================
// STATE (TEK YERDEN YÖNETİLİR)
// ===============================
const state = {
  language: "en",
  activeTab: "timer",

  timer: {
    running: false,
    paused: false,
    timeLeft: 0,
    total: 0,
    endAt: 0,
    interval: null,
    mode: "timer"
  },

  stopwatch: {
    running: false,
    elapsed: 0,
    startAt: 0,
    interval: null
  },

  pomodoro: {
    enabled: false,
    phase: "work",
    work: 25,
    break: 5,
    cycle: 0,
    auto: true
  },

  sound: {
    enabled: true,
    selected: "sound1",
    audio: null
  }
};

// ===============================
window.APP = { $, $$, state, formatTime, now };

})();
// ===============================
// PART 2 / 5
// TIMER ENGINE
// ===============================

(() => {

const { state, $, formatTime, now } = window.APP;

// ===============================
// TIMER DISPLAY
// ===============================
function updateTimerUI() {
  const el = $("timerDisplay");
  if (el) el.textContent = formatTime(state.timer.timeLeft);
}

// ===============================
// TIMER TICK
// ===============================
function tick() {
  if (!state.timer.running) return;

  state.timer.timeLeft = Math.max(
    0,
    Math.ceil((state.timer.endAt - now()) / 1000)
  );

  updateTimerUI();

  if (state.timer.timeLeft <= 0) {
    finish();
  }
}

// ===============================
function finish() {
  clearInterval(state.timer.interval);

  state.timer.running = false;
  state.timer.paused = false;
  state.timer.endAt = 0;

  updateTimerUI();

  triggerAlarm();

  if (state.timer.mode === "pomodoro" && state.pomodoro.enabled) {
    switchPomodoro();
  }
}

// ===============================
function startTimer(sec = null) {

  if (state.timer.running) return;

  if (sec === null) {
    const h = +$("hours")?.value || 0;
    const m = +$("minutes")?.value || 0;
    const s = +$("seconds")?.value || 0;
    sec = h*3600 + m*60 + s;
  }

  if (sec <= 0) return;

  state.timer.running = true;
  state.timer.paused = false;
  state.timer.total = sec;
  state.timer.timeLeft = sec;
  state.timer.endAt = now() + sec*1000;

  clearInterval(state.timer.interval);
  state.timer.interval = setInterval(tick, 250);

  updateTimerUI();
}

// ===============================
function pauseTimer() {
  if (!state.timer.running) return;

  state.timer.timeLeft = Math.ceil((state.timer.endAt - now())/1000);

  clearInterval(state.timer.interval);

  state.timer.running = false;
  state.timer.paused = true;
}

// ===============================
function resumeTimer() {
  if (!state.timer.paused) return;

  state.timer.running = true;
  state.timer.paused = false;
  state.timer.endAt = now() + state.timer.timeLeft*1000;

  clearInterval(state.timer.interval);
  state.timer.interval = setInterval(tick, 250);
}

// ===============================
function resetTimer() {
  clearInterval(state.timer.interval);

  state.timer.running = false;
  state.timer.paused = false;
  state.timer.timeLeft = 0;
  state.timer.total = 0;
  state.timer.endAt = 0;

  updateTimerUI();
}

// ===============================
window.TIMER = {
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer
};

})();
// ===============================
// PART 3 / 5
// STOPWATCH
// ===============================

(() => {

const { state, $, now, formatTime } = window.APP;

function updateSW() {
  const el = $("stopwatchDisplay");
  if (el) el.textContent = formatTime(state.stopwatch.elapsed);
}

function startSW() {
  if (state.stopwatch.running) return;

  state.stopwatch.running = true;
  state.stopwatch.startAt = now() - state.stopwatch.elapsed*1000;

  state.stopwatch.interval = setInterval(() => {
    state.stopwatch.elapsed = Math.floor(
      (now() - state.stopwatch.startAt)/1000
    );
    updateSW();
  }, 250);
}

function pauseSW() {
  clearInterval(state.stopwatch.interval);
  state.stopwatch.running = false;
}

function resetSW() {
  clearInterval(state.stopwatch.interval);
  state.stopwatch.running = false;
  state.stopwatch.elapsed = 0;
  updateSW();
}

window.SW = { startSW, pauseSW, resetSW };

})();
// ===============================
// PART 4 / 5
// POMODORO + SOUND
// ===============================

(() => {

const { state } = window.APP;

// ===============================
function switchPomodoro() {

  if (!state.pomodoro.enabled) return;

  if (state.pomodoro.phase === "work") {
    state.pomodoro.phase = "break";
    TIMER.startTimer(state.pomodoro.break * 60);
  } else {
    state.pomodoro.phase = "work";
    state.pomodoro.cycle++;
    TIMER.startTimer(state.pomodoro.work * 60);
  }
}

// ===============================
function startPomodoro() {
  state.pomodoro.enabled = true;
  state.pomodoro.phase = "work";
  state.pomodoro.cycle = 0;

  state.timer.mode = "pomodoro";

  TIMER.startTimer(state.pomodoro.work * 60);
}

// ===============================
// SOUND
// ===============================
function triggerAlarm() {

  if (!state.sound.enabled) return;

  try {
    const audio = new Audio(`sounds/${state.sound.selected}.mp3`);
    audio.loop = true;
    audio.play();

    state.sound.audio = audio;

  } catch {}
}

function stopAlarm() {
  if (state.sound.audio) {
    state.sound.audio.pause();
    state.sound.audio.currentTime = 0;
  }
}

window.POMO = { startPomodoro, switchPomodoro };
window.SOUND = { triggerAlarm, stopAlarm };

})();
// ===============================
// PART 4 / 5
// POMODORO + SOUND
// ===============================

(() => {

const { state } = window.APP;

// ===============================
function switchPomodoro() {

  if (!state.pomodoro.enabled) return;

  if (state.pomodoro.phase === "work") {
    state.pomodoro.phase = "break";
    TIMER.startTimer(state.pomodoro.break * 60);
  } else {
    state.pomodoro.phase = "work";
    state.pomodoro.cycle++;
    TIMER.startTimer(state.pomodoro.work * 60);
  }
}

// ===============================
function startPomodoro() {
  state.pomodoro.enabled = true;
  state.pomodoro.phase = "work";
  state.pomodoro.cycle = 0;

  state.timer.mode = "pomodoro";

  TIMER.startTimer(state.pomodoro.work * 60);
}

// ===============================
// SOUND
// ===============================
function triggerAlarm() {

  if (!state.sound.enabled) return;

  try {
    const audio = new Audio(`sounds/${state.sound.selected}.mp3`);
    audio.loop = true;
    audio.play();

    state.sound.audio = audio;

  } catch {}
}

function stopAlarm() {
  if (state.sound.audio) {
    state.sound.audio.pause();
    state.sound.audio.currentTime = 0;
  }
}

window.POMO = { startPomodoro, switchPomodoro };
window.SOUND = { triggerAlarm, stopAlarm };

})();
// ===============================
// PART 5 / 5
// EVENTS + INIT
// ===============================

(() => {

const { $ } = window.APP;

// ===============================
document.addEventListener("DOMContentLoaded", () => {

  // TIMER
  $("startBtn")?.addEventListener("click", () => {
    if (APP.state.timer.paused) TIMER.resumeTimer();
    else TIMER.startTimer();
  });

  $("pauseBtn")?.addEventListener("click", TIMER.pauseTimer);
  $("resetBtn")?.addEventListener("click", TIMER.resetTimer);

  // STOPWATCH
  $("swStart")?.addEventListener("click", SW.startSW);
  $("swPause")?.addEventListener("click", SW.pauseSW);
  $("swReset")?.addEventListener("click", SW.resetSW);

  // POMODORO
  $("pomodoroBtn")?.addEventListener("click", POMO.startPomodoro);

  // ALARM CLOSE
  $("alarmClose")?.addEventListener("click", SOUND.stopAlarm);

  console.log("APP READY 🚀");

});

})();
// ===============================
// PART 6 / 6
// I18N - 18 LANGUAGE SYSTEM (FINAL)
// ===============================

(() => {

const { state, $, $$ } = window.APP;

// ===============================
// SUPPORTED LANGUAGES
// ===============================
const LANGS = [
  "tr","en","de","fr","es","ru","ar","it","pt",
  "zh","hi","ja","ko","nl","pl","uk","id","ms"
];

// ===============================
// TRANSLATIONS
// ===============================
const I18N = {
  en: {
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    timer: "Timer",
    stopwatch: "Stopwatch",
    pomodoro: "Pomodoro",
    done: "Time is up!",
    work: "Work",
    break: "Break"
  },

  tr: {
    start: "Başlat",
    pause: "Duraklat",
    reset: "Sıfırla",
    timer: "Zamanlayıcı",
    stopwatch: "Kronometre",
    pomodoro: "Pomodoro",
    done: "Süre doldu!",
    work: "Çalışma",
    break: "Mola"
  },

  de: {
    start: "Start",
    pause: "Pause",
    reset: "Zurücksetzen",
    timer: "Timer",
    stopwatch: "Stoppuhr",
    pomodoro: "Pomodoro",
    done: "Zeit ist um!",
    work: "Arbeit",
    break: "Pause"
  },

  fr: {
    start: "Démarrer",
    pause: "Pause",
    reset: "Réinitialiser",
    timer: "Minuteur",
    stopwatch: "Chronomètre",
    pomodoro: "Pomodoro",
    done: "Temps écoulé!",
    work: "Travail",
    break: "Pause"
  },

  es: {
    start: "Iniciar",
    pause: "Pausar",
    reset: "Restablecer",
    timer: "Temporizador",
    stopwatch: "Cronómetro",
    pomodoro: "Pomodoro",
    done: "Tiempo terminado!",
    work: "Trabajo",
    break: "Descanso"
  },

  ru: {
    start: "Старт",
    pause: "Пауза",
    reset: "Сброс",
    timer: "Таймер",
    stopwatch: "Секундомер",
    pomodoro: "Помодоро",
    done: "Время вышло!",
    work: "Работа",
    break: "Перерыв"
  },

  ar: {
    start: "ابدأ",
    pause: "إيقاف",
    reset: "إعادة",
    timer: "المؤقت",
    stopwatch: "ساعة",
    pomodoro: "بومودورو",
    done: "انتهى الوقت!",
    work: "عمل",
    break: "راحة"
  },

  it: {
    start: "Avvia",
    pause: "Pausa",
    reset: "Reimposta",
    timer: "Timer",
    stopwatch: "Cronometro",
    pomodoro: "Pomodoro",
    done: "Tempo scaduto!",
    work: "Lavoro",
    break: "Pausa"
  },

  pt: {
    start: "Iniciar",
    pause: "Pausar",
    reset: "Redefinir",
    timer: "Temporizador",
    stopwatch: "Cronômetro",
    pomodoro: "Pomodoro",
    done: "Tempo esgotado!",
    work: "Trabalho",
    break: "Pausa"
  },

  zh: {
    start: "开始",
    pause: "暂停",
    reset: "重置",
    timer: "计时器",
    stopwatch: "秒表",
    pomodoro: "番茄钟",
    done: "时间到了！",
    work: "工作",
    break: "休息"
  },

  hi: {
    start: "शुरू",
    pause: "रोकें",
    reset: "रीसेट",
    timer: "टाइमर",
    stopwatch: "स्टॉपवॉच",
    pomodoro: "पोमोडोरो",
    done: "समय समाप्त!",
    work: "काम",
    break: "ब्रेक"
  },

  ja: {
    start: "開始",
    pause: "一時停止",
    reset: "リセット",
    timer: "タイマー",
    stopwatch: "ストップウォッチ",
    pomodoro: "ポモドーロ",
    done: "時間切れ！",
    work: "作業",
    break: "休憩"
  },

  ko: {
    start: "시작",
    pause: "일시정지",
    reset: "재설정",
    timer: "타이머",
    stopwatch: "스톱워치",
    pomodoro: "포모도로",
    done: "시간 종료!",
    work: "작업",
    break: "휴식"
  },

  nl: {
    start: "Start",
    pause: "Pauze",
    reset: "Reset",
    timer: "Timer",
    stopwatch: "Stopwatch",
    pomodoro: "Pomodoro",
    done: "Tijd is om!",
    work: "Werk",
    break: "Pauze"
  },

  pl: {
    start: "Start",
    pause: "Pauza",
    reset: "Resetuj",
    timer: "Timer",
    stopwatch: "Stoper",
    pomodoro: "Pomodoro",
    done: "Czas minął!",
    work: "Praca",
    break: "Przerwa"
  },

  uk: {
    start: "Почати",
    pause: "Пауза",
    reset: "Скинути",
    timer: "Таймер",
    stopwatch: "Секундомір",
    pomodoro: "Помодоро",
    done: "Час вийшов!",
    work: "Робота",
    break: "Перерва"
  },

  id: {
    start: "Mulai",
    pause: "Jeda",
    reset: "Reset",
    timer: "Timer",
    stopwatch: "Stopwatch",
    pomodoro: "Pomodoro",
    done: "Waktu habis!",
    work: "Kerja",
    break: "Istirahat"
  },

  ms: {
    start: "Mula",
    pause: "Jeda",
    reset: "Tetapkan semula",
    timer: "Pemasa",
    stopwatch: "Jam randik",
    pomodoro: "Pomodoro",
    done: "Masa tamat!",
    work: "Kerja",
    break: "Rehat"
  }
};

// ===============================
// TRANSLATE FUNCTION (TEK)
// ===============================
function t(key) {
  const lang = state.language || "en";
  return I18N[lang]?.[key] || I18N.en[key] || key;
}

// ===============================
// APPLY TEXT
// ===============================
function applyTranslations() {

  // TEXT
  $$("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  // PLACEHOLDER
  $$("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

}

// ===============================
// LANGUAGE CHANGE
// ===============================
function setLanguage(lang) {
  if (!LANGS.includes(lang)) return;

  state.language = lang;
  localStorage.setItem("lang", lang);

  applyTranslations();
}

// ===============================
// INIT LANGUAGE
// ===============================
function initLang() {

  const saved = localStorage.getItem("lang");

  if (saved && LANGS.includes(saved)) {
    state.language = saved;
  } else {
    const nav = navigator.language.slice(0,2);
    state.language = LANGS.includes(nav) ? nav : "en";
  }

  applyTranslations();
}

// ===============================
// EXPORT
// ===============================
window.I18N_SYSTEM = {
  t,
  setLanguage,
  initLang
};

// ===============================
// AUTO INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  I18N_SYSTEM.initLang();

  $("langSelect")?.addEventListener("change", (e)=>{
    setLanguage(e.target.value);
  });
});

})();
