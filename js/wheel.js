/**
 * Classroom Lucky Wheel - Canvas 2D Wheel Engine
 */

import { sounds } from './audio.js';

export const COLOR_PALETTES = {
  vibrant: [
    '#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ec4899', '#3b82f6', '#14b8a6', '#84cc16', '#eab308'
  ],
  pastel: [
    '#fda4af', '#c4b5fd', '#67e8f9', '#6ee7b7', '#fde047',
    '#f9a8d4', '#93c5fd', '#5eead4', '#bef264', '#fcd34d'
  ],
  candy: [
    '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f7cad0',
    '#70d6ff', '#ff70a6', '#ff9770', '#ffd670', '#e9ff70'
  ]
};

export class WheelEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.items = []; // Array of { id, name, ... }
    this.currentAngle = 0; // Current rotation angle in radians
    this.isSpinning = false;
    this.spinDuration = options.spinDuration || 4.5; // seconds
    this.paletteName = options.paletteName || 'vibrant';
    this.pointerEl = document.querySelector('.wheel-pointer');
    this.lastTickIndex = -1;
    this.onWinnerSelected = options.onWinnerSelected || null;

    this.setupDPI();
    window.addEventListener('resize', () => {
      this.setupDPI();
      this.draw();
    });
  }

  setupDPI() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set internal canvas resolution based on display size and DPR
    const size = Math.min(rect.width || 480, 560);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.displaySize = size;
  }

  setItems(items) {
    this.items = items.filter(item => item.enabled !== false);
    this.draw();
  }

  setPalette(paletteName) {
    if (COLOR_PALETTES[paletteName]) {
      this.paletteName = paletteName;
      this.draw();
    }
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const size = this.displaySize || 480;
    const center = size / 2;
    const radius = center - 8;

    this.ctx.clearRect(0, 0, size, size);

    if (this.items.length === 0) {
      // Empty wheel placeholder
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(center, center, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fill();
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#cbd5e1';
      this.ctx.stroke();
      this.ctx.restore();
      return;
    }

    const sliceAngle = (Math.PI * 2) / this.items.length;
    const colors = COLOR_PALETTES[this.paletteName] || COLOR_PALETTES.vibrant;

    // Draw Wheel Slices
    for (let i = 0; i < this.items.length; i++) {
      const startAngle = this.currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(center, center);
      this.ctx.arc(center, center, radius, startAngle, endAngle);
      this.ctx.closePath();

      // Alternate colors nicely
      let colorIndex = i % colors.length;
      if (i === this.items.length - 1 && colorIndex === 0 && this.items.length > 1) {
        colorIndex = 1; // Prevent first and last slice having same color
      }
      this.ctx.fillStyle = colors[colorIndex];
      this.ctx.fill();

      // Slice border
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();

      // Text on Slice
      this.drawSliceText(this.items[i].name, center, center, radius, startAngle, endAngle);
      this.ctx.restore();
    }

    // Outer wheel border ring
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(center, center, radius, 0, Math.PI * 2);
    this.ctx.lineWidth = 6;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSliceText(text, cx, cy, radius, startAngle, endAngle) {
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const sliceCount = this.items.length;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(midAngle);
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#ffffff';

    // Dynamic font sizing based on item count
    let fontSize = 16;
    if (sliceCount > 24) fontSize = 11;
    else if (sliceCount > 16) fontSize = 13;
    else if (sliceCount > 10) fontSize = 15;
    else fontSize = 18;

    this.ctx.font = `600 ${fontSize}px 'Prompt', sans-serif`;
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Truncate long text if needed
    const maxTextWidth = radius - 75;
    let displayText = text;
    if (this.ctx.measureText(displayText).width > maxTextWidth) {
      while (this.ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 2) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }

    this.ctx.fillText(displayText, radius - 24, 0);
    this.ctx.restore();
  }

  spin() {
    if (this.isSpinning || this.items.length === 0) return false;

    this.isSpinning = true;
    sounds.ensureContextActive();

    // The pointer sits at the 3 o'clock position (angle 0 in standard polar coordinates)
    const sliceAngle = (Math.PI * 2) / this.items.length;

    // Pick a random winner index
    const winnerIndex = Math.floor(Math.random() * this.items.length);

    // Calculate target angle so the winning slice is centered under the 3 o'clock pointer (Angle 0)
    // Slice i occupies: [angle + i*sliceAngle, angle + (i+1)*sliceAngle]
    // Center of slice i: angle + (i + 0.5)*sliceAngle
    // To align with Angle 0 (or 2*PI*k):
    // targetAngle = - (winnerIndex + 0.5) * sliceAngle + (random offset within slice)
    const randomOffsetInSlice = (Math.random() - 0.5) * (sliceAngle * 0.7);
    const targetSliceCenter = (winnerIndex + 0.5) * sliceAngle + randomOffsetInSlice;

    // Minimum full spins for excitement (5 to 8 rotations)
    const fullSpins = Math.floor(Math.random() * 3) + 6;
    const totalRotation = fullSpins * Math.PI * 2 + (Math.PI * 2 - (targetSliceCenter % (Math.PI * 2)));

    const startAngle = this.currentAngle;
    const finalAngle = startAngle + totalRotation;
    const startTime = performance.now();
    const durationMs = this.spinDuration * 1000;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease-out cubic curve: 1 - (1-t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = startAngle + (finalAngle - startAngle) * easeProgress;

      this.draw();
      this.checkPointerTick();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.currentAngle = finalAngle % (Math.PI * 2);
        this.draw();

        // Selected winner
        const winner = this.items[winnerIndex];
        if (this.onWinnerSelected) {
          this.onWinnerSelected(winner, winnerIndex);
        }
      }
    };

    requestAnimationFrame(animate);
    return true;
  }

  checkPointerTick() {
    if (this.items.length === 0) return;
    const sliceAngle = (Math.PI * 2) / this.items.length;
    // Current angle normalized to [0, 2PI)
    const normalizedAngle = (Math.PI * 2 - (this.currentAngle % (Math.PI * 2))) % (Math.PI * 2);
    const currentSliceIndex = Math.floor(normalizedAngle / sliceAngle);

    if (currentSliceIndex !== this.lastTickIndex) {
      this.lastTickIndex = currentSliceIndex;
      sounds.playTick(500 + (currentSliceIndex % 4) * 50);

      if (this.pointerEl) {
        this.pointerEl.classList.remove('ticking');
        void this.pointerEl.offsetWidth; // Trigger reflow for CSS animation
        this.pointerEl.classList.add('ticking');
      }
    }
  }
}
