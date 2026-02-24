// Real-time dashboard with live updates - NO page reloads
const refreshBtn = document.getElementById("refreshBtn");
const toggleBtn = document.getElementById("toggleBtn");
const status = document.getElementById("status");
const clock = document.getElementById("clock");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalBody = document.getElementById("modalBody");

let running = true;
let lastUploadedFile = null;
let pollInterval = null;
let currentlyViewedItem = null;

// Real-time polling - update every 2 seconds
async function pollData() {
  try {
    const resp = await fetch("/data");
    const items = await resp.json();
    
    // Update existing items in the feed
    updateFeedItems(items);
    
    // If modal is open, refresh its content
    if (modal.classList.contains("open") && currentlyViewedItem) {
      const updatedItem = items.find(item => item.file_name === currentlyViewedItem.file_name);
      if (updatedItem) {
        currentlyViewedItem = updatedItem;
        updateModalContent(updatedItem);
      }
    }
    
    updateClock();
  } catch (err) {
    console.log("Polling error:", err);
  }
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
}

// Create a new item element
function createItemElement(item) {
  const div = document.createElement("div");
  div.className = "item";
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
  div.dataset.mimeType = item.mime_type || "";
  div.dataset.category = item.category || "";
  div.dataset.vtMagic = item.vt_magic || "";
  div.dataset.vtType = item.vt_type || "";
  div.dataset.vtTypeTag = item.vt_type_tag || "";
  div.dataset.fileLink = `/uploads/${item.file_name}` || "#";
  
  const riskLevel = getRiskLevel(item.vt_stats);
  const statusClass = item.vt_status === "completed" ? "completed" : item.vt_status === "queued" || item.vt_status === "in_progress" ? "analyzing" : "failed";
  const spinner = item.vt_status === "queued" || item.vt_status === "in_progress" ? '<div class="spinner"></div>' : '';
  
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
    </div>
    ${item.vt_status === "completed" && item.vt_stats ? `<div class="item-stats">
      <span class="stat-safe" title="Safe">🟢 ${item.vt_stats.harmless || 0}</span>
      <span class="stat-threat" title="Threat">🔴 ${item.vt_stats.malicious || 0}</span>
      <span class="stat-risky" title="Risky">🟡 ${item.vt_stats.suspicious || 0}</span>
    </div>` : ""}
  `;
  
  div.addEventListener("click", () => {
    currentlyViewedItem = item;
    openModal(item);
  });
  
  return div;
}

// Update an existing item element with new data
function updateItemElement(itemElement, item) {
  // Update data attributes
  itemElement.dataset.vtStatus = item.vt_status || "unknown";
  itemElement.dataset.vtStats = JSON.stringify(item.vt_stats) || "null";
  itemElement.dataset.md5 = item.md5 || "";
  itemElement.dataset.sha1 = item.sha1 || "";
  itemElement.dataset.sha256 = item.sha256 || "";
  itemElement.dataset.mimeType = item.mime_type || "";
  itemElement.dataset.category = item.category || "";
  itemElement.dataset.vtMagic = item.vt_magic || "";
  itemElement.dataset.vtType = item.vt_type || "";
  
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
    if (item.dataset.vtType || item.dataset.vtMagic || item.dataset.mimeType) {
      html += `<div class="detail-section" style="margin-top: 16px;">`;
      html += `<div class="section-title">📋 File Type</div>`;
      html += `<div class="detail-grid">`;
      
      if (item.dataset.vtMagic) {
        html += `<div class="detail-row"><span class="detail-key">Magic</span><span class="detail-value">${item.dataset.vtMagic}</span></div>`;
      }
      if (item.dataset.vtType) {
        html += `<div class="detail-row"><span class="detail-key">Type</span><span class="detail-value">${item.dataset.vtType}</span></div>`;
      }
      if (item.dataset.mimeType) {
        html += `<div class="detail-row"><span class="detail-key">MIME</span><span class="detail-value">${item.dataset.mimeType}</span></div>`;
      }
      if (item.dataset.category) {
        html += `<div class="detail-row"><span class="detail-key">Category</span><span class="detail-value">${item.dataset.category}</span></div>`;
      }
      
      html += `</div></div>`;
    }
    
    // Hashes section
    if (item.dataset.md5 || item.dataset.sha1 || item.dataset.sha256) {
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
      
      html += `</div></div>`;
    }
    
    html += `</div>`;
  }
  
  if (vtStatus) {
    html += `<div class="security-report">`;
    html += `<div class="report-header">🛡️ Security Analysis Report</div>`;
    
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
    const description = getVTStatusDescription(vtStatus);
    html += `<div class="analysis-detail" style="margin-top: 14px; padding: 12px; background: #f0f7fc; border-radius: 8px; border-left: 3px solid var(--accent-2);">`;
    html += `<div class="detail-title" style="font-weight: 600; color: var(--ink); margin-bottom: 4px;">Analysis Summary</div>`;
    html += `<div style="font-size: 13px; color: #2a333f; line-height: 1.5;">${description}</div>`;
    html += `</div>`;
    
    // Show detailed stats if available
    if (vtStats) {
      const riskLevel = getRiskLevel(vtStats);
      const total = (vtStats.harmless || 0) + (vtStats.malicious || 0) + (vtStats.suspicious || 0);
      
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
      html += `<div class="analysis-detail" style="margin-top: 14px; background: #f8fafc; padding: 10px; border-radius: 8px; font-size: 12px; color: var(--muted); line-height: 1.6;">`;
      html += `<div><strong>Total Detections:</strong> ${total}</div>`;
      html += `<div><strong>Vendors Consulted:</strong> Multiple security engines</div>`;
      html += `<div><strong>Analysis Type:</strong> AI-Powered Security Scan</div>`;
      html += `</div>`;
    }
    
    html += `</div>`;
  }
  
  modalBody.innerHTML = html || "<div class=\"empty\">No details available.</div>";
  modal.classList.add("open");
}

// Update statistics dashboard
function updateStats(items) {
  const totalItems = items.length;
  const fileItems = items.filter(i => i.file_name).length;
  const urlItems = items.filter(i => i.type === "url").length;
  const textItems = items.filter(i => i.type === "text").length;
  
  // Look for stats elements and update them
  const totalStat = document.getElementById("stat-total");
  const fileStat = document.getElementById("stat-files");
  const urlStat = document.getElementById("stat-urls");
  const textStat = document.getElementById("stat-text");
  
  if (totalStat) totalStat.textContent = totalItems;
  if (fileStat) fileStat.textContent = fileItems;
  if (urlStat) urlStat.textContent = urlItems;
  if (textStat) textStat.textContent = textItems;
}

// File upload handling
const dropzoneEl = document.getElementById("dropzone");
const fileInputEl = document.getElementById("fileInput");
const uploadProgressEl = document.getElementById("uploadProgress");
const progressFillEl = document.getElementById("progressFill");
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
refreshBtn.addEventListener("click", () => pollData());

toggleBtn.addEventListener("click", () => {
  running = !running;
  toggleBtn.textContent = running ? "Pause live" : "Resume live";
  status.innerHTML = running ? '<span class="dot"></span>Live' : "Paused";
  if (!running && pollInterval) {
    clearInterval(pollInterval);
  } else if (running) {
    pollData();
    pollInterval = setInterval(pollData, 2000);
  }
});

closeModal.addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.remove("open");
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    tab.classList.add("active");
    const target = document.getElementById(`tab-${tab.dataset.tab}`);
    if (target) {
      target.classList.add("active");
    }
  });
});

// Initial load and start continuous polling
updateClock();
pollData();
pollInterval = setInterval(pollData, 2000); // Poll every 2 seconds for real-time updates
