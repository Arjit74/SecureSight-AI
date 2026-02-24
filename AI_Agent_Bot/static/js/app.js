// Real-time dashboard with live updates - NO page reloads
const toggleBtn = document.getElementById("toggleBtn");
const refreshBtn = document.getElementById("refreshBtn");
const status = document.getElementById("status");
const clock = document.getElementById("clock");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalBody = document.getElementById("modalBody");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");
const exportFormatSelect = document.getElementById("exportFormat");
const exportVisibleBtn = document.getElementById("exportVisibleBtn");
const suggestionsEl = document.getElementById("suggestions");
const reloadInput = document.getElementById("reloadInput");
const applyReloadBtn = document.getElementById("applyReloadBtn");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let running = true;
let lastUploadedFile = null;
let pollInterval = null;
let currentlyViewedItem = null;
let currentFilter = "all";
let searchQuery = "";
let suggestTimer = null;
let pollIntervalMs = 2000;
let currentTheme = "light";
window.livePaused = false;

// Show notification toast
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, duration);
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  if (themeToggle) {
    themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
  }
  currentTheme = isDark ? "dark" : "light";
  localStorage.setItem("theme", currentTheme);
}

function animateThemeSwitch() {
  document.body.classList.add("theme-transition");
  setTimeout(() => {
    document.body.classList.remove("theme-transition");
  }, 360);
}

// Export analysis report
function buildClientReport(item) {
  if (!item) return;
  
  const vtStats = JSON.parse(item.dataset.vtStats || "null");
  const verdict = vtStats ? generateFinalVerdict(vtStats) : null;
  
  const report = {
    filename: item.dataset.fileName,
    username: item.dataset.username,
    timestamp: item.dataset.timestamp,
    file_size: item.dataset.fileSize,
    hashes: {
      md5: item.dataset.md5,
      sha1: item.dataset.sha1,
      sha256: item.dataset.sha256,
      vhash: item.dataset.vhash,
      ssdeep: item.dataset.ssdeep,
      tlsh: item.dataset.tlsh
    },
    file_type: {
      mime: item.dataset.mimeType,
      category: item.dataset.category,
      magic: item.dataset.vtMagic,
      type: item.dataset.vtType,
      type_tag: item.dataset.vtTypeTag
    },
    analysis: {
      status: item.dataset.vtStatus,
      stats: vtStats,
      verdict: verdict ? verdict.title : "Unknown",
      recommendation: verdict ? verdict.recommendation : "N/A"
    }
  };
  
  return report;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportReport(item) {
  if (!item) return;
  const format = exportFormatSelect?.value || "json";
  const itemId = item.dataset.id;

  if (itemId) {
    try {
      const resp = await fetch(`/export/${itemId}?format=${format}`);
      if (!resp.ok) {
        showToast("❌ Export failed. Please try again.");
        return;
      }
      const blob = await resp.blob();
      downloadBlob(blob, `report_${itemId}.${format}`);
      showToast("✅ Report exported successfully!");
      return;
    } catch (err) {
      console.log("Export error:", err);
    }
  }

  if (format !== "json") {
    showToast("❌ Server export unavailable for this item.");
    return;
  }

  const report = buildClientReport(item);
  if (!report) return;
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${item.dataset.fileName || "report"}_analysis_${Date.now()}.json`);
  showToast("✅ Report exported successfully!");
}

// Real-time polling - update every 2 seconds
async function pollData() {
  try {
    // Show progress bar loading
    if (progressBarEl) {
      progressBarEl.style.width = "30%";
      progressBarEl.style.opacity = "1";
    }

    const resp = await fetch("/data");
    const items = await resp.json();
    
    // Update progress bar
    if (progressBarEl) {
      progressBarEl.style.width = "70%";
    }
    
    // Update existing items in the feed
    updateFeedItems(items);
    
    // If modal is open, refresh its content
    if (modal.classList.contains("open") && currentlyViewedItem) {
      const currentFileName = currentlyViewedItem.dataset?.fileName;
      if (currentFileName) {
        const updatedItem = items.find(item => item.file_name === currentFileName);
        if (updatedItem) {
          // Find the updated DOM element
          const updatedElement = document.querySelector(`[data-file-name="${currentFileName}"]`);
          if (updatedElement) {
            currentlyViewedItem = updatedElement;
            updateModalContent(updatedElement);
          }
        }
      }
    }
    
    updateClock();
    
    // Complete progress bar
    if (progressBarEl) {
      progressBarEl.style.width = "100%";
      setTimeout(() => {
        progressBarEl.style.transition = "opacity 0.3s ease";
        progressBarEl.style.opacity = "0";
        setTimeout(() => {
          progressBarEl.style.width = "0%";
          progressBarEl.style.transition = "width 300ms ease, opacity 300ms ease";
        }, 300);
      }, 200);
    }
  } catch (err) {
    console.log("Polling error:", err);
    if (progressBarEl) {
      progressBarEl.style.width = "0%";
      progressBarEl.style.opacity = "0";
    }
  }
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function startPolling() {
  stopPolling();
  pollData();
  pollInterval = setInterval(pollData, pollIntervalMs);
}

function setLiveMode(isRunning) {
  running = isRunning;
  window.livePaused = !isRunning;
  if (toggleBtn) {
    toggleBtn.textContent = isRunning ? "Pause live" : "Resume live";
  }
  if (status) {
    status.innerHTML = isRunning ? '<span class="dot"></span>Live' : "Paused";
  }
  if (isRunning) {
    startPolling();
  } else {
    stopPolling();
  }
}

function applyReloadInterval(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 1) {
    showToast("❌ Reload time must be at least 1s.");
    return;
  }
  const clamped = Math.min(Math.max(value, 1), 60);
  pollIntervalMs = clamped * 1000;
  if (reloadInput) {
    reloadInput.value = String(clamped);
  }
  localStorage.setItem("reloadIntervalSec", String(clamped));
  if (running) {
    startPolling();
  }
  showToast(`✅ Reload set to ${clamped}s.`);
}

// Update items in the feed with new data
function updateFeedItems(items) {
  const feedContainer = document.getElementById("tab-feed");
  if (!feedContainer) return;
  
  items.forEach(item => {
    let itemElement = document.querySelector(`[data-file-name="${item.file_name}"]`);
    
    if (!itemElement) {
      // NEW ITEM - Add it to the top of the feed
      itemElement = createItemElement(item);
      feedContainer.insertBefore(itemElement, feedContainer.firstChild);
    } else {
      // EXISTING ITEM - Update its data and UI
      updateItemElement(itemElement, item);
    }
  });
  
  // Update statistics
  updateStats(items);
  
  // Apply current filters
  filterItems();
}

// Create a new item element
function createItemElement(item) {
  const div = document.createElement("div");
  div.className = "item";
  div.dataset.id = item.id || "";
  div.dataset.fileName = item.file_name || "Unknown";
  div.dataset.username = item.username || "Bot";
  div.dataset.timestamp = item.timestamp || new Date().toLocaleTimeString();
  div.dataset.text = item.text || "";
  div.dataset.urls = JSON.stringify(item.urls || []);
  div.dataset.vtStats = JSON.stringify(item.vt_stats) || "null";
  div.dataset.vtStatus = item.vt_status || "unknown";
  div.dataset.fileSize = item.file_size || "";
  div.dataset.md5 = item.md5 || "";
  div.dataset.sha1 = item.sha1 || "";
  div.dataset.sha256 = item.sha256 || "";
  div.dataset.vhash = item.vhash || "";
  div.dataset.ssdeep = item.ssdeep || "";
  div.dataset.tlsh = item.tlsh || "";
  div.dataset.mimeType = item.mime_type || "";
  div.dataset.category = item.category || "";
  div.dataset.vtMagic = item.vt_magic || "";
  div.dataset.vtType = item.vt_type || "";
  div.dataset.vtTypeTag = item.vt_type_tag || "";
  div.dataset.vtTrid = JSON.stringify(item.vt_trid) || "null";
  div.dataset.vtMagika = item.vt_magika || "";
  div.dataset.fileLink = item.saved_file ? `/uploads/${item.saved_file}` : "";
  
  const riskLevel = getRiskLevel(item.vt_stats);
  const statusClass = item.vt_status === "completed" ? "completed" : item.vt_status === "queued" || item.vt_status === "in_progress" ? "analyzing" : "failed";
  const spinner = item.vt_status === "queued" || item.vt_status === "in_progress" ? '<div class="spinner"></div>' : '';
  
  // Generate verdict for completed items
  let verdictHtml = '';
  if (item.vt_status === "completed" && item.vt_stats) {
    const verdict = generateFinalVerdict(item.vt_stats);
    verdictHtml = `
      <div class="item-verdict ${verdict.class}" style="margin-top: 12px; padding: 12px; border-radius: 8px; border-left: 4px solid ${verdict.borderColor}; background: ${verdict.bgColor};">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">${verdict.icon}</span>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 600; color: ${verdict.textColor};">${verdict.title}</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">${verdict.subtitle}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  div.innerHTML = `
    <div class="item-header">
      <div class="item-meta">
        <strong>${item.username || "Bot"}</strong> · <span class="timestamp">${item.timestamp || new Date().toLocaleTimeString()}</span>
      </div>
      <div class="status-badge ${statusClass}" data-status="${item.vt_status}">
        ${spinner}
        <span>${item.vt_status === "queued" ? "Queued" : item.vt_status === "in_progress" ? "Analyzing" : item.vt_status === "completed" ? "Completed" : "Failed"}</span>
      </div>
    </div>
    <div class="item-content">
      ${item.text ? `<div class="text-content">${item.text}</div>` : ""}
      ${item.file_name ? `<div class="file-info">📄 ${item.file_name}</div>` : ""}
      ${item.vt_status ? `<div class="analysis-summary">${getAnalysisNarrative(item.vt_status, item.vt_stats)}</div>` : ""}
    </div>
    ${verdictHtml}
    ${item.vt_status === "completed" && item.vt_stats ? `<div class="item-stats">
      <span class="stat-safe" title="Safe">🟢 ${item.vt_stats.harmless || 0}</span>
      <span class="stat-threat" title="Threat">🔴 ${item.vt_stats.malicious || 0}</span>
      <span class="stat-risky" title="Risky">🟡 ${item.vt_stats.suspicious || 0}</span>
    </div>` : ""}
  `;
  
  div.addEventListener("click", () => {
    currentlyViewedItem = div;
    openModal(div);
  });
  
  return div;
}

// Update an existing item element with new data
function updateItemElement(itemElement, item) {
  // Update data attributes
  itemElement.dataset.id = item.id || itemElement.dataset.id || "";
  itemElement.dataset.vtStatus = item.vt_status || "unknown";
  itemElement.dataset.vtStats = JSON.stringify(item.vt_stats) || "null";
  itemElement.dataset.md5 = item.md5 || "";
  itemElement.dataset.sha1 = item.sha1 || "";
  itemElement.dataset.sha256 = item.sha256 || "";
  itemElement.dataset.vhash = item.vhash || "";
  itemElement.dataset.ssdeep = item.ssdeep || "";
  itemElement.dataset.tlsh = item.tlsh || "";
  itemElement.dataset.mimeType = item.mime_type || "";
  itemElement.dataset.category = item.category || "";
  itemElement.dataset.vtMagic = item.vt_magic || "";
  itemElement.dataset.vtType = item.vt_type || "";
  itemElement.dataset.vtTypeTag = item.vt_type_tag || "";
  itemElement.dataset.vtTrid = JSON.stringify(item.vt_trid) || "null";
  itemElement.dataset.vtMagika = item.vt_magika || "";
  if (item.saved_file) {
    itemElement.dataset.fileLink = `/uploads/${item.saved_file}`;
  }
  
  // Update status badge
  const statusBadge = itemElement.querySelector(".status-badge");
  if (statusBadge) {
    const statusClass = item.vt_status === "completed" ? "completed" : item.vt_status === "queued" || item.vt_status === "in_progress" ? "analyzing" : "failed";
    const spinner = item.vt_status === "queued" || item.vt_status === "in_progress" ? '<div class="spinner"></div>' : '';
    
    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.dataset.status = item.vt_status;
    statusBadge.innerHTML = `
      ${spinner}
      <span>${item.vt_status === "queued" ? "Queued" : item.vt_status === "in_progress" ? "Analyzing" : item.vt_status === "completed" ? "Completed" : "Failed"}</span>
    `;
  }
  
  // Update statistics if analysis is complete
  let statsDiv = itemElement.querySelector(".item-stats");
  if (item.vt_status === "completed" && item.vt_stats) {
    if (!statsDiv) {
      statsDiv = document.createElement("div");
      statsDiv.className = "item-stats";
      itemElement.appendChild(statsDiv);
    }
    statsDiv.innerHTML = `
      <span class="stat-safe" title="Safe">🟢 ${item.vt_stats.harmless || 0}</span>
      <span class="stat-threat" title="Threat">🔴 ${item.vt_stats.malicious || 0}</span>
      <span class="stat-risky" title="Risky">🟡 ${item.vt_stats.suspicious || 0}</span>
    `;
    
    // Add verdict if not already present
    let verdictDiv = itemElement.querySelector(".item-verdict");
    if (!verdictDiv) {
      const verdict = generateFinalVerdict(item.vt_stats);
      verdictDiv = document.createElement("div");
      verdictDiv.className = `item-verdict ${verdict.class}`;
      verdictDiv.style.cssText = `margin-top: 12px; padding: 12px; border-radius: 8px; border-left: 4px solid ${verdict.borderColor}; background: ${verdict.bgColor};`;
      verdictDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">${verdict.icon}</span>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 600; color: ${verdict.textColor};">${verdict.title}</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">${verdict.subtitle}</div>
          </div>
        </div>
      `;
      // Insert verdict before stats
      itemElement.insertBefore(verdictDiv, statsDiv);
    }
  }

  const summaryEl = itemElement.querySelector(".analysis-summary");
  if (item.vt_status) {
    const narrative = getAnalysisNarrative(item.vt_status, item.vt_stats);
    if (summaryEl) {
      summaryEl.textContent = narrative;
    } else {
      const contentEl = itemElement.querySelector(".item-content");
      if (contentEl) {
        const newSummary = document.createElement("div");
        newSummary.className = "analysis-summary";
        newSummary.textContent = narrative;
        contentEl.appendChild(newSummary);
      }
    }
  }
}

// Update modal content in real-time
function updateModalContent(item) {
  // Rebuild the modal with fresh data
  openModal(item);
}

function updateClock() {
  const now = new Date();
  clock.textContent = `Live · ${now.toLocaleTimeString()}`;
}

function getRiskLevel(stats) {
  if (!stats) return "Unknown";
  const total = (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0);
  if (total === 0) return "No threats detected";
  const threatScore = ((stats.malicious || 0) * 100 + (stats.suspicious || 0) * 50) / (total * 100);
  if (threatScore > 0.3) return "🔴 High Risk";
  if (threatScore > 0.1) return "🟡 Medium Risk";
  return "🟢 Low Risk";
}

function generateFinalVerdict(stats) {
  const harmless = stats?.harmless || 0;
  const malicious = stats?.malicious || 0;
  const suspicious = stats?.suspicious || 0;
  const total = harmless + malicious + suspicious;
  
  // Treat no data as SAFE instead of INSUFFICIENT DATA
  const threatScore = total === 0 ? 0 : ((malicious * 100) + (suspicious * 50)) / (total * 100);
  
  if (threatScore > 0.3) {
    return {
      class: "verdict-danger",
      icon: "⛔",
      title: "UNSAFE - DO NOT USE",
      subtitle: `High Risk: ${malicious} malicious, ${suspicious} suspicious out of ${total} engines`,
      recommendation: "🚨 Recommendation: DELETE this file immediately and do not execute it. It may contain malware, viruses, or other harmful code.",
      borderColor: "#d32f2f",
      bgColor: "#ffebee",
      textColor: "#c62828"
    };
  } else if (threatScore > 0.1) {
    return {
      class: "verdict-warning",
      icon: "⚠️",
      title: "CAUTION ADVISED",
      subtitle: `Medium Risk: ${malicious} malicious, ${suspicious} suspicious out of ${total} engines`,
      recommendation: "🔍 Recommendation: Proceed with extreme caution. Verify the source, scan with additional tools, and avoid opening on important systems.",
      borderColor: "#f57c00",
      bgColor: "#fff3e0",
      textColor: "#e65100"
    };
  } else {
    // Low risk or no data - show as SAFE
    return {
      class: "verdict-safe",
      icon: "✅",
      title: "SAFE TO USE",
      subtitle: total > 0 ? `Low Risk: ${malicious} malicious, ${suspicious} suspicious out of ${total} engines` : "No threats detected",
      recommendation: "✓ Recommendation: File appears clean. However, always verify the source and stay vigilant with unknown files.",
      borderColor: "#388e3c",
      bgColor: "#e8f5e9",
      textColor: "#2e7d32"
    };
  }
}


function getVTStatusDescription(status) {
  const descriptions = {
    "pending_upload": "Preparing for security analysis...",
    "queued": "Queued for analysis. This may take a few minutes.",
    "in_progress": "AI model is analyzing your file. Please wait...",
    "completed": "Analysis complete.",
    "upload_failed": "Failed to process file.",
    "check_failed": "Failed to retrieve analysis results.",
    "unknown": "Status unknown."
  };
  return descriptions[status] || `Status: ${status}`;
}

function getAnalysisNarrative(status, stats) {
  const harmless = stats?.harmless || 0;
  const malicious = stats?.malicious || 0;
  const suspicious = stats?.suspicious || 0;
  const total = harmless + malicious + suspicious;
  const riskLevel = getRiskLevel(stats);

  if (status === "queued" || status === "in_progress" || status === "pending_upload") {
    return "The model pipeline is running multi-engine checks on this file. It is still processing the signals and correlating results. Final risk will be computed once all checks complete. Please wait for the completed status.";
  }

  if (status === "completed") {
    let reason = "the engines returned limited signals";
    if (riskLevel.includes("High")) {
      reason = "multiple engines flagged it as malicious or suspicious";
    } else if (riskLevel.includes("Medium")) {
      reason = "some engines reported suspicious activity";
    } else if (riskLevel.includes("Low")) {
      reason = "few or no engines raised concerns";
    }

    return `The model evaluated the file across ${total} checks. It recorded ${harmless} harmless, ${malicious} malicious, and ${suspicious} suspicious signals. Overall risk is ${riskLevel} because ${reason}. If the file is unexpected, treat it with caution and verify the source.`;
  }

  return "The analysis could not be completed due to a processing error. The model did not finish scoring this file. Try again later or resubmit the file. If the issue persists, check the server configuration.";
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "";
  const units = ["bytes", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  if (unitIndex === 0) {
    return `${value.toLocaleString()} bytes`;
  }
  return `${size.toFixed(2)} ${units[unitIndex]} (${value.toLocaleString()} bytes)`;
}

function buildPlainReport(item, vtStats) {
  const lines = [];
  const fileName = item.dataset.fileName || "unknown";
  const sizeText = item.dataset.fileSize ? formatBytes(item.dataset.fileSize) : "";

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`📋 File: ${fileName}`);
  if (sizeText) {
    lines.push(`Size: ${sizeText}`);
  }
  lines.push("📄━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const fileInfo = [];
  if (item.dataset.mimeType) fileInfo.push(`  MIME Type: ${item.dataset.mimeType}`);
  if (item.dataset.category) fileInfo.push(`  Category: ${item.dataset.category}`);
  if (item.dataset.vtMagic) fileInfo.push(`  Magic: ${item.dataset.vtMagic}`);
  if (item.dataset.vtType) fileInfo.push(`  Type Description: ${item.dataset.vtType}`);
  if (item.dataset.vtTypeTag) fileInfo.push(`  Type Tag: ${item.dataset.vtTypeTag}`);
  if (item.dataset.vtMagika) fileInfo.push(`  Magika: ${item.dataset.vtMagika}`);

  if (fileInfo.length) {
    lines.push("📋 FILE TYPE INFORMATION");
    lines.push(...fileInfo);
    lines.push("");
  }

  const hashes = [];
  if (item.dataset.md5) hashes.push(`  MD5: ${item.dataset.md5}`);
  if (item.dataset.sha1) hashes.push(`  SHA-1: ${item.dataset.sha1}`);
  if (item.dataset.sha256) hashes.push(`  SHA-256: ${item.dataset.sha256}`);
  if (item.dataset.vhash) hashes.push(`  Vhash: ${item.dataset.vhash}`);
  if (item.dataset.ssdeep) hashes.push(`  SSDEEP: ${item.dataset.ssdeep}`);
  if (item.dataset.tlsh) hashes.push(`  TLSH: ${item.dataset.tlsh}`);

  if (hashes.length) {
    lines.push("🔐 CRYPTOGRAPHIC HASHES");
    lines.push(...hashes);
    lines.push("");
  }

  if (vtStats) {
    const harmless = vtStats.harmless ?? 0;
    const malicious = vtStats.malicious ?? 0;
    const suspicious = vtStats.suspicious ?? 0;
    const total = harmless + malicious + suspicious;
    const risk = getRiskLevel(vtStats);
    lines.push("🛡️ SECURITY ANALYSIS REPORT");
    lines.push(`Status: ${item.dataset.vtStatus || "unknown"}`);
    lines.push(`Total Checks: ${total}`);
    lines.push(`Risk Level: ${risk}`);
    lines.push(`  ✅ Harmless: ${harmless}`);
    lines.push(`  🔴 Malicious: ${malicious}`);
    lines.push(`  🟡 Suspicious: ${suspicious}`);
    lines.push("");
  }

  return lines.join("\n");
}

function openModal(item) {
  const urls = JSON.parse(item.dataset.urls || "[]");
  const vtStats = JSON.parse(item.dataset.vtStats || "null");
  const vtStatus = item.dataset.vtStatus;
  
  modalTitle.textContent = item.dataset.fileName || "Message";
  modalMeta.textContent = `@${item.dataset.username} | ${item.dataset.timestamp}`;
  
  let html = "";
  
  if (item.dataset.text) {
    html += `<div class="text">${item.dataset.text}</div>`;
  }
  
  if (urls.length) {
    html += "<div class=\"urls\"><strong>URLs</strong><ul>";
    urls.forEach((u) => {
      html += `<li><a href="${u}" target="_blank">${u}</a></li>`;
    });
    html += "</ul></div>";
  }
  
  // File details section
  if (item.dataset.fileName) {
    html += `<div class="file-details-main">`;
    html += `<div class="file-header">`;
    html += `<div style="display: flex; align-items: center; gap: 12px;">`;
    html += `<div style="font-size: 32px;">📄</div>`;
    html += `<div>`;
    html += `<div style="font-size: 16px; font-weight: 600;"><a href="${item.dataset.fileLink}">${item.dataset.fileName}</a></div>`;
    
    // File size
    if (item.dataset.fileSize) {
      const bytes = parseInt(item.dataset.fileSize);
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      html += `<div style="font-size: 13px; color: var(--muted);">${mb} MB • ${bytes.toLocaleString()} bytes</div>`;
    }
    
    html += `</div></div></div>`;
    
    // File type info
    if (item.dataset.vtType || item.dataset.vtMagic || item.dataset.mimeType || item.dataset.vtTrid || item.dataset.vtMagika) {
      html += `<div class="detail-section" style="margin-top: 16px;">`;
      html += `<div class="section-title">📋 File Type Information</div>`;
      html += `<div class="detail-grid">`;
      
      if (item.dataset.vtMagic) {
        html += `<div class="detail-row"><span class="detail-key">Magic</span><span class="detail-value">${item.dataset.vtMagic}</span></div>`;
      }
      if (item.dataset.vtType) {
        html += `<div class="detail-row"><span class="detail-key">Type Description</span><span class="detail-value">${item.dataset.vtType}</span></div>`;
      }
      if (item.dataset.mimeType) {
        html += `<div class="detail-row"><span class="detail-key">MIME Type</span><span class="detail-value">${item.dataset.mimeType}</span></div>`;
      }
      if (item.dataset.category) {
        html += `<div class="detail-row"><span class="detail-key">Category</span><span class="detail-value">${item.dataset.category}</span></div>`;
      }
      if (item.dataset.vtTypeTag) {
        html += `<div class="detail-row"><span class="detail-key">Type Tag</span><span class="detail-value">${item.dataset.vtTypeTag}</span></div>`;
      }
      
      // TrID - can be an array
      if (item.dataset.vtTrid && item.dataset.vtTrid !== "null") {
        try {
          const trid = JSON.parse(item.dataset.vtTrid);
          if (Array.isArray(trid) && trid.length > 0) {
            const tridList = trid.slice(0, 3).map(t => `${t.file_type} (${t.probability}%)`).join(", ");
            html += `<div class="detail-row"><span class="detail-key">TrID</span><span class="detail-value">${tridList}</span></div>`;
          } else if (typeof trid === 'string') {
            html += `<div class="detail-row"><span class="detail-key">TrID</span><span class="detail-value">${trid}</span></div>`;
          }
        } catch (e) {
          if (item.dataset.vtTrid) {
            html += `<div class="detail-row"><span class="detail-key">TrID</span><span class="detail-value">${item.dataset.vtTrid}</span></div>`;
          }
        }
      }
      
      if (item.dataset.vtMagika) {
        html += `<div class="detail-row"><span class="detail-key">Magika</span><span class="detail-value">${item.dataset.vtMagika}</span></div>`;
      }
      
      html += `</div></div>`;
    }
    
    // Hashes section
    if (item.dataset.md5 || item.dataset.sha1 || item.dataset.sha256 || item.dataset.vhash || item.dataset.ssdeep || item.dataset.tlsh) {
      html += `<div class="detail-section">`;
      html += `<div class="section-title">🔐 Cryptographic Hashes</div>`;
      html += `<div class="hash-grid">`;
      
      if (item.dataset.md5) {
        html += `<div class="hash-block">`;
        html += `<div class="hash-label">MD5</div>`;
        html += `<div class="hash-value-mono">${item.dataset.md5}</div>`;
        html += `</div>`;
      }
      if (item.dataset.sha1) {
        html += `<div class="hash-block">`;
        html += `<div class="hash-label">SHA-1</div>`;
        html += `<div class="hash-value-mono">${item.dataset.sha1}</div>`;
        html += `</div>`;
      }
      if (item.dataset.sha256) {
        html += `<div class="hash-block">`;
        html += `<div class="hash-label">SHA-256</div>`;
        html += `<div class="hash-value-mono">${item.dataset.sha256}</div>`;
        html += `</div>`;
      }
      if (item.dataset.vhash) {
        html += `<div class="hash-block">`;
        html += `<div class="hash-label">Vhash</div>`;
        html += `<div class="hash-value-mono">${item.dataset.vhash}</div>`;
        html += `</div>`;
      }
      if (item.dataset.ssdeep) {
        html += `<div class="hash-block">`;
        html += `<div class="hash-label">SSDEEP</div>`;
        html += `<div class="hash-value-mono" style="font-size: 10px; word-break: break-all;">${item.dataset.ssdeep}</div>`;
        html += `</div>`;
      }
      if (item.dataset.tlsh) {
        html += `<div class="hash-block">`;
        html += `<div class="hash-label">TLSH</div>`;
        html += `<div class="hash-value-mono" style="font-size: 10px;">${item.dataset.tlsh}</div>`;
        html += `</div>`;
      }
      
      html += `</div></div>`;
    }
    
    html += `</div>`;
  }
  
  if (vtStatus) {
    html += `<div class="security-report">`;
    html += `<div class="report-header">🛡️ Security Analysis Report</div>`;
    
    // Add Final Verdict Banner (only for completed analysis)
    if (vtStatus === "completed" && vtStats) {
      const verdict = generateFinalVerdict(vtStats);
      html += `<div class="final-verdict ${verdict.class}" style="margin: 16px 0; padding: 20px; border-radius: 12px; border-left: 5px solid ${verdict.borderColor}; background: ${verdict.bgColor};">`;
      html += `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">`;
      html += `<div style="font-size: 28px;">${verdict.icon}</div>`;
      html += `<div style="flex: 1;">`;
      html += `<div style="font-size: 18px; font-weight: 700; color: ${verdict.textColor};">${verdict.title}</div>`;
      html += `<div class="verdict-subtitle">${verdict.subtitle}</div>`;
      html += `</div></div>`;
      html += `<div class="verdict-recommendation">${verdict.recommendation}</div>`;
      html += `</div>`;
    }
    
    // Show loading state or status
    if (vtStatus === "queued" || vtStatus === "in_progress") {
      html += `<div class="analysis-status-loading">`;
      html += `<div class="vt-loading"><div class="vt-spinner"></div><span>${vtStatus === "queued" ? "⏳ Queued for analysis" : "🔍 Analyzing file"}</span></div>`;
      html += `<div style="font-size: 12px; color: var(--muted); margin-top: 8px;">Analysis in progress. Updates in real-time below.</div>`;
      html += `</div>`;
    } else {
      html += `<div style="margin: 12px 0;">`;
      const statusColor = vtStatus === "completed" ? "#2e7d32" : "#c62828";
      html += `<span class="vt-status-badge ${vtStatus}" style="background: ${statusColor}20; color: ${statusColor}; padding: 8px 12px; border-radius: 8px; font-weight: 500;">${vtStatus.replace(/_/g, " ").toUpperCase()}</span>`;
      html += `</div>`;
    }
    
    // Show descriptive analysis
    const description = getAnalysisNarrative(vtStatus, vtStats);
    html += `<div class="analysis-detail analysis-summary-block" style="margin-top: 14px;">`;
    html += `<div class="detail-title" style="font-weight: 600; margin-bottom: 4px;">Analysis Summary</div>`;
    html += `<div class="analysis-summary-text">${description}</div>`;
    html += `</div>`;
    
    // Show detailed stats if available
    if (vtStats) {
      const riskLevel = getRiskLevel(vtStats);
      const total = (vtStats.harmless || 0) + (vtStats.malicious || 0) + (vtStats.suspicious || 0);

      // Summary block
      html += `<div class="analysis-detail" style="margin-top: 14px;">`;
      html += `<div class="detail-title" style="color: var(--accent-2); margin-bottom: 8px;">Summary</div>`;
      html += `<div class="analysis-summary-text">Total Engines: ${total}</div>`;
      html += `<div class="analysis-summary-text">Risk Level: ${riskLevel}</div>`;
      html += `</div>`;
      
      // Risk assessment
      html += `<div class="analysis-detail" style="margin-top: 14px;">`;
      html += `<div class="detail-title" style="color: var(--accent-2); margin-bottom: 10px;">⚠️ Risk Assessment</div>`;
      html += `<div style="font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">${riskLevel}</div>`;
      html += `</div>`;
      
      // Detection results grid
      html += `<div class="detection-results" style="margin-top: 16px;">`;
      html += `<div class="detail-title" style="color: var(--accent-2); margin-bottom: 10px;">🔎 Detection Results</div>`;
      html += `<div class="detection-grid">`;
      html += `<div class="detection-card safe">`;
      html += `<div class="detection-label">Safe</div>`;
      html += `<div class="detection-count">${vtStats.harmless ?? 0}</div>`;
      html += `<div class="detection-percent">${total > 0 ? ((vtStats.harmless / total) * 100).toFixed(0) : 0}%</div>`;
      html += `</div>`;
      html += `<div class="detection-card threat">`;
      html += `<div class="detection-label">Threat</div>`;
      html += `<div class="detection-count">${vtStats.malicious ?? 0}</div>`;
      html += `<div class="detection-percent">${total > 0 ? ((vtStats.malicious / total) * 100).toFixed(0) : 0}%</div>`;
      html += `</div>`;
      html += `<div class="detection-card risky">`;
      html += `<div class="detection-label">Risky</div>`;
      html += `<div class="detection-count">${vtStats.suspicious ?? 0}</div>`;
      html += `<div class="detection-percent">${total > 0 ? ((vtStats.suspicious / total) * 100).toFixed(0) : 0}%</div>`;
      html += `</div>`;
      html += `</div></div>`;
      
      // Statistics footer
      html += `<div class="analysis-detail analysis-footer" style="margin-top: 14px;">`;
      html += `<div><strong>Total Detections:</strong> ${total}</div>`;
      html += `<div><strong>Vendors Consulted:</strong> Multiple security engines</div>`;
      html += `<div><strong>Analysis Type:</strong> AI-Powered Security Scan</div>`;
      html += `</div>`;
    }
    
    const plainReport = buildPlainReport(item, vtStats);
    html += `<div class="detail-section">`;
    html += `<div class="section-title">📄 Full Details</div>`;
    html += `<pre class="report-plain">${plainReport}</pre>`;
    html += `</div>`;

    html += `</div>`;
  }
  
  modalBody.innerHTML = html || "<div class=\"empty\">No details available.</div>";
  modal.classList.add("open");
}

// Update statistics dashboard
function updateStats(items) {
  const totalItems = items.length;
  const fileItems = items.filter(i => i.file_name).length;
  
  // Count safe, threats, and analyzing
  let safeCount = 0;
  let threatsCount = 0;
  let analyzingCount = 0;
  
  items.forEach(item => {
    if (item.vt_status === "queued" || item.vt_status === "in_progress") {
      analyzingCount++;
    } else if (item.vt_status === "completed" && item.vt_stats) {
      const stats = item.vt_stats;
      const total = (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0);
      if (total > 0) {
        const threatScore = ((stats.malicious || 0) * 100 + (stats.suspicious || 0) * 50) / (total * 100);
        if (threatScore > 0.1) {
          threatsCount++;
        } else {
          safeCount++;
        }
      } else {
        safeCount++;
      }
    }
  });
  
  // Update stat displays with animation
  animateValue("stat-total", totalItems);
  animateValue("stat-safe", safeCount);
  animateValue("stat-threats", threatsCount);
  animateValue("stat-analyzing", analyzingCount);
}

function initExistingItemClicks() {
  const items = document.querySelectorAll(".item");
  items.forEach((item) => {
    if (item.dataset.clickBound === "true") return;
    item.addEventListener("click", () => {
      currentlyViewedItem = item;
      openModal(item);
    });
    item.dataset.clickBound = "true";
  });
}

// Animate number changes
function animateValue(id, newValue) {
  const elem = document.getElementById(id);
  if (!elem) return;
  
  const currentValue = parseInt(elem.textContent) || 0;
  if (currentValue === newValue) return;
  
  const duration = 500;
  const steps = 20;
  const stepValue = (newValue - currentValue) / steps;
  const stepDuration = duration / steps;
  
  let current = currentValue;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    current += stepValue;
    
    if (step >= steps) {
      elem.textContent = newValue;
      clearInterval(timer);
    } else {
      elem.textContent = Math.round(current);
    }
  }, stepDuration);
}

// Filter and search items
function filterItems() {
  const items = document.querySelectorAll(".item");
  let visibleCount = 0;
  
  items.forEach((item) => {
    const fileName = (item.dataset.fileName || "").toLowerCase();
    const username = (item.dataset.username || "").toLowerCase();
    const md5 = (item.dataset.md5 || "").toLowerCase();
    const sha256 = (item.dataset.sha256 || "").toLowerCase();
    const vtStatus = item.dataset.vtStatus || "";
    const vtStats = JSON.parse(item.dataset.vtStats || "null");
    const timestamp = new Date(item.dataset.timestamp || Date.now());
    const now = new Date();
    const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
    
    // Check search query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      fileName.includes(searchLower) ||
      username.includes(searchLower) ||
      md5.includes(searchLower) ||
      sha256.includes(searchLower);
    
    // Check filter
    let matchesFilter = true;
    if (currentFilter === "safe") {
      if (vtStatus === "completed" && vtStats) {
        const total = (vtStats.harmless || 0) + (vtStats.malicious || 0) + (vtStats.suspicious || 0);
        const threatScore = total > 0 ? ((vtStats.malicious || 0) * 100 + (vtStats.suspicious || 0) * 50) / (total * 100) : 0;
        matchesFilter = threatScore <= 0.1;
      } else {
        matchesFilter = false;
      }
    } else if (currentFilter === "threat") {
      if (vtStatus === "completed" && vtStats) {
        const total = (vtStats.harmless || 0) + (vtStats.malicious || 0) + (vtStats.suspicious || 0);
        const threatScore = total > 0 ? ((vtStats.malicious || 0) * 100 + (vtStats.suspicious || 0) * 50) / (total * 100) : 0;
        matchesFilter = threatScore > 0.1;
      } else {
        matchesFilter = false;
      }
    } else if (currentFilter === "analyzing") {
      matchesFilter = vtStatus === "queued" || vtStatus === "in_progress";
    } else if (currentFilter === "recent") {
      matchesFilter = hoursDiff <= 24;
    }
    
    // Show or hide item
    if (matchesSearch && matchesFilter) {
      item.style.display = "";
      visibleCount++;
    } else {
      item.style.display = "none";
    }
  });
  
  // Show empty state if no results
  const feedContainer = document.querySelector("#tab-feed .grid");
  if (feedContainer) {
    let emptyState = feedContainer.querySelector(".empty-search");
    if (visibleCount === 0) {
      if (!emptyState) {
        emptyState = document.createElement("div");
        emptyState.className = "empty empty-search";
        emptyState.textContent = "No items match your search or filter criteria.";
        feedContainer.appendChild(emptyState);
      }
    } else if (emptyState) {
      emptyState.remove();
    }
  }
}

// File upload handling
const dropzoneEl = document.getElementById("dropzone");
const fileInputEl = document.getElementById("fileInput");
const uploadProgressEl = document.getElementById("uploadProgress");
const progressFillEl = document.getElementById("progressFill");
const progressBarEl = document.getElementById("bar");
const uploadStatusEl = document.getElementById("uploadStatus");

if (dropzoneEl) {
  dropzoneEl.addEventListener("click", () => fileInputEl.click());

  dropzoneEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzoneEl.classList.add("drag-over");
  });

  dropzoneEl.addEventListener("dragleave", () => dropzoneEl.classList.remove("drag-over"));

  dropzoneEl.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzoneEl.classList.remove("drag-over");
    if (event.dataTransfer.files.length) {
      // Use a data transfer object to handle drag-drop files
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        dataTransfer.items.add(event.dataTransfer.files[i]);
      }
      fileInputEl.files = dataTransfer.files;
      uploadFile();
    }
  });
}

if (fileInputEl) {
  fileInputEl.addEventListener("change", () => {
    if (fileInputEl.files.length) {
      uploadFile();
    }
  });
}

async function uploadFile() {
  const file = fileInputEl.files[0];
  if (!file) return;

  lastUploadedFile = file.name;
  dropzoneEl.style.display = "none";
  uploadProgressEl.style.display = "block";
  uploadStatusEl.textContent = "Uploading...";
  progressFillEl.style.width = "0%";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_name", file.name);

  try {
    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      const currentWidth = parseFloat(progressFillEl.style.width);
      if (currentWidth < 90) {
        progressFillEl.style.width = (currentWidth + Math.random() * 20) + "%";
      }
    }, 200);

    const resp = await fetch("/upload", { method: "POST", body: formData });
    clearInterval(progressInterval);
    
    if (!resp.ok) {
      uploadStatusEl.textContent = `Upload failed (${resp.status})`;
      setTimeout(() => {
        uploadProgressEl.style.display = "none";
        dropzoneEl.style.display = "block";
        fileInputEl.value = "";
      }, 2000);
      lastUploadedFile = null;
      return;
    }

    progressFillEl.style.width = "100%";
    uploadStatusEl.textContent = "Upload complete. Analyzing...";
    
    // Trigger immediate poll to show new file
    await pollData();
    
    // Reset upload UI after a moment
    setTimeout(() => {
      uploadProgressEl.style.display = "none";
      dropzoneEl.style.display = "block";
      fileInputEl.value = "";
      lastUploadedFile = null;
      progressFillEl.style.width = "0%";
    }, 1500);
    
  } catch (err) {
    console.log("Upload error:", err);
    uploadStatusEl.textContent = "Upload failed. Please try again.";
    setTimeout(() => {
      uploadProgressEl.style.display = "none";
      dropzoneEl.style.display = "block";
      fileInputEl.value = "";
      progressFillEl.style.width = "0%";
    }, 2000);
    lastUploadedFile = null;
  }
}

// Event listeners
toggleBtn.addEventListener("click", () => {
  setLiveMode(!running);
});

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.style.transform = "rotate(360deg)";
    refreshBtn.style.transition = "transform 0.5s ease";
    await pollData();
    showToast("✅ Data refreshed!");
    setTimeout(() => {
      refreshBtn.style.transform = "rotate(0deg)";
    }, 500);
  });
}

closeModal.addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.remove("open");
  }
});

// Search functionality
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    filterItems();
    scheduleSuggestions(searchQuery);
  });

  searchInput.addEventListener("focus", () => {
    if (searchQuery) {
      scheduleSuggestions(searchQuery);
    }
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => hideSuggestions(), 120);
  });
}

// Filter buttons
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active class from all buttons
    filterButtons.forEach(b => b.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");
    // Update current filter
    currentFilter = btn.dataset.filter;
    // Apply filter
    filterItems();
  });
});

// Export button
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (currentlyViewedItem) {
      exportReport(currentlyViewedItem);
    }
  });
}

if (exportVisibleBtn) {
  exportVisibleBtn.addEventListener("click", () => {
    const visibleItems = Array.from(document.querySelectorAll(".item")).filter(
      (item) => item.style.display !== "none"
    );
    if (!visibleItems.length) {
      showToast("❌ No visible items to export.");
      return;
    }

    const rows = visibleItems.map((item) => {
      const stats = JSON.parse(item.dataset.vtStats || "null") || {};
      return {
        id: item.dataset.id,
        timestamp: item.dataset.timestamp,
        username: item.dataset.username,
        file_name: item.dataset.fileName,
        status: item.dataset.vtStatus,
        harmless: stats.harmless ?? "",
        malicious: stats.malicious ?? "",
        suspicious: stats.suspicious ?? "",
      };
    });

    const headers = Object.keys(rows[0]);
    const csv = [headers.join(",")]
      .concat(rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `visible_items_${Date.now()}.csv`);
    showToast("✅ Visible items exported!");
  });
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // ESC to close modal
  if (e.key === "Escape" && modal.classList.contains("open")) {
    modal.classList.remove("open");
  }
  
  // Ctrl+F to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === "f" && searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

document.addEventListener("click", (e) => {
  if (!suggestionsEl || !searchInput) return;
  if (!suggestionsEl.contains(e.target) && e.target !== searchInput) {
    hideSuggestions();
  }
});

if (applyReloadBtn && reloadInput) {
  applyReloadBtn.addEventListener("click", () => {
    applyReloadInterval(reloadInput.value);
  });

  reloadInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      applyReloadInterval(reloadInput.value);
    }
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    animateThemeSwitch();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
}

// Add click-to-copy functionality for hashes
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("hash-value-mono")) {
    const text = e.target.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Hash copied to clipboard!");
      e.target.style.background = "#e8f5e9";
      setTimeout(() => {
        e.target.style.background = "#fafafa";
      }, 500);
    }).catch(() => {
      showToast("❌ Failed to copy");
    });
  }
});

function hideSuggestions() {
  if (!suggestionsEl) return;
  suggestionsEl.style.display = "none";
  suggestionsEl.innerHTML = "";
}

function renderSuggestions(list) {
  if (!suggestionsEl) return;
  if (!list || !list.length) {
    hideSuggestions();
    return;
  }

  suggestionsEl.innerHTML = "";
  list.forEach((suggestion) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.innerHTML = `
      <span class="suggestion-type">${suggestion.type || "match"}</span>
      <span class="suggestion-value">${suggestion.value}</span>
    `;
    item.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = suggestion.value;
      }
      searchQuery = suggestion.value;
      filterItems();
      hideSuggestions();
    });
    suggestionsEl.appendChild(item);
  });
  suggestionsEl.style.display = "block";
}

function scheduleSuggestions(query) {
  if (!suggestionsEl) return;
  if (!query) {
    hideSuggestions();
    return;
  }
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(async () => {
    try {
      const resp = await fetch(`/suggest?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      renderSuggestions(data.suggestions || []);
    } catch (err) {
      console.log("Suggest error:", err);
      hideSuggestions();
    }
  }, 200);
}

// Initial load and start continuous polling
updateClock();
initExistingItemClicks();
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark" || savedTheme === "light") {
  applyTheme(savedTheme);
} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  applyTheme("dark");
} else {
  applyTheme("light");
}
const savedInterval = localStorage.getItem("reloadIntervalSec");
if (savedInterval && reloadInput) {
  reloadInput.value = savedInterval;
  applyReloadInterval(savedInterval);
} else {
  startPolling();
}
