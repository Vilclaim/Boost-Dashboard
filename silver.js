let data = JSON.parse(localStorage.getItem("boostData")) || [];
let chart = null;

function save() {
  localStorage.setItem("boostData", JSON.stringify(data));
}

function getStatus(rate) {
  if (rate >= 20) return { text: "🔥 Excellent", class: "excellent" };
  if (rate >= 10) return { text: "✅ Good", class: "good" };
  if (rate >= 5) return { text: "⚠️ Low", class: "low" };
  return { text: "❌ Poor", class: "poor" };
}

function getSafeNumber(id) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function addBoost() {
  const agent = document.getElementById("agent").value.trim();
  const product = document.getElementById("product").value.trim();
  const adlink = document.getElementById("adlink").value.trim();
  const image = document.getElementById("image").value.trim();
  const views = getSafeNumber("views");
  const clicks = getSafeNumber("clicks");
  const inquiries = getSafeNumber("inquiries");

  if (!agent) {
    alert("Please select an agent.");
    return;
  }

  if (!image) {
    alert("Please add the poster image URL.");
    return;
  }

  if (views <= 0) {
    alert("Views must be greater than 0.");
    return;
  }

  const rate = (inquiries / views) * 100;
  const status = getStatus(rate);

  data.unshift({
    id: Date.now(),
    agent,
    product,
    adlink,
    image,
    views,
    clicks,
    inquiries,
    rate: rate.toFixed(2),
    status: status.text,
    class: status.class
  });

  save();
  render();
  clearForm();
}

function clearForm() {
  document.getElementById("agent").value = "";
  document.getElementById("product").value = "A2A";
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
}

function openAd(link) {
  if (!link) {
    alert("No ad link added for this post.");
    return;
  }

  window.open(link, "_blank");
}

function render() {
  const table = document.getElementById("reportTable");
  const container = document.getElementById("cardContainer");
  const emptyMsg = document.getElementById("emptyMsg");

  table.innerHTML = "";
  container.innerHTML = "";

  if (data.length === 0) {
    emptyMsg.style.display = "block";
  } else {
    emptyMsg.style.display = "none";
  }

  data.forEach((item, index) => {
    table.innerHTML += `
      <tr>
        <td>${item.agent}</td>
        <td>${item.product}</td>
        <td>${item.views}</td>
        <td>${item.clicks}</td>
        <td>${item.inquiries}</td>
        <td>${item.rate}%</td>
        <td class="${item.class}">${item.status}</td>
      </tr>
    `;

    container.innerHTML += `
      <div class="boost-card">
        <img src="${item.image}" alt="${item.product} poster" class="poster" />

        <div class="info">
          <div class="card-top">
            <div>
              <span class="badge">${item.product}</span>
              <h3 class="agent-name">${item.agent}</h3>
              <p class="small-text">Ongoing Boost Tracking</p>
            </div>
          </div>

          <div class="stats">
            <div class="stat-box">
              <span>Views</span>
              <strong>${item.views}</strong>
            </div>
            <div class="stat-box">
              <span>Clicks</span>
              <strong>${item.clicks}</strong>
            </div>
            <div class="stat-box">
              <span>Inquiries</span>
              <strong>${item.inquiries}</strong>
            </div>
          </div>

          <p class="rate">📈 ${item.rate}% Conversion Rate</p>
          <p class="${item.class}">${item.status}</p>

          <div class="card-actions">
            <button class="view-btn" onclick="openAd('${escapeSingleQuotes(item.adlink)}')">▶ View Ad</button>
            <button class="delete-btn" onclick="deleteBoost(${index})">Delete</button>
          </div>
        </div>
      </div>
    `;
  });

  renderChart();
}

function escapeSingleQuotes(text) {
  return String(text || "").replace(/'/g, "\\'");
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