/**
 * File: app.js
 * Deskripsi: Manajemen Utama Sesi Deteksi Kursi ErgoSmart.
 * Integrasi: Menghapus suara ting, mempertahankan efek desis swoosh molekul.
 */

const matricesData = {
    ideal: [20,25,25,20, 22,28,28,22, 22,28,28,22, 20,25,25,20],
    left:  [80,75,40,20, 82,78,38,18, 85,80,35,18, 82,78,36,18],
    right: [20,40,75,80, 18,38,78,82, 18,35,80,85, 18,36,78,82],
    forward:[85,90,90,85, 70,75,75,70, 30,35,35,30, 10,15,15,10],
    back:  [10,15,15,10, 30,35,35,30, 70,75,75,70, 85,90,90,85],
    empty: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
};

const anthropometryData = {
    "5": { popliteal: "38 cm", depth: "39 cm", width: "34 cm" },
    "50": { popliteal: "41 cm", depth: "42 cm", width: "38 cm" },
    "95": { popliteal: "45 cm", depth: "46 cm", width: "42 cm" }
};

let weeklyData = [
    { day: 'Sen', time: 0, score: 0, totalScore: 0, sessions: 0 },
    { day: 'Sel', time: 0, score: 0, totalScore: 0, sessions: 0 },
    { day: 'Rab', time: 0, score: 0, totalScore: 0, sessions: 0 },
    { day: 'Kam', time: 0, score: 0, totalScore: 0, sessions: 0 },
    { day: 'Jum', time: 0, score: 0, totalScore: 0, sessions: 0 },
    { day: 'Sab', time: 0, score: 0, totalScore: 0, sessions: 0 },
    { day: 'Min', time: 0, score: 0, totalScore: 0, sessions: 0 },
];

let sessionStats = { ideal: 0, warning: 0, danger: 0 };
let currentPosture = 'empty';
let badPostureTimer = null;
const BAD_POSTURE_LIMIT_MS = 5000; 
let isIotConnected = false; 
let sessionSeconds = 0;
let sessionInterval = null;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBeepCustom(freq, duration) {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

// Suara desisan futuristik (Swoosh) saat partikel mengumpul
window.playSciFiSwoosh = function() {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 3.0);
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.5);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 3.0);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 3.0);
    } catch(e){}
};

document.addEventListener('DOMContentLoaded', () => {
    try { setupLandingPageTransition(); } catch(e) {}
    try { setupIoTModal(); } catch(e) {}
    try { setupHardwareSimulator(); } catch(e) {}
    try { initHeatmapGrid(); } catch(e) {}
    try { renderWeeklyLog(); } catch(e) {}
    try { if(typeof initPostureChart === 'function') initPostureChart(); } catch(e) {}
    try { startSessionTimer(); } catch(e) {}
    try { setupSimulationButtons(); } catch(e) {}
    try { setupAnthropometry(); } catch(e) {}
    try { setupExportFeature(); } catch(e) {}
    try { setupDisconnectFeature(); } catch(e) {}
    try { setupCalibrateFeature(); } catch(e) {}
    
    const daySelector = document.getElementById('day-selector');
    if(daySelector) {
        let today = new Date().getDay() - 1; 
        if(today === -1) today = 6;
        daySelector.value = today.toString();
        daySelector.addEventListener('change', renderWeeklyLog);
    }
});

function setupLandingPageTransition() {
    const btnStart = document.getElementById('btn-start-simulation');
    if(!btnStart) return;
    btnStart.addEventListener('click', () => {
        playBeepCustom(600, 0.2);
        const landingPage = document.getElementById('landing-page');
        const introScene = document.getElementById('intro-scene');
        
        landingPage.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            landingPage.classList.add('hidden');
            introScene.classList.remove('hidden');
            setTimeout(() => {
                introScene.classList.remove('opacity-0');
                if(window.playIntro3D) window.playIntro3D();
            }, 50);
        }, 1000);
    });
}

const btnContinue = document.getElementById('btn-continue-dashboard');
if(btnContinue) {
    btnContinue.addEventListener('click', () => {
        playBeepCustom(800, 0.2);
        const introScene = document.getElementById('intro-scene');
        const mainDashboard = document.getElementById('main-dashboard');

        introScene.classList.add('opacity-0');
        setTimeout(() => {
            introScene.classList.add('hidden');
            mainDashboard.classList.remove('hidden');

            setTimeout(() => {
                mainDashboard.classList.remove('opacity-0');
                mainDashboard.classList.add('opacity-100');
                window.dispatchEvent(new Event('resize'));
                applySimulation('empty'); 
            }, 50);
        }, 1000);
    });
}

function setupIoTModal() {
    const btnOpen = document.getElementById('btn-open-iot-modal');
    const btnClose = document.getElementById('close-iot-modal');
    const iotModal = document.getElementById('iot-modal');

    if(btnOpen && iotModal) {
        btnOpen.addEventListener('click', () => {
            playBeepCustom(500, 0.1);
            iotModal.classList.remove('hidden');
            iotModal.style.display = 'flex';
            setTimeout(() => iotModal.classList.remove('opacity-0'), 10);
        });
    }

    if(btnClose && iotModal) {
        btnClose.addEventListener('click', () => {
            iotModal.classList.add('opacity-0');
            setTimeout(() => {
                iotModal.style.display = 'none';
                iotModal.classList.add('hidden');
            }, 300);
        });
    }
}

function setupCalibrateFeature() {
    const btn = document.getElementById('btn-calibrate');
    if(!btn) return;
    btn.addEventListener('click', function() {
        if(!isIotConnected) { alert("Hubungkan IoT Terlebih Dahulu!"); return; }
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengkalibrasi...';
        this.disabled = true;
        setTimeout(() => {
            this.innerHTML = '<i class="fa-solid fa-check text-ergo-green neon-glow"></i> Kalibrasi Selesai';
            addActivityLog('Sensor FSR Berhasil Dikalibrasi (0.0kg offset)', 'fa-weight-scale text-ergo-blue');
            playBeepCustom(600, 0.2);
            setTimeout(() => { this.innerHTML = '<i class="fa-solid fa-weight-scale"></i> Kalibrasi Beban FSR Awal'; this.disabled = false; }, 3000);
        }, 2000);
    });
}

function setupHardwareSimulator() {
    const btnTrigger = document.getElementById('btn-trigger-hardware');
    if(!btnTrigger) return;

    const steps = [
        { block: 'step-fsr', badge: 'badge-fsr', text: '🟢 Active' },
        { block: 'step-mux', badge: 'badge-mux', text: '🟢 Coupled' },
        { block: 'step-esp', badge: 'badge-esp', text: '🟢 Booted' },
        { block: 'step-cloud', badge: 'badge-cloud', text: '🟢 Stream Live' }
    ];

    btnTrigger.addEventListener('click', () => {
        initAudio();
        btnTrigger.disabled = true;
        btnTrigger.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing System...';
        btnTrigger.className = "mx-auto bg-slate-700 text-slate-400 font-bold py-4 px-10 rounded-2xl text-sm flex items-center justify-center gap-3 border border-slate-600 cursor-not-allowed";

        steps.forEach(s => {
            const blockEl = document.getElementById(s.block);
            const badgeEl = document.getElementById(s.badge);
            if(blockEl && badgeEl) {
                blockEl.className = "glass-card p-5 border-t-4 border-slate-600 transition-all duration-300 bg-slate-900/80";
                badgeEl.innerText = "Connecting...";
                badgeEl.className = "text-[10px] font-bold text-ergo-yellow animate-pulse neon-glow";
            }
        });

        steps.forEach((step, index) => {
            setTimeout(() => {
                const blockEl = document.getElementById(step.block);
                const badgeEl = document.getElementById(step.badge);
                if(blockEl && badgeEl) {
                    blockEl.className = "glass-card p-5 border-t-4 border-ergo-green shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02] transition-all duration-300 bg-slate-900/90";
                    badgeEl.innerText = step.text;
                    badgeEl.className = "text-[10px] font-bold text-ergo-green neon-glow";
                }
                
                playBeepCustom(440 + (index * 100), 0.15); 

                if (index === steps.length - 1) {
                    btnTrigger.innerHTML = '<i class="fa-solid fa-check"></i> Connected';
                    btnTrigger.className = "mx-auto bg-ergo-green text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] text-sm flex items-center justify-center gap-3 border border-green-400/50";
                    
                    isIotConnected = true;
                    
                    setTimeout(() => {
                        const iotModal = document.getElementById('iot-modal');
                        if(iotModal) {
                            iotModal.classList.add('opacity-0');
                            setTimeout(() => {
                                iotModal.style.display = 'none';
                                iotModal.classList.add('hidden');
                                
                                const lockOverlay = document.getElementById('lock-overlay');
                                if(lockOverlay) {
                                    lockOverlay.classList.add('opacity-0');
                                    setTimeout(() => lockOverlay.style.display = 'none', 300);
                                }
                                
                                startSessionTimer();
                                addActivityLog('IoT Hardware Synchronized', 'fa-circle-nodes text-ergo-green');
                                playBeepCustom(800, 0.3); 
                                
                                const btnIdeal = document.querySelector('[data-posture="ideal"]');
                                if(btnIdeal) btnIdeal.click();

                            }, 300);
                        }
                    }, 800);
                }
            }, (index + 1) * 400); 
        });
    });
}

function renderWeeklyLog() {
    const container = document.getElementById('weekly-grid');
    const daySelector = document.getElementById('day-selector');
    if(!container) return;
    container.innerHTML = '';
    
    const currentSelectedDay = daySelector ? parseInt(daySelector.value) : -1;
    
    weeklyData.forEach((d, index) => {
        const hasData = d.time > 0;
        const isCurrentSelected = index === currentSelectedDay;
        
        let bgClass = hasData ? 'bg-ergo-green/20 border-ergo-green/50 text-ergo-green shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-500';
        if (isCurrentSelected) bgClass += ' ring-2 ring-ergo-blue ring-offset-2 ring-offset-slate-900';
        
        let scoreHtml = '';
        if(hasData) {
            const min = Math.floor(d.time / 60); const sec = d.time % 60;
            const timeStr = min > 0 ? `${min}m` : `${sec}s`;
            scoreHtml = `<div class="text-[7px] font-bold mt-1 text-white">${d.score} pts</div><div class="text-[6px] text-slate-300">${timeStr}</div>`;
        }
        container.innerHTML += `<div class="flex flex-col items-center justify-center py-1.5 px-1 rounded border ${bgClass} transition-all"><span class="text-[9px] font-bold">${d.day}</span>${scoreHtml}</div>`;
    });
}

function setupDisconnectFeature() {
    const btnDisconnect = document.getElementById('btn-disconnect');
    const daySelector = document.getElementById('day-selector');
    
    if(!btnDisconnect) return;

    btnDisconnect.addEventListener('click', () => {
        if(!isIotConnected) return;

        const dayIndex = daySelector ? parseInt(daySelector.value) : 0; 
        const scoreTxt = document.getElementById('score-text');
        const finalScore = scoreTxt ? parseInt(scoreTxt.innerText) || 0 : 0;
        
        weeklyData[dayIndex].time += sessionSeconds; 
        weeklyData[dayIndex].totalScore += finalScore; 
        weeklyData[dayIndex].sessions += 1;
        weeklyData[dayIndex].score = Math.round(weeklyData[dayIndex].totalScore / weeklyData[dayIndex].sessions);

        renderWeeklyLog(); 

        const toast = document.getElementById('toast-save');
        if(toast) {
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            setTimeout(() => { toast.classList.remove('translate-y-0', 'opacity-100'); toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
        }

        isIotConnected = false;
        clearInterval(sessionInterval);
        sessionSeconds = 0;
        sessionStats = { ideal: 0, warning: 0, danger: 0 };
        updateSessionRatioUI();
        
        document.getElementById('realtime-clock').innerText = "00:00:00";
        const dot = document.getElementById('hardware-status-dot');
        const txt = document.getElementById('hardware-status-text');
        if(dot) dot.className = "w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5 shadow-[0_0_5px_rgba(255,255,255,0.1)]";
        if(txt) { txt.innerText = "Disconnected"; txt.className = "text-slate-300"; }
        
        const lockOverlay = document.getElementById('lock-overlay');
        if(lockOverlay) {
            lockOverlay.style.display = 'flex';
            setTimeout(() => lockOverlay.classList.remove('opacity-0'), 50);
        }
        
        const btnTrigger = document.getElementById('btn-trigger-hardware');
        if(btnTrigger) {
            btnTrigger.disabled = false;
            btnTrigger.innerHTML = '<i class="fa-solid fa-power-off text-lg"></i> Initialize IoT Connection';
            btnTrigger.className = "mx-auto bg-ergo-blue hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.5)] text-sm flex items-center justify-center gap-3 border border-blue-400/50 hover:scale-105";
        }

        const steps = ['fsr', 'mux', 'esp', 'cloud'];
        steps.forEach(s => {
            const blockEl = document.getElementById('step-'+s);
            const badgeEl = document.getElementById('badge-'+s);
            if(blockEl) blockEl.className = "glass-card p-5 border-t-4 border-slate-600 transition-all duration-300 bg-slate-900/80";
            if(badgeEl) { badgeEl.innerText = "Offline"; badgeEl.className = "text-[10px] font-bold text-slate-500"; }
        });
        
        applySimulation('empty');
        document.getElementById('activity-log').innerHTML = ''; 
        playBeepCustom(300, 0.4); 
    });
}

function startSessionTimer() {
    clearInterval(sessionInterval);
    sessionSeconds = 0;
    sessionStats = { ideal: 0, warning: 0, danger: 0 };
    updateSessionRatioUI();
    const rClock = document.getElementById('realtime-clock');
    if(rClock) rClock.innerText = "00:00:00"; 
    
    sessionInterval = setInterval(() => {
        if (isIotConnected && rClock) {
            sessionSeconds++;
            const h = Math.floor(sessionSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((sessionSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (sessionSeconds % 60).toString().padStart(2, '0');
            rClock.innerText = `${h}:${m}:${s}`;

            if(currentPosture === 'ideal') sessionStats.ideal++;
            else if(['left', 'right', 'back'].includes(currentPosture)) sessionStats.warning++;
            else if(['forward'].includes(currentPosture)) sessionStats.danger++;
            
            updateSessionRatioUI();
        }
    }, 1000);
}

function updateSessionRatioUI() {
    let total = sessionStats.ideal + sessionStats.warning + sessionStats.danger;
    let pI = 0, pW = 0, pD = 0;
    if (total > 0) {
        pI = (sessionStats.ideal / total) * 100; pW = (sessionStats.warning / total) * 100; pD = (sessionStats.danger / total) * 100;
    }
    const bI = document.getElementById('bar-ideal'); const bW = document.getElementById('bar-warning'); const bD = document.getElementById('bar-danger');
    if(bI) bI.style.width = pI + '%'; if(bW) bW.style.width = pW + '%'; if(bD) bD.style.width = pD + '%';
    
    const tI = document.getElementById('text-ideal-pct'); const tW = document.getElementById('text-warning-pct'); const tD = document.getElementById('text-danger-pct');
    if(tI) tI.innerText = `Ideal: ${Math.round(pI)}%`; if(tW) tW.innerText = `Warn: ${Math.round(pW)}%`; if(tD) tD.innerText = `Danger: ${Math.round(pD)}%`;
}

function initHeatmapGrid() {
    const grid = document.getElementById('heatmap-grid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<16; i++) {
        const cell = document.createElement('div');
        cell.className = 'h-full w-full rounded-[4px] flex items-center justify-center relative group transition-colors duration-700';
        cell.id = `cell-${i}`;
        const label = document.createElement('span');
        label.className = 'text-[6px] text-white font-bold opacity-30 group-hover:opacity-100 pointer-events-none drop-shadow-md';
        label.innerText = `S${i+1}`;
        cell.appendChild(label);
        grid.appendChild(cell);
    }
}

function setupAnthropometry() {
    const select = document.getElementById('anthro-select');
    if(!select) return;
    select.addEventListener('change', (e) => {
        const val = e.target.value;
        const p = document.getElementById('anthro-popliteal'); const d = document.getElementById('anthro-depth'); const w = document.getElementById('anthro-width');
        if(p) p.innerText = anthropometryData[val].popliteal; if(d) d.innerText = anthropometryData[val].depth; if(w) w.innerText = anthropometryData[val].width;
        if(isIotConnected) addActivityLog(`Profile changed to ${val}th Pct`, 'fa-ruler text-ergo-blue');
    });
}

function setupExportFeature() {
    const btn = document.getElementById('btn-export');
    if(!btn) return;
    btn.addEventListener('click', () => {
        const toast = document.getElementById('toast-export');
        if(toast) {
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            if(isIotConnected) addActivityLog('Generating PDF Report...', 'fa-file-pdf text-ergo-green');
            generateRealPDF();
            setTimeout(() => { toast.classList.remove('translate-y-0', 'opacity-100'); toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
        }
    });
}

function generateRealPDF() {
    if(!window.jspdf) { alert("Library PDF belum termuat!"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(2, 132, 199); 
    doc.text("ErgoSmart Chair - Live Evaluation Report", 105, 20, { align: "center" });
    doc.setFontSize(10); doc.setTextColor(100, 116, 139); 
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 28, { align: "center" });
    doc.setDrawColor(200, 200, 200); doc.line(20, 34, 190, 34);

    doc.setFontSize(14); doc.setTextColor(30, 41, 59); doc.text("1. Profil Antropometri Pengguna", 20, 48);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const p = document.getElementById('anthro-popliteal'); const d = document.getElementById('anthro-depth'); const w = document.getElementById('anthro-width');
    doc.text(`• Tinggi Popliteal (Dudukan)  : ${p ? p.innerText : '-'}`, 25, 57);
    doc.text(`• Kedalaman Dudukan         : ${d ? d.innerText : '-'}`, 25, 64);
    doc.text(`• Lebar Pinggul                     : ${w ? w.innerText : '-'}`, 25, 71);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("2. Laporan Sesi Duduk Mingguan (Senin-Minggu)", 20, 88);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    let yTable = 97;
    weeklyData.forEach((dayData) => {
        let timeStr = "0 detik";
        if(dayData.time > 0) {
            const min = Math.floor(dayData.time / 60); const sec = dayData.time % 60;
            timeStr = min > 0 ? `${min} menit ${sec} detik` : `${sec} detik`;
        }
        let sessionInfo = dayData.sessions > 0 ? `(${dayData.sessions} sesi)` : '';
        doc.text(`Hari ${dayData.day}   |   Skor Rata-rata: ${dayData.score}/100 ${sessionInfo}   |   Total Durasi: ${timeStr}`, 25, yTable);
        yTable += 7;
    });

    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("3. Rekaman Log Aktivitas Terakhir", 20, 155);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const logItems = document.querySelectorAll('#activity-log .log-item');
    let yPos = 164; let logCount = 0;
    logItems.forEach((item) => {
        if(logCount >= 10) return; 
        const msg = item.querySelector('p:first-child').innerText;
        const time = item.querySelector('p:last-child').innerText;
        doc.text(`[${time}] - ${msg}`, 25, yPos);
        yPos += 7; logCount++;
    });

    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text("Dokumen ini digenerate secara langsung dari ErgoSmart IoT Dashboard Simulator.", 105, 280, { align: "center" });

    doc.save("ErgoSmart_Report.pdf");
}

function setupSimulationButtons() {
    const buttons = document.querySelectorAll('.sim-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!isIotConnected) return;
            buttons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            applySimulation(e.currentTarget.getAttribute('data-posture'));
        });
    });
    const btnCloseModal = document.getElementById('close-modal-btn');
    if(btnCloseModal) btnCloseModal.addEventListener('click', closeWarningModal);
}

function applySimulation(mode) {
    currentPosture = mode;
    const matrix = matricesData[mode];
    renderHeatmapColors(matrix);
    const analysisResult = analyzePostureRuleBased(matrix);
    updateStatusUI(analysisResult);
    updateScoreUI(analysisResult.score, analysisResult.colorStroke);
    
    if(isIotConnected && typeof addChartData === 'function') {
        addChartData(analysisResult.score);
        addActivityLog(`${analysisResult.title} detected`, analysisResult.iconClass);
        evaluateNotificationTimer(analysisResult.score);
    }
    if(typeof window.update3DLighting === 'function') { window.update3DLighting(mode); }
}

function getColorForValue(val) {
    if (val === 0) return 'rgba(30, 41, 59, 0.8)'; 
    if (val <= 25) return '#0ea5e9'; 
    if (val <= 50) return '#10b981'; 
    if (val <= 75) return '#f59e0b'; 
    return '#ef4444';                
}

function renderHeatmapColors(matrix) {
    matrix.forEach((val, index) => {
        const cell = document.getElementById(`cell-${index}`);
        if(cell) {
            cell.style.backgroundColor = getColorForValue(val);
            cell.style.boxShadow = val > 0 ? `0 0 8px ${getColorForValue(val)}` : 'none';
            cell.style.transform = `scale(${val > 60 ? 0.9 : 1})`;
        }
    });
}

function analyzePostureRuleBased(matrix) {
    let sumTotal = 0, sumLeft = 0, sumRight = 0, sumFront = 0, sumBack = 0;
    matrix.forEach((val, i) => { sumTotal += val; if(i%4 < 2) sumLeft += val; else sumRight += val; if(i < 8) sumFront += val; else sumBack += val; });

    if (!isIotConnected) return { title: 'System Offline', desc: 'Menunggu koneksi.', score: 0, colorStroke: '#334155', iconClass: 'fa-ban text-slate-500', sensors: 'Offline', guideTitle: 'Hardware Offline', guideDesc: 'Klik tombol Connect IoT First.', guideBg: 'bg-slate-800/80 border border-slate-700 text-slate-400', guideIcon: 'fa-solid fa-power-off text-slate-500' };
    if (sumTotal === 0) return { title: 'Empty Seat', desc: 'Kursi kosong.', score: 0, colorStroke: '#334155', iconClass: 'fa-ban text-slate-500', sensors: 'Tidak ada sensor aktif', guideTitle: 'Standby Mode', guideDesc: 'Siap memantau saat Anda duduk.', guideBg: 'bg-slate-800/80 border border-slate-700 text-slate-400', guideIcon: 'fa-solid fa-power-off text-slate-500' };

    const diffLeftRight = Math.abs(sumLeft - sumRight) / sumTotal;
    const diffFrontBack = Math.abs(sumFront - sumBack) / sumTotal;

    if (diffLeftRight < 0.2 && diffFrontBack < 0.2 && sumTotal > 200) return { title: 'Ideal Posture', desc: 'Tekanan merata.', score: 95, colorStroke: '#10B981', iconClass: 'fa-check-circle text-ergo-green', sensors: 'S1-S16 Normal', guideTitle: 'Pertahankan Posisi!', guideDesc: 'Sangat baik. Meminimalkan risiko beban.', guideBg: 'bg-emerald-900/30 border border-emerald-500/50 text-emerald-300', guideIcon: 'fa-solid fa-circle-check text-ergo-green' };
    if (diffLeftRight >= 0.2 && sumLeft > sumRight) return { title: 'Leaning Left', desc: 'Tekanan berlebih di kiri.', score: 68, colorStroke: '#F59E0B', iconClass: 'fa-arrow-rotate-left text-ergo-yellow', sensors: 'S1, S2, S5, S6... (Kiri)', guideTitle: 'Koreksi Sisi Kanan', guideDesc: 'Seimbangkan berat badan ke tengah.', guideBg: 'bg-amber-900/30 border border-amber-500/50 text-amber-300', guideIcon: 'fa-solid fa-triangle-exclamation text-ergo-yellow' };
    if (diffLeftRight >= 0.2 && sumRight > sumLeft) return { title: 'Leaning Right', desc: 'Tekanan berlebih di kanan.', score: 65, colorStroke: '#F59E0B', iconClass: 'fa-arrow-rotate-right text-ergo-yellow', sensors: 'S3, S4, S7, S8... (Kanan)', guideTitle: 'Koreksi Sisi Kiri', guideDesc: 'Seimbangkan posisi duduk.', guideBg: 'bg-amber-900/30 border border-amber-500/50 text-amber-300', guideIcon: 'fa-solid fa-triangle-exclamation text-ergo-yellow' };
    if (diffFrontBack >= 0.2 && sumFront > sumBack) return { title: 'Slouching', desc: 'Tekanan di depan.', score: 45, colorStroke: '#EF4444', iconClass: 'fa-person-falling text-ergo-red', sensors: 'S1-S8 (Depan)', guideTitle: 'Tegakkan Punggung', guideDesc: 'Mundurkan pinggul hingga menyentuh lumbar.', guideBg: 'bg-red-900/30 border border-red-500/50 text-red-300', guideIcon: 'fa-solid fa-circle-exclamation text-ergo-red' };

    return { title: 'Leaning Back', desc: 'Terlalu menyandar.', score: 55, colorStroke: '#F97316', iconClass: 'fa-person-praying text-ergo-orange', sensors: 'S9-S16 (Belakang)', guideTitle: 'Atur Sudut Kemiringan', guideDesc: 'Kurangi sudut sandaran kursi Anda.', guideBg: 'bg-orange-900/30 border border-orange-500/50 text-orange-300', guideIcon: 'fa-solid fa-circle-exclamation text-ergo-orange' };
}

function updateStatusUI(data) {
    const t = document.getElementById('status-title'); const d = document.getElementById('status-desc'); const i = document.getElementById('status-icon');
    if(t) t.innerText = data.title; if(d) d.innerText = data.desc; if(i) i.innerHTML = `<i class="fa-solid ${data.iconClass} neon-glow"></i>`;
    
    const sessStatus = document.getElementById('session-status-text');
    const statusDot = document.getElementById('hardware-status-dot');
    const statusTxt = document.getElementById('hardware-status-text');
    
    if (isIotConnected) {
        if(sessStatus) sessStatus.innerHTML = `<span class="animate-pulse w-1.5 h-1.5 bg-ergo-blue rounded-full inline-block mr-1"></span> Live Data Stream`;
        if(statusDot) statusDot.className = "w-1.5 h-1.5 rounded-full bg-ergo-green animate-pulse mr-1.5 shadow-[0_0_5px_#10b981]";
        if(statusTxt) { statusTxt.innerText = "Connected"; statusTxt.className = "text-white"; }
    } else {
        if(sessStatus) sessStatus.innerText = "Status: Offline";
    }
    
    const loc = document.getElementById('sensor-location-text'); const gTitle = document.getElementById('guide-title'); const gInst = document.getElementById('guide-instruction'); const gBox = document.getElementById('guide-box'); const gIcon = document.getElementById('guide-icon');
    if(loc) loc.innerText = data.sensors; if(gTitle) gTitle.innerText = data.guideTitle; if(gInst) gInst.innerText = data.guideDesc;
    if(gBox) gBox.className = `p-2.5 rounded-xl flex items-start gap-2 transition-colors duration-300 ${data.guideBg}`; if(gIcon) gIcon.innerHTML = `<i class="${data.guideIcon} neon-glow"></i>`;
}

function updateScoreUI(score, color) {
    const st = document.getElementById('score-text'); const sc = document.getElementById('score-circle');
    if(st) st.innerText = score; if(sc) { sc.setAttribute('stroke', color); sc.style.strokeDashoffset = 176 - (score / 100) * 176; }
}

function addActivityLog(message, iconClassHtml) {
    const log = document.getElementById('activity-log');
    if(!log) return;
    const logItem = document.createElement('div');
    logItem.className = 'flex items-start text-[10px] border-b border-slate-700/50 pb-1.5 log-item';
    logItem.innerHTML = `<div class="mr-2 mt-0.5"><i class="fa-solid ${iconClassHtml}"></i></div><div class="flex-1"><p class="text-slate-300 font-semibold">${message}</p><p class="text-slate-500 text-[8px] mt-0.5">${new Date().toLocaleTimeString('id-ID', { hour12: false })}</p></div>`;
    log.prepend(logItem);
}

function evaluateNotificationTimer(score) {
    if(score === 0 || score >= 80) { clearTimeout(badPostureTimer); badPostureTimer = null; return; }
    if (!badPostureTimer) badPostureTimer = setTimeout(() => { triggerWarningModal(); addActivityLog('Warning Notification Sent', 'fa-bell text-ergo-red animate-pulse'); }, BAD_POSTURE_LIMIT_MS);
}

function triggerWarningModal() {
    playBeepCustom(800, 0.3);
    const modal = document.getElementById('warning-modal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('opacity-0'); modal.classList.add('opacity-100'); }, 10); }
}

function closeWarningModal() {
    const modal = document.getElementById('warning-modal');
    if(modal) { modal.classList.remove('opacity-100'); modal.classList.add('opacity-0'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300); }
    clearTimeout(badPostureTimer); badPostureTimer = null;
}
