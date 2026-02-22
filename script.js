let myChart = null;
let allCoins = [];
let userBalance = 12450.80;
let currentCoin = null;

async function init() {
    lucide.createIcons();
    await fetchCoins();
    setInterval(simulateLivePrice, 2000); 
}

function simulateLivePrice() {
    if (allCoins.length === 0 || !myChart) return;
    allCoins.forEach(coin => {
        const jitter = 1 + (Math.random() * 0.003 - 0.0015);
        coin.current_price *= jitter;
    });
    updateUIRealtime();
    updateGraphRealtime();
}

function updateUIRealtime() {
    if (currentCoin) {
        const priceDisplay = document.getElementById('active-coin-price');
        priceDisplay.innerText = `$${currentCoin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }
    const rows = document.querySelectorAll('.coin-row');
    allCoins.forEach((coin, index) => {
        if (rows[index]) {
            const pDiv = rows[index].querySelector('.row-price');
            if (pDiv) pDiv.innerText = `$${coin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        }
    });
}

function updateGraphRealtime() {
    if (!myChart || !currentCoin) return;
    myChart.data.datasets[0].data.shift();
    myChart.data.datasets[0].data.push(currentCoin.current_price);
    myChart.update('none'); 
}

function quickOrder(type) {
    const amountInput = document.getElementById('trade-amount-input');
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) { showToast("Enter a valid amount"); return; }
    userBalance = (type === 'Buy') ? userBalance - amount : userBalance + amount;
    document.getElementById('user-balance').innerText = `$${userBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    addTradeToHistory(type, amount);
    showToast(`${type} Success: $${amount.toLocaleString()}`);
}

function addTradeToHistory(type, amount) {
    const history = document.getElementById('trade-history');
    if (history.querySelector('.empty-msg')) history.innerHTML = '';
    const item = document.createElement('div');
    item.style.cssText = "display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.8rem;";
    item.innerHTML = `<span><strong>${type}</strong> ${currentCoin.symbol.toUpperCase()}</span><span style="color:${type==='Buy'?'#00ffa3':'#ff3b3b'}">${type==='Buy'?'-':'+'}$${amount.toLocaleString()}</span>`;
    history.prepend(item);
}

function showToast(msg) {
    const toast = document.getElementById('success-toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

async function fetchCoins() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10');
        allCoins = await res.json();
        renderList(allCoins);
        selectCoin(allCoins[0].id);
    } catch (e) { console.error("API Limit"); }
}

function renderList(coins) {
    const list = document.getElementById('market-list');
    list.innerHTML = coins.map(coin => `
        <div class="coin-row" onclick="selectCoin('${coin.id}')">
            <div style="display:flex; align-items:center; gap:12px; pointer-events:none;">
                <img src="${coin.image}">
                <div>
                    <div style="font-weight:700; font-size:0.9rem; color:#fff;">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div style="text-align:right; pointer-events:none;">
                <div class="row-price" style="font-size:0.95rem; font-weight:600; color:#fff;">$${coin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
        </div>
    `).join('');
}

function selectCoin(id) {
    const coin = allCoins.find(c => c.id === id);
    currentCoin = coin;
    document.getElementById('active-coin-name').innerText = coin.name;
    loadChart(coin.id);
}

async function loadChart(id) {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`);
    const data = await res.json();
    const prices = data.prices.map(p => p[1]);
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels: prices.map(() => ""), datasets: [{ data: prices, borderColor: '#00ffa3', borderWidth: 3, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(0, 255, 163, 0.05)' }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1000 }, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
}

function filterCoins() {
    const term = document.getElementById('coin-search').value.toLowerCase();
    const filtered = allCoins.filter(c => c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term));
    renderList(filtered);
}

init();
