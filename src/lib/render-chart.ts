import { Chart } from 'chart.js/auto';
import { formatMetric } from './format';

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
    sizer.style.width = neededWidth > scrollBox.clientWidth ? `${neededWidth}px` : '100%';

    setupChartNav(scrollBox);
    updateNavButtons(scrollBox);
}

function updateNavButtons(scrollBox: HTMLElement): void {
    const leftBtn = document.getElementById('chart-nav-left');
    const rightBtn = document.getElementById('chart-nav-right');
    if (!leftBtn || !rightBtn) return;

    const scrollable = scrollBox.scrollWidth > scrollBox.clientWidth + 1;
    leftBtn.classList.toggle('visible', scrollable && scrollBox.scrollLeft > 4);
    rightBtn.classList.toggle('visible', scrollable && scrollBox.scrollLeft < scrollBox.scrollWidth - scrollBox.clientWidth - 4);
}

// Left/right arrow buttons page the scroll box by ~80% of its width so users
// can step through a wide chart without having to drag-scroll it by hand.
function setupChartNav(scrollBox: HTMLElement): void {
    const leftBtn = document.getElementById('chart-nav-left');
    const rightBtn = document.getElementById('chart-nav-right');
    if (!leftBtn || !rightBtn || scrollBox.dataset.navBound) return;
    scrollBox.dataset.navBound = 'true';

    const page = () => Math.max(scrollBox.clientWidth * 0.8, 120);
    leftBtn.addEventListener('click', () => scrollBox.scrollBy({ left: -page(), behavior: 'smooth' }));
    rightBtn.addEventListener('click', () => scrollBox.scrollBy({ left: page(), behavior: 'smooth' }));
    scrollBox.addEventListener('scroll', () => updateNavButtons(scrollBox));
}

function escapeHtml(str: string): string {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, (c) => map[c]);
}

function getOrCreateTooltipEl(): HTMLDivElement {
    let el = document.getElementById('chart-tooltip-el') as HTMLDivElement | null;
    if (!el) {
        el = document.createElement('div');
        el.id = 'chart-tooltip-el';
        el.className = 'chart-tooltip-el';
        document.body.appendChild(el);
    }
    return el;
}

// Renders the tooltip as a real HTML element (instead of Chart.js's default
// canvas-drawn tooltip) so it can be measured and clamped to the actual
// browser viewport — it can no longer render off the edge of the page, even
// when the chart itself is wider than the screen and horizontally scrolled.
function externalTooltipHandler(context: any): void {
    const { chart, tooltip } = context;
    const el = getOrCreateTooltipEl();

    if (tooltip.opacity === 0) {
        el.style.opacity = '0';
        return;
    }

    let html = '';
    (tooltip.title || []).forEach((title: string) => {
        html += `<div class="ct-title">${escapeHtml(title)}</div>`;
    });
    (tooltip.body || []).forEach((b: any, i: number) => {
        const dp = tooltip.dataPoints[i];
        const color = dp.dataset.borderColor as string;
        const lines = [...(b.before || []), ...(b.lines || [])];
        if (lines.length) {
            html += `<div class="ct-row"><span class="ct-dot" style="background:${color}"></span>${escapeHtml(lines.join(' '))}</div>`;
        }
        (b.after || []).forEach((line: string) => {
            html += `<div class="ct-note">${escapeHtml(line)}</div>`;
        });
    });
    el.innerHTML = html;
    el.style.opacity = '1';

    const canvasRect = chart.canvas.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const margin = 10;

    let left = canvasRect.left + window.scrollX + tooltip.caretX - rect.width / 2;
    const minLeft = window.scrollX + margin;
    const maxLeft = window.scrollX + window.innerWidth - rect.width - margin;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    let top = canvasRect.top + window.scrollY + tooltip.caretY - rect.height - 14;
    const minTop = window.scrollY + margin;
    if (top < minTop) {
        // Not enough room above the point — show the tooltip below it instead.
        top = canvasRect.top + window.scrollY + tooltip.caretY + 14;
    }
    const maxTop = window.scrollY + window.innerHeight - rect.height - margin;
    top = Math.min(Math.max(top, minTop), maxTop);

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
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
                    ticks: {
                        color: AXIS_INK,
                        font: { size: chartFontSize() },
                        callback: (value: any) => formatMetric(Number(value), chartData.y_axis_label),
                    },
                    border: { display: false },
                },
            },
            plugins: {
                legend: {
                    display: hasGoal,
                    labels: { boxWidth: 22, boxHeight: 2, color: '#444', font: { size: 12 }, usePointStyle: false },
                },
                tooltip: {
                    enabled: false,
                    external: externalTooltipHandler,
                    callbacks: {
                        label: (ctx: any) => `${ctx.dataset.label}: ${formatMetric(ctx.parsed.y, chartData.y_axis_label)}`,
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

// Highlights one point on the chart (used by the focus-view slideshow) and,
// if the chart is scrolled horizontally, scrolls that point into view.
export function setActivePoint(chart: Chart, entries: any[], activeIndex: number | null): void {
    const dataset = chart.data.datasets[0] as any;
    const dense = entries.length > 60;
    const baseR = dense ? 3 : 4;
    const annR = dense ? 6 : 7;

    dataset.pointRadius = entries.map((e: any, i: number) => {
        const r = e.annotation ? annR : baseR;
        return i === activeIndex ? r + 5 : r;
    });
    dataset.pointBorderColor = entries.map((_: any, i: number) => (i === activeIndex ? '#1e4620' : '#fff'));
    dataset.pointBorderWidth = entries.map((_: any, i: number) => (i === activeIndex ? 3 : 2));
    chart.update('none');

    if (activeIndex === null) return;
    const point = chart.getDatasetMeta(0).data[activeIndex] as any;
    const scrollBox = chart.canvas.parentElement?.parentElement as HTMLElement | null;
    if (point && scrollBox && scrollBox.scrollWidth > scrollBox.clientWidth) {
        const target = point.x - scrollBox.clientWidth / 2;
        scrollBox.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
}
