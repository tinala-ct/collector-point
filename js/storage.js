/**
 * Classroom Lucky Wheel - Storage & State Persistence Manager
 */

const STORAGE_KEYS = {
  CLASSES: 'classroom_wheel_classes',
  CURRENT_CLASS_ID: 'classroom_wheel_current_class_id',
  SETTINGS: 'classroom_wheel_settings',
  THEME: 'classroom_wheel_theme'
};

const DEFAULT_SAMPLE_CLASSES = [
  {
    id: 'class_demo_1',
    name: 'ม.1/1 (ตัวอย่างห้องเรียน)',
    students: [
      { id: 's1', name: 'กิตติศักดิ์ เจริญสุข', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's2', name: 'จิราพร พงษ์ศิริ', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's3', name: 'ชนานันท์ วงศ์สมบูรณ์', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's4', name: 'ณัฐวุฒิ ศรีประเสริฐ', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's5', name: 'ธนากร สุวรรณรัตน์', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's6', name: 'พิมพ์มาดา เลิศปัญญา', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's7', name: 'ภัทรดนัย บุญมี', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's8', name: 'วิภาวี สิทธิโชค', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's9', name: 'ศุภกร แก้วประเสริฐ', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's10', name: 'อรัญญา ทวีทรัพย์', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true }
    ]
  },
  {
    id: 'class_demo_2',
    name: 'ม.1/2 (กลุ่มกิจกรรมพิเศษ)',
    students: [
      { id: 's201', name: 'ก้องภพ', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's202', name: 'แก้วตา', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's203', name: 'ชินวัตร', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's204', name: 'ต้นกล้า', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's205', name: 'ใบเฟิร์น', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's206', name: 'พลอยใส', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's207', name: 'มินนี่', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true },
      { id: 's208', name: 'สายฟ้า', score: 0, answeredCount: 0, correctCount: 0, wrongCount: 0, pickedCount: 0, enabled: true }
    ]
  }
];

const DEFAULT_SETTINGS = {
  totalQuestions: 10,
  pointsPerQuestion: 1,
  bonusPoints: 2,
  removeOnPick: false, // Keep in wheel by default to allow score accumulation across multiple rounds
  soundEnabled: true,
  spinDuration: 4.5, // seconds
  colorTheme: 'vibrant'
};

export const StorageManager = {
  getClasses() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading classes from localStorage', e);
    }
    // Set default sample classes if first time
    this.saveClasses(DEFAULT_SAMPLE_CLASSES);
    return DEFAULT_SAMPLE_CLASSES;
  },

  saveClasses(classes) {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.error('Error saving classes to localStorage', e);
    }
  },

  getCurrentClassId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS_ID) || 'class_demo_1';
  },

  setCurrentClassId(id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS_ID, id);
  },

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};
