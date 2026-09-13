/**
 * Classroom Lucky Wheel - Export Manager (CSV & Print Reports)
 */

export const ExportManager = {
  /**
   * Export students score data to CSV with UTF-8 BOM for Microsoft Excel compatibility
   */
  exportToCSV(className, students, stats) {
    if (!students || students.length === 0) {
      alert('ไม่มีข้อมูลนักเรียนสำหรับส่งออก');
      return;
    }

    const timestamp = new Date().toLocaleString('th-TH');
    
    // Header lines
    let csvContent = `\uFEFF`; // UTF-8 BOM
    csvContent += `รายงานสรุปผลคะแนนกิจกรรมวงล้อสุ่มชื่อในชั้นเรียน\n`;
    csvContent += `ห้องเรียน / กลุ่ม: ${className}\n`;
    csvContent += `วันที่และเวลา: ${timestamp}\n`;
    csvContent += `คะแนนสูงสุด (Max): ${stats.maxScore} คะแนน\n`;
    csvContent += `คะแนนต่ำสุด (Min): ${stats.minScore} คะแนน\n`;
    csvContent += `คะแนนเฉลี่ย (Average): ${stats.avgScore} คะแนน\n\n`;

    // Table Header
    csvContent += `อันดับ,ชื่อ-นามสกุล,คะแนนสะสม (ตอบคำถาม),คะแนนความประพฤติคงเหลือ,จำนวนครั้งที่โดนหักคะแนน,จำนวนครั้งที่ตอบ,ตอบถูก (ครั้ง),ตอบผิด (ครั้ง),อัตราตอบถูก (%)\n`;

    // Sort by score or behaviorScore depending on game
    const sorted = [...students].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bBeh = b.behaviorScore !== undefined ? b.behaviorScore : 100;
      const aBeh = a.behaviorScore !== undefined ? a.behaviorScore : 100;
      return bBeh - aBeh;
    });

    sorted.forEach((student, index) => {
      const accuracy = student.answeredCount > 0 
        ? Math.round((student.correctCount / student.answeredCount) * 100)
        : 0;
      
      const safeName = `"${student.name.replace(/"/g, '""')}"`;
      const behScore = student.behaviorScore !== undefined ? student.behaviorScore : 100;
      const deductCount = student.deductionsCount || 0;
      csvContent += `${index + 1},${safeName},${student.score},${behScore},${deductCount},${student.answeredCount},${student.correctCount},${student.wrongCount},${accuracy}%\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const cleanClassName = className.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `คะแนน_${cleanClassName}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Open native print window for summary sheet
   */
  printReport() {
    window.print();
  }
};
