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
   * Generates a deterministic illustrated avatar. The same student id always
   * receives the same face, while different students get varied combinations.
   */
  static getFigurineSVG(pose = 'stand', size = 140, id = '') {
    const key = String(id || pose || 'student');
    let seed = 0;
    for (let i = 0; i < key.length; i++) seed = ((seed << 5) - seed + key.charCodeAt(i)) | 0;
    seed = Math.abs(seed);
    const pick = (items, offset = 0) => items[(seed + offset * 17) % items.length];
    const skin = pick(['#ffd7b5', '#efb27d', '#c98252', '#8e563c'], 1);
    const hair = pick(['#27223f', '#263b65', '#6b344e', '#173f4e', '#754631'], 2);
    const shirt = pick(['#5b6ee1', '#16a085', '#e15b8f', '#f39c4a', '#6c5ce7'], 3);
    const bg = pick(['#dff7f4', '#fff0c7', '#e9e2ff', '#dcecff', '#ffe1ed'], 4);
    const style = seed % 6;
    const accessory = Math.floor(seed / 7) % 4;
    const safeId = key.replace(/[^a-zA-Z0-9_-]/g, '').slice(-16) || 'avatar';
    const clipId = `avatarClip_${safeId}_${style}`;
    const hairShapes = [
      `<path d="M24 52C21 26 34 14 50 14s29 12 26 38l-9-12c-7 2-23 1-33-6z" fill="${hair}"/>`,
      `<path d="M25 57C17 36 28 15 50 14c22-1 34 18 27 43l-9-6-2-18c-13 8-25 5-34 0l-1 19z" fill="${hair}"/>`,
      `<g fill="${hair}"><circle cx="30" cy="27" r="10"/><circle cx="42" cy="20" r="11"/><circle cx="56" cy="20" r="12"/><circle cx="69" cy="28" r="11"/><path d="M23 32h54v27H23z"/></g>`,
      `<path d="M24 54c-4-25 7-40 28-40 18 0 29 13 26 36-6-12-13-18-21-21-8 10-18 14-27 13v15z" fill="${hair}"/>`,
      `<path d="M26 58c-8-31 7-44 25-44 21 0 34 17 25 46l-8-5V33c-10 7-23 9-37 3v20z" fill="${hair}"/><circle cx="50" cy="11" r="8" fill="${hair}"/>`,
      `<path d="M22 59c-5-26 5-45 28-45s34 20 28 46l-10-5-3-25c-9 8-22 10-34 5l1 20z" fill="${hair}"/><path d="M25 50c-8 13-5 27 4 33l8-28zm50 0c8 13 5 27-4 33l-8-28z" fill="${hair}"/>`
    ];
    const accessories = [
      '',
      `<g fill="none" stroke="#34364f" stroke-width="2.5"><circle cx="40" cy="48" r="7"/><circle cx="60" cy="48" r="7"/><path d="M47 48h6"/></g>`,
      `<path d="M31 32c10-9 28-12 40-2l-3 7c-13-5-24-4-37 2z" fill="${shirt}"/><path d="M66 31l15 7-14 2z" fill="${shirt}"/>`,
      `<path d="M74 26c8-15 15-10 9 4 12-9 17-1 4 8z" fill="${shirt}"/>`
    ];
    return `<svg class="student-avatar-svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="อวตารนักเรียน" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="47"/></clipPath></defs>
      <g clip-path="url(#${clipId})">
        <circle cx="50" cy="50" r="47" fill="${bg}"/>
        <path d="M18 104c2-25 14-36 32-36s30 11 32 36z" fill="${shirt}"/>
        ${hairShapes[style]}
        <ellipse cx="50" cy="48" rx="22" ry="27" fill="${skin}"/>
        ${style === 5 ? `<path d="M27 37c5-18 34-25 47-4-15-3-29-1-47 8z" fill="${hair}"/>` : ''}
        <circle cx="41" cy="48" r="2.3" fill="#29243b"/><circle cx="59" cy="48" r="2.3" fill="#29243b"/>
        <circle cx="32" cy="57" r="4" fill="#ec8290" opacity=".55"/><circle cx="68" cy="57" r="4" fill="#ec8290" opacity=".55"/>
        <path d="M43 60q7 6 14 0" fill="none" stroke="#803c4a" stroke-width="2.2" stroke-linecap="round"/>
        ${accessories[accessory]}
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>
    </svg>`;
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
