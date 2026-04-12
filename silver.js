let data = JSON.parse(localStorage.getItem("boostData")) || [];
let chart = null;
let editIndex = -1;

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
  }

  if (views <= 0) {
    alert("Views must be greater than 0.");
    return;
  }

  const rate = (inquiries / views) * 100;
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
    rate: rate.toFixed(2),
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
    table.innerHTML += `
      <tr>
        <td>${item.agent}</td>
        <td>${item.product}</td>
        <td>${item.boostStatus}</td>
        <td>${item.startDate || "-"}</td>
        <td>${formatNumber(item.views)}</td>
        <td>${formatNumber(item.clicks)}</td>
        <td>${formatNumber(item.inquiries)}</td>
        <td>${item.rate}%</td>
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

          <p class="rate">📈 ${item.rate}% Conversion Rate</p>
          <p class="${item.class}">${item.status}</p>

          <div class="card-actions">
            <button class="edit-btn" onclick="editBoost(${index})">Edit</button>
            <button class="view-btn" onclick="openAd('${escapeSingleQuotes(item.adlink)}')">▶ View Ad</button>
            <button class="delete-btn" onclick="deleteBoost(${index})">Delete</button>
          </div>
        </div>
      </div>
    `;
  });

  updateSummary();
  renderChart();
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
