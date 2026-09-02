// --- API Configuration ---
const _0x1a2b = 'aHR0cHM6Ly93d3cudmFuZy50b2RheS9hcGkvcHJpY2VzLnBocA==';
const getVangTodayApi = () => atob(_0x1a2b);
const HANA_API_BASE = 'https://api.hanagold.vn/app/pnl/pnl-chart?baseCurrency=VNDC&currency=';

// Constants for conversion
const OZ_TO_TAEL = 1.205653;
const USD_TO_VND = 25400;

// Chart instances
let goldChart = null;
let silverChart = null;

// Raw Data Stores
let rawVangTodayGold = []; // from vang.today
let rawHanaGold = [];      // from hanagold (CHI)
let rawHanaSilver = [];    // from hanagold (SILVER)

// Selected filters
let currentDays = '3m';
let currentUnit = 'VND';

// Elegant Colors (Gold/Silver theme)
const COLOR_MIENG = '#fbbf24'; 
const COLOR_NHAN = '#f59e0b';
const COLOR_TRANGSUC = '#d97706';
const COLOR_THEGIOI = '#fef08a';
const COLOR_BAC_VN = '#e5e7eb';
const COLOR_BAC_TG = '#9ca3af';

const formatVND = (value) => new Intl.NumberFormat('vi-VN').format(Math.round(value));
const formatShortVND = (value) => (value / 1000000).toFixed(1) + 'M';

// DOM Elements
const loadingOverlay = document.getElementById('loading');
const legendDateGold = document.getElementById('legend-date-gold');
const valMieng = document.getElementById('val-mieng');
const valNhan = document.getElementById('val-nhan');
const valTrangsuc = document.getElementById('val-trangsuc');
const valThegioi = document.getElementById('val-thegioi');
const legendDateSilver = document.getElementById('legend-date-silver');
const valSilver = document.getElementById('val-silver');
const valSilverWorld = document.createElement('div'); // create virtual element to reuse code if needed
const legendGold = document.getElementById('custom-legend-gold');
const legendSilver = document.getElementById('custom-legend-silver');

// Min/Max DOM
const minGoldEl = document.getElementById('min-gold');
const maxGoldEl = document.getElementById('max-gold');
const minSilverEl = document.getElementById('min-silver');
const maxSilverEl = document.getElementById('max-silver');

// Stat Cards DOM
const statGoldVnVal = document.getElementById('stat-gold-vn-val');
const statGoldVnChange = document.getElementById('stat-gold-vn-change');
const statGoldWorldVal = document.getElementById('stat-gold-world-val');
const statGoldWorldChange = document.getElementById('stat-gold-world-change');
const statSilverVnVal = document.getElementById('stat-silver-vn-val');
const statSilverVnChange = document.getElementById('stat-silver-vn-change');
const statSilverWorldVal = document.getElementById('stat-silver-world-val');
const statSilverWorldChange = document.getElementById('stat-silver-world-change');

// Modal DOM
const modalOverlay = document.getElementById('api-modal');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtn = document.getElementById('close-modal');

openModalBtn.addEventListener('click', () => modalOverlay.classList.add('active'));
closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
});

// Create Gradient
const getGradient = (ctx, colorHex) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    let r = 0, g = 0, b = 0;
    if (colorHex.length === 7) {
        r = parseInt(colorHex.substring(1,3), 16);
        g = parseInt(colorHex.substring(3,5), 16);
        b = parseInt(colorHex.substring(5,7), 16);
    }
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
    return gradient;
};

// Custom Tooltip Data extraction
let currentGoldTooltipData = [];
let currentSilverTooltipData = [];

const getCommonOptions = (isPercentage, onHoverCallback, legendElement) => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    displayFormats: { 
                        hour: 'HH:mm',
                        day: 'dd/MM',
                        month: 'MM/yyyy',
                        year: 'yyyy'
                    }
                },
                grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                border: { display: false },
                ticks: { color: '#6b7280', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
            },
            y: {
                position: 'right',
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                border: { display: false },
                ticks: {
                    color: '#6b7280',
                    callback: function(value) { return isPercentage ? value.toFixed(1) + '%' : formatShortVND(value); }
                }
            }
        },
        elements: {
            point: { radius: 0, hoverRadius: 6 },
            line: { borderWidth: 2, tension: 0.1 }
        },
        onHover: (event, elements, chart) => {
            if (elements && elements.length > 0) {
                legendElement.style.opacity = '1';
                const chartRect = chart.canvas.getBoundingClientRect();
                
                // Use event.x and event.y from Chart.js for absolute precision
                let left = event.x + 15;
                let top = event.y - 15;
                
                // Prevent overflow right
                if (left + legendElement.offsetWidth > chartRect.width) {
                    left = event.x - legendElement.offsetWidth - 15;
                }
                // Prevent overflow bottom
                if (top + legendElement.offsetHeight > chartRect.height) {
                    top = event.y - legendElement.offsetHeight - 15;
                }
                
                legendElement.style.left = left + 'px';
                legendElement.style.top = top + 'px';
                
                onHoverCallback(elements[0].index);
            } else {
                legendElement.style.opacity = '0';
            }
        }
    };
};

const initCharts = () => {
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    const ctxGold = document.getElementById('goldChart').getContext('2d');
    goldChart = new Chart(ctxGold, {
        type: 'line',
        data: { datasets: [] },
        options: getCommonOptions(currentUnit === '%', updateLegendGold, legendGold)
    });
    document.getElementById('goldChart').addEventListener('mouseout', () => legendGold.style.opacity = '0');

    const ctxSilver = document.getElementById('silverChart').getContext('2d');
    silverChart = new Chart(ctxSilver, {
        type: 'line',
        data: { datasets: [] },
        options: getCommonOptions(currentUnit === '%', updateLegendSilver, legendSilver)
    });
    document.getElementById('silverChart').addEventListener('mouseout', () => legendSilver.style.opacity = '0');
};

const formatDateTooltip = (timestampMs) => {
    const d = new Date(timestampMs);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const Min = String(d.getMinutes()).padStart(2, '0');
    
    const isShort = ['6h', '1d', '7d'].includes(currentDays);
    if (isShort) {
        return `${HH}h${Min} ${dd}/${mm}/${yyyy}`;
    }
    return `${dd}/${mm}/${yyyy}`;
};

const updateLegendGold = (index) => {
    if (!currentGoldTooltipData[index]) return;
    const pt = currentGoldTooltipData[index];
    legendDateGold.textContent = formatDateTooltip(pt.timestamp);
    
    valMieng.textContent = pt.pM !== null ? (currentUnit === '%' ? pt.pM.toFixed(2)+'%' : formatVND(pt.pM)) : '...';
    valNhan.textContent = pt.pN !== null ? (currentUnit === '%' ? pt.pN.toFixed(2)+'%' : formatVND(pt.pN)) : '...';
    valTrangsuc.textContent = pt.pTs !== null ? (currentUnit === '%' ? pt.pTs.toFixed(2)+'%' : formatVND(pt.pTs)) : '...';
    valThegioi.textContent = pt.pTg !== null ? (currentUnit === '%' ? pt.pTg.toFixed(2)+'%' : formatVND(pt.pTg)) : '...';
};

const updateLegendSilver = (index) => {
    if (!currentSilverTooltipData[index]) return;
    const pt = currentSilverTooltipData[index];
    legendDateSilver.textContent = formatDateTooltip(pt.timestamp);
    
    // We add a new div in HTML via JS for World Silver tooltip
    if(!document.getElementById('val-silver-world-tooltip')) {
        const row = document.createElement('div');
        row.className = 'legend-item';
        row.innerHTML = `<span class="legend-color color-silver"></span><span>Bạc Thế Giới:</span> <strong id="val-silver-world-tooltip" class="legend-value">...</strong>`;
        document.getElementById('val-silver').parentNode.parentNode.appendChild(row);
    }
    
    valSilver.textContent = pt.pBacVn !== null ? (currentUnit === '%' ? pt.pBacVn.toFixed(2)+'%' : formatVND(pt.pBacVn)) : '...';
    const valSilverWorldEl = document.getElementById('val-silver-world-tooltip');
    if (valSilverWorldEl) {
        valSilverWorldEl.textContent = pt.pBacTg !== null ? (currentUnit === '%' ? pt.pBacTg.toFixed(2)+'%' : formatVND(pt.pBacTg)) : '...';
    }
};

const processAllData = () => {
    const isShort = ['6h', '1d', '7d'].includes(currentDays);
    
    let dMieng=[], dNhan=[], dTrangsuc=[], dThegioi=[], dBacVN=[], dBacTG=[];
    let minG = Infinity, maxG = -Infinity, minS = Infinity, maxS = -Infinity;

    currentGoldTooltipData = [];
    currentSilverTooltipData = [];

    // --- GOLD PROCESSING ---
    if (isShort && rawHanaGold.length > 0) {
        // Use HanaGold CHI for Gold
        let baseM = currentUnit === '%' ? rawHanaGold[0].price : null;
        rawHanaGold.forEach((item, i) => {
            let val = item.price;
            if (currentUnit === '%') val = (val - baseM)/baseM * 100;
            if(val !== null) { minG = Math.min(minG, val); maxG = Math.max(maxG, val); }
            dMieng.push({ x: item.timestamp, y: val });
            currentGoldTooltipData.push({ timestamp: item.timestamp, pM: val, pN: null, pTs: null, pTg: null });
        });
    } else if (!isShort && rawVangTodayGold.length > 0) {
        // Use VangToday for Gold
        const getP = (prices, code) => (prices[code] && prices[code].sell > 0) ? prices[code].sell : ((prices[code] && prices[code].buy > 0) ? prices[code].buy : null);
        let baseM=null, baseN=null, baseTs=null, baseTg=null;
        if (currentUnit === '%') {
            const firstP = rawVangTodayGold[0].prices;
            baseM = getP(firstP, 'SJL1L10');
            baseN = getP(firstP, 'SJ9999');
            baseTs = getP(firstP, 'DOJINHTV');
            let rawTg = getP(firstP, 'XAUUSD');
            baseTg = rawTg ? rawTg * OZ_TO_TAEL * USD_TO_VND : null;
        }

        rawVangTodayGold.forEach((item) => {
            const ts = new Date(item.date).getTime();
            const p = item.prices;
            let vM = getP(p, 'SJL1L10');
            let vN = getP(p, 'SJ9999');
            let vTs = getP(p, 'DOJINHTV');
            let rawTg = getP(p, 'XAUUSD');
            let vTg = rawTg ? rawTg * OZ_TO_TAEL * USD_TO_VND : null;

            if (currentUnit === '%') {
                vM = vM && baseM ? (vM - baseM)/baseM * 100 : null;
                vN = vN && baseN ? (vN - baseN)/baseN * 100 : null;
                vTs = vTs && baseTs ? (vTs - baseTs)/baseTs * 100 : null;
                vTg = vTg && baseTg ? (vTg - baseTg)/baseTg * 100 : null;
            }

            if(vM !== null) { minG = Math.min(minG, vM); maxG = Math.max(maxG, vM); }
            dMieng.push({ x: ts, y: vM });
            dNhan.push({ x: ts, y: vN });
            dTrangsuc.push({ x: ts, y: vTs });
            dThegioi.push({ x: ts, y: vTg });
            
            currentGoldTooltipData.push({ timestamp: ts, pM: vM, pN: vN, pTs: vTs, pTg: vTg });
        });
    }

    // --- SILVER PROCESSING ---
    // Silver VN from HanaGold
    let baseBacVn = null;
    if (rawHanaSilver.length > 0 && currentUnit === '%') baseBacVn = rawHanaSilver[0].price;
    
    // Silver TG from VangToday Gold
    let baseBacTg = null;
    let validVangTodayPoints = [];
    if (rawVangTodayGold.length > 0) {
        const getP = (prices, code) => (prices[code] && prices[code].sell > 0) ? prices[code].sell : ((prices[code] && prices[code].buy > 0) ? prices[code].buy : null);
        if (currentUnit === '%') {
            let rawTgBase = getP(rawVangTodayGold[0].prices, 'XAUUSD');
            baseBacTg = rawTgBase ? (rawTgBase * OZ_TO_TAEL * USD_TO_VND) / 85 : null;
        }
        
        rawVangTodayGold.forEach(item => {
            let rawTg = getP(item.prices, 'XAUUSD');
            let vBacTg = rawTg ? (rawTg * OZ_TO_TAEL * USD_TO_VND) / 85 : null;
            if (currentUnit === '%') {
                vBacTg = vBacTg && baseBacTg ? (vBacTg - baseBacTg)/baseBacTg * 100 : null;
            }
            if (vBacTg !== null) {
                validVangTodayPoints.push({ x: new Date(item.date).getTime(), y: vBacTg });
            }
        });
    }

    // Combine them into the tooltip timeline (use HanaGold timestamps as master for Silver chart)
    rawHanaSilver.forEach((item, i) => {
        let vVn = item.price;
        if (currentUnit === '%') vVn = (vVn - baseBacVn)/baseBacVn * 100;
        
        // Find closest World Silver point
        let vTg = null;
        if (validVangTodayPoints.length > 0) {
            // Find closest by timestamp
            const closest = validVangTodayPoints.reduce((prev, curr) => 
                Math.abs(curr.x - item.timestamp) < Math.abs(prev.x - item.timestamp) ? curr : prev
            );
            // Only use if it's within a few days
            if (Math.abs(closest.x - item.timestamp) < 5 * 24 * 60 * 60 * 1000) {
                vTg = closest.y;
            }
        }

        if(vVn !== null) { minS = Math.min(minS, vVn); maxS = Math.max(maxS, vVn); }
        if(vTg !== null) { minS = Math.min(minS, vTg); maxS = Math.max(maxS, vTg); }
        
        dBacVN.push({ x: item.timestamp, y: vVn });
        if (vTg !== null) dBacTG.push({ x: item.timestamp, y: vTg }); // Plot exactly at same X to align tooltips
        
        currentSilverTooltipData.push({ timestamp: item.timestamp, pBacVn: vVn, pBacTg: vTg });
    });

    // Update Gold Chart
    const ctxGold = document.getElementById('goldChart').getContext('2d');
    goldChart.data.datasets = [
        { label: 'Vàng miếng (VN)', data: dMieng, borderColor: COLOR_MIENG, backgroundColor: getGradient(ctxGold, COLOR_MIENG), fill: true },
        { label: 'Vàng nhẫn', data: dNhan, borderColor: COLOR_NHAN, fill: false },
        { label: 'Vàng trang sức', data: dTrangsuc, borderColor: COLOR_TRANGSUC, fill: false },
        { label: 'Vàng thế giới', data: dThegioi, borderColor: COLOR_THEGIOI, fill: false }
    ];
    if(currentUnit === '%') { goldChart.options.scales.y.beginAtZero = false; } else { goldChart.options.scales.y.beginAtZero = true; }
    goldChart.update();

    // Update Silver Chart
    const ctxSilver = document.getElementById('silverChart').getContext('2d');
    silverChart.data.datasets = [
        { label: 'Giá Bạc VN', data: dBacVN, borderColor: COLOR_BAC_VN, backgroundColor: getGradient(ctxSilver, COLOR_BAC_VN), fill: true },
        { label: 'Giá Bạc Thế Giới', data: dBacTG, borderColor: COLOR_BAC_TG, fill: false }
    ];
    if(currentUnit === '%') { silverChart.options.scales.y.beginAtZero = false; } else { silverChart.options.scales.y.beginAtZero = true; }
    silverChart.update();

    // Update Min/Max Stats
    if (minG !== Infinity) {
        minGoldEl.textContent = currentUnit === '%' ? minG.toFixed(1) + '%' : formatVND(minG) + ' đ';
        maxGoldEl.textContent = currentUnit === '%' ? maxG.toFixed(1) + '%' : formatVND(maxG) + ' đ';
    } else { minGoldEl.textContent = '--'; maxGoldEl.textContent = '--'; }

    if (minS !== Infinity) {
        minSilverEl.textContent = currentUnit === '%' ? minS.toFixed(1) + '%' : formatVND(minS) + ' đ';
        maxSilverEl.textContent = currentUnit === '%' ? maxS.toFixed(1) + '%' : formatVND(maxS) + ' đ';
    } else { minSilverEl.textContent = '--'; maxSilverEl.textContent = '--'; }

    // Update Stat Cards (Current Prices)
    updateStatCards();
    
    if (currentGoldTooltipData.length > 0) updateLegendGold(currentGoldTooltipData.length - 1);
    if (currentSilverTooltipData.length > 0) updateLegendSilver(currentSilverTooltipData.length - 1);
};

const updateStatCards = () => {
    const setCard = (valEl, changeEl, pLatest, pPrev, extraText = '') => {
        if (!pLatest) { valEl.textContent = '...'; changeEl.textContent = '--'; return; }
        
        if (extraText) {
            valEl.innerHTML = `${formatVND(pLatest)} <span style="font-size:0.6em; opacity:0.7;">(${extraText})</span>`;
        } else {
            valEl.textContent = formatVND(pLatest);
        }

        if (pPrev) {
            const diff = pLatest - pPrev;
            const pct = (diff / pPrev) * 100;
            const sign = diff >= 0 ? '+' : '';
            const diffStr = `${sign}${formatVND(diff)} (${sign}${pct.toFixed(2)}%)`;
            changeEl.innerHTML = diff >= 0 ? `▲ ${diffStr}` : `▼ ${diffStr}`;
            changeEl.className = 'stat-change ' + (diff >= 0 ? 'up' : 'down');
        } else { changeEl.textContent = '--'; }
    };

    const get24hPrev = (rawArr, tsKey = 'timestamp') => {
        if (rawArr.length < 2) return null;
        const latestTs = rawArr[rawArr.length - 1][tsKey];
        const targetTs = latestTs - 24 * 60 * 60 * 1000;
        let best = rawArr[0];
        let minDiff = Math.abs(best[tsKey] - targetTs);
        for (let i = 1; i < rawArr.length - 1; i++) {
            const diff = Math.abs(rawArr[i][tsKey] - targetTs);
            if (diff < minDiff) { minDiff = diff; best = rawArr[i]; }
        }
        return best;
    };

    // Gold VN (Use HanaGold if short, else VangToday)
    const isShort = ['6h', '1d', '7d'].includes(currentDays);
    if (isShort && window._fullHanaGold && window._fullHanaGold.length >= 2) {
        const l = rawHanaGold[rawHanaGold.length-1].price;
        const pObj = get24hPrev(window._fullHanaGold);
        const p = pObj ? pObj.price : null;
        setCard(statGoldVnVal, statGoldVnChange, l, p);
    } else if (!isShort && rawVangTodayGold.length >= 2) {
        const latest = rawVangTodayGold[rawVangTodayGold.length - 1];
        const pObj = get24hPrev(rawVangTodayGold, 'ts'); // we need a ts property
        const previous = pObj ? pObj.prices : rawVangTodayGold[rawVangTodayGold.length - 2].prices;
        const getP = (prices, code) => (prices[code] && prices[code].sell > 0) ? prices[code].sell : ((prices[code] && prices[code].buy > 0) ? prices[code].buy : null);
        setCard(statGoldVnVal, statGoldVnChange, getP(latest.prices, 'SJL1L10'), getP(previous, 'SJL1L10'));
    }

    // Gold World & Silver World (Always from VangToday)
    if (rawVangTodayGold.length >= 2) {
        const latest = rawVangTodayGold[rawVangTodayGold.length - 1];
        const pObj = get24hPrev(rawVangTodayGold, 'ts');
        const previous = pObj ? pObj.prices : rawVangTodayGold[rawVangTodayGold.length - 2].prices;
        const getP = (prices, code) => (prices[code] && prices[code].sell > 0) ? prices[code].sell : ((prices[code] && prices[code].buy > 0) ? prices[code].buy : null);
        
        let wLatestRaw = getP(latest.prices, 'XAUUSD'); let wPrevRaw = getP(previous, 'XAUUSD');
        let wLatest = wLatestRaw ? (wLatestRaw * OZ_TO_TAEL * USD_TO_VND) : null;
        let wPrev = wPrevRaw ? (wPrevRaw * OZ_TO_TAEL * USD_TO_VND) : null;
        const goldUsdStr = wLatestRaw ? `$${wLatestRaw.toFixed(2)}/oz` : '';
        setCard(statGoldWorldVal, statGoldWorldChange, wLatest, wPrev, goldUsdStr);

        let bWorldLatest = wLatest ? (wLatest / 85) : null;
        let bWorldPrev = wPrev ? (wPrev / 85) : null;
        const silverUsdStr = wLatestRaw ? `$${(wLatestRaw / 85).toFixed(2)}/oz` : '';
        setCard(statSilverWorldVal, statSilverWorldChange, bWorldLatest, bWorldPrev, silverUsdStr);
    }

    // Silver VN (Always from HanaGold)
    if (window._fullHanaSilver && window._fullHanaSilver.length >= 2) {
        const l = rawHanaSilver[rawHanaSilver.length-1].price;
        const pObj = get24hPrev(window._fullHanaSilver);
        const p = pObj ? pObj.price : null;
        setCard(statSilverVnVal, statSilverVnChange, l, p);
    }
};

const parseHanaData = (dataObj) => {
    if (!dataObj) return [];
    let keys = Object.keys(dataObj).sort();
    let arr = [];
    keys.forEach(tsStr => {
        let tsMs = parseInt(tsStr) * 1000;
        arr.push({
            timestamp: tsMs,
            price: dataObj[tsStr][0] * 10 // Multiply by 10 to convert from Chỉ to Lượng!
        });
    });
    return arr;
};

const fetchData = async () => {
    loadingOverlay.classList.add('active');
    try {
        let fetchDaysVang = 90;
        let hanaRange = '3M';
        let limitMsHana = null;

        if (currentDays === '6h') { hanaRange = '7D'; limitMsHana = Date.now() - 6*60*60*1000; }
        if (currentDays === '1d') { fetchDaysVang = 3; hanaRange = '7D'; limitMsHana = Date.now() - 24*60*60*1000; }
        if (currentDays === '7d') { fetchDaysVang = 7; hanaRange = '7D'; }
        if (currentDays === '1m') { fetchDaysVang = 30; hanaRange = '1M'; }
        if (currentDays === '3m') { fetchDaysVang = 90; hanaRange = '3M'; }
        if (currentDays === '6m') { fetchDaysVang = 180; hanaRange = '1Y'; limitMsHana = Date.now() - 180*24*60*60*1000; }
        if (currentDays === '1y') { fetchDaysVang = 365; hanaRange = '1Y'; }
        if (currentDays === '3y') { fetchDaysVang = 1095; hanaRange = '1Y'; } // Hana max is 1Y

        const isShort = ['6h', '1d', '7d'].includes(currentDays);

        const promises = [
            fetch(`${HANA_API_BASE}SILVER&range=${hanaRange}`).catch(() => null),
            fetch(`${getVangTodayApi()}?days=${fetchDaysVang}`).catch(() => null)
        ];
        if (isShort) promises.push(fetch(`${HANA_API_BASE}CHI&range=${hanaRange}`).catch(() => null));

        const resArr = await Promise.all(promises);
        
        rawHanaSilver = [];
        rawVangTodayGold = [];
        rawHanaGold = [];
        // Keep full raw data for 24h stat calculation, but filter later for charting
        let fullHanaSilver = [];
        let fullHanaGold = [];

        if (resArr[0]) {
            const r = await resArr[0].json();
            fullHanaSilver = parseHanaData(r.data);
            rawHanaSilver = limitMsHana ? fullHanaSilver.filter(p => p.timestamp >= limitMsHana) : fullHanaSilver;
            // Always ensure raw contains full for 24h lookup! Wait, let's just make the stat cards use fullHanaSilver.
            // Actually I'll assign full to another variable and swap it for stats, OR simpler:
            // Just use the full data for stat cards, and limitMsHana for charts.
        }
        if (resArr[1]) {
            const r = await resArr[1].json();
            const dArr = r.data || r.history;
            if (dArr) {
                rawVangTodayGold = [...dArr].map(item => ({...item, ts: new Date(item.date).getTime()})).sort((a, b) => a.ts - b.ts);
            }
        }
        if (isShort && resArr[2]) {
            const r = await resArr[2].json();
            fullHanaGold = parseHanaData(r.data);
            rawHanaGold = limitMsHana ? fullHanaGold.filter(p => p.timestamp >= limitMsHana) : fullHanaGold;
        }

        // Pass full arrays to global state but filter for charts in processAllData
        // Wait, rawHanaGold is already filtered! I should pass full data to stat cards.
        window._fullHanaSilver = fullHanaSilver.length ? fullHanaSilver : rawHanaSilver;
        window._fullHanaGold = fullHanaGold.length ? fullHanaGold : rawHanaGold;

        processAllData();
        
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        loadingOverlay.classList.remove('active');
    }
};

document.getElementById('time-filters').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#time-filters .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentDays = e.target.getAttribute('data-days');
        fetchData();
    }
});

document.getElementById('unit-filters').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll('#unit-filters .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentUnit = e.target.getAttribute('data-unit');
        processAllData();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchData();
});
