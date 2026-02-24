from datetime import datetime
import csv
import io
import json
import os
import re
import threading
import time
import requests
import hashlib
import mimetypes
import uuid
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_from_directory, Response
from werkzeug.utils import secure_filename

load_dotenv()
app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

received_items = []   # use DB in real project

VT_API_KEY = os.environ.get("VT_API_KEY")
VT_BASE_URL = "https://www.virustotal.com/api/v3"
VT_CHECK_INTERVAL_SEC = 20
URL_REGEX = re.compile(r"https?://\S+", re.IGNORECASE)


def _calculate_file_hashes(file_path):
    """Calculate MD5, SHA-1, and SHA-256 hashes for a file"""
    hashes = {}
    md5_hash = hashlib.md5()
    sha1_hash = hashlib.sha1()
    sha256_hash = hashlib.sha256()
    
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
                sha1_hash.update(chunk)
                sha256_hash.update(chunk)
        
        hashes["md5"] = md5_hash.hexdigest()
        hashes["sha1"] = sha1_hash.hexdigest()
        hashes["sha256"] = sha256_hash.hexdigest()
        hashes["file_size"] = os.path.getsize(file_path)
    except Exception as e:
        print(f"Error calculating hashes: {e}")
    
    return hashes


def _get_file_info(file_path, filename):
    """Get file type and other metadata"""
    info = {}
    try:
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(file_path)
        info["mime_type"] = mime_type or "unknown"
        
        # Get file extension
        _, ext = os.path.splitext(filename)
        info["extension"] = ext.lower()
        
        # Determine file category
        if mime_type:
            if "office" in mime_type or "spreadsheet" in mime_type or "wordprocessing" in mime_type:
                info["category"] = "office"
            elif "image" in mime_type:
                info["category"] = "image"
            elif "video" in mime_type:
                info["category"] = "video"
            elif "audio" in mime_type:
                info["category"] = "audio"
            elif "pdf" in mime_type:
                info["category"] = "pdf"
            elif "archive" in mime_type or "zip" in mime_type or "rar" in mime_type:
                info["category"] = "archive"
            else:
                info["category"] = "document"
        else:
            info["category"] = "unknown"
    except Exception as e:
        print(f"Error getting file info: {e}")
    
    return info


def _vt_headers():
    if not VT_API_KEY:
        return None
    return {"x-apikey": VT_API_KEY}


def _vt_upload_file(file_path, entry):
    headers = _vt_headers()
    if not headers:
        entry["vt_status"] = "VT API key missing"
        return

    try:
        # Calculate hashes first
        hashes = _calculate_file_hashes(file_path)
        entry.update(hashes)
        
        # Get file info
        file_info = _get_file_info(file_path, entry.get("file_name", ""))
        entry.update(file_info)
        
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f)}
            resp = requests.post(f"{VT_BASE_URL}/files", headers=headers, files=files, timeout=60)
        if resp.status_code >= 400:
            entry["vt_status"] = "upload_failed"
            entry["vt_error"] = f"Upload failed: {resp.status_code}"
            return

        data = resp.json()
        entry["vt_analysis_id"] = data.get("data", {}).get("id")
        entry["vt_status"] = "queued"
        entry["vt_last_check"] = 0
    except Exception as exc:
        entry["vt_status"] = "upload_failed"
        entry["vt_error"] = str(exc)


def _vt_check_analysis(entry):
    analysis_id = entry.get("vt_analysis_id")
    if not analysis_id:
        return

    now = time.time()
    last = entry.get("vt_last_check", 0) or 0
    if now - last < VT_CHECK_INTERVAL_SEC:
        return

    headers = _vt_headers()
    if not headers:
        return

    try:
        resp = requests.get(f"{VT_BASE_URL}/analyses/{analysis_id}", headers=headers, timeout=30)
        entry["vt_last_check"] = now
        if resp.status_code >= 400:
            entry["vt_status"] = "check_failed"
            entry["vt_error"] = f"Check failed: {resp.status_code}"
            return

        data = resp.json().get("data", {})
        status = data.get("attributes", {}).get("status")
        entry["vt_status"] = status or "unknown"
        
        # Get file stats
        stats = data.get("attributes", {}).get("stats")
        if stats:
            entry["vt_stats"] = stats
        
        # Get file details from VT
        attrs = data.get("attributes", {})
        if entry["vt_status"] == "completed":
            # Capture file details from VirusTotal
            if "magic" in attrs:
                entry["vt_magic"] = attrs["magic"]
            if "type_description" in attrs:
                entry["vt_type"] = attrs["type_description"]
            if "type_tag" in attrs:
                entry["vt_type_tag"] = attrs["type_tag"]
            if "trid" in attrs:
                entry["vt_trid"] = attrs["trid"]
            if "magika" in attrs:
                entry["vt_magika"] = attrs["magika"]
            
            # Get additional hash values from meta section
            meta = data.get("meta", {}).get("file_info", {})
            if "vhash" in meta:
                entry["vhash"] = meta["vhash"]
            if "ssdeep" in meta:
                entry["ssdeep"] = meta["ssdeep"]
            if "tlsh" in meta:
                entry["tlsh"] = meta["tlsh"]
        
        entry["vt_link"] = f"https://www.virustotal.com/gui/analysis/{analysis_id}"
    except Exception as exc:
        entry["vt_status"] = "check_failed"
        entry["vt_error"] = str(exc)


def _compute_risk(stats):
    if not stats:
        return "Unknown", 0.0
    harmless = stats.get("harmless", 0)
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    total = harmless + malicious + suspicious
    if total == 0:
        return "Low", 0.0
    threat_score = ((malicious * 100) + (suspicious * 50)) / (total * 100)
    if threat_score > 0.3:
        return "High", threat_score
    if threat_score > 0.1:
        return "Medium", threat_score
    return "Low", threat_score


def _final_verdict(stats, status):
    if status != "completed":
        return "Analysis incomplete. Please wait for final results."

    risk, _ = _compute_risk(stats)
    harmless = stats.get("harmless", 0) if stats else 0
    malicious = stats.get("malicious", 0) if stats else 0
    suspicious = stats.get("suspicious", 0) if stats else 0
    total = harmless + malicious + suspicious

    if risk == "High":
        return (
            "UNSAFE - DO NOT USE. "
            f"High risk with {malicious} malicious and {suspicious} suspicious detections "
            f"out of {total} engines."
        )
    if risk == "Medium":
        return (
            "CAUTION ADVISED. "
            f"Medium risk with {malicious} malicious and {suspicious} suspicious detections "
            f"out of {total} engines."
        )
    return (
        "SAFE TO USE. "
        f"Low risk with {malicious} malicious and {suspicious} suspicious detections "
        f"out of {total} engines."
    )


def _build_report(entry):
    stats = entry.get("vt_stats") or {}
    risk, threat_score = _compute_risk(stats)
    return {
        "id": entry.get("id"),
        "timestamp": entry.get("timestamp"),
        "username": entry.get("username"),
        "text": entry.get("text"),
        "urls": entry.get("urls") or [],
        "file_name": entry.get("file_name"),
        "file_size": entry.get("file_size"),
        "mime_type": entry.get("mime_type"),
        "category": entry.get("category"),
        "hashes": {
            "md5": entry.get("md5"),
            "sha1": entry.get("sha1"),
            "sha256": entry.get("sha256"),
            "vhash": entry.get("vhash"),
            "ssdeep": entry.get("ssdeep"),
            "tlsh": entry.get("tlsh"),
        },
        "analysis": {
            "status": entry.get("vt_status"),
            "stats": stats or None,
            "risk": risk,
            "threat_score": round(threat_score, 4),
            "verdict": _final_verdict(stats, entry.get("vt_status")),
            "vt_link": entry.get("vt_link"),
        },
        "file_meta": {
            "extension": entry.get("extension"),
            "vt_magic": entry.get("vt_magic"),
            "vt_type": entry.get("vt_type"),
            "vt_type_tag": entry.get("vt_type_tag"),
            "vt_trid": entry.get("vt_trid"),
            "vt_magika": entry.get("vt_magika"),
        },
    }


def _report_to_text(report):
    lines = [
        "Security Analysis Report",
        "========================",
        f"ID: {report.get('id')}",
        f"Timestamp: {report.get('timestamp')}",
        f"Username: {report.get('username')}",
        f"File: {report.get('file_name')}",
        f"File Size: {report.get('file_size')}",
        f"MIME Type: {report.get('mime_type')}",
        f"Category: {report.get('category')}",
        "",
        "Hashes",
        "------",
        f"MD5: {report['hashes'].get('md5')}",
        f"SHA-1: {report['hashes'].get('sha1')}",
        f"SHA-256: {report['hashes'].get('sha256')}",
        f"Vhash: {report['hashes'].get('vhash')}",
        f"SSDEEP: {report['hashes'].get('ssdeep')}",
        f"TLSH: {report['hashes'].get('tlsh')}",
        "",
        "Analysis",
        "--------",
        f"Status: {report['analysis'].get('status')}",
        f"Risk: {report['analysis'].get('risk')}",
        f"Threat Score: {report['analysis'].get('threat_score')}",
        f"Verdict: {report['analysis'].get('verdict')}",
        f"VT Link: {report['analysis'].get('vt_link')}",
    ]
    return "\n".join(lines)


def _report_to_csv_row(report):
    return {
        "id": report.get("id"),
        "timestamp": report.get("timestamp"),
        "username": report.get("username"),
        "file_name": report.get("file_name"),
        "file_size": report.get("file_size"),
        "mime_type": report.get("mime_type"),
        "category": report.get("category"),
        "md5": report["hashes"].get("md5"),
        "sha1": report["hashes"].get("sha1"),
        "sha256": report["hashes"].get("sha256"),
        "vhash": report["hashes"].get("vhash"),
        "ssdeep": report["hashes"].get("ssdeep"),
        "tlsh": report["hashes"].get("tlsh"),
        "status": report["analysis"].get("status"),
        "risk": report["analysis"].get("risk"),
        "threat_score": report["analysis"].get("threat_score"),
        "verdict": report["analysis"].get("verdict"),
        "vt_link": report["analysis"].get("vt_link"),
    }


@app.route("/receive", methods=["POST"])
def receive():
    data = request.get_json(silent=True) or {}

    entry = {
        "id": uuid.uuid4().hex,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "username": data.get("username"),
        "text": data.get("text"),
        "urls": data.get("urls", []),
        "file_name": data.get("file_name"),
        "file_id": data.get("file_id"),
        "mime_type": data.get("mime_type"),
        "file_size": data.get("file_size"),
        "saved_file": None,
        "vt_analysis_id": None,
        "vt_status": None,
        "vt_stats": None,
        "vt_link": None,
        "vt_error": None,
        "vt_last_check": 0,
        # File hash fields
        "md5": None,
        "sha1": None,
        "sha256": None,
        "vhash": None,
        "ssdeep": None,
        "tlsh": None,
        # File metadata fields
        "category": None,
        "extension": None,
        "vt_magic": None,
        "vt_type": None,
        "vt_type_tag": None,
        "vt_trid": None,
        "vt_magika": None,
    }

    if "file" in request.files:
        up = request.files["file"]
        original = secure_filename(up.filename) or "upload.bin"
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        saved_name = f"{ts}_{original}"
        saved_path = os.path.join(UPLOAD_DIR, saved_name)
        up.save(saved_path)
        entry["file_name"] = entry["file_name"] or original
        entry["saved_file"] = saved_name

        entry["vt_status"] = "pending_upload"
        threading.Thread(target=_vt_upload_file, args=(saved_path, entry), daemon=True).start()

    received_items.insert(0, entry)
    return jsonify({"status": "ok", "id": entry["id"]})


@app.route("/upload", methods=["POST"])
def upload():
    data = request.form or {}
    text = data.get("text")
    url = data.get("url")

    entry = {
        "id": uuid.uuid4().hex,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "username": "web",
        "text": text,
        "urls": URL_REGEX.findall(url or ""),
        "file_name": data.get("file_name"),
        "file_id": None,
        "mime_type": None,
        "file_size": None,
        "saved_file": None,
        "vt_analysis_id": None,
        "vt_status": None,
        "vt_stats": None,
        "vt_link": None,
        "vt_error": None,
        "vt_last_check": 0,
        # File hash fields
        "md5": None,
        "sha1": None,
        "sha256": None,
        "vhash": None,
        "ssdeep": None,
        "tlsh": None,
        # File metadata fields
        "category": None,
        "extension": None,
        "vt_magic": None,
        "vt_type": None,
        "vt_type_tag": None,
        "vt_trid": None,
        "vt_magika": None,
    }

    if "file" in request.files:
        up = request.files["file"]
        original = secure_filename(up.filename) or "upload.bin"
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        saved_name = f"{ts}_{original}"
        saved_path = os.path.join(UPLOAD_DIR, saved_name)
        up.save(saved_path)
        entry["file_name"] = entry["file_name"] or original
        entry["saved_file"] = saved_name

        entry["vt_status"] = "pending_upload"
        threading.Thread(target=_vt_upload_file, args=(saved_path, entry), daemon=True).start()

    received_items.insert(0, entry)
    return jsonify({"status": "ok", "id": entry["id"]})


@app.route("/data", methods=["GET"])
def data():
    return jsonify(received_items)


@app.route("/status/<item_id>", methods=["GET"])
def status(item_id):
    entry = next((item for item in received_items if item.get("id") == item_id), None)
    if not entry:
        return jsonify({"error": "not_found"}), 404

    if entry.get("vt_status") in {"queued", "in_progress"}:
        _vt_check_analysis(entry)

    return jsonify(entry)


@app.route("/export/<item_id>", methods=["GET"])
def export_report(item_id):
    entry = next((item for item in received_items if item.get("id") == item_id), None)
    if not entry:
        return jsonify({"error": "not_found"}), 404

    report = _build_report(entry)
    export_format = (request.args.get("format") or "json").lower()
    file_base = f"report_{item_id}"

    if export_format == "csv":
        output = io.StringIO()
        row = _report_to_csv_row(report)
        writer = csv.DictWriter(output, fieldnames=list(row.keys()))
        writer.writeheader()
        writer.writerow(row)
        csv_data = output.getvalue()
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={file_base}.csv"},
        )

    if export_format == "txt":
        text_data = _report_to_text(report)
        return Response(
            text_data,
            mimetype="text/plain",
            headers={"Content-Disposition": f"attachment; filename={file_base}.txt"},
        )

    json_data = json.dumps(report, indent=2)
    return Response(
        json_data,
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment; filename={file_base}.json"},
    )


@app.route("/suggest", methods=["GET"])
def suggest():
    query = (request.args.get("q") or "").strip().lower()
    if not query:
        return jsonify({"suggestions": []})

    seen = set()
    suggestions = []

    def _add_suggestion(value, kind):
        if not value:
            return
        value_str = str(value)
        value_lower = value_str.lower()
        if query not in value_lower:
            return
        key = (kind, value_lower)
        if key in seen:
            return
        seen.add(key)
        suggestions.append({"type": kind, "value": value_str})

    for entry in received_items:
        _add_suggestion(entry.get("file_name"), "file")
        _add_suggestion(entry.get("username"), "user")
        _add_suggestion(entry.get("md5"), "hash")
        _add_suggestion(entry.get("sha1"), "hash")
        _add_suggestion(entry.get("sha256"), "hash")
        for url in entry.get("urls") or []:
            _add_suggestion(url, "url")
        if len(suggestions) >= 8:
            break

    return jsonify({"suggestions": suggestions[:8]})


@app.route("/")
def index():
    for item in received_items:
        if item.get("vt_status") in {"queued", "in_progress"}:
            _vt_check_analysis(item)
    return render_template("index.html", items=received_items, vt_enabled=bool(VT_API_KEY))


@app.route("/uploads/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)
