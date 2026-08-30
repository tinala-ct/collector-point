/**
 * Classroom Lucky Wheel & Score Collector - Main Application Controller
 */

import { WheelEngine, COLOR_PALETTES } from './wheel.js';
import { QueueManager } from './queue.js';
import { sounds } from './audio.js';
import { confetti } from './confetti.js';
import { StorageManager } from './storage.js';
import { ExportManager } from './export.js';

class ClassroomApp {
  constructor() {
    this.classes = [];
    this.currentClass = null;
    this.settings = {};
    this.currentRound = 1;
    this.history = [];
    this.currentPickedStudent = null;
    this.wheel = null;
    this.queueManager = null;

    this.init();
  }

  init() {
    // Load persisted state
    this.classes = StorageManager.getClasses();
    this.settings = StorageManager.getSettings();
    sounds.setMuted(!this.settings.soundEnabled);

    const savedClassId = StorageManager.getCurrentClassId();
    this.currentClass = this.classes.find(c => c.id === savedClassId) || this.classes[0];

    // Theme initialization
    const theme = StorageManager.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Initialize Canvas Wheel
    this.wheel = new WheelEngine('wheelCanvas', {
      spinDuration: this.settings.spinDuration,
      paletteName: this.settings.colorTheme,
      onWinnerSelected: (winner, index) => this.handleWinnerSelected(winner, index)
    });

    // Initialize Sequential Queue Manager
    this.queueManager = new QueueManager('queueCard', {
      onAnswerSubmit: (student, outcome) => this.handleQueueAnswer(student, outcome)
    });

    this.bindDOM();
    this.bindEvents();
    this.setGameMode(this.settings.gameMode || 'wheel', false);
    this.syncUI();
  }

  bindDOM() {
    // Header & Mode Controls
    this.modeWheelBtn = document.getElementById('modeWheelBtn');
    this.modeQueueBtn = document.getElementById('modeQueueBtn');
    this.wheelCard = document.getElementById('wheelCard');
    this.queueCard = document.getElementById('queueCard');

    this.classSelect = document.getElementById('classSelect');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');
    this.settingsModalBtn = document.getElementById('settingsModalBtn');
    this.finishGameBtn = document.getElementById('finishGameBtn');
    this.newGameBtn = document.getElementById('newGameBtn');

    // Status bar
    this.currentRoundBadge = document.getElementById('currentRoundBadge');
    this.totalRoundsBadge = document.getElementById('totalRoundsBadge');
    this.pointsPerQBadge = document.getElementById('pointsPerQBadge');

    // Wheel
    this.spinBtn = document.getElementById('spinBtn');
    this.centerSpinBtn = document.getElementById('centerSpinBtn');
    this.emptyWheelMsg = document.getElementById('emptyWheelMsg');

    // Tabs
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Student & Roster Management
    this.studentsList = document.getElementById('studentsList');
    this.newStudentInput = document.getElementById('newStudentInput');
    this.addStudentBtn = document.getElementById('addStudentBtn');
    this.bulkTextarea = document.getElementById('bulkTextarea');
    this.applyBulkBtn = document.getElementById('applyBulkBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.resetScoresBtn = document.getElementById('resetScoresBtn');
    this.manageClassesBtn = document.getElementById('manageClassesBtn');

    // Scoreboard
    this.scoreboardBody = document.getElementById('scoreboardBody');
    this.historyList = document.getElementById('historyList');

    // Answer / Scoring Modal (for Wheel mode)
    this.answerModal = document.getElementById('answerModal');
    this.winnerNameDisplay = document.getElementById('winnerNameDisplay');
    this.winnerCurrentScore = document.getElementById('winnerCurrentScore');
    this.correctBtn = document.getElementById('correctBtn');
    this.wrongBtn = document.getElementById('wrongBtn');
    this.bonusBtn = document.getElementById('bonusBtn');
    this.skipBtn = document.getElementById('skipBtn');
    this.correctPointsLabel = document.getElementById('correctPointsLabel');

    // Settings Modal
    this.settingsModal = document.getElementById('settingsModal');
    this.settingGameMode = document.getElementById('settingGameMode');
    this.settingQuestions = document.getElementById('settingQuestions');
    this.settingPoints = document.getElementById('settingPoints');
    this.settingBonus = document.getElementById('settingBonus');
    this.settingSound = document.getElementById('settingSound');
    this.settingRemoveOnPick = document.getElementById('settingRemoveOnPick');
    this.settingThemeColor = document.getElementById('settingThemeColor');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');

    // Summary / Podium Modal
    this.summaryModal = document.getElementById('summaryModal');
    this.closeSummaryBtn = document.getElementById('closeSummaryBtn');
    this.summaryPlayAgainBtn = document.getElementById('summaryPlayAgainBtn');
    this.exportCsvBtn = document.getElementById('exportCsvBtn');
    this.printReportBtn = document.getElementById('printReportBtn');

    // Class Management Modal
    this.classModal = document.getElementById('classModal');
    this.classListGroup = document.getElementById('classListGroup');
    this.newClassNameInput = document.getElementById('newClassNameInput');
    this.createClassBtn = document.getElementById('createClassBtn');
    this.closeClassModalBtn = document.getElementById('closeClassModalBtn');
  }

  bindEvents() {
    // Mode Switcher Buttons
    if (this.modeWheelBtn) {
      this.modeWheelBtn.addEventListener('click', () => this.setGameMode('wheel'));
    }
    if (this.modeQueueBtn) {
      this.modeQueueBtn.addEventListener('click', () => this.setGameMode('queue'));
    }

    // Wheel Spin Actions
    const triggerSpin = () => {
      if (this.settings.gameMode === 'wheel') {
        if (this.wheel.spin()) {
          this.centerSpinBtn.classList.add('spinning');
          this.spinBtn.disabled = true;
        }
      }
    };

    this.spinBtn.addEventListener('click', triggerSpin);
    this.centerSpinBtn.addEventListener('click', triggerSpin);
    document.getElementById('wheelCanvas').addEventListener('click', () => {
      if (!this.wheel.isSpinning && this.settings.gameMode === 'wheel') triggerSpin();
    });

    // Keyboard shortcut
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (this.settings.gameMode === 'wheel') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!this.isAnyModalOpen() && !this.wheel.isSpinning) {
            triggerSpin();
          }
        } else if (this.answerModal.classList.contains('show')) {
          if (e.key === '1' || e.key === 'Enter') {
            e.preventDefault();
            this.recordAnswer('correct');
          } else if (e.key === '2' || e.key === 'Escape') {
            e.preventDefault();
            this.recordAnswer('wrong');
          }
        }
      } else if (this.settings.gameMode === 'queue') {
        if (!this.isAnyModalOpen()) {
          if (e.key === '1' || e.code === 'Space') {
            e.preventDefault();
            const btn = document.getElementById('qCorrectBtn');
            if (btn) btn.click();
          } else if (e.key === '2') {
            e.preventDefault();
            const btn = document.getElementById('qWrongBtn');
            if (btn) btn.click();
          } else if (e.key === '3') {
            e.preventDefault();
            const btn = document.getElementById('qBonusBtn');
            if (btn) btn.click();
          }
        }
      }
    });

    // Scoring Actions for Wheel Modal
    this.correctBtn.addEventListener('click', () => this.recordAnswer('correct'));
    this.wrongBtn.addEventListener('click', () => this.recordAnswer('wrong'));
    this.bonusBtn.addEventListener('click', () => this.recordAnswer('bonus'));
    this.skipBtn.addEventListener('click', () => this.recordAnswer('skip'));

    // Tab Navigation
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.tabBtns.forEach(b => b.classList.remove('active'));
        this.tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
      });
    });

    // Class selection
    this.classSelect.addEventListener('change', (e) => {
      this.switchClass(e.target.value);
    });

    // Student Management
    this.addStudentBtn.addEventListener('click', () => this.handleAddStudent());
    this.newStudentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAddStudent();
    });

    this.applyBulkBtn.addEventListener('click', () => this.handleBulkApply());
    this.shuffleBtn.addEventListener('click', () => this.handleShuffle());
    this.resetScoresBtn.addEventListener('click', () => this.handleResetScores());

    // Settings Modal
    this.settingsModalBtn.addEventListener('click', () => this.openSettingsModal());
    this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
    this.saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());

    // Class Management Modal
    this.manageClassesBtn.addEventListener('click', () => this.openClassModal());
    this.closeClassModalBtn.addEventListener('click', () => this.closeClassModal());
    this.createClassBtn.addEventListener('click', () => this.handleCreateClass());

    // Game End & Summary
    this.finishGameBtn.addEventListener('click', () => this.showGameSummary());
    this.closeSummaryBtn.addEventListener('click', () => this.closeSummaryModal());
    this.summaryPlayAgainBtn.addEventListener('click', () => {
      this.closeSummaryModal();
      this.handleResetScores();
    });
    this.newGameBtn.addEventListener('click', () => {
      if (confirm('ต้องการเริ่มเกมใหม่และล้างคะแนนสะสมใช่หรือไม่?')) {
        this.handleResetScores();
      }
    });

    // Export & Print
    this.exportCsvBtn.addEventListener('click', () => {
      const stats = this.calculateStats();
      ExportManager.exportToCSV(this.currentClass.name, this.currentClass.students, stats);
    });

    this.printReportBtn.addEventListener('click', () => {
      ExportManager.printReport();
    });

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      StorageManager.setTheme(next);
      this.themeToggleBtn.innerText = next === 'dark' ? '☀️' : '🌙';
    });

    // Fullscreen Toggle
    this.fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  setGameMode(mode, save = true) {
    this.settings.gameMode = mode;
    if (save) StorageManager.saveSettings(this.settings);

    if (this.modeWheelBtn && this.modeQueueBtn) {
      this.modeWheelBtn.classList.toggle('active', mode === 'wheel');
      this.modeQueueBtn.classList.toggle('active', mode === 'queue');
    }

    if (this.wheelCard && this.queueCard) {
      if (mode === 'wheel') {
        this.wheelCard.style.display = 'flex';
        this.queueCard.style.display = 'none';
        this.updateWheelItems();
      } else {
        this.wheelCard.style.display = 'none';
        this.queueCard.style.display = 'flex';
        this.queueManager.setStudents(this.currentClass.students || []);
      }
    }
  }

  syncUI() {
    this.renderClassSelect();
    this.renderStatusBar();
    this.renderStudentsList();
    this.renderScoreboard();
    this.renderHistory();

    if (this.settings.gameMode === 'wheel') {
      this.updateWheelItems();
    } else {
      this.queueManager.setStudents(this.currentClass.students || []);
    }
  }

  renderClassSelect() {
    this.classSelect.innerHTML = '';
    this.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.students.length} คน)`;
      if (c.id === this.currentClass.id) opt.selected = true;
      this.classSelect.appendChild(opt);
    });
  }

  renderStatusBar() {
    this.currentRoundBadge.textContent = this.currentRound;
    this.totalRoundsBadge.textContent = this.settings.totalQuestions > 0 ? this.settings.totalQuestions : '∞';
    this.pointsPerQBadge.textContent = this.settings.pointsPerQuestion;
    this.correctPointsLabel.textContent = `+${this.settings.pointsPerQuestion} คะแนน`;
  }

  renderStudentsList() {
    this.studentsList.innerHTML = '';
    const students = this.currentClass.students || [];

    // Populate bulk textarea with current names
    this.bulkTextarea.value = students.map(s => s.name).join('\n');

    if (students.length === 0) {
      this.studentsList.innerHTML = `<li style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">ยังไม่มีรายชื่อนักเรียน<br>กรุณาพิมพ์เพิ่มชื่อ หรือ วางรายชื่อด้านล่าง</li>`;
      return;
    }

    students.forEach((student, index) => {
      const li = document.createElement('li');
      li.className = `student-item ${student.enabled === false ? 'disabled' : ''}`;

      li.innerHTML = `
        <div class="student-name-box">
          <span class="student-num">${index + 1}.</span>
          <span class="student-name-text">${this.escapeHTML(student.name)}</span>
        </div>
        <div class="student-actions">
          <button class="btn btn-outline btn-sm toggle-btn" title="${student.enabled === false ? 'นำกลับเข้าแถว' : 'ซ่อนชั่วคราว'}">
            ${student.enabled === false ? '👁️‍🗨️ ซ่อนอยู่' : '✅ ใช้งาน'}
          </button>
          <button class="btn btn-outline btn-sm delete-btn" title="ลบรายชื่อ" style="color:var(--danger);">
            🗑️
          </button>
        </div>
      `;

      li.querySelector('.toggle-btn').addEventListener('click', () => {
        student.enabled = student.enabled === false ? true : false;
        this.saveCurrentClass();
        this.renderStudentsList();
        this.syncUI();
      });

      li.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm(`ต้องการลบ "${student.name}" ออกจากห้องใช่หรือไม่?`)) {
          this.currentClass.students = this.currentClass.students.filter(s => s.id !== student.id);
          this.saveCurrentClass();
          this.syncUI();
        }
      });

      this.studentsList.appendChild(li);
    });
  }

  renderScoreboard() {
    this.scoreboardBody.innerHTML = '';
    const students = [...(this.currentClass.students || [])];

    // Sort by score descending, then by name
    students.sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name, 'th'));

    if (students.length === 0) {
      this.scoreboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">ไม่มีข้อมูลคะแนน</td></tr>`;
      return;
    }

    students.forEach((student, index) => {
      const tr = document.createElement('tr');
      let rankBadgeClass = 'rank-badge';
      if (index === 0) rankBadgeClass += ' rank-1';
      else if (index === 1) rankBadgeClass += ' rank-2';
      else if (index === 2) rankBadgeClass += ' rank-3';

      const accuracy = student.answeredCount > 0 
        ? Math.round((student.correctCount / student.answeredCount) * 100) 
        : 0;

      tr.innerHTML = `
        <td style="width: 40px; text-align:center;">
          <span class="${rankBadgeClass}">${index + 1}</span>
        </td>
        <td style="font-weight:600;">
          ${this.escapeHTML(student.name)}
        </td>
        <td style="text-align:center;">
          <span class="score-badge">⭐ ${student.score}</span>
        </td>
        <td style="text-align:center; font-size:0.8rem; color:var(--text-muted);">
          ${student.correctCount}/${student.answeredCount} (${accuracy}%)
        </td>
      `;

      this.scoreboardBody.appendChild(tr);
    });
  }

  renderHistory() {
    this.historyList.innerHTML = '';
    if (this.history.length === 0) {
      this.historyList.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">ยังไม่มีประวัติการตอบคำถามในคาบนี้</div>`;
      return;
    }

    [...this.history].reverse().forEach(item => {
      const div = document.createElement('div');
      div.className = `history-card history-${item.outcome}`;

      let outcomeText = '';
      if (item.outcome === 'correct') outcomeText = `<span style="color:var(--success); font-weight:700;">✅ ถูก (+${item.points})</span>`;
      else if (item.outcome === 'wrong') outcomeText = `<span style="color:var(--danger); font-weight:700;">❌ ผิด (0)</span>`;
      else outcomeText = `<span style="color:var(--text-muted);">⏭️ ข้าม</span>`;

      div.innerHTML = `
        <div>
          <strong style="color:var(--primary);">ข้อ ${item.round}:</strong>
          <span style="font-weight:600; margin-left:0.35rem;">${this.escapeHTML(item.studentName)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          ${outcomeText}
          <span style="font-size:0.75rem; color:var(--text-light);">${item.time}</span>
        </div>
      `;
      this.historyList.appendChild(div);
    });
  }

  updateWheelItems() {
    const activeStudents = (this.currentClass.students || []).filter(s => s.enabled !== false);
    this.wheel.setItems(activeStudents);

    if (activeStudents.length === 0) {
      this.emptyWheelMsg.classList.add('active');
      this.spinBtn.disabled = true;
    } else {
      this.emptyWheelMsg.classList.remove('active');
      this.spinBtn.disabled = false;
    }
  }

  handleWinnerSelected(winner, index) {
    this.centerSpinBtn.classList.remove('spinning');
    this.spinBtn.disabled = false;
    this.currentPickedStudent = winner;

    // Increment picked count
    winner.pickedCount = (winner.pickedCount || 0) + 1;
    this.saveCurrentClass();

    sounds.playWinner();
    confetti.shoot({ count: 90 });

    // Open Scoring Modal
    this.winnerNameDisplay.textContent = winner.name;
    this.winnerCurrentScore.textContent = `คะแนนสะสมปัจจุบัน: ${winner.score} คะแนน (ตอบถูกสะสม ${winner.correctCount} ครั้ง)`;
    this.openAnswerModal();
  }

  // Answer handler for Sequential Queue Mode
  handleQueueAnswer(student, outcome) {
    if (!student) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let pointsAwarded = 0;

    if (outcome === 'correct') {
      pointsAwarded = this.settings.pointsPerQuestion;
      student.score += pointsAwarded;
      student.answeredCount = (student.answeredCount || 0) + 1;
      student.correctCount = (student.correctCount || 0) + 1;
      student.pickedCount = (student.pickedCount || 0) + 1;
      sounds.playCorrect();
      confetti.shoot({ count: 60 });
    } else if (outcome === 'bonus') {
      pointsAwarded = this.settings.pointsPerQuestion + this.settings.bonusPoints;
      student.score += pointsAwarded;
      student.answeredCount = (student.answeredCount || 0) + 1;
      student.correctCount = (student.correctCount || 0) + 1;
      student.pickedCount = (student.pickedCount || 0) + 1;
      sounds.playCorrect();
      confetti.shoot({ count: 100 });
    } else if (outcome === 'wrong') {
      pointsAwarded = 0;
      student.answeredCount = (student.answeredCount || 0) + 1;
      student.wrongCount = (student.wrongCount || 0) + 1;
      student.pickedCount = (student.pickedCount || 0) + 1;
      sounds.playWrong();
    } else if (outcome === 'skip') {
      pointsAwarded = 0;
    }

    // Log history
    this.history.push({
      round: this.currentRound,
      studentName: student.name,
      outcome: outcome === 'bonus' ? 'correct' : outcome,
      points: pointsAwarded,
      time: timeStr
    });

    this.saveCurrentClass();

    // Advance round
    if (outcome !== 'skip') {
      if (this.settings.totalQuestions > 0 && this.currentRound >= this.settings.totalQuestions) {
        this.renderStatusBar();
        this.renderScoreboard();
        this.renderHistory();
        setTimeout(() => this.showGameSummary(), 700);
        return;
      }
      this.currentRound++;
    }

    this.renderStatusBar();
    this.renderScoreboard();
    this.renderHistory();
  }

  recordAnswer(outcome) {
    if (!this.currentPickedStudent) return;

    const student = this.currentPickedStudent;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let pointsAwarded = 0;

    if (outcome === 'correct') {
      pointsAwarded = this.settings.pointsPerQuestion;
      student.score += pointsAwarded;
      student.answeredCount = (student.answeredCount || 0) + 1;
      student.correctCount = (student.correctCount || 0) + 1;
      sounds.playCorrect();
      confetti.shoot({ count: 60 });
    } else if (outcome === 'bonus') {
      pointsAwarded = this.settings.pointsPerQuestion + this.settings.bonusPoints;
      student.score += pointsAwarded;
      student.answeredCount = (student.answeredCount || 0) + 1;
      student.correctCount = (student.correctCount || 0) + 1;
      sounds.playCorrect();
      confetti.shoot({ count: 100 });
    } else if (outcome === 'wrong') {
      pointsAwarded = 0;
      student.answeredCount = (student.answeredCount || 0) + 1;
      student.wrongCount = (student.wrongCount || 0) + 1;
      sounds.playWrong();
    } else if (outcome === 'skip') {
      pointsAwarded = 0;
    }

    // Log history
    this.history.push({
      round: this.currentRound,
      studentName: student.name,
      outcome: outcome === 'bonus' ? 'correct' : outcome,
      points: pointsAwarded,
      time: timeStr
    });

    // Optionally remove from wheel if setting enabled
    if (this.settings.removeOnPick && outcome !== 'skip') {
      student.enabled = false;
    }

    this.saveCurrentClass();
    this.closeAnswerModal();

    // Advance round if not skipped
    if (outcome !== 'skip') {
      if (this.settings.totalQuestions > 0 && this.currentRound >= this.settings.totalQuestions) {
        // Reached end of questions!
        this.renderStatusBar();
        this.renderScoreboard();
        this.renderHistory();
        this.updateWheelItems();
        setTimeout(() => this.showGameSummary(), 700);
        return;
      }
      this.currentRound++;
    }

    this.syncUI();
  }

  calculateStats() {
    const students = this.currentClass.students || [];
    if (students.length === 0) {
      return { maxScore: 0, minScore: 0, avgScore: 0, totalAnswered: 0, accuracy: 0 };
    }

    const scores = students.map(s => s.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const totalScore = scores.reduce((sum, s) => sum + s, 0);
    const avgScore = (totalScore / students.length).toFixed(1);

    const totalAnswered = students.reduce((sum, s) => sum + (s.answeredCount || 0), 0);
    const totalCorrect = students.reduce((sum, s) => sum + (s.correctCount || 0), 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return { maxScore, minScore, avgScore, totalAnswered, totalCorrect, accuracy };
  }

  showGameSummary() {
    const students = [...(this.currentClass.students || [])];
    students.sort((a, b) => (b.score - a.score) || (b.correctCount - a.correctCount));

    const stats = this.calculateStats();
    sounds.playFanfare();
    confetti.shoot({ count: 150 });

    // Populate Stats Cards
    document.getElementById('summaryMaxScore').textContent = `${stats.maxScore} คะแนน`;
    document.getElementById('summaryMinScore').textContent = `${stats.minScore} คะแนน`;
    document.getElementById('summaryAvgScore').textContent = `${stats.avgScore} คะแนน`;
    document.getElementById('summaryAccuracy').textContent = `${stats.accuracy}%`;

    // Populate Podium 1st, 2nd, 3rd
    const p1 = students[0];
    const p2 = students[1];
    const p3 = students[2];

    document.getElementById('podium1Name').textContent = p1 ? p1.name : '-';
    document.getElementById('podium1Score').textContent = p1 ? `${p1.score} คะแนน` : '';

    document.getElementById('podium2Name').textContent = p2 ? p2.name : '-';
    document.getElementById('podium2Score').textContent = p2 ? `${p2.score} คะแนน` : '';

    document.getElementById('podium3Name').textContent = p3 ? p3.name : '-';
    document.getElementById('podium3Score').textContent = p3 ? `${p3.score} คะแนน` : '';

    // Calculate Badges / Awards
    this.renderAwards(students);

    // Render Full Ranking Table in Summary
    const summaryTableBody = document.getElementById('summaryRankingBody');
    summaryTableBody.innerHTML = '';
    students.forEach((s, idx) => {
      const tr = document.createElement('tr');
      const acc = s.answeredCount > 0 ? Math.round((s.correctCount / s.answeredCount) * 100) : 0;
      tr.innerHTML = `
        <td style="text-align:center; font-weight:700;">${idx + 1}</td>
        <td style="font-weight:600;">${this.escapeHTML(s.name)}</td>
        <td style="text-align:center; font-weight:700; color:var(--secondary);">${s.score}</td>
        <td style="text-align:center;">${s.correctCount}/${s.answeredCount} (${acc}%)</td>
      `;
      summaryTableBody.appendChild(tr);
    });

    this.openSummaryModal();
  }

  renderAwards(students) {
    const awardsContainer = document.getElementById('summaryAwardsList');
    awardsContainer.innerHTML = '';

    if (students.length === 0) return;

    // 1. Top Scorer
    const topScorer = students[0];
    if (topScorer && topScorer.score > 0) {
      awardsContainer.appendChild(this.createBadgeCard('🌟', 'อัจฉริยะประจำคาบ (Top Scorer)', `คะแนนสะสมสูงสุดในชั้นเรียน`, topScorer.name, `${topScorer.score} คะแนน`));
    }

    // 2. Perfect Streak (100% correct, >= 1 answered)
    const perfectStudents = students.filter(s => s.answeredCount > 0 && s.correctCount === s.answeredCount);
    if (perfectStudents.length > 0) {
      const bestPerfect = perfectStudents.sort((a, b) => b.correctCount - a.correctCount)[0];
      awardsContainer.appendChild(this.createBadgeCard('⚡', 'สายฟ้าแลบตอบแม่น (100% Accuracy)', `ตอบถูกทุกข้อที่ได้รับเลือก`, bestPerfect.name, `ตอบถูก ${bestPerfect.correctCount} ข้อรวด`));
    }

    // 3. Most Picked
    const mostPicked = [...students].sort((a, b) => (b.pickedCount || 0) - (a.pickedCount || 0))[0];
    if (mostPicked && mostPicked.pickedCount > 1) {
      awardsContainer.appendChild(this.createBadgeCard('💖', 'ขวัญใจกิจกรรม (Favorite Student)', `มีส่วนร่วมตอบคำถามบ่อยที่สุด`, mostPicked.name, `ได้รับเลือก ${mostPicked.pickedCount} ครั้ง`));
    }

    // 4. Great Participation / Persistence
    const activeLearner = [...students].filter(s => s.answeredCount > 1).sort((a, b) => b.answeredCount - a.answeredCount)[0];
    if (activeLearner && activeLearner !== topScorer) {
      awardsContainer.appendChild(this.createBadgeCard('🎖️', 'นักสู้ผู้มุ่งมั่น (Active Learner)', `มีส่วนร่วมตอบคำถามอย่างยอดเยี่ยม`, activeLearner.name, `ร่วมตอบ ${activeLearner.answeredCount} รอบ`));
    }
  }

  createBadgeCard(icon, title, desc, studentName, extra) {
    const div = document.createElement('div');
    div.className = 'award-badge-card';
    div.innerHTML = `
      <div class="award-badge-icon">${icon}</div>
      <div class="award-badge-info">
        <h4>${title}</h4>
        <p class="badge-winner">👑 ${this.escapeHTML(studentName)} <span style="font-weight:400; font-size:0.75rem; color:var(--text-muted);">(${extra})</span></p>
        <p>${desc}</p>
      </div>
    `;
    return div;
  }

  // Modals Controller
  isAnyModalOpen() {
    return document.querySelector('.modal-backdrop.show') !== null;
  }

  openAnswerModal() { this.answerModal.classList.add('show'); }
  closeAnswerModal() { this.answerModal.classList.remove('show'); }

  openSettingsModal() {
    if (this.settingGameMode) this.settingGameMode.value = this.settings.gameMode || 'wheel';
    this.settingQuestions.value = this.settings.totalQuestions;
    this.settingPoints.value = this.settings.pointsPerQuestion;
    this.settingBonus.value = this.settings.bonusPoints;
    this.settingSound.checked = this.settings.soundEnabled;
    this.settingRemoveOnPick.checked = this.settings.removeOnPick;
    this.settingThemeColor.value = this.settings.colorTheme;
    this.settingsModal.classList.add('show');
  }

  closeSettingsModal() { this.settingsModal.classList.remove('show'); }

  handleSaveSettings() {
    if (this.settingGameMode) {
      const mode = this.settingGameMode.value;
      this.setGameMode(mode, false);
    }
    this.settings.totalQuestions = parseInt(this.settingQuestions.value, 10) || 10;
    this.settings.pointsPerQuestion = parseInt(this.settingPoints.value, 10) || 1;
    this.settings.bonusPoints = parseInt(this.settingBonus.value, 10) || 2;
    this.settings.soundEnabled = this.settingSound.checked;
    this.settings.removeOnPick = this.settingRemoveOnPick.checked;
    this.settings.colorTheme = this.settingThemeColor.value;

    sounds.setMuted(!this.settings.soundEnabled);
    this.wheel.setPalette(this.settings.colorTheme);

    StorageManager.saveSettings(this.settings);
    this.closeSettingsModal();
    this.syncUI();
  }

  openSummaryModal() { this.summaryModal.classList.add('show'); }
  closeSummaryModal() { this.summaryModal.classList.remove('show'); }

  openClassModal() {
    this.renderClassModalList();
    this.classModal.classList.add('show');
  }

  closeClassModal() { this.classModal.classList.remove('show'); }

  renderClassModalList() {
    this.classListGroup.innerHTML = '';
    this.classes.forEach(c => {
      const item = document.createElement('div');
      item.className = 'student-item';
      item.style.marginBottom = '0.5rem';
      item.innerHTML = `
        <div>
          <strong>${this.escapeHTML(c.name)}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${c.students.length} รายชื่อ</div>
        </div>
        <div style="display:flex; gap:0.35rem;">
          <button class="btn btn-outline btn-sm select-class-btn" ${c.id === this.currentClass.id ? 'disabled' : ''}>
            ${c.id === this.currentClass.id ? '✓ กำลังเลือก' : 'เลือกห้องนี้'}
          </button>
          ${this.classes.length > 1 ? `<button class="btn btn-outline btn-sm delete-class-btn" style="color:var(--danger);">🗑️</button>` : ''}
        </div>
      `;

      item.querySelector('.select-class-btn').addEventListener('click', () => {
        this.switchClass(c.id);
        this.closeClassModal();
      });

      const delBtn = item.querySelector('.delete-class-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (confirm(`ต้องการลบห้อง "${c.name}" หรือไม่?`)) {
            this.classes = this.classes.filter(cl => cl.id !== c.id);
            if (this.currentClass.id === c.id) {
              this.currentClass = this.classes[0];
              StorageManager.setCurrentClassId(this.currentClass.id);
            }
            StorageManager.saveClasses(this.classes);
            this.renderClassModalList();
            this.syncUI();
          }
        });
      }

      this.classListGroup.appendChild(item);
    });
  }

  handleCreateClass() {
    const name = this.newClassNameInput.value.trim();
    if (!name) return;

    const newClass = {
      id: 'class_' + Date.now(),
      name: name,
      students: []
    };

    this.classes.push(newClass);
    this.currentClass = newClass;
    StorageManager.setCurrentClassId(newClass.id);
    StorageManager.saveClasses(this.classes);

    this.newClassNameInput.value = '';
    this.renderClassModalList();
    this.syncUI();
  }

  switchClass(classId) {
    const target = this.classes.find(c => c.id === classId);
    if (target) {
      this.currentClass = target;
      StorageManager.setCurrentClassId(target.id);
      this.currentRound = 1;
      this.history = [];
      this.syncUI();
    }
  }

  handleAddStudent() {
    const name = this.newStudentInput.value.trim();
    if (!name) return;

    const newStudent = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name,
      score: 0,
      answeredCount: 0,
      correctCount: 0,
      wrongCount: 0,
      pickedCount: 0,
      enabled: true
    };

    this.currentClass.students.push(newStudent);
    this.saveCurrentClass();
    this.newStudentInput.value = '';
    this.syncUI();
  }

  handleBulkApply() {
    const text = this.bulkTextarea.value.trim();
    if (!text) {
      alert('กรุณากรอกรายชื่ออย่างน้อย 1 รายชื่อ');
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const existingMap = new Map();
    (this.currentClass.students || []).forEach(s => existingMap.set(s.name, s));

    const updatedStudents = lines.map(name => {
      if (existingMap.has(name)) {
        return existingMap.get(name);
      }
      return {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: name,
        score: 0,
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        pickedCount: 0,
        enabled: true
      };
    });

    this.currentClass.students = updatedStudents;
    this.saveCurrentClass();
    this.syncUI();
    alert(`บันทึกรายชื่อ ${updatedStudents.length} คนเรียบร้อยแล้ว!`);
  }

  handleShuffle() {
    const students = this.currentClass.students || [];
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]];
    }
    this.saveCurrentClass();
    this.syncUI();
  }

  handleResetScores() {
    (this.currentClass.students || []).forEach(s => {
      s.score = 0;
      s.answeredCount = 0;
      s.correctCount = 0;
      s.wrongCount = 0;
      s.pickedCount = 0;
      s.enabled = true;
    });
    this.currentRound = 1;
    this.history = [];
    this.saveCurrentClass();
    this.syncUI();
  }

  saveCurrentClass() {
    StorageManager.saveClasses(this.classes);
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ClassroomApp();
});
