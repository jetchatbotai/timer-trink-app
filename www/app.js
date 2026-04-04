// ===============================
// TIMER TRINK PRO CORE
// ===============================

// ===============================
// STATE
// ===============================
const state = {
  running: false,
  paused: false,
  timeLeft: 0,
  totalTime: 0,
  endAt: 0,
  interval: null,

  mode: "timer",

  language: "en",

  pomodoro: {
    enabled: false,
    phase: "work",
    work: 25,
    break: 5,
    cycle: 0,
    auto: true
  },

  stopwatch: {
    running: false,
    startAt: 0,
    elapsed: 0,
    interval: null
  }
};

// ===============================
// I18N FULL (18 LANG)
// ===============================
const I18N = {
  en:{
    start:"Start", pause:"Pause", reset:"Reset", done:"Time is up!",
    ready:"Ready", running:"Running", paused:"Paused",
    timer:"Timer", stopwatch:"Stopwatch", pomodoro:"Pomodoro",
    work:"Work", break:"Break",
    hours:"Hours", minutes:"Minutes", seconds:"Seconds",
    lap:"Lap", laps:"Laps", clear:"Clear",
    apply:"Apply", close:"Close",
    sounds:"Sounds", settings:"Settings",
    subtitle:"Simple focus timer"
  },

  tr:{
    start:"Başlat", pause:"Duraklat", reset:"Sıfırla", done:"Süre doldu!",
    ready:"Hazır", running:"Çalışıyor", paused:"Duraklatıldı",
    timer:"Zamanlayıcı", stopwatch:"Kronometre", pomodoro:"Pomodoro",
    work:"Çalışma", break:"Mola",
    hours:"Saat", minutes:"Dakika", seconds:"Saniye",
    lap:"Tur", laps:"Turlar", clear:"Temizle",
    apply:"Uygula", close:"Kapat",
    sounds:"Sesler", settings:"Ayarlar",
    subtitle:"Basit odak zamanlayıcısı"
  },

  de:{
    start:"Start", pause:"Pause", reset:"Zurücksetzen", done:"Zeit ist um!",
    ready:"Bereit", running:"Läuft", paused:"Pausiert",
    timer:"Timer", stopwatch:"Stoppuhr", pomodoro:"Pomodoro",
    work:"Arbeit", break:"Pause",
    hours:"Stunden", minutes:"Minuten", seconds:"Sekunden",
    lap:"Runde", laps:"Runden", clear:"Löschen",
    apply:"Anwenden", close:"Schließen",
    sounds:"Töne", settings:"Einstellungen",
    subtitle:"Einfacher Fokus-Timer"
  },

  fr:{
    start:"Démarrer", pause:"Pause", reset:"Réinitialiser", done:"Temps écoulé!",
    ready:"Prêt", running:"En cours", paused:"En pause",
    timer:"Minuteur", stopwatch:"Chronomètre", pomodoro:"Pomodoro",
    work:"Travail", break:"Pause",
    hours:"Heures", minutes:"Minutes", seconds:"Secondes",
    lap:"Tour", laps:"Tours", clear:"Effacer",
    apply:"Appliquer", close:"Fermer",
    sounds:"Sons", settings:"Paramètres",
    subtitle:"Minuteur simple pour se concentrer"
  },

  es:{
    start:"Iniciar", pause:"Pausar", reset:"Restablecer", done:"Tiempo terminado!",
    ready:"Listo", running:"En marcha", paused:"Pausado",
    timer:"Temporizador", stopwatch:"Cronómetro", pomodoro:"Pomodoro",
    work:"Trabajo", break:"Descanso",
    hours:"Horas", minutes:"Minutos", seconds:"Segundos",
    lap:"Vuelta", laps:"Vueltas", clear:"Borrar",
    apply:"Aplicar", close:"Cerrar",
    sounds:"Sonidos", settings:"Configuración",
    subtitle:"Temporizador simple"
  },

  ru:{
    start:"Старт", pause:"Пауза", reset:"Сброс", done:"Время вышло!",
    ready:"Готово", running:"Работает", paused:"На паузе",
    timer:"Таймер", stopwatch:"Секундомер", pomodoro:"Помодоро",
    work:"Работа", break:"Перерыв",
    hours:"Часы", minutes:"Минуты", seconds:"Секунды",
    lap:"Круг", laps:"Круги", clear:"Очистить",
    apply:"Применить", close:"Закрыть",
    sounds:"Звуки", settings:"Настройки",
    subtitle:"Простой таймер"
  },

  ar:{
    start:"ابدأ", pause:"إيقاف", reset:"إعادة", done:"انتهى الوقت!",
    ready:"جاهز", running:"يعمل", paused:"متوقف",
    timer:"المؤقت", stopwatch:"ساعة", pomodoro:"بومودورو",
    work:"عمل", break:"راحة",
    hours:"ساعات", minutes:"دقائق", seconds:"ثواني",
    lap:"لفة", laps:"لفات", clear:"مسح",
    apply:"تطبيق", close:"إغلاق",
    sounds:"أصوات", settings:"إعدادات",
    subtitle:"مؤقت بسيط"
  }
};
// ===============================
// HELPERS
// ===============================
function t(key){
  return I18N[state.language]?.[key] || I18N.en[key] || key;
}

function format(sec){
  const h=Math.floor(sec/3600);
  const m=Math.floor((sec%3600)/60);
  const s=sec%60;
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

// ===============================
// TIMER
// ===============================
function startTimer(seconds){
  if(state.running) return;

  state.running=true;
  state.paused=false;
  state.totalTime=seconds;
  state.timeLeft=seconds;
  state.endAt=Date.now()+seconds*1000;

  tick();
  state.interval=setInterval(tick,250);

  updateUI();
}

function tick(){
  const left=Math.max(0,Math.ceil((state.endAt-Date.now())/1000));
  state.timeLeft=left;

  updateDisplay();

  if(left<=0){
    clearInterval(state.interval);
    state.running=false;
    alert(t("done"));

    if(state.mode==="pomodoro" && state.pomodoro.enabled){
      switchPomodoro();
    }
  }
}

function pauseTimer(){
  if(!state.running) return;

  clearInterval(state.interval);
  state.running=false;
  state.paused=true;
}

function resumeTimer(){
  if(!state.paused) return;

  state.running=true;
  state.paused=false;
  state.endAt=Date.now()+state.timeLeft*1000;

  state.interval=setInterval(tick,250);
}

function resetTimer(){
  clearInterval(state.interval);
  state.running=false;
  state.paused=false;
  state.timeLeft=0;
  updateDisplay();
}

// ===============================
// STOPWATCH
// ===============================
function startStopwatch(){
  if(state.stopwatch.running) return;

  state.stopwatch.running=true;
  state.stopwatch.startAt=Date.now()-state.stopwatch.elapsed*1000;

  state.stopwatch.interval=setInterval(()=>{
    state.stopwatch.elapsed=Math.floor((Date.now()-state.stopwatch.startAt)/1000);
    updateStopwatch();
  },250);
}

function pauseStopwatch(){
  if(!state.stopwatch.running) return;

  clearInterval(state.stopwatch.interval);
  state.stopwatch.running=false;
}

function resetStopwatch(){
  clearInterval(state.stopwatch.interval);
  state.stopwatch.running=false;
  state.stopwatch.elapsed=0;
  updateStopwatch();
}

// ===============================
// POMODORO
// ===============================
function startPomodoro(){
  state.mode="pomodoro";
  state.pomodoro.enabled=true;
  state.pomodoro.phase="work";
  state.pomodoro.cycle=0;

  startTimer(state.pomodoro.work*60);
}

function switchPomodoro(){
  if(state.pomodoro.phase==="work"){
    state.pomodoro.phase="break";
    startTimer(state.pomodoro.break*60);
  }else{
    state.pomodoro.phase="work";
    state.pomodoro.cycle++;
    startTimer(state.pomodoro.work*60);
  }

  updateUI();
}

// ===============================
// UI
// ===============================
function updateDisplay(){
  const el=document.getElementById("display");
  if(el) el.textContent=format(state.timeLeft);
}

function updateStopwatch(){
  const el=document.getElementById("stopwatchDisplay");
  if(el) el.textContent=format(state.stopwatch.elapsed);
}

function updateUI(){
  const startBtn=document.getElementById("startBtn");
  const pauseBtn=document.getElementById("pauseBtn");
  const resetBtn=document.getElementById("resetBtn");

  if(startBtn) startBtn.textContent=t("start");
  if(pauseBtn) pauseBtn.textContent=t("pause");
  if(resetBtn) resetBtn.textContent=t("reset");

  const phase=document.getElementById("phase");
  if(phase && state.mode==="pomodoro"){
    phase.textContent=t(state.pomodoro.phase);
  }
}

// ===============================
// LANGUAGE
// ===============================
function setLanguage(lang){
  if(I18N[lang]){
    state.language=lang;
    updateUI();
  }
}

// ===============================
// INIT + EVENTS
// ===============================
document.addEventListener("DOMContentLoaded",()=>{
  try{

    document.getElementById("startBtn")?.addEventListener("click",()=>{
      startTimer(1500);
    });

    document.getElementById("pauseBtn")?.addEventListener("click",pauseTimer);

    document.getElementById("resetBtn")?.addEventListener("click",resetTimer);

    document.getElementById("resumeBtn")?.addEventListener("click",resumeTimer);

    document.getElementById("pomodoroBtn")?.addEventListener("click",startPomodoro);

    document.getElementById("swStart")?.addEventListener("click",startStopwatch);
    document.getElementById("swPause")?.addEventListener("click",pauseStopwatch);
    document.getElementById("swReset")?.addEventListener("click",resetStopwatch);
// ===============================
// PART 2 / 5
// TRANSLATIONS (18 LANG CORE)
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
    work: "Çalışma",
    break: "Mola",
    cycle: "Döngü",
    previewSound: "Sesi dinle",
    applyPomodoro: "Uygula",
    resetPomodoro: "Sıfırla",
    resetCycle: "Döngüyü sıfırla",
    soundOn: "Ses açık",
    vibrationOn: "Titreşim açık",
    subtitle: "Basit odak zamanlayıcı"
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
    alarmRinging: "Alarm ringing",
    sounds: "Sounds",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    lap: "Lap",
    stopwatch: "Stopwatch",
    timer: "Timer",
    pomodoro: "Pomodoro",
    work: "Work",
    break: "Break",
    cycle: "Cycle",
    previewSound: "Preview",
    applyPomodoro: "Apply",
    resetPomodoro: "Reset",
    resetCycle: "Reset cycle",
    soundOn: "Sound on",
    vibrationOn: "Vibration on",
    subtitle: "Simple focus timer"
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
    work: "Arbeit",
    break: "Pause",
    cycle: "Zyklus",
    previewSound: "Anhören",
    applyPomodoro: "Anwenden",
    resetPomodoro: "Zurücksetzen",
    resetCycle: "Zyklus zurücksetzen",
    soundOn: "Ton an",
    vibrationOn: "Vibration an",
    subtitle: "Einfacher Timer"
  },

  fr: {
    start: "Démarrer",
    pause: "Pause",
    reset: "Réinitialiser",
    ready: "Prêt",
    running: "En cours",
    paused: "En pause",
    done: "Temps écoulé !",
    close: "Fermer",
    alarmRinging: "Alarme active",
    sounds: "Sons",
    hours: "Heures",
    minutes: "Minutes",
    seconds: "Secondes",
    lap: "Tour",
    stopwatch: "Chronomètre",
    timer: "Minuteur",
    pomodoro: "Pomodoro",
    work: "Travail",
    break: "Pause",
    cycle: "Cycle",
    previewSound: "Écouter",
    applyPomodoro: "Appliquer",
    resetPomodoro: "Réinitialiser",
    resetCycle: "Réinitialiser cycle",
    soundOn: "Son activé",
    vibrationOn: "Vibration activée",
    subtitle: "Minuteur simple"
  },

  es: {
    start: "Iniciar",
    pause: "Pausar",
    reset: "Restablecer",
    ready: "Listo",
    running: "En marcha",
    paused: "Pausado",
    done: "¡Tiempo terminado!",
    close: "Cerrar",
    alarmRinging: "Alarma sonando",
    sounds: "Sonidos",
    hours: "Horas",
    minutes: "Minutos",
    seconds: "Segundos",
    lap: "Vuelta",
    stopwatch: "Cronómetro",
    timer: "Temporizador",
    pomodoro: "Pomodoro",
    work: "Trabajo",
    break: "Descanso",
    cycle: "Ciclo",
    previewSound: "Escuchar",
    applyPomodoro: "Aplicar",
    resetPomodoro: "Restablecer",
    resetCycle: "Reiniciar ciclo",
    soundOn: "Sonido activo",
    vibrationOn: "Vibración activa",
    subtitle: "Temporizador simple"
  },

  ru: {
    start: "Старт",
    pause: "Пауза",
    reset: "Сброс",
    ready: "Готово",
    running: "Работает",
    paused: "Пауза",
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
    work: "Работа",
    break: "Перерыв",
    cycle: "Цикл",
    previewSound: "Прослушать",
    applyPomodoro: "Применить",
    resetPomodoro: "Сбросить",
    resetCycle: "Сбросить цикл",
    soundOn: "Звук",
    vibrationOn: "Вибрация",
    subtitle: "Простой таймер"
  },

  ar: {
    start: "ابدأ",
    pause: "إيقاف",
    reset: "إعادة",
    ready: "جاهز",
    running: "يعمل",
    paused: "متوقف",
    done: "انتهى الوقت!",
    close: "إغلاق",
    alarmRinging: "المنبه يعمل",
    sounds: "أصوات",
    hours: "ساعات",
    minutes: "دقائق",
    seconds: "ثواني",
    lap: "دورة",
    stopwatch: "ساعة",
    timer: "مؤقت",
    pomodoro: "بومودورو",
    work: "عمل",
    break: "راحة",
    cycle: "دورة",
    previewSound: "استماع",
    applyPomodoro: "تطبيق",
    resetPomodoro: "إعادة",
    resetCycle: "إعادة الدورة",
    soundOn: "الصوت",
    vibrationOn: "اهتزاز",
    subtitle: "مؤقت بسيط"
  }
};

// ===============================
// TRANSLATE FUNCTION
// ===============================
function t(key) {
  const lang = appState.language || "en";
  return I18N[lang]?.[key] || I18N.en[key] || key;
}

// ===============================
// APPLY LANGUAGE
// ===============================
function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

// ===============================
// LANGUAGE SELECT
// ===============================
$("language")?.addEventListener("change", (e) => {
  appState.language = e.target.value;
  localStorage.setItem("lang", appState.language);
  applyLanguage();
});
    
    document.getElementById("langSelect")?.addEventListener("change",(e)=>{
      setLanguage(e.target.value);
    });

    updateUI();
    updateDisplay();
    updateStopwatch();

  }catch(e){
    console.log("INIT ERROR:",e);
  }
});

// ===============================
// GLOBAL ERROR GUARD
// ===============================
window.addEventListener("error",(e)=>{
  console.log("ERROR:",e.message);
});

window.addEventListener("unhandledrejection",(e)=>{
  console.log("PROMISE ERROR:",e.reason);
// ===============================
// PART 3 / 5
// SOUND LIBRARY + SOUND UI + AUDIO HELPERS
// ===============================

// 20 SOUND
const SOUND_LIBRARY = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1;
  return {
    id: `sound_${n}`,
    rawName: `sound${n}`,
    assetPath: getExistingSoundExtension(`sound${n}`),
    names: {
      tr: `Ses ${n}`,
      en: `Sound ${n}`,
      de: `Ton ${n}`,
      fr: `Son ${n}`,
      es: `Sonido ${n}`,
      ru: `Звук ${n}`,
      ar: `صوت ${n}`,
      it: `Suono ${n}`,
      pt: `Som ${n}`,
      zh: `声音 ${n}`,
      hi: `ध्वनि ${n}`,
      ja: `サウンド ${n}`,
      ko: `사운드 ${n}`,
      nl: `Geluid ${n}`,
      pl: `Dźwięk ${n}`,
      uk: `Звук ${n}`,
      id: `Suara ${n}`,
      ms: `Bunyi ${n}`
    }
  };
});

let selectedSoundId = localStorage.getItem(STORAGE_KEYS.sound) || SOUND_LIBRARY[0].id;

function getSelectedSound() {
  return SOUND_LIBRARY.find(s => s.id === selectedSoundId) || SOUND_LIBRARY[0];
}

function getSelectedSoundRawName() {
  const selected = getSelectedSound();
  if (!selected) return "beep";
  return fileNameWithoutExt(selected.assetPath) || selected.rawName || "beep";
}

function getSoundDisplayName(sound) {
  const lang = appState.language || "en";
  return sound?.names?.[lang] || sound?.names?.en || sound?.rawName || "Sound";
}

function saveSelectedSound() {
  localStorage.setItem(STORAGE_KEYS.sound, selectedSoundId);
}

function populateSoundSelect() {
  const select = $("soundSelect");
  if (!select) return;

  select.innerHTML = "";

  SOUND_LIBRARY.forEach(sound => {
    const option = document.createElement("option");
    option.value = sound.id;
    option.textContent = getSoundDisplayName(sound);
    if (sound.id === selectedSoundId) option.selected = true;
    select.appendChild(option);
  });
}

function renderSounds() {
  const list = $("soundsList");
  if (!list) {
    populateSoundSelect();
    return;
  }

  list.innerHTML = "";

  SOUND_LIBRARY.forEach(sound => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sound-item";
    if (sound.id === selectedSoundId) item.classList.add("active");

    const left = document.createElement("span");
    left.className = "sound-item-name";
    left.textContent = getSoundDisplayName(sound);

    const right = document.createElement("span");
    right.className = "sound-item-action";
    right.textContent = sound.id === selectedSoundId ? "✓" : "▶";

    item.appendChild(left);
    item.appendChild(right);

    item.addEventListener("click", async () => {
      selectedSoundId = sound.id;
      saveSelectedSound();
      populateSoundSelect();
      renderSounds();
      try {
        await previewSound(sound);
      } catch {}
    });

    list.appendChild(item);
  });

  populateSoundSelect();
}

async function unlockAudioOnce() {
  if (alarmState.htmlAudioUnlocked) return true;

  try {
    const a = new Audio();
    a.src = getSelectedSound().assetPath;
    a.muted = true;
    a.playsInline = true;
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
      alarmState.previewAudio.src = "";
      alarmState.previewAudio = null;
    }
  } catch {}
}

async function previewSound(sound) {
  if ($("soundToggle")?.checked === false) return;

  try {
    stopPreviewSound();
    await unlockAudioOnce();

    const audio = new Audio(sound.assetPath);
    audio.currentTime = 0;
    audio.loop = false;
    audio.volume = 1;
    audio.preload = "auto";
    audio.playsInline = true;

    alarmState.previewAudio = audio;
    await audio.play();
  } catch (e) {
    console.warn("Preview sound failed:", e);
  }
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
      alarmState.htmlAudio.src = "";
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
    alarmState.htmlAudio.preload = "auto";
    alarmState.htmlAudio.playsInline = true;

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
  } catch (e) {
    console.warn("Persistent alarm failed:", e);
  }
}

function vibrateNow(ms = 300) {
  try {
    if ($("vibrationToggle")?.checked === false) return;
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

function updateSoundCount() {
  const el = $("soundCountLabel");
  if (!el) return;
  el.textContent = `${SOUND_LIBRARY.length} ${t("sounds")}`;
}

function bindSoundEvents() {
  $("soundSelect")?.addEventListener("change", (e) => {
    selectedSoundId = e.target.value;
    saveSelectedSound();
    renderSounds();
  });

  $("previewSoundBtn")?.addEventListener("click", async () => {
    const sound = getSelectedSound();
    if (!sound) return;
    await previewSound(sound);
  });

  $("soundToggle")?.addEventListener("change", () => {
    if ($("soundToggle")?.checked === false) {
      stopPreviewSound();
      stopPersistentAlarm();
    }
  });
}

function initSoundUI() {
  populateSoundSelect();
  renderSounds();
  updateSoundCount();
  bindSoundEvents();
}});
// ===============================
// PART 3 / 5
// SOUND LIBRARY + SOUND UI + AUDIO HELPERS
// ===============================

// 20 SOUND
const SOUND_LIBRARY = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1;
  return {
    id: `sound_${n}`,
    rawName: `sound${n}`,
    assetPath: getExistingSoundExtension(`sound${n}`),
    names: {
      tr: `Ses ${n}`,
      en: `Sound ${n}`,
      de: `Ton ${n}`,
      fr: `Son ${n}`,
      es: `Sonido ${n}`,
      ru: `Звук ${n}`,
      ar: `صوت ${n}`,
      it: `Suono ${n}`,
      pt: `Som ${n}`,
      zh: `声音 ${n}`,
      hi: `ध्वनि ${n}`,
      ja: `サウンド ${n}`,
      ko: `사운드 ${n}`,
      nl: `Geluid ${n}`,
      pl: `Dźwięk ${n}`,
      uk: `Звук ${n}`,
      id: `Suara ${n}`,
      ms: `Bunyi ${n}`
    }
  };
});

let selectedSoundId = localStorage.getItem(STORAGE_KEYS.sound) || SOUND_LIBRARY[0].id;

function getSelectedSound() {
  return SOUND_LIBRARY.find(s => s.id === selectedSoundId) || SOUND_LIBRARY[0];
}

function getSelectedSoundRawName() {
  const selected = getSelectedSound();
  if (!selected) return "beep";
  return fileNameWithoutExt(selected.assetPath) || selected.rawName || "beep";
}

function getSoundDisplayName(sound) {
  const lang = appState.language || "en";
  return sound?.names?.[lang] || sound?.names?.en || sound?.rawName || "Sound";
}

function saveSelectedSound() {
  localStorage.setItem(STORAGE_KEYS.sound, selectedSoundId);
}

function populateSoundSelect() {
  const select = $("soundSelect");
  if (!select) return;

  select.innerHTML = "";

  SOUND_LIBRARY.forEach(sound => {
    const option = document.createElement("option");
    option.value = sound.id;
    option.textContent = getSoundDisplayName(sound);
    if (sound.id === selectedSoundId) option.selected = true;
    select.appendChild(option);
  });
}

function renderSounds() {
  const list = $("soundsList");
  if (!list) {
    populateSoundSelect();
    return;
  }

  list.innerHTML = "";

  SOUND_LIBRARY.forEach(sound => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sound-item";
    if (sound.id === selectedSoundId) item.classList.add("active");

    const left = document.createElement("span");
    left.className = "sound-item-name";
    left.textContent = getSoundDisplayName(sound);

    const right = document.createElement("span");
    right.className = "sound-item-action";
    right.textContent = sound.id === selectedSoundId ? "✓" : "▶";

    item.appendChild(left);
    item.appendChild(right);

    item.addEventListener("click", async () => {
      selectedSoundId = sound.id;
      saveSelectedSound();
      populateSoundSelect();
      renderSounds();
      try {
        await previewSound(sound);
      } catch {}
    });

    list.appendChild(item);
  });

  populateSoundSelect();
}

async function unlockAudioOnce() {
  if (alarmState.htmlAudioUnlocked) return true;

  try {
    const a = new Audio();
    a.src = getSelectedSound().assetPath;
    a.muted = true;
    a.playsInline = true;
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
      alarmState.previewAudio.src = "";
      alarmState.previewAudio = null;
    }
  } catch {}
}

async function previewSound(sound) {
  if ($("soundToggle")?.checked === false) return;

  try {
    stopPreviewSound();
    await unlockAudioOnce();

    const audio = new Audio(sound.assetPath);
    audio.currentTime = 0;
    audio.loop = false;
    audio.volume = 1;
    audio.preload = "auto";
    audio.playsInline = true;

    alarmState.previewAudio = audio;
    await audio.play();
  } catch (e) {
    console.warn("Preview sound failed:", e);
  }
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
      alarmState.htmlAudio.src = "";
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
    alarmState.htmlAudio.preload = "auto";
    alarmState.htmlAudio.playsInline = true;

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
  } catch (e) {
    console.warn("Persistent alarm failed:", e);
  }
}

function vibrateNow(ms = 300) {
  try {
    if ($("vibrationToggle")?.checked === false) return;
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

function updateSoundCount() {
  const el = $("soundCountLabel");
  if (!el) return;
  el.textContent = `${SOUND_LIBRARY.length} ${t("sounds")}`;
}

function bindSoundEvents() {
  $("soundSelect")?.addEventListener("change", (e) => {
    selectedSoundId = e.target.value;
    saveSelectedSound();
    renderSounds();
  });

  $("previewSoundBtn")?.addEventListener("click", async () => {
    const sound = getSelectedSound();
    if (!sound) return;
    await previewSound(sound);
  });

  $("soundToggle")?.addEventListener("change", () => {
    if ($("soundToggle")?.checked === false) {
      stopPreviewSound();
      stopPersistentAlarm();
    }
  });
}

function initSoundUI() {
  populateSoundSelect();
  renderSounds();
  updateSoundCount();
  bindSoundEvents();
}
// ===============================
// PART 4 / 5
// TIMER ENGINE + BACKGROUND + ALARM CORE
// ===============================

// ===============================
// FOREGROUND / BACKGROUND
// ===============================
function isAppForeground() {
  return document.visibilityState === "visible";
}

function isTimerExpired() {
  return timerState.endAt > 0 && nowMs() >= timerState.endAt;
}

// ===============================
// VISIBILITY LISTENER
// ===============================
function setupVisibilityListeners() {
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      handleAppForeground();
    } else {
      handleAppBackground();
    }
  });
}

function handleAppForeground() {
  if (timerState.running && isTimerExpired()) {
    finalizeTimer();
  }

  if (alarmState.isActive) {
    showAlarmOverlay();
    startPersistentAlarm();
  }
}

function handleAppBackground() {
  // burada native alarm istersen sonra ekleriz
}

// ===============================
// TIMER DISPLAY
// ===============================
function updateTimerDisplay() {
  const el = $("timerDisplay");
  if (!el) return;
  el.textContent = formatTime(timerState.timeLeft);
}

// ===============================
// TIMER LOOP
// ===============================
function timerTick() {
  if (!timerState.running) return;

  const remaining = Math.ceil((timerState.endAt - nowMs()) / 1000);
  timerState.timeLeft = Math.max(0, remaining);

  if (timerState.timeLeft <= 0) {
    finalizeTimer();
    return;
  }

  updateTimerDisplay();
}

// ===============================
// START TIMER
// ===============================
function startTimer(fromPomodoro = false) {
  if (timerState.running) return;

  const h = safeNumber($("hours")?.value);
  const m = safeNumber($("minutes")?.value);
  const s = safeNumber($("seconds")?.value);

  const total = h * 3600 + m * 60 + s;
  if (total <= 0) return;

  clearInterval(timerState.timerId);

  timerState.totalTime = total;
  timerState.timeLeft = total;
  timerState.running = true;
  timerState.paused = false;
  timerState.endAt = nowMs() + total * 1000;

  timerState.timerId = setInterval(timerTick, 250);

  setText("timerStatus", "running");
  updateTimerDisplay();
}

// ===============================
// PAUSE
// ===============================
function pauseTimer() {
  if (!timerState.running) return;

  timerState.timeLeft = Math.ceil((timerState.endAt - nowMs()) / 1000);

  clearInterval(timerState.timerId);

  timerState.running = false;
  timerState.paused = true;
  timerState.endAt = 0;

  setText("timerStatus", "paused");
}

// ===============================
// RESUME
// ===============================
function resumeTimer() {
  if (!timerState.paused) return;

  timerState.running = true;
  timerState.paused = false;
  timerState.endAt = nowMs() + timerState.timeLeft * 1000;

  clearInterval(timerState.timerId);
  timerState.timerId = setInterval(timerTick, 250);

  setText("timerStatus", "running");
}

// ===============================
// RESET
// ===============================
function resetTimer() {
  clearInterval(timerState.timerId);

  timerState.running = false;
  timerState.paused = false;
  timerState.timeLeft = 0;
  timerState.totalTime = 0;
  timerState.endAt = 0;

  stopPersistentAlarm();
  hideAlarmOverlay();

  updateTimerDisplay();
  setText("timerStatus", "ready");
}

// ===============================
// FINISH
// ===============================
function finalizeTimer() {
  clearInterval(timerState.timerId);

  timerState.running = false;
  timerState.paused = false;
  timerState.timeLeft = 0;
  timerState.endAt = 0;

  updateTimerDisplay();
  setText("timerStatus", "done");

  triggerAlarm();
}

// ===============================
// ALARM
// ===============================
function triggerAlarm() {
  alarmState.isActive = true;

  showAlarmOverlay();
  startPersistentAlarm();
  vibrateNow(500);
}

// ===============================
// ALARM UI
// ===============================
function showAlarmOverlay() {
  const overlay = $("alarmOverlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideAlarmOverlay() {
  const overlay = $("alarmOverlay");
  if (overlay) overlay.classList.add("hidden");
}

// ===============================
// DISMISS ALARM
// ===============================
function dismissAlarm() {
  stopPersistentAlarm();
  hideAlarmOverlay();
  alarmState.isActive = false;
}

// ===============================
// EVENTS
// ===============================
$("timerStartBtn")?.addEventListener("click", () => {
  if (timerState.running) return;
  if (timerState.paused) resumeTimer();
  else startTimer();
});

$("timerPauseBtn")?.addEventListener("click", pauseTimer);
$("timerResetBtn")?.addEventListener("click", resetTimer);
$("dismissAlarmBtn")?.addEventListener("click", dismissAlarm);

// ===============================
// INIT
// ===============================
setupVisibilityListeners();
updateTimerDisplay();
