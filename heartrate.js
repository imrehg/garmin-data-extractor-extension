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
  let dialog = window.confirm("Getting data?");
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
        console.log(data);
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
  URL.revokeObjectURL;
}

// TODO: should only happen on the pages which we can export
// TODO: need to re-run this on navigation
waitForElement("headerComponent-headerTitleContainer-area", (header) => {
  const btn = document.createElement("button");
  btn.textContent = "Export";
  btn.type = "button";
  btn.style.border = "1px solid black";
  btn.addEventListener("click", getData);
  header.appendChild(btn);
});
