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
    this.hasBoundGlobalEvents = false;
  }

  setStudents(students, initialScore = 100, deductStep = 5) {
    this.initialScore = Number(initialScore) || 100;
    this.deductStep = Number(deductStep) || 5;
    
    // Ensure every student has behaviorScore and deductionsCount initialized
    this.students = students;
    this.students.forEach(s => {
      if (s.behaviorScore === undefined || s.behaviorScore === null || isNaN(s.behaviorScore)) {
        s.behaviorScore = this.initialScore;
      }
      if (s.deductionsCount === undefined || s.deductionsCount === null || isNaN(s.deductionsCount)) {
        s.deductionsCount = 0;
      }
    });

    this.render();
  }

  getProcessedList() {
    let list = this.students.filter(s => s.enabled !== false);

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(s => s.name.toLowerCase().includes(term));
    }

    if (this.sortBy === 'score-desc') {
      list = [...list].sort((a, b) => {
        const aScore = a.behaviorScore !== undefined ? a.behaviorScore : this.initialScore;
        const bScore = b.behaviorScore !== undefined ? b.behaviorScore : this.initialScore;
        return (bScore - aScore) || a.name.localeCompare(b.name, 'th');
      });
    } else if (this.sortBy === 'score-asc') {
      list = [...list].sort((a, b) => {
        const aScore = a.behaviorScore !== undefined ? a.behaviorScore : this.initialScore;
        const bScore = b.behaviorScore !== undefined ? b.behaviorScore : this.initialScore;
        return (aScore - bScore) || a.name.localeCompare(b.name, 'th');
      });
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
        <div class="deduct-stats-badge" id="deductStatsBadge">
          <span>📉 คะแนนเริ่มต้น: <strong>${this.initialScore}</strong> แต้ม</span>
          <span>• ลดทีละ: <strong>-${this.deductStep}</strong> แต้ม</span>
          <span class="stat-pill" id="deductTotalPill">💥 หักรวมทั้งห้อง: ${totalDeductions} ครั้ง (-${totalDeductedPoints} แต้ม)</span>
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
            <div class="deduct-item" id="deductItem_${student.id}" data-student-id="${student.id}">
              <!-- Student Info & Clay Avatar -->
              <div class="deduct-student-info">
                <div class="deduct-avatar-box" title="${this.escapeHTML(student.name)}">
                  <div class="deduct-avatar-fig">
                    ${QueueManager.getFigurineSVG(poseIndex, 40, student.id)}
                  </div>
                </div>
                <div class="deduct-name-box">
                  <span class="deduct-name" title="${this.escapeHTML(student.name)}">${this.escapeHTML(student.name)}</span>
                  <span class="deduct-rank-tag" id="deductTag_${student.id}">ลำดับที่ ${idx + 1} • หักไป ${student.deductionsCount || 0} ครั้ง</span>
                </div>
              </div>

              <!-- Animated Progress Bar / Health Bar -->
              <div class="deduct-bar-wrapper">
                <div class="deduct-bar-labels">
                  <span class="deduct-score-text" id="deductScoreText_${student.id}" style="color: ${scoreColor};">
                    ${score} / ${this.initialScore} แต้ม
                  </span>
                  <span class="deduct-count-text" id="deductStatusText_${student.id}">
                    ${score <= 0 ? '💀 หมดพลัง' : score < 50 ? '⚠️ ระวัง' : '🌟 เรียบร้อย'}
                  </span>
                </div>
                <div class="deduct-bar-track">
                  <div class="deduct-bar-fill ${tierClass}" id="deductBarFill_${student.id}" style="width: ${percent}%;"></div>
                </div>
              </div>

              <!-- Deduct Action Button -->
              <div class="deduct-btn-box">
                <button type="button" class="btn-deduct" id="deductBtn_${student.id}" data-student-id="${student.id}" ${score <= 0 ? 'disabled' : ''} title="หักคะแนน ${this.escapeHTML(student.name)} ${this.deductStep} แต้ม">
                  <span>-${this.deductStep} แต้ม</span> 💥
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindEventsOnce();
  }

  bindEventsOnce() {
    if (this.hasBoundGlobalEvents) return;
    this.hasBoundGlobalEvents = true;

    // Delegated click listener on the main container
    this.container.addEventListener('click', (e) => {
      // 1. Check if deduct button was clicked
      const deductBtn = e.target.closest('.btn-deduct');
      if (deductBtn) {
        e.preventDefault();
        e.stopPropagation();
        const studentId = deductBtn.dataset.studentId;
        this.handleDeductStudent(studentId, deductBtn);
        return;
      }

      // 2. Check if reset all button was clicked
      const resetBtn = e.target.closest('#deductResetAllBtn');
      if (resetBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.handleResetAll();
        return;
      }
    });

    // Delegated input listener for search
    this.container.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'deductSearchInput') {
        this.searchTerm = e.target.value;
        this.renderGridOnly();
      }
    });

    // Delegated change listener for sorting
    this.container.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'deductSortSelect') {
        this.sortBy = e.target.value;
        this.renderGridOnly();
      }
    });
  }

  renderGridOnly() {
    const gridEl = document.getElementById('deductGrid');
    if (!gridEl) {
      this.render();
      return;
    }

    const displayList = this.getProcessedList();
    if (displayList.length === 0) {
      gridEl.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👥</div>
          <p>ไม่พบรายชื่อนักเรียน</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = displayList.map((student, idx) => {
      const score = student.behaviorScore !== undefined ? student.behaviorScore : this.initialScore;
      const percent = Math.max(0, Math.min(100, (score / this.initialScore) * 100));
      const tierClass = this.getTierClass(score, this.initialScore);
      const scoreColor = this.getScoreColor(score, this.initialScore);
      const poseIndex = Math.abs(this.hashCode(student.name)) % CLAY_POSES.length;

      return `
        <div class="deduct-item" id="deductItem_${student.id}" data-student-id="${student.id}">
          <div class="deduct-student-info">
            <div class="deduct-avatar-box" title="${this.escapeHTML(student.name)}">
              <div class="deduct-avatar-fig">
                ${QueueManager.getFigurineSVG(poseIndex, 40, student.id)}
              </div>
            </div>
            <div class="deduct-name-box">
              <span class="deduct-name" title="${this.escapeHTML(student.name)}">${this.escapeHTML(student.name)}</span>
              <span class="deduct-rank-tag" id="deductTag_${student.id}">ลำดับที่ ${idx + 1} • หักไป ${student.deductionsCount || 0} ครั้ง</span>
            </div>
          </div>

          <div class="deduct-bar-wrapper">
            <div class="deduct-bar-labels">
              <span class="deduct-score-text" id="deductScoreText_${student.id}" style="color: ${scoreColor};">
                ${score} / ${this.initialScore} แต้ม
              </span>
              <span class="deduct-count-text" id="deductStatusText_${student.id}">
                ${score <= 0 ? '💀 หมดพลัง' : score < 50 ? '⚠️ ระวัง' : '🌟 เรียบร้อย'}
              </span>
            </div>
            <div class="deduct-bar-track">
              <div class="deduct-bar-fill ${tierClass}" id="deductBarFill_${student.id}" style="width: ${percent}%;"></div>
            </div>
          </div>

          <div class="deduct-btn-box">
            <button type="button" class="btn-deduct" id="deductBtn_${student.id}" data-student-id="${student.id}" ${score <= 0 ? 'disabled' : ''} title="หักคะแนน ${this.escapeHTML(student.name)} ${this.deductStep} แต้ม">
              <span>-${this.deductStep} แต้ม</span> 💥
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  handleResetAll() {
    if (confirm(`ต้องการรีเซ็ตคะแนนความประพฤติของทุกคนกลับเป็น ${this.initialScore} คะแนนเต็มใช่หรือไม่?`)) {
      this.students.forEach(s => {
        s.behaviorScore = this.initialScore;
        s.deductionsCount = 0;
      });
      if (this.onResetAll) this.onResetAll();
      this.render();
    }
  }

  handleDeductStudent(studentId, btnElement) {
    const student = this.students.find(s => String(s.id) === String(studentId));
    if (!student) {
      console.warn('Student not found:', studentId);
      return;
    }

    const currentScore = student.behaviorScore !== undefined ? student.behaviorScore : this.initialScore;
    if (currentScore <= 0) return;

    // Deduct points
    const oldScore = currentScore;
    const newScore = Math.max(0, currentScore - this.deductStep);
    student.behaviorScore = newScore;
    student.deductionsCount = (student.deductionsCount || 0) + 1;

    // Play Sound
    sounds.playDeduct();

    // 1. Instant targeted DOM update for this student
    const itemEl = document.getElementById(`deductItem_${student.id}`);
    const scoreTextEl = document.getElementById(`deductScoreText_${student.id}`);
    const statusTextEl = document.getElementById(`deductStatusText_${student.id}`);
    const barFillEl = document.getElementById(`deductBarFill_${student.id}`);
    const tagEl = document.getElementById(`deductTag_${student.id}`);
    const btnEl = btnElement || document.getElementById(`deductBtn_${student.id}`);

    const percent = Math.max(0, Math.min(100, (newScore / this.initialScore) * 100));
    const tierClass = this.getTierClass(newScore, this.initialScore);
    const scoreColor = this.getScoreColor(newScore, this.initialScore);

    if (scoreTextEl) {
      scoreTextEl.textContent = `${newScore} / ${this.initialScore} แต้ม`;
      scoreTextEl.style.color = scoreColor;
    }

    if (statusTextEl) {
      statusTextEl.textContent = newScore <= 0 ? '💀 หมดพลัง' : newScore < 50 ? '⚠️ ระวัง' : '🌟 เรียบร้อย';
    }

    if (barFillEl) {
      barFillEl.style.width = `${percent}%`;
      barFillEl.className = `deduct-bar-fill ${tierClass}`;
    }

    if (tagEl) {
      tagEl.textContent = `หักไป ${student.deductionsCount} ครั้ง`;
    }

    if (btnEl && newScore <= 0) {
      btnEl.disabled = true;
    }

    // Update Toolbar total deductions pill
    const totalDeductions = this.students.reduce((sum, s) => sum + (s.deductionsCount || 0), 0);
    const totalDeductedPoints = totalDeductions * this.deductStep;
    const totalPill = document.getElementById('deductTotalPill');
    if (totalPill) {
      totalPill.textContent = `💥 หักรวมทั้งห้อง: ${totalDeductions} ครั้ง (-${totalDeductedPoints} แต้ม)`;
    }

    // 2. Shake & Floating Text animation
    if (itemEl) {
      itemEl.classList.remove('shaking');
      void itemEl.offsetWidth; // trigger reflow
      itemEl.classList.add('shaking');

      const floater = document.createElement('div');
      floater.className = 'floating-deduct-text';
      floater.textContent = `-${this.deductStep}`;
      itemEl.appendChild(floater);
      setTimeout(() => floater.remove(), 850);
    }

    // 3. Trigger callback to sync app state, history, and localStorage
    if (this.onDeduct) {
      this.onDeduct(student, this.deductStep, oldScore);
    }
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
