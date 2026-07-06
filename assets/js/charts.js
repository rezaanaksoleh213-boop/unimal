let postureChartInstance = null;

function initPostureChart() {
    const ctx = document.getElementById('postureChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.5)'); 
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

    postureChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], 
            datasets: [{
                label: 'Posture Score',
                data: [], 
                borderColor: '#0ea5e9', 
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#0ea5e9',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 800, easing: 'easeOutQuart' },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }, ticks: { stepSize: 25, font: { size: 9 }, color: '#64748b' } },
                x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#64748b', maxTicksLimit: 5 } }
            },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 11, color: '#e2e8f0' }, bodyFont: { size: 12, color: '#38bdf8' }, padding: 10, displayColors: false, borderColor: 'rgba(14, 165, 233, 0.3)', borderWidth: 1 } }
        }
    });
    addChartData(0);
}

function addChartData(score) {
    if (!postureChartInstance) return;
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const chartData = postureChartInstance.data;
    chartData.labels.push(timeLabel);
    chartData.datasets[0].data.push(score);
    if (chartData.labels.length > 10) { chartData.labels.shift(); chartData.datasets[0].data.shift(); }
    postureChartInstance.update();
}
