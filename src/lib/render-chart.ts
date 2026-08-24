import { Chart } from 'chart.js/auto';

// Data-mark colors. Main line color is per-chart (validated palette,
// src/lib/chart-colors.ts); the goal line always stays gold — validated
// against every palette option so any choice pairs safely with it.
const CHART_GOLD = '#b8860b';
const GRID = '#e6e9e6';
const AXIS_INK = '#8a938a';

function chartFontSize(): number {
    return window.innerWidth < 480 ? 10 : 12;
}

// Give every point a minimum amount of horizontal room. When a chart has more
// points than fit in that space, the sizer div grows wider than its scroll
// box instead of squeezing points together, and the box scrolls horizontally.
function layoutChartWidth(canvas: HTMLCanvasElement, pointCount: number): void {
    const sizer = canvas.parentElement as HTMLElement | null;
    const scrollBox = sizer?.parentElement as HTMLElement | null;
    if (!sizer || !scrollBox) return;

    const minPxPerPoint = window.innerWidth < 640 ? 34 : 22;
    const neededWidth = pointCount * minPxPerPoint;
    const scrollable = neededWidth > scrollBox.clientWidth;
    sizer.style.width = scrollable ? `${neededWidth}px` : '100%';

    const hint = document.getElementById('chart-scroll-hint');
    if (hint) hint.style.display = scrollable ? 'block' : 'none';
}

export function renderChart(canvas: HTMLCanvasElement, chartData: any, entries: any[]): Chart {
    const CHART_MAIN = chartData.color || '#1f7a3d';
    const labels = entries.map((e: any) => e.entry_date);
    layoutChartWidth(canvas, entries.length);

    // Shrink markers once points are packed tightly, so dense charts don't
    // turn into a solid smear of overlapping dots.
    const dense = entries.length > 60;
    const basePointRadius = dense ? 3 : 4;
    const annotationPointRadius = dense ? 6 : 7;

    // Auto-expand each axis to fit the actual data if it falls outside the
    // chart's configured range, instead of silently clipping points at the edge.
    const scores = entries.map((e: any) => e.score);
    if (chartData.goal_score !== null) scores.push(chartData.goal_score);
    const dataYMin = scores.length ? Math.min(...scores) : chartData.y_min;
    const dataYMax = scores.length ? Math.max(...scores) : chartData.y_max;
    const effectiveYMin = Math.min(chartData.y_min, dataYMin);
    const effectiveYMax = Math.max(chartData.y_max, dataYMax);

    const datasets: any[] = [{
        label: chartData.y_axis_label,
        data: entries.map((e: any) => e.score),
        borderColor: CHART_MAIN,
        borderWidth: 2,
        backgroundColor: `${CHART_MAIN}1a`, // ~10% opacity wash
        pointBackgroundColor: entries.map((e: any) => e.annotation ? CHART_GOLD : CHART_MAIN),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: entries.map((e: any) => e.annotation ? annotationPointRadius : basePointRadius),
        pointHoverRadius: entries.map((e: any) => e.annotation ? annotationPointRadius + 2 : basePointRadius + 2),
        tension: 0.15,
        fill: true,
    }];

    const hasGoal = chartData.goal_score !== null && labels.length > 0;
    if (hasGoal) {
        datasets.push({
            label: 'Goal',
            data: labels.map(() => chartData.goal_score),
            borderColor: CHART_GOLD,
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
        });
    }

    const chartInstance = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    title: { display: true, text: chartData.x_axis_label, color: '#666', font: { size: chartFontSize() } },
                    grid: { display: false },
                    ticks: { color: AXIS_INK, font: { size: chartFontSize() }, autoSkip: true, maxRotation: 0 },
                    border: { color: GRID },
                },
                y: {
                    title: { display: true, text: chartData.y_axis_label, color: '#666', font: { size: chartFontSize() } },
                    min: effectiveYMin,
                    max: effectiveYMax,
                    grace: '5%',
                    grid: { color: GRID },
                    ticks: { color: AXIS_INK, font: { size: chartFontSize() } },
                    border: { display: false },
                },
            },
            plugins: {
                legend: {
                    display: hasGoal,
                    labels: { boxWidth: 22, boxHeight: 2, color: '#444', font: { size: 12 }, usePointStyle: false },
                },
                tooltip: {
                    backgroundColor: '#1e4620',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    cornerRadius: 6,
                    titleFont: { weight: '600' },
                    bodyFont: { weight: '600' },
                    callbacks: {
                        afterLabel: (ctx: any) => {
                            if (ctx.dataset.label === 'Goal') return '';
                            const annotation = entries[ctx.dataIndex]?.annotation;
                            return annotation ? `Note: ${annotation}` : '';
                        },
                    },
                },
            },
        },
    });

    window.addEventListener('resize', () => {
        const size = chartFontSize();
        chartInstance.options.scales!.x!.ticks!.font = { size };
        chartInstance.options.scales!.y!.ticks!.font = { size };
        layoutChartWidth(canvas, entries.length);
        chartInstance.resize();
        chartInstance.update('none');
    });

    return chartInstance;
}
