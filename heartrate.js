// We need to watch for the header to show up in the app.
function waitForElement(classname, callback) {
  const observer = new MutationObserver(() => {
    const el = document.getElementsByClassName(classname)[0];
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Data Management

function getData() {
  let dialog = window.confirm(
    "Download this day's heartrate data as a CSV file?",
  );
  if (dialog) {
    const pathParts = window.location.pathname.split("/");
    // The path is something like "/app/heart-rate/2026-01-16/0" resulting in
    // ["", "app", "heart-rate", "2026-01-16", "0"]
    const pageDate = pathParts[3];
    const csrfToken = document.querySelector(
      'meta[name="csrf-token"]',
    )?.content;
    fetch(
      `https://connect.garmin.com/gc-api/wellness-service/wellness/dailyHeartRate?date=${pageDate}`,
      {
        credentials: "include",
        headers: {
          "Connect-Csrf-Token": csrfToken,
        },
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error while fetchin data: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        exportHeartRateData(pageDate, data.heartRateValues);
      })
      .catch((error) => {
        console.error("Failed to fetch heart rate data:", error);
      });
  }
}

function formatTimestamp(ms) {
  const date = new Date(ms);
  return date.toLocaleString("sv-SE"); // "2026-01-16 14:32:22" format
}

function exportHeartRateData(date, heartrateData) {
  const rows = [
    ["Timestamp", "DateTime", "HeartRate"],
    ...heartrateData.map((d) => [d[0], formatTimestamp(d[0]), d[1]]),
  ];

  const csvContent = rows.map((row) => row.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `heartrate-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function onNavigate() {
  // Check if we've added our button to the page already
  const existing_btn = document.querySelector(".extra-export-btn");

  // Match the single day path /app/heart-rate/2026-01-15 or /app/heart-rate/2026-01-15/0
  target_path = /^\/app\/heart-rate\/\d{4}-\d{2}-\d{2}(?:\/?|\/0)$/g;

  if (window.location.pathname.match(target_path)) {
    if (existing_btn) return;

    waitForElement("headerComponent-headerTitleContainer-area", (header) => {
      const btn = document.createElement("button");
      btn.textContent = "Export";
      btn.type = "button";
      btn.className = "extra-export-btn";
      // TODO: do styling separately
      btn.style.border = "1px solid black";
      btn.addEventListener("click", getData);
      header.appendChild(btn);
    });
  } else {
    if (existing_btn) {
      existing_btn.remove();
    }
  }
}

// Check if the Navigation API is supported
if ("navigation" in window) {
  window.navigation.addEventListener("navigatesuccess", (event) => {
    onNavigate();
  });
} else {
  console.warn(
    "Navigation API not supported, this won't work, have to refresh on the target page to show export button.",
  );
}
// Kick it off on the first load; Navigation API doesn't trigger then.
onNavigate();
