let data = JSON.parse(localStorage.getItem("boostData")) || [];
let chart = null;
let editIndex = -1;
let miniCharts = {};

function save() {
  localStorage.setItem("boostData", JSON.stringify(data));
}

function getSafeNumber(id) {
  const rawValue = document.getElementById(id).value.trim();
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatNumber(num) {
  const value = Number(num) || 0;

  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace(".0", "") + "M";
  }

  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(".0", "") + "K";
  }

  return value.toString();
}

function getStatus(rate) {
  if (rate >= 20) return { text: "🔥 Excellent", class: "excellent" };
  if (rate >= 10) return { text: "✅ Good", class: "good" };
  if (rate >= 5) return { text: "⚠️ Low", class: "low" };
  return { text: "❌ Poor", class: "poor" };
}

function escapeSingleQuotes(text) {
  return String(text || "").replace(/'/g, "\\'");
}

function addOrUpdateBoost() {
  const agent = document.getElementById("agent").value.trim();
  const product = document.getElementById("product").value.trim();
  const boostStatus = document.getElementById("boostStatus").value.trim();
  const startDate = document.getElementById("startDate").value.trim();
  const adlink = document.getElementById("adlink").value.trim();
  const image = document.getElementById("image").value.trim();
  const views = getSafeNumber("views");
  const clicks = getSafeNumber("clicks");
  const inquiries = getSafeNumber("inquiries");

  if (!agent) {
    alert("Please select an agent.");
    return;
  

 
    return;
  }

  let rate = 0;
  if (views > 0) {
    rate = (inquiries / views) * 100;
  }

  const performance = getStatus(rate);

  const itemData = {
    id: editIndex === -1 ? Date.now() : data[editIndex].id,
    agent,
    product,
    boostStatus,
    startDate,
    adlink,
    image,
    views,
    clicks,
    inquiries,
    rate: Number.isFinite(rate) ? rate.toFixed(2) : "0.00",
    status: performance.text,
    class: performance.class
  };

  if (editIndex === -1) {
    data.unshift(itemData);
  } else {
    data[editIndex] = itemData;
  }

  save();
  render();
  resetFormState();
}

function editBoost(index) {
  const item = data[index];

  document.getElementById("agent").value = item.agent;
  document.getElementById("product").value = item.product;
  document.getElementById("boostStatus").value = item.boostStatus;
  document.getElementById("startDate").value = item.startDate || "";
  document.getElementById("adlink").value = item.adlink || "";
  document.getElementById("image").value = item.image || "";
  document.getElementById("views").value = item.views;
  document.getElementById("clicks").value = item.clicks;
  document.getElementById("inquiries").value = item.inquiries;

  editIndex = index;
  document.getElementById("saveBtn").textContent = "Update Boost";
  document.getElementById("formTitle").textContent = "Update Ongoing Boost";
  document.getElementById("cancelEditBtn").style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  resetFormState();
}

function resetFormState() {
  editIndex = -1;
  clearForm();
  document.getElementById("saveBtn").textContent = "Add Boost";
  document.getElementById("formTitle").textContent = "Add Ongoing Boost";
  document.getElementById("cancelEditBtn").style.display = "none";
}

function clearForm() {
  document.getElementById("agent").value = "";
  document.getElementById("product").value = "A2A";
  document.getElementById("boostStatus").value = "ONGOING";
  document.getElementById("startDate").value = "";
  document.getElementById("adlink").value = "";
  document.getElementById("image").value = "";
  document.getElementById("views").value = "";
  document.getElementById("clicks").value = "";
  document.getElementById("inquiries").value = "";
}

function deleteBoost(index) {
  const confirmed = confirm("Delete this boost entry?");
  if (!confirmed) return;

  const chartKey = String(data[index]?.id ?? index);
  if (miniCharts[chartKey]) {
    miniCharts[chartKey].destroy();
    delete miniCharts[chartKey];
  }

  data.splice(index, 1);
  save();
  render();

  if (editIndex === index) {
    resetFormState();
  } else if (editIndex > index) {
    editIndex--;
  }
}

function clearAll() {
  if (data.length === 0) {
    alert("No data to clear.");
    return;
  }

  const confirmed = confirm("Delete all boost data?");
  if (!confirmed) return;

  Object.values(miniCharts).forEach(instance => {
    if (instance) instance.destroy();
  });
  miniCharts = {};

  data = [];
  save();
  render();
  resetFormState();
}

function openAd(link) {
  if (!link) {
    alert("No ad link added for this post.");
    return;
  }

  window.open(link, "_blank");
}

function updateSummary() {
  const totalBoostsEl = document.getElementById("totalBoosts");
  const totalViewsEl = document.getElementById("totalViews");
  const totalClicksEl = document.getElementById("totalClicks");
  const totalInquiriesEl = document.getElementById("totalInquiries");
  const avgRateEl = document.getElementById("avgRate");

  const totalBoosts = data.length;
  const totalViews = data.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const totalClicks = data.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const totalInquiries = data.reduce((sum, item) => sum + Number(item.inquiries || 0), 0);
  const avgRate =
    totalBoosts > 0
      ? data.reduce((sum, item) => sum + Number(item.rate || 0), 0) / totalBoosts
      : 0;

  totalBoostsEl.textContent = totalBoosts;
  totalViewsEl.textContent = formatNumber(totalViews);
  totalClicksEl.textContent = formatNumber(totalClicks);
  totalInquiriesEl.textContent = formatNumber(totalInquiries);
  avgRateEl.textContent = `${avgRate.toFixed(2)}%`;
}

function render() {
  const table = document.getElementById("reportTable");
  const container = document.getElementById("cardContainer");
  const emptyMsg = document.getElementById("emptyMsg");

  table.innerHTML = "";
  container.innerHTML = "";

  emptyMsg.style.display = data.length === 0 ? "block" : "none";

  data.forEach((item, index) => {
    const safeRate = Number(item.rate || 0).toFixed(2);
    const chartId = `chart-${item.id}`;
    const flipId = `flip-${item.id}`;

    table.innerHTML += `
      <tr>
        <td>${item.agent}</td>
        <td>${item.product}</td>
        <td>${item.boostStatus}</td>
        <td>${item.startDate || "-"}</td>
        <td>${formatNumber(item.views)}</td>
        <td>${formatNumber(item.clicks)}</td>
        <td>${formatNumber(item.inquiries)}</td>
        <td>${safeRate}%</td>
        <td class="${item.class}">${item.status}</td>
        <td>
          <div class="action-cell">
            <button class="action-btn-small edit-btn" onclick="editBoost(${index})">Edit</button>
            <button class="action-btn-small view-btn" onclick="openAd('${escapeSingleQuotes(item.adlink)}')">View</button>
            <button class="action-btn-small delete-btn" onclick="deleteBoost(${index})">Delete</button>
          </div>
        </td>
      </tr>
    `;

    container.innerHTML += `
      <div class="boost-card">
        <div class="card-flip" id="${flipId}">
          <div class="card-front">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.product} poster" class="poster" />`
                : `
                  <div class="no-image">
                    <h3>${item.product}</h3>
                    <p>Ongoing Boost</p>
                  </div>
                `
            }

            <div class="info">
              <div class="card-top">
                <div>
                  <span class="badge">${item.product}</span>
                  <h3 class="agent-name">${item.agent}</h3>
                  <p class="small-text">Saved campaign performance</p>
                  <p class="small-text">📅 Start Date: ${item.startDate || "Not set"}</p>
                </div>
                <span class="boost-status">${item.boostStatus}</span>
              </div>

              <div class="stats">
                <div class="stat-box">
                  <span>Views</span>
                  <strong>${formatNumber(item.views)}</strong>
                </div>
                <div class="stat-box">
                  <span>Clicks</span>
                  <strong>${formatNumber(item.clicks)}</strong>
                </div>
                <div class="stat-box">
                  <span>Inquiries</span>
                  <strong>${formatNumber(item.inquiries)}</strong>
                </div>
              </div>

              <p class="rate">📈 ${safeRate}% Conversion Rate</p>
              <p class="${item.class}">${item.status}</p>

              <div class="card-actions">
                <button class="edit-btn" onclick="editBoost(${index})">Edit</button>
                <button class="view-btn" onclick="openAd('${escapeSingleQuotes(item.adlink)}')">▶ View Ad</button>
                <button class="view-chart-btn" onclick="flipCard(${index})">📊 View Chart</button>
                <button class="delete-btn" onclick="deleteBoost(${index})">Delete</button>
              </div>
            </div>
          </div>

          <div class="card-back">
            <div class="chart-card-header">
              <h3>Performance Chart</h3>
              <p>${item.agent} • ${item.product}</p>
            </div>

            <div class="chart-mini-wrap">
              <div class="chart-mini-box">
                <canvas id="${chartId}"></canvas>
              </div>
            </div>

            <div class="chart-card-footer">
              <button class="secondary-btn chart-back-btn" onclick="flipCard(${index})">⬅ Back to Card</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  updateSummary();
  renderChart();
}

function flipCard(index) {
  const item = data[index];
  if (!item) return;

  const flipEl = document.getElementById(`flip-${item.id}`);
  if (!flipEl) return;

  flipEl.classList.toggle("active");

  if (flipEl.classList.contains("active")) {
    setTimeout(() => renderMiniChart(index), 320);
  }
}

function getTrendData(item) {
  const views = Number(item.views || 0);
  const clicks = Number(item.clicks || 0);
  const inquiries = Number(item.inquiries || 0);

  const p1 = Math.max(0, Math.round(views * 0.18));
  const p2 = Math.max(p1, Math.round(views * 0.34));
  const p3 = Math.max(p2, Math.round(views * 0.56));
  const p4 = Math.max(p3, Math.round(views * 0.78));
  const p5 = views;

  const q1 = Math.max(0, Math.round(inquiries * 0.12));
  const q2 = Math.max(q1, Math.round(inquiries * 0.3));
  const q3 = Math.max(q2, Math.round(inquiries * 0.52));
  const q4 = Math.max(q3, Math.round(inquiries * 0.76));
  const q5 = inquiries;

  const c1 = Math.max(0, Math.round(clicks * 0.15));
  const c2 = Math.max(c1, Math.round(clicks * 0.32));
  const c3 = Math.max(c2, Math.round(clicks * 0.55));
  const c4 = Math.max(c3, Math.round(clicks * 0.79));
  const c5 = clicks;

  return {
    labels: ["Start", "Day 2", "Day 3", "Day 4", "Now"],
    views: [p1, p2, p3, p4, p5],
    inquiries: [q1, q2, q3, q4, q5],
    clicks: [c1, c2, c3, c4, c5]
  };
}

function renderMiniChart(index) {
  const item = data[index];
  if (!item) return;

  const chartKey = String(item.id);
  const canvas = document.getElementById(`chart-${item.id}`);
  if (!canvas) return;

  if (miniCharts[chartKey]) {
    miniCharts[chartKey].destroy();
  }

  const trend = getTrendData(item);
  const ctx = canvas.getContext("2d");

  miniCharts[chartKey] = new Chart(ctx, {
    type: "line",
    data: {
      labels: trend.labels,
      datasets: [
        {
          label: "Views",
          data: trend.views,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: "Clicks",
          data: trend.clicks,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.10)",
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: "Inquiries",
          data: trend.inquiries,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.10)",
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#ffffff"
          },
          grid: {
            color: "#334155"
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#ffffff"
          },
          grid: {
            color: "#334155"
          }
        }
      }
    }
  });
}

function renderChart() {
  const canvas = document.getElementById("myChart");
  const ctx = canvas.getContext("2d");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(item => `${item.agent} - ${item.product}`),
      datasets: [
        {
          label: "Views",
          data: data.map(item => item.views),
          backgroundColor: "rgba(59, 130, 246, 0.82)",
          borderRadius: 6
        },
        {
          label: "Inquiries",
          data: data.map(item => item.inquiries),
          backgroundColor: "rgba(34, 197, 94, 0.82)",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "white"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "white"
          },
          grid: {
            color: "#334155"
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "white"
          },
          grid: {
            color: "#334155"
          }
        }
      }
    }
  });
}

render();
