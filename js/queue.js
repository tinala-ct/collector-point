/**
 * Classroom Lucky Wheel & Score Collector - Sequential Queue & Clay Figurine Engine
 * Renders cute 3D Clay Figures (matching reference image) and manages line-up queue
 */

export const CLAY_POSES = ['flex', 'stand', 'cheer', 'stretch', 'kneel', 'lean'];

export class QueueManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.queue = []; // Array of active student objects
    this.currentIndex = 0;
    this.onAnswerSubmit = options.onAnswerSubmit || null;
    this.isAnimating = false;
  }

  setStudents(students) {
    this.queue = students.filter(s => s.enabled !== false);
    this.render();
  }

  getCurrentStudent() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  rotateQueue() {
    if (this.queue.length > 1) {
      const front = this.queue.shift();
      this.queue.push(front);
    }
  }

  shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.render();
  }

  /**
   * Generates clean SVG markup for cute 3D White Clay Figurine in given pose
   */
  static getFigurineSVG(pose = 'stand', size = 140, id = '') {
    const poseIndex = typeof pose === 'number' ? Math.abs(pose) % CLAY_POSES.length : CLAY_POSES.indexOf(pose);
    const selectedPose = CLAY_POSES[poseIndex >= 0 ? poseIndex : 0];
    const gradId = `clayGrad_${selectedPose}_${id || Math.random().toString(36).substr(2, 4)}`;

    let bodyPaths = '';

    if (selectedPose === 'flex') {
      // Arms raised up flexing muscles (Pose 1 in photo)
      bodyPaths = `
        <!-- Head -->
        <circle cx="50" cy="22" r="14" fill="url(#${gradId}_head)" filter="url(#${gradId}_shadow)" />
        <!-- Torso -->
        <path d="M 40 36 Q 50 34 60 36 Q 62 60 58 74 L 42 74 Q 38 60 40 36 Z" fill="url(#${gradId}_body)" />
        <!-- Left Flex Arm -->
        <path d="M 40 40 Q 22 42 22 28 Q 22 18 28 18 Q 32 18 32 26 Q 32 34 42 46 Z" fill="url(#${gradId}_body)" />
        <!-- Right Flex Arm -->
        <path d="M 60 40 Q 78 42 78 28 Q 78 18 72 18 Q 68 18 68 26 Q 68 34 58 46 Z" fill="url(#${gradId}_body)" />
        <!-- Legs -->
        <path d="M 42 72 Q 41 88 43 96 Q 47 98 50 94 L 50 72 Z" fill="url(#${gradId}_body)" />
        <path d="M 58 72 Q 59 88 57 96 Q 53 98 50 94 L 50 72 Z" fill="url(#${gradId}_body)" />
      `;
    } else if (selectedPose === 'cheer') {
      // Arms spread wide in Y-shape (Pose 5 in photo)
      bodyPaths = `
        <!-- Head -->
        <circle cx="50" cy="22" r="14" fill="url(#${gradId}_head)" filter="url(#${gradId}_shadow)" />
        <!-- Torso -->
        <path d="M 41 36 Q 50 34 59 36 Q 61 60 57 74 L 43 74 Q 39 60 41 36 Z" fill="url(#${gradId}_body)" />
        <!-- Left Cheering Arm -->
        <path d="M 42 40 Q 24 28 12 20 Q 8 26 18 34 Q 30 42 42 48 Z" fill="url(#${gradId}_body)" />
        <!-- Right Cheering Arm -->
        <path d="M 58 40 Q 76 28 88 20 Q 92 26 82 34 Q 70 42 58 48 Z" fill="url(#${gradId}_body)" />
        <!-- Legs Wide -->
        <path d="M 43 72 Q 34 86 30 96 Q 36 98 42 90 L 50 74 Z" fill="url(#${gradId}_body)" />
        <path d="M 57 72 Q 66 86 70 96 Q 64 98 58 90 L 50 74 Z" fill="url(#${gradId}_body)" />
      `;
    } else if (selectedPose === 'stretch') {
      // Both arms cupping head (Pose 6 in photo)
      bodyPaths = `
        <!-- Head -->
        <circle cx="50" cy="24" r="14" fill="url(#${gradId}_head)" filter="url(#${gradId}_shadow)" />
        <!-- Torso -->
        <path d="M 41 38 Q 50 36 59 38 Q 61 60 57 74 L 43 74 Q 39 60 41 38 Z" fill="url(#${gradId}_body)" />
        <!-- Arms around head -->
        <path d="M 41 42 Q 26 30 28 16 Q 34 8 48 10 Q 52 14 44 18 Q 36 22 41 36 Z" fill="url(#${gradId}_body)" />
        <path d="M 59 42 Q 74 30 72 16 Q 66 8 52 10 Q 48 14 56 18 Q 64 22 59 36 Z" fill="url(#${gradId}_body)" />
        <!-- Legs -->
        <path d="M 43 72 L 43 96 Q 47 98 50 94 L 50 72 Z" fill="url(#${gradId}_body)" />
        <path d="M 57 72 L 57 96 Q 53 98 50 94 L 50 72 Z" fill="url(#${gradId}_body)" />
      `;
    } else if (selectedPose === 'kneel') {
      // Sitting / kneeling upright (Pose 7 in photo)
      bodyPaths = `
        <!-- Head -->
        <circle cx="50" cy="24" r="14" fill="url(#${gradId}_head)" filter="url(#${gradId}_shadow)" />
        <!-- Torso -->
        <path d="M 40 38 Q 50 36 60 38 Q 62 58 58 68 L 42 68 Q 38 58 40 38 Z" fill="url(#${gradId}_body)" />
        <!-- Arms resting at sides -->
        <path d="M 41 40 Q 30 52 32 64 Q 37 66 40 60 L 43 46 Z" fill="url(#${gradId}_body)" />
        <path d="M 59 40 Q 70 52 68 64 Q 63 66 60 60 L 57 46 Z" fill="url(#${gradId}_body)" />
        <!-- Kneeling Legs (folded) -->
        <path d="M 42 66 Q 38 78 40 90 Q 46 92 48 88 L 48 66 Z" fill="url(#${gradId}_body)" />
        <path d="M 58 66 Q 62 78 60 90 Q 54 92 52 88 L 52 66 Z" fill="url(#${gradId}_body)" />
      `;
    } else if (selectedPose === 'lean') {
      // Bending forward curiously (Pose 3 in photo)
      bodyPaths = `
        <!-- Head -->
        <circle cx="42" cy="28" r="14" fill="url(#${gradId}_head)" filter="url(#${gradId}_shadow)" />
        <!-- Torso bent forward -->
        <path d="M 38 40 Q 56 34 66 42 Q 62 66 52 74 L 40 72 Q 40 56 38 40 Z" fill="url(#${gradId}_body)" />
        <!-- Arms extending forward -->
        <path d="M 44 42 Q 30 46 20 48 Q 18 54 28 54 Q 38 54 50 48 Z" fill="url(#${gradId}_body)" />
        <!-- Legs -->
        <path d="M 42 72 Q 44 86 46 96 Q 50 98 52 94 L 50 72 Z" fill="url(#${gradId}_body)" />
        <path d="M 52 74 Q 56 86 58 96 Q 62 98 64 94 L 60 74 Z" fill="url(#${gradId}_body)" />
      `;
    } else {
      // Default Stand (Pose 2 in photo)
      bodyPaths = `
        <!-- Head -->
        <circle cx="50" cy="22" r="14" fill="url(#${gradId}_head)" filter="url(#${gradId}_shadow)" />
        <!-- Torso -->
        <path d="M 40 36 Q 50 34 60 36 Q 62 60 58 74 L 42 74 Q 38 60 40 36 Z" fill="url(#${gradId}_body)" />
        <!-- Left Arm -->
        <path d="M 40 38 Q 30 50 32 66 Q 37 68 40 62 L 43 44 Z" fill="url(#${gradId}_body)" />
        <!-- Right Arm -->
        <path d="M 60 38 Q 70 50 68 66 Q 63 68 60 62 L 57 44 Z" fill="url(#${gradId}_body)" />
        <!-- Left Leg -->
        <path d="M 42 72 L 42 96 Q 46 98 49 95 L 49 72 Z" fill="url(#${gradId}_body)" />
        <!-- Right Leg -->
        <path d="M 58 72 L 58 96 Q 54 98 51 95 L 51 72 Z" fill="url(#${gradId}_body)" />
      `;
    }

    return `
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Soft White Matte Clay Shading -->
          <radialGradient id="${gradId}_head" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="55%" stop-color="#f1f5f9" />
            <stop offset="85%" stop-color="#cbd5e1" />
            <stop offset="100%" stop-color="#94a3b8" />
          </radialGradient>
          
          <linearGradient id="${gradId}_body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#f8fafc" />
            <stop offset="75%" stop-color="#e2e8f0" />
            <stop offset="100%" stop-color="#94a3b8" />
          </linearGradient>

          <filter id="${gradId}_shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.12" />
          </filter>
        </defs>
        ${bodyPaths}
      </svg>
    `;
  }

  render() {
    if (!this.container) return;

    if (this.queue.length === 0) {
      this.container.innerHTML = `
        <div class="queue-empty-msg">
          <div style="font-size: 3rem;">👥</div>
          <h3>ไม่มีนักเรียนในแถว</h3>
          <p>กรุณาเพิ่มชื่อนักเรียนหรือเปิดใช้งานรายชื่อในแถบด้านขวา</p>
        </div>
      `;
      return;
    }

    const currentStudent = this.queue[0];
    const waitingQueue = this.queue.slice(1);
    const poseIndex = Math.abs(this.hashCode(currentStudent.name)) % CLAY_POSES.length;

    this.container.innerHTML = `
      <!-- Spotlight Stage (Front Student) -->
      <div class="spotlight-area">
        <div class="spotlight-podium">
          <div class="spotlight-character" id="spotlightChar">
            ${QueueManager.getFigurineSVG(poseIndex, 170, currentStudent.id)}
          </div>
          <div class="podium-base"></div>
        </div>

        <div class="spotlight-info">
          <div class="spotlight-order-tag">
            <span>🎯 ถึงคิวตอบคนที่ 1</span>
          </div>
          <div class="spotlight-name" id="spotlightName">${this.escapeHTML(currentStudent.name)}</div>
          <div class="spotlight-score-pill">
            ⭐ คะแนนสะสม: <strong style="color:var(--secondary); font-size:1.1rem;">${currentStudent.score}</strong> คะแนน
            <span style="font-size:0.8rem; font-weight:400; color:var(--text-muted);">(ถูก ${currentStudent.correctCount || 0}/${currentStudent.answeredCount || 0})</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons for Answering -->
      <div class="queue-actions">
        <button id="qCorrectBtn" class="queue-btn queue-btn-correct" title="ตอบถูก (กดเลข 1 หรือ Space)">
          <span>✅ ตอบถูก (+1)</span>
        </button>
        <button id="qWrongBtn" class="queue-btn queue-btn-wrong" title="ตอบผิด (กดเลข 2)">
          <span>❌ ตอบผิด (0)</span>
        </button>
        <button id="qBonusBtn" class="queue-btn queue-btn-bonus" title="ตอบถูกพิเศษ (+โบนัส)">
          <span>⭐ โบนัส</span>
        </button>
        <button id="qSkipBtn" class="queue-btn queue-btn-skip" title="ข้ามไปท้ายแถว">
          <span>⏭️ ข้าม</span>
        </button>
      </div>

      <!-- Waiting Queue Line Track -->
      <div class="queue-track-section">
        <div class="queue-track-header">
          <span>🚶 นักเรียนที่กำลังรอคิว (${waitingQueue.length} คน):</span>
          <span style="font-size:0.75rem; color:var(--text-light);">ตอบเสร็จจะวนไปต่อท้ายแถว</span>
        </div>
        
        <div class="queue-line-wrapper">
          <div class="queue-line">
            ${waitingQueue.map((student, idx) => {
              const itemPose = Math.abs(this.hashCode(student.name)) % CLAY_POSES.length;
              return `
                <div class="queue-item" data-student-id="${student.id}" title="อันดับที่ ${idx + 2}: ${this.escapeHTML(student.name)}">
                  <span class="queue-item-order">คิวที่ ${idx + 2}</span>
                  <div class="queue-item-fig">
                    ${QueueManager.getFigurineSVG(itemPose, 65, student.id)}
                  </div>
                  <span class="queue-item-name">${this.escapeHTML(student.name)}</span>
                  <span class="queue-item-score">⭐ ${student.score}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindQueueButtons();
  }

  bindQueueButtons() {
    const correctBtn = document.getElementById('qCorrectBtn');
    const wrongBtn = document.getElementById('qWrongBtn');
    const bonusBtn = document.getElementById('qBonusBtn');
    const skipBtn = document.getElementById('qSkipBtn');

    if (correctBtn) correctBtn.addEventListener('click', () => this.handleAction('correct'));
    if (wrongBtn) wrongBtn.addEventListener('click', () => this.handleAction('wrong'));
    if (bonusBtn) bonusBtn.addEventListener('click', () => this.handleAction('bonus'));
    if (skipBtn) skipBtn.addEventListener('click', () => this.handleAction('skip'));
  }

  handleAction(outcome) {
    if (this.isAnimating || this.queue.length === 0) return;
    this.isAnimating = true;

    const charEl = document.getElementById('spotlightChar');

    if (outcome === 'correct' || outcome === 'bonus') {
      if (charEl) charEl.classList.add('jump');
    } else if (outcome === 'wrong') {
      if (charEl) charEl.classList.add('shake');
    }

    setTimeout(() => {
      if (charEl) charEl.classList.add('walk-out');

      setTimeout(() => {
        if (this.onAnswerSubmit) {
          this.onAnswerSubmit(this.getCurrentStudent(), outcome);
        }
        this.rotateQueue();
        this.render();
        this.isAnimating = false;

        const newCharEl = document.getElementById('spotlightChar');
        if (newCharEl) newCharEl.classList.add('walk-in');
      }, 350);
    }, 450);
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
