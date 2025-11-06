const panels = [
  { id: "PNL-01", name: "Roof A1", rated: 420, defect: 1 },
  { id: "PNL-02", name: "Roof A2", rated: 420, defect: 0.8 },
  { id: "PNL-03", name: "South B1", rated: 380, defect: 0.5 },
  { id: "PNL-04", name: "South B2", rated: 380, defect: 1 }
];

let showAll = false;
const panelContainer = document.getElementById("panelContainer");
const alertBox = document.getElementById("alertBox");
const fleetStats = document.getElementById("fleetStats");
const noIssues = document.getElementById("noIssues");
let charts = {};

async function sendAlert(message) {
  console.log("Sending SMS/Email Alert:", message);
}

async function fetchLiveAPI() {
  return null;
}

function generateData(p) {
  let irr = Math.max(0, Math.sin(Date.now() / 200000));
  let watts = (p.rated * irr * p.defect) + (Math.random()*15 - 7);
  watts = Math.max(0, watts);
  let temp = 25 + (irr * 30) + (Math.random()*2);
  let eff = watts / p.rated;
  return { watts, eff, temp, irr };
}

panels.forEach(p => {
  const card = document.createElement("div");
  card.id = `card-${p.id}`;
  card.className = "panel-card";
  card.innerHTML = `
    <div class="panel-title">${p.name} (${p.id})</div>
    <canvas id="chart-${p.id}" height="120"></canvas>
    <div class="metric" id="out-${p.id}"></div>
    <div class="metric" id="eff-${p.id}"></div>
    <div class="metric" id="temp-${p.id}"></div>
    <div class="metric" id="irr-${p.id}"></div>
    <div class="metric" id="status-${p.id}" style="font-weight:bold;"></div>
  `;
  panelContainer.appendChild(card);

  charts[p.id] = new Chart(document.getElementById(`chart-${p.id}`), {
    type: 'line',
    data: { labels: [], datasets: [{
      label: 'Output (W)',
      data: [],
      borderWidth: 2
    }]},
    options: { scales: { y: { beginAtZero: true } } }
  });
});

function update() {
  let fleetTotal = 0;
  let effValues = [];
  let badPanels = [];

  panels.forEach(p => {
    const { watts, eff, temp, irr } = generateData(p);

    fleetTotal += watts;
    effValues.push(eff);

    const chart = charts[p.id];
    chart.data.labels.push("");
    chart.data.datasets[0].data.push(watts);
    if (chart.data.labels.length > 40) chart.data.labels.shift(), chart.data.datasets[0].data.shift();
    chart.update();

    document.getElementById(`out-${p.id}`).innerText = `Output: ${watts.toFixed(1)} W`;
    document.getElementById(`eff-${p.id}`).innerText = `Efficiency: ${(eff*100).toFixed(1)}%`;
    document.getElementById(`temp-${p.id}`).innerText = `Temperature: ${temp.toFixed(1)} °C`;
    document.getElementById(`irr-${p.id}`).innerText = `Irradiance: ${irr.toFixed(2)} kW/m²`;

    const statusEl = document.getElementById(`status-${p.id}`);
    const cardEl = document.getElementById(`card-${p.id}`);

    if (eff < 0.6) {
      statusEl.innerText = "⚠ DEFECT / LOW PERFORMANCE";
      statusEl.style.color = "red";
      badPanels.push(p.id);
      cardEl.style.display = "block";
      sendAlert(`Panel ${p.id} is underperforming.`);
    } else {
      statusEl.innerText = "✅ Normal";
      statusEl.style.color = "green";
      cardEl.style.display = showAll ? "block" : "none";
    }
  });

  let avgEff = (effValues.reduce((a,b)=>a+b)/effValues.length)*100;
  fleetStats.innerText = `Total Output: ${fleetTotal.toFixed(1)} W | Avg Efficiency: ${avgEff.toFixed(1)}%`;

  if (badPanels.length > 0) {
    alertBox.style.display = "block";
    noIssues.style.display = "none";
    alertBox.innerText = "⚠ Underperforming Panels: " + badPanels.join(", ");
  } else {
    alertBox.style.display = "none";
    noIssues.style.display = "block";
  }
}

setInterval(update, 1000);

document.getElementById("toggleViewBtn").onclick = () => {
  showAll = !showAll;
  document.getElementById("toggleViewBtn").innerText = showAll ? "Show Only Defective Panels" : "Show All Panels";
};

document.getElementById("darkModeBtn").onclick = () => {
  document.body.classList.toggle("dark");
};
