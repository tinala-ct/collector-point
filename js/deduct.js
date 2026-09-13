/**
 * Classroom Lucky Wheel - Behavior Point Deduction & Bar Chart Engine
 * Manages 100-point HP health bars, 5-point deductions, sorting, and animations
 */

import { QueueManager, CLAY_POSES } from './queue.js';
import { sounds } from './audio.js';

export class DeductManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.students = [];
    this.initialScore = options.initialScore || 100;
    this.deductStep = options.deductStep || 5;
    this.sortBy = 'default'; // 'default', 'score-desc', 'score-asc'
    this.searchTerm = '';
    this.onDeduct = options.onDeduct || null;
    this.onResetAll = options.onResetAll || null;
  }

  setStudents(students, initialScore = 100, deductStep = 5) {
    this.initialScore = initialScore;
    this.deductStep = deductStep;
    
    // Ensure every student has behaviorScore initialized
    this.students = students.map(s => {
      if (s.behaviorScore === undefined || s.behaviorScore === null) {
        s.behaviorScore = this.initialScore;
      }
      if (s.deductionsCount === undefined || s.deductionsCount === null) {
        s.deductionsCount = 0;
      }
      return s;
    });

    this.render();
  }

  getProcessedList() {
    let list = this.students.filter(s => s.enabled !== false);

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(term));
    }

    if (this.sortBy === 'score-desc') {
      list = [...list].sort((a, b) => (b.behaviorScore - a.behaviorScore) || a.name.localeCompare(b.name, 'th'));
    } else if (this.sortBy === 'score-asc') {
      list = [...list].sort((a, b) => (a.behaviorScore - b.behaviorScore) || a.name.localeCompare(b.name, 'th'));
    }

    return list;
  }

  getTierClass(score, maxScore) {
    const ratio = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (ratio <= 0) return 'bar-tier-empty';
    if (ratio < 20) return 'bar-tier-red';
    if (ratio < 50) return 'bar-tier-orange';
    if (ratio < 80) return 'bar-tier-yellow';
    return 'bar-tier-green';
  }

  getScoreColor(score, maxScore) {
    const ratio = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (ratio <= 0) return '#64748b';
    if (ratio < 20) return '#ef4444';
    if (ratio < 50) return '#f97316';
    if (ratio < 80) return '#eab308';
    return '#10b981';
  }

  render() {
    if (!this.container) return;

    const displayList = this.getProcessedList();
    const totalDeductions = this.students.reduce((sum, s) => sum + (s.deductionsCount || 0), 0);
    const totalDeductedPoints = totalDeductions * this.deductStep;

    this.container.innerHTML = `
      <!-- Toolbar -->
      <div class="deduct-toolbar">
        <div class="deduct-stats-badge">
          <span>📉 คะแนนเริ่มต้น: <strong>${this.initialScore}</strong> แต้ม</span>
          <span>• ลดทีละ: <strong>-${this.deductStep}</strong> แต้ม</span>
          <span class="stat-pill">💥 หักรวมทั้งห้อง: ${totalDeductions} ครั้ง (-${totalDeductedPoints} แต้ม)</span>
        </div>

        <div class="deduct-toolbar-actions">
          <!-- Search Box -->
          <input type="text" id="deductSearchInput" class="input-text" style="width: 140px; padding: 0.35rem 0.65rem; font-size: 0.8rem;" placeholder="🔍 ค้นหาชื่อ..." value="${this.escapeHTML(this.searchTerm)}">

          <!-- Sort Select -->
          <select id="deductSortSelect" style="width: 140px; padding: 0.35rem 0.5rem; font-size: 0.8rem;">
            <option value="default" ${this.sortBy === 'default' ? 'selected' : ''}>📋 เรียงตามเลขที่</option>
            <option value="score-desc" ${this.sortBy === 'score-desc' ? 'selected' : ''}>🏆 แต้มมาก ➔ น้อย</option>
            <option value="score-asc" ${this.sortBy === 'score-asc' ? 'selected' : ''}>⚠️ แต้มน้อย ➔ มาก</option>
          </select>

          <!-- Reset All to 100 Button -->
          <button id="deductResetAllBtn" class="btn btn-outline btn-sm" title="รีเซ็ตคะแนนทุกคนกลับเป็นค่าเริ่มต้น (${this.initialScore} แต้ม)">
            🔄 คืนค่าเต็ม ${this.initialScore}
          </button>
        </div>
      </div>

      <!-- Student Health Bar List -->
      <div class="deduct-grid" id="deductGrid">
        ${displayList.length === 0 ? `
          <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
            <p>ไม่พบรายชื่อนักเรียน</p>
          </div>
        ` : displayList.map((student, idx) => {
          const score = student.behaviorScore !== undefined ? student.behaviorScore : this.initialScore;
          const percent = Math.max(0, Math.min(100, (score / this.initialScore) * 100));
          const tierClass = this.getTierClass(score, this.initialScore);
          const scoreColor = this.getScoreColor(score, this.initialScore);
          const poseIndex = Math.abs(this.hashCode(student.name)) % CLAY_POSES.length;

          return `
            <div class="deduct-item" id="deductItem_${student.id}">
              <!-- Student Info & Clay Avatar -->
              <div class="deduct-student-info">
                <div class="deduct-avatar-box" title="${this.escapeHTML(student.name)}">
                  <div class="deduct-avatar-fig">
                    ${QueueManager.getFigurineSVG(poseIndex, 40, student.id)}
                  </div>
                </div>
                <div class="deduct-name-box">
                  <span class="deduct-name" title="${this.escapeHTML(student.name)}">${this.escapeHTML(student.name)}</span>
                  <span class="deduct-rank-tag">ลำดับที่ ${idx + 1} • หักไป ${student.deductionsCount || 0} ครั้ง</span>
                </div>
              </div>

              <!-- Animated Progress Bar / Health Bar -->
              <div class="deduct-bar-wrapper">
                <div class="deduct-bar-labels">
                  <span class="deduct-score-text" style="color: ${scoreColor};">
                    ${score} / ${this.initialScore} แต้ม
                  </span>
                  <span class="deduct-count-text">
                    ${score <= 0 ? '💀 หมดพลัง' : score < 50 ? '⚠️ ระวัง' : '🌟 เรียบร้อย'}
                  </span>
                </div>
                <div class="deduct-bar-track">
                  <div class="deduct-bar-fill ${tierClass}" style="width: ${percent}%;"></div>
                </div>
              </div>

              <!-- Deduct Action Button -->
              <div class="deduct-btn-box">
                <button class="btn-deduct" data-student-id="${student.id}" ${score <= 0 ? 'disabled' : ''} title="หักคะแนน ${student.name} ${this.deductStep} แต้ม">
                  <span>-${this.deductStep} แต้ม</span> 💥
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('deductSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.render();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('deductSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // Reset All button
    const resetBtn = document.getElementById('deductResetAllBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm(`ต้องการรีเซ็ตคะแนนความประพฤติของทุกคนกลับเป็น ${this.initialScore} คะแนนเต็มใช่หรือไม่?`)) {
          this.students.forEach(s => {
            s.behaviorScore = this.initialScore;
            s.deductionsCount = 0;
          });
          if (this.onResetAll) this.onResetAll();
          this.render();
        }
      });
    }

    // Deduct buttons
    const deductBtns = this.container.querySelectorAll('.btn-deduct');
    deductBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = btn.dataset.studentId;
        this.handleDeductStudent(studentId, btn);
      });
    });
  }

  handleDeductStudent(studentId, btnElement) {
    const student = this.students.find(s => s.id === studentId);
    if (!student || student.behaviorScore <= 0) return;

    // Deduct points
    const oldScore = student.behaviorScore;
    student.behaviorScore = Math.max(0, student.behaviorScore - this.deductStep);
    student.deductionsCount = (student.deductionsCount || 0) + 1;

    // Play Sound
    sounds.playDeduct();

    // Visual animation on Item
    const itemEl = document.getElementById(`deductItem_${student.id}`);
    if (itemEl) {
      itemEl.classList.remove('shaking');
      void itemEl.offsetWidth; // trigger reflow
      itemEl.classList.add('shaking');

      // Floating -5 text
      const floater = document.createElement('div');
      floater.className = 'floating-deduct-text';
      floater.textContent = `-${this.deductStep}`;
      itemEl.appendChild(floater);
      setTimeout(() => floater.remove(), 850);
    }

    if (this.onDeduct) {
      this.onDeduct(student, this.deductStep, oldScore);
    }

    // Re-render to update bars and numbers smoothly
    setTimeout(() => this.render(), 180);
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
