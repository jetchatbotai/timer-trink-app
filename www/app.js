// ===============================
// TIMER TRINK PRO - CLEAN FINAL
// PART 1 / 5
// CORE + HELPERS + STATE + I18N
// ===============================

(() => {
  "use strict";

  // ===============================
  // DOM HELPERS
  // ===============================
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => document.querySelectorAll(selector);

  // ===============================
  // STORAGE KEYS
  // ===============================
  const STORAGE_KEYS = {
    language: "tt_language",
    selectedSound: "tt_selected_sound",
    soundEnabled: "tt_sound_enabled",
    vibrationEnabled: "tt_vibration_enabled",
    timer: "tt_timer_state",
    stopwatch: "tt_stopwatch_state",
    pomodoro: "tt_pomodoro_state"
  };

  // ===============================
  // BASIC HELPERS
  // ===============================
  function nowMs() {
    return Date.now();
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function safeParse(json, fallback = null) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatTime(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  function getRemainingSeconds(endAt) {
    if (!endAt || endAt <= 0) return 0;
    return Math.max(0, Math.ceil((endAt - nowMs()) / 1000));
  }

  function fileNameWithoutExt(name) {
    return String(name || "").replace(/\.(mp3|wav)$/i, "");
  }

  function getExistingSoundExtension(baseName) {
    const all = Array.isArray(window.__availableSoundFiles)
      ? window.__availableSoundFiles
      : [];
    const wav = `${baseName}.wav`;
    const mp3 = `${baseName}.mp3`;

    if (all.includes(wav)) return wav;
    if (all.includes(mp3)) return mp3;

    return mp3;
  }

  function getInitialLanguage() {
    const supported = [
      "tr", "en", "de", "fr", "es", "ru", "ar", "it", "pt",
      "zh", "hi", "ja", "ko", "nl", "pl", "uk", "id", "ms"
    ];

    const saved = localStorage.getItem(STORAGE_KEYS.language);
    if (saved && supported.includes(saved)) return saved;

    const raw = (navigator.language || "en").toLowerCase();
    const short = raw.slice(0, 2);

    return supported.includes(short) ? short : "en";
  }

  // ===============================
  // GLOBAL STATE
  // ===============================
  const appState = {
    initialized: false,
    language: getInitialLanguage(),
    activeTab: "timer"
  };

  const timerState = {
    running: false,
    paused: false,
    totalTime: 0,
    timeLeft: 0,
    endAt: 0,
    intervalId: null,
    mode: "timer" // timer | pomodoro
  };

  const stopwatchState = {
    running: false,
    elapsed: 0,
    startAt: 0,
    intervalId: null,
    laps: []
  };

  const pomodoroState = {
    enabled: false,
    phase: "work", // work | break
    work: 25,
    break: 5,
    cycle: 0,
    auto: true
  };

  const soundState = {
    enabled: localStorage.getItem(STORAGE_KEYS.soundEnabled) !== "false",
    vibrationEnabled: localStorage.getItem(STORAGE_KEYS.vibrationEnabled) !== "false",
    selectedSoundId: localStorage.getItem(STORAGE_KEYS.selectedSound) || "sound_1",
    previewAudio: null,
    alarmAudio: null,
    alarmLoopGuardId: null,
    audioUnlocked: false,
    alarmActive: false
  };

  // ===============================
  // I18N - 18 LANGUAGES
  // ===============================
  const I18N = {
    tr: {
      start: "Başlat",
      pause: "Duraklat",
      resume: "Devam",
      reset: "Sıfırla",
      ready: "Hazır",
      running: "Çalışıyor",
      paused: "Duraklatıldı",
      done: "Süre doldu!",
      timer: "Zamanlayıcı",
      stopwatch: "Kronometre",
      pomodoro: "Pomodoro",
      sounds: "Sesler",
      settings: "Ayarlar",
      work: "Çalışma",
      break: "Mola",
      cycle: "Döngü",
      hours: "Saat",
      minutes: "Dakika",
      seconds: "Saniye",
      apply: "Uygula",
      close: "Kapat",
      preview: "Sesi dinle",
      subtitle: "Basit odak zamanlayıcısı",
      soundOn: "Ses açık",
      vibrationOn: "Titreşim açık",
      alarmRinging: "Alarm çalıyor",
      clearLaps: "Turları temizle",
      lap: "Tur",
      laps: "Turlar",
      phase: "Faz",
      customWork: "Çalışma süresi",
      customBreak: "Mola süresi",
      pomodoroStart: "Pomodoro başlat",
      pomodoroStop: "Pomodoro durdur",
      timerStatus: "Durum",
      selectedSound: "Seçili ses"
    },

    en: {
      start: "Start",
      pause: "Pause",
      resume: "Resume",
      reset: "Reset",
      ready: "Ready",
      running: "Running",
      paused: "Paused",
      done: "Time is up!",
      timer: "Timer",
      stopwatch: "Stopwatch",
      pomodoro: "Pomodoro",
      sounds: "Sounds",
      settings: "Settings",
      work: "Work",
      break: "Break",
      cycle: "Cycle",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds",
      apply: "Apply",
      close: "Close",
      preview: "Preview",
      subtitle: "Simple focus timer",
      soundOn: "Sound on",
      vibrationOn: "Vibration on",
      alarmRinging: "Alarm ringing",
      clearLaps: "Clear laps",
      lap: "Lap",
      laps: "Laps",
      phase: "Phase",
      customWork: "Work duration",
      customBreak: "Break duration",
      pomodoroStart: "Start pomodoro",
      pomodoroStop: "Stop pomodoro",
      timerStatus: "Status",
      selectedSound: "Selected sound"
    },

    de: {
      start: "Start",
      pause: "Pause",
      resume: "Fortsetzen",
      reset: "Zurücksetzen",
      ready: "Bereit",
      running: "Läuft",
      paused: "Pausiert",
      done: "Zeit ist um!",
      timer: "Timer",
      stopwatch: "Stoppuhr",
      pomodoro: "Pomodoro",
      sounds: "Töne",
      settings: "Einstellungen",
      work: "Arbeit",
      break: "Pause",
      cycle: "Zyklus",
      hours: "Stunden",
      minutes: "Minuten",
      seconds: "Sekunden",
      apply: "Anwenden",
      close: "Schließen",
      preview: "Anhören",
      subtitle: "Einfacher Fokus-Timer",
      soundOn: "Ton an",
      vibrationOn: "Vibration an",
      alarmRinging: "Alarm klingelt",
      clearLaps: "Runden löschen",
      lap: "Runde",
      laps: "Runden",
      phase: "Phase",
      customWork: "Arbeitszeit",
      customBreak: "Pausenzeit",
      pomodoroStart: "Pomodoro starten",
      pomodoroStop: "Pomodoro stoppen",
      timerStatus: "Status",
      selectedSound: "Gewählter Ton"
    },

    fr: {
      start: "Démarrer",
      pause: "Pause",
      resume: "Reprendre",
      reset: "Réinitialiser",
      ready: "Prêt",
      running: "En cours",
      paused: "En pause",
      done: "Temps écoulé !",
      timer: "Minuteur",
      stopwatch: "Chronomètre",
      pomodoro: "Pomodoro",
      sounds: "Sons",
      settings: "Paramètres",
      work: "Travail",
      break: "Pause",
      cycle: "Cycle",
      hours: "Heures",
      minutes: "Minutes",
      seconds: "Secondes",
      apply: "Appliquer",
      close: "Fermer",
      preview: "Écouter",
      subtitle: "Minuteur simple de concentration",
      soundOn: "Son activé",
      vibrationOn: "Vibration activée",
      alarmRinging: "Alarme active",
      clearLaps: "Effacer les tours",
      lap: "Tour",
      laps: "Tours",
      phase: "Phase",
      customWork: "Durée travail",
      customBreak: "Durée pause",
      pomodoroStart: "Démarrer pomodoro",
      pomodoroStop: "Arrêter pomodoro",
      timerStatus: "Statut",
      selectedSound: "Son sélectionné"
    },

    es: {
      start: "Iniciar",
      pause: "Pausar",
      resume: "Continuar",
      reset: "Restablecer",
      ready: "Listo",
      running: "En marcha",
      paused: "Pausado",
      done: "¡Tiempo terminado!",
      timer: "Temporizador",
      stopwatch: "Cronómetro",
      pomodoro: "Pomodoro",
      sounds: "Sonidos",
      settings: "Configuración",
      work: "Trabajo",
      break: "Descanso",
      cycle: "Ciclo",
      hours: "Horas",
      minutes: "Minutos",
      seconds: "Segundos",
      apply: "Aplicar",
      close: "Cerrar",
      preview: "Escuchar",
      subtitle: "Temporizador simple de enfoque",
      soundOn: "Sonido activo",
      vibrationOn: "Vibración activa",
      alarmRinging: "Alarma sonando",
      clearLaps: "Borrar vueltas",
      lap: "Vuelta",
      laps: "Vueltas",
      phase: "Fase",
      customWork: "Duración trabajo",
      customBreak: "Duración descanso",
      pomodoroStart: "Iniciar pomodoro",
      pomodoroStop: "Detener pomodoro",
      timerStatus: "Estado",
      selectedSound: "Sonido seleccionado"
    },

    ru: {
      start: "Старт",
      pause: "Пауза",
      resume: "Продолжить",
      reset: "Сброс",
      ready: "Готово",
      running: "Работает",
      paused: "Пауза",
      done: "Время вышло!",
      timer: "Таймер",
      stopwatch: "Секундомер",
      pomodoro: "Помодоро",
      sounds: "Звуки",
      settings: "Настройки",
      work: "Работа",
      break: "Перерыв",
      cycle: "Цикл",
      hours: "Часы",
      minutes: "Минуты",
      seconds: "Секунды",
      apply: "Применить",
      close: "Закрыть",
      preview: "Прослушать",
      subtitle: "Простой таймер для фокуса",
      soundOn: "Звук",
      vibrationOn: "Вибрация",
      alarmRinging: "Будильник звонит",
      clearLaps: "Очистить круги",
      lap: "Круг",
      laps: "Круги",
      phase: "Фаза",
      customWork: "Длительность работы",
      customBreak: "Длительность перерыва",
      pomodoroStart: "Запустить помодоро",
      pomodoroStop: "Остановить помодоро",
      timerStatus: "Статус",
      selectedSound: "Выбранный звук"
    },

    ar: {
      start: "ابدأ",
      pause: "إيقاف",
      resume: "متابعة",
      reset: "إعادة",
      ready: "جاهز",
      running: "يعمل",
      paused: "متوقف",
      done: "انتهى الوقت!",
      timer: "المؤقت",
      stopwatch: "الساعة",
      pomodoro: "بومودورو",
      sounds: "أصوات",
      settings: "الإعدادات",
      work: "عمل",
      break: "راحة",
      cycle: "دورة",
      hours: "ساعات",
      minutes: "دقائق",
      seconds: "ثواني",
      apply: "تطبيق",
      close: "إغلاق",
      preview: "استماع",
      subtitle: "مؤقت تركيز بسيط",
      soundOn: "الصوت",
      vibrationOn: "الاهتزاز",
      alarmRinging: "المنبه يعمل",
      clearLaps: "مسح اللفات",
      lap: "لفة",
      laps: "لفات",
      phase: "المرحلة",
      customWork: "مدة العمل",
      customBreak: "مدة الراحة",
      pomodoroStart: "ابدأ بومودورو",
      pomodoroStop: "إيقاف بومودورو",
      timerStatus: "الحالة",
      selectedSound: "الصوت المحدد"
    },

    it: {
      start: "Avvia",
      pause: "Pausa",
      resume: "Riprendi",
      reset: "Reimposta",
      ready: "Pronto",
      running: "In esecuzione",
      paused: "In pausa",
      done: "Tempo scaduto!",
      timer: "Timer",
      stopwatch: "Cronometro",
      pomodoro: "Pomodoro",
      sounds: "Suoni",
      settings: "Impostazioni",
      work: "Lavoro",
      break: "Pausa",
      cycle: "Ciclo",
      hours: "Ore",
      minutes: "Minuti",
      seconds: "Secondi",
      apply: "Applica",
      close: "Chiudi",
      preview: "Ascolta",
      subtitle: "Semplice timer focus",
      soundOn: "Suono attivo",
      vibrationOn: "Vibrazione attiva",
      alarmRinging: "Allarme attivo",
      clearLaps: "Cancella giri",
      lap: "Giro",
      laps: "Giri",
      phase: "Fase",
      customWork: "Durata lavoro",
      customBreak: "Durata pausa",
      pomodoroStart: "Avvia pomodoro",
      pomodoroStop: "Ferma pomodoro",
      timerStatus: "Stato",
      selectedSound: "Suono selezionato"
    },

    pt: {
      start: "Iniciar",
      pause: "Pausar",
      resume: "Retomar",
      reset: "Redefinir",
      ready: "Pronto",
      running: "Em andamento",
      paused: "Pausado",
      done: "Tempo esgotado!",
      timer: "Temporizador",
      stopwatch: "Cronômetro",
      pomodoro: "Pomodoro",
      sounds: "Sons",
      settings: "Configurações",
      work: "Trabalho",
      break: "Pausa",
      cycle: "Ciclo",
      hours: "Horas",
      minutes: "Minutos",
      seconds: "Segundos",
      apply: "Aplicar",
      close: "Fechar",
      preview: "Ouvir",
      subtitle: "Temporizador simples de foco",
      soundOn: "Som ativo",
      vibrationOn: "Vibração ativa",
      alarmRinging: "Alarme tocando",
      clearLaps: "Limpar voltas",
      lap: "Volta",
      laps: "Voltas",
      phase: "Fase",
      customWork: "Duração trabalho",
      customBreak: "Duração pausa",
      pomodoroStart: "Iniciar pomodoro",
      pomodoroStop: "Parar pomodoro",
      timerStatus: "Estado",
      selectedSound: "Som selecionado"
    },

    zh: {
      start: "开始",
      pause: "暂停",
      resume: "继续",
      reset: "重置",
      ready: "就绪",
      running: "运行中",
      paused: "已暂停",
      done: "时间到了！",
      timer: "计时器",
      stopwatch: "秒表",
      pomodoro: "番茄钟",
      sounds: "声音",
      settings: "设置",
      work: "工作",
      break: "休息",
      cycle: "周期",
      hours: "小时",
      minutes: "分钟",
      seconds: "秒",
      apply: "应用",
      close: "关闭",
      preview: "试听",
      subtitle: "简单专注计时器",
      soundOn: "声音开启",
      vibrationOn: "振动开启",
      alarmRinging: "闹铃响起",
      clearLaps: "清除圈数",
      lap: "圈",
      laps: "圈数",
      phase: "阶段",
      customWork: "工作时长",
      customBreak: "休息时长",
      pomodoroStart: "开始番茄钟",
      pomodoroStop: "停止番茄钟",
      timerStatus: "状态",
      selectedSound: "已选声音"
    },

    hi: {
      start: "शुरू",
      pause: "रोकें",
      resume: "जारी रखें",
      reset: "रीसेट",
      ready: "तैयार",
      running: "चल रहा है",
      paused: "रुका हुआ",
      done: "समय समाप्त!",
      timer: "टाइमर",
      stopwatch: "स्टॉपवॉच",
      pomodoro: "पोमोडोरो",
      sounds: "ध्वनियाँ",
      settings: "सेटिंग्स",
      work: "काम",
      break: "ब्रेक",
      cycle: "चक्र",
      hours: "घंटे",
      minutes: "मिनट",
      seconds: "सेकंड",
      apply: "लागू करें",
      close: "बंद करें",
      preview: "सुनें",
      subtitle: "सरल फोकस टाइमर",
      soundOn: "ध्वनि चालू",
      vibrationOn: "वाइब्रेशन चालू",
      alarmRinging: "अलार्म बज रहा है",
      clearLaps: "लैप साफ करें",
      lap: "लैप",
      laps: "लैप्स",
      phase: "चरण",
      customWork: "कार्य अवधि",
      customBreak: "ब्रेक अवधि",
      pomodoroStart: "पोमोडोरो शुरू करें",
      pomodoroStop: "पोमोडोरो रोकें",
      timerStatus: "स्थिति",
      selectedSound: "चुनी गई ध्वनि"
    },

    ja: {
      start: "開始",
      pause: "一時停止",
      resume: "再開",
      reset: "リセット",
      ready: "準備完了",
      running: "実行中",
      paused: "一時停止中",
      done: "時間切れ！",
      timer: "タイマー",
      stopwatch: "ストップウォッチ",
      pomodoro: "ポモドーロ",
      sounds: "サウンド",
      settings: "設定",
      work: "作業",
      break: "休憩",
      cycle: "サイクル",
      hours: "時間",
      minutes: "分",
      seconds: "秒",
      apply: "適用",
      close: "閉じる",
      preview: "試聴",
      subtitle: "シンプルな集中タイマー",
      soundOn: "サウンドオン",
      vibrationOn: "バイブレーションオン",
      alarmRinging: "アラーム作動中",
      clearLaps: "ラップを消去",
      lap: "ラップ",
      laps: "ラップ",
      phase: "フェーズ",
      customWork: "作業時間",
      customBreak: "休憩時間",
      pomodoroStart: "ポモドーロ開始",
      pomodoroStop: "ポモドーロ停止",
      timerStatus: "状態",
      selectedSound: "選択した音"
    },

    ko: {
      start: "시작",
      pause: "일시정지",
      resume: "계속",
      reset: "재설정",
      ready: "준비됨",
      running: "실행 중",
      paused: "일시정지됨",
      done: "시간 종료!",
      timer: "타이머",
      stopwatch: "스톱워치",
      pomodoro: "포모도로",
      sounds: "소리",
      settings: "설정",
      work: "작업",
      break: "휴식",
      cycle: "사이클",
      hours: "시간",
      minutes: "분",
      seconds: "초",
      apply: "적용",
      close: "닫기",
      preview: "듣기",
      subtitle: "간단한 집중 타이머",
      soundOn: "소리 켜짐",
      vibrationOn: "진동 켜짐",
      alarmRinging: "알람 울림",
      clearLaps: "랩 지우기",
      lap: "랩",
      laps: "랩",
      phase: "단계",
      customWork: "작업 시간",
      customBreak: "휴식 시간",
      pomodoroStart: "포모도로 시작",
      pomodoroStop: "포모도로 중지",
      timerStatus: "상태",
      selectedSound: "선택한 소리"
    },

    nl: {
      start: "Start",
      pause: "Pauze",
      resume: "Doorgaan",
      reset: "Reset",
      ready: "Klaar",
      running: "Bezig",
      paused: "Gepauzeerd",
      done: "Tijd is om!",
      timer: "Timer",
      stopwatch: "Stopwatch",
      pomodoro: "Pomodoro",
      sounds: "Geluiden",
      settings: "Instellingen",
      work: "Werk",
      break: "Pauze",
      cycle: "Cyclus",
      hours: "Uren",
      minutes: "Minuten",
      seconds: "Seconden",
      apply: "Toepassen",
      close: "Sluiten",
      preview: "Beluisteren",
      subtitle: "Eenvoudige focustimer",
      soundOn: "Geluid aan",
      vibrationOn: "Trillen aan",
      alarmRinging: "Alarm gaat af",
      clearLaps: "Rondes wissen",
      lap: "Ronde",
      laps: "Rondes",
      phase: "Fase",
      customWork: "Werkduur",
      customBreak: "Pauzeduur",
      pomodoroStart: "Pomodoro starten",
      pomodoroStop: "Pomodoro stoppen",
      timerStatus: "Status",
      selectedSound: "Gekozen geluid"
    },

    pl: {
      start: "Start",
      pause: "Pauza",
      resume: "Wznów",
      reset: "Resetuj",
      ready: "Gotowe",
      running: "Działa",
      paused: "Wstrzymano",
      done: "Czas minął!",
      timer: "Timer",
      stopwatch: "Stoper",
      pomodoro: "Pomodoro",
      sounds: "Dźwięki",
      settings: "Ustawienia",
      work: "Praca",
      break: "Przerwa",
      cycle: "Cykl",
      hours: "Godziny",
      minutes: "Minuty",
      seconds: "Sekundy",
      apply: "Zastosuj",
      close: "Zamknij",
      preview: "Odsłuchaj",
      subtitle: "Prosty timer skupienia",
      soundOn: "Dźwięk włączony",
      vibrationOn: "Wibracja włączona",
      alarmRinging: "Alarm dzwoni",
      clearLaps: "Wyczyść okrążenia",
      lap: "Okrążenie",
      laps: "Okrążenia",
      phase: "Faza",
      customWork: "Czas pracy",
      customBreak: "Czas przerwy",
      pomodoroStart: "Uruchom pomodoro",
      pomodoroStop: "Zatrzymaj pomodoro",
      timerStatus: "Status",
      selectedSound: "Wybrany dźwięk"
    },

    uk: {
      start: "Почати",
      pause: "Пауза",
      resume: "Продовжити",
      reset: "Скинути",
      ready: "Готово",
      running: "Працює",
      paused: "На паузі",
      done: "Час вийшов!",
      timer: "Таймер",
      stopwatch: "Секундомір",
      pomodoro: "Помодоро",
      sounds: "Звуки",
      settings: "Налаштування",
      work: "Робота",
      break: "Перерва",
      cycle: "Цикл",
      hours: "Години",
      minutes: "Хвилини",
      seconds: "Секунди",
      apply: "Застосувати",
      close: "Закрити",
      preview: "Прослухати",
      subtitle: "Простий таймер фокусу",
      soundOn: "Звук увімкнено",
      vibrationOn: "Вібрацію увімкнено",
      alarmRinging: "Будильник дзвонить",
      clearLaps: "Очистити кола",
      lap: "Коло",
      laps: "Кола",
      phase: "Фаза",
      customWork: "Тривалість роботи",
      customBreak: "Тривалість перерви",
      pomodoroStart: "Запустити помодоро",
      pomodoroStop: "Зупинити помодоро",
      timerStatus: "Статус",
      selectedSound: "Обраний звук"
    },

    id: {
      start: "Mulai",
      pause: "Jeda",
      resume: "Lanjutkan",
      reset: "Reset",
      ready: "Siap",
      running: "Berjalan",
      paused: "Dijeda",
      done: "Waktu habis!",
      timer: "Timer",
      stopwatch: "Stopwatch",
      pomodoro: "Pomodoro",
      sounds: "Suara",
      settings: "Pengaturan",
      work: "Kerja",
      break: "Istirahat",
      cycle: "Siklus",
      hours: "Jam",
      minutes: "Menit",
      seconds: "Detik",
      apply: "Terapkan",
      close: "Tutup",
      preview: "Dengar",
      subtitle: "Timer fokus sederhana",
      soundOn: "Suara aktif",
      vibrationOn: "Getar aktif",
      alarmRinging: "Alarm berbunyi",
      clearLaps: "Hapus putaran",
      lap: "Putaran",
      laps: "Putaran",
      phase: "Fase",
      customWork: "Durasi kerja",
      customBreak: "Durasi istirahat",
      pomodoroStart: "Mulai pomodoro",
      pomodoroStop: "Hentikan pomodoro",
      timerStatus: "Status",
      selectedSound: "Suara terpilih"
    },

    ms: {
      start: "Mula",
      pause: "Jeda",
      resume: "Sambung",
      reset: "Tetapkan semula",
      ready: "Sedia",
      running: "Sedang berjalan",
      paused: "Dijeda",
      done: "Masa tamat!",
      timer: "Pemasa",
      stopwatch: "Jam randik",
      pomodoro: "Pomodoro",
      sounds: "Bunyi",
      settings: "Tetapan",
      work: "Kerja",
      break: "Rehat",
      cycle: "Kitaran",
      hours: "Jam",
      minutes: "Minit",
      seconds: "Saat",
      apply: "Guna",
      close: "Tutup",
      preview: "Dengar",
      subtitle: "Pemasa fokus ringkas",
      soundOn: "Bunyi aktif",
      vibrationOn: "Getaran aktif",
      alarmRinging: "Penggera berbunyi",
      clearLaps: "Kosongkan pusingan",
      lap: "Pusingan",
      laps: "Pusingan",
      phase: "Fasa",
      customWork: "Tempoh kerja",
      customBreak: "Tempoh rehat",
      pomodoroStart: "Mula pomodoro",
      pomodoroStop: "Henti pomodoro",
      timerStatus: "Status",
      selectedSound: "Bunyi dipilih"
    }
  };

  function t(key) {
    return I18N[appState.language]?.[key] || I18N.en[key] || key;
  }

  // expose later parts
  window.__TT_CORE__ = {
    $,
    $$,
    STORAGE_KEYS,
    appState,
    timerState,
    stopwatchState,
    pomodoroState,
    soundState,
    I18N,
    t,
    nowMs,
    safeNumber,
    safeParse,
    clamp,
    formatTime,
    getRemainingSeconds,
    fileNameWithoutExt,
    getExistingSoundExtension
  };
})();
// ===============================
// PART 2 / 5
// TIMER ENGINE + STOPWATCH + POMODORO + UI CORE
// ===============================

// ===============================
// TIMER
// ===============================
function startTimer(seconds = null) {
  if (state.running) return;

  if (seconds === null) {
    const h = Number(document.getElementById("hours")?.value || 0);
    const m = Number(document.getElementById("minutes")?.value || 0);
    const s = Number(document.getElementById("seconds")?.value || 0);
    seconds = h * 3600 + m * 60 + s;
  }

  if (seconds <= 0) return;

  state.running = true;
  state.paused = false;
  state.totalTime = seconds;
  state.timeLeft = seconds;
  state.endAt = Date.now() + seconds * 1000;

  clearInterval(state.interval);
  state.interval = setInterval(timerTick, 250);

  updateTimerDisplay();
  updateUI();
}

function timerTick() {
  if (!state.running) return;

  const left = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
  state.timeLeft = left;

  updateTimerDisplay();

  if (left <= 0) {
    clearInterval(state.interval);
    state.running = false;
    state.paused = false;

    triggerFinish();
  }
}

function pauseTimer() {
  if (!state.running) return;

  state.timeLeft = Math.ceil((state.endAt - Date.now()) / 1000);
  clearInterval(state.interval);

  state.running = false;
  state.paused = true;

  updateUI();
}

function resumeTimer() {
  if (!state.paused) return;

  state.running = true;
  state.paused = false;
  state.endAt = Date.now() + state.timeLeft * 1000;

  clearInterval(state.interval);
  state.interval = setInterval(timerTick, 250);

  updateUI();
}

function resetTimer() {
  clearInterval(state.interval);

  state.running = false;
  state.paused = false;
  state.timeLeft = 0;
  state.totalTime = 0;
  state.endAt = 0;

  updateTimerDisplay();
  updateUI();
}

// ===============================
// STOPWATCH
// ===============================
function startStopwatch() {
  if (state.stopwatch.running) return;

  state.stopwatch.running = true;
  state.stopwatch.startAt = Date.now() - state.stopwatch.elapsed * 1000;

  clearInterval(state.stopwatch.interval);
  state.stopwatch.interval = setInterval(() => {
    state.stopwatch.elapsed = Math.floor(
      (Date.now() - state.stopwatch.startAt) / 1000
    );
    updateStopwatchDisplay();
  }, 250);
}

function pauseStopwatch() {
  if (!state.stopwatch.running) return;

  clearInterval(state.stopwatch.interval);
  state.stopwatch.running = false;
}

function resetStopwatch() {
  clearInterval(state.stopwatch.interval);

  state.stopwatch.running = false;
  state.stopwatch.elapsed = 0;

  updateStopwatchDisplay();
}

// ===============================
// POMODORO
// ===============================
function startPomodoro() {
  state.mode = "pomodoro";
  state.pomodoro.enabled = true;
  state.pomodoro.phase = "work";
  state.pomodoro.cycle = 0;

  startTimer(state.pomodoro.work * 60);
  updateUI();
}

function switchPomodoro() {
  if (!state.pomodoro.enabled) return;

  if (state.pomodoro.phase === "work") {
    state.pomodoro.phase = "break";
    startTimer(state.pomodoro.break * 60);
  } else {
    state.pomodoro.phase = "work";
    state.pomodoro.cycle++;
    startTimer(state.pomodoro.work * 60);
  }

  updateUI();
}

// ===============================
// FINISH HANDLER
// ===============================
function triggerFinish() {
  alert(t("done"));

  if (state.mode === "pomodoro" && state.pomodoro.enabled) {
    switchPomodoro();
  }
}

// ===============================
// UI
// ===============================
function updateTimerDisplay() {
  const el = document.getElementById("display");
  if (el) el.textContent = format(state.timeLeft);
}

function updateStopwatchDisplay() {
  const el = document.getElementById("stopwatchDisplay");
  if (el) el.textContent = format(state.stopwatch.elapsed);
}

function updateUI() {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (startBtn) startBtn.textContent = t("start");
  if (pauseBtn) pauseBtn.textContent = t("pause");
  if (resetBtn) resetBtn.textContent = t("reset");

  const phase = document.getElementById("phase");
  if (phase && state.mode === "pomodoro") {
    phase.textContent = t(state.pomodoro.phase);
  }
}

// ===============================
// EVENTS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  try {
    document.getElementById("startBtn")?.addEventListener("click", () => {
      if (state.running) return;
      if (state.paused) resumeTimer();
      else startTimer();
    });

    document.getElementById("pauseBtn")?.addEventListener("click", pauseTimer);
    document.getElementById("resetBtn")?.addEventListener("click", resetTimer);

    document.getElementById("resumeBtn")?.addEventListener("click", resumeTimer);
    document.getElementById("pomodoroBtn")?.addEventListener("click", startPomodoro);

    document.getElementById("swStart")?.addEventListener("click", startStopwatch);
    document.getElementById("swPause")?.addEventListener("click", pauseStopwatch);
    document.getElementById("swReset")?.addEventListener("click", resetStopwatch);

    document.getElementById("langSelect")?.addEventListener("change", (e) => {
      state.language = e.target.value;
      updateUI();
    });

    updateUI();
    updateTimerDisplay();
    updateStopwatchDisplay();

  } catch (e) {
    console.log("INIT ERROR:", e);
  }
});
