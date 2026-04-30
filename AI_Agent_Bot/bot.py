import asyncio
import io
import os
import re
import tempfile
import requests
from dotenv import load_dotenv
from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, filters

load_dotenv()
BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN")
SERVER_URL = os.environ.get("SERVER_URL", "http://127.0.0.1:5000/receive")
STATUS_URL = os.environ.get("STATUS_URL", "http://127.0.0.1:5000/status")
EXPORT_URL = os.environ.get("EXPORT_URL", "http://127.0.0.1:5000/export")

URL_REGEX = re.compile(r"https?://\S+", re.IGNORECASE)
LATEST_ITEM_BY_CHAT = {}


def _post_json(payload):
    return requests.post(SERVER_URL, json=payload, timeout=15)


def _post_file(payload, file_path, file_name, mime_type):
    with open(file_path, "rb") as f:
        files = {"file": (file_name, f, mime_type or "application/octet-stream")}
        return requests.post(SERVER_URL, data=payload, files=files, timeout=30)


def _get_status(item_id):
    return requests.get(f"{STATUS_URL}/{item_id}", timeout=15)


def _get_export(item_id, export_format):
    return requests.get(f"{EXPORT_URL}/{item_id}?format={export_format}", timeout=30)


def _format_vt_result(entry):
    vt_status = entry.get("vt_status")
    stats = entry.get("vt_stats") or {}
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    harmless = stats.get("harmless", 0)
    total = harmless + malicious + suspicious
    if total == 0:
        risk = "Unknown"
    else:
        threat_score = ((malicious * 100) + (suspicious * 50)) / (total * 100)
        if threat_score > 0.3:
            risk = "High"
        elif threat_score > 0.1:
            risk = "Medium"
        else:
            risk = "Low"

    description = _build_vt_description(vt_status, harmless, malicious, suspicious, total, risk)
    
    # Generate final verdict
    final_verdict = _generate_final_verdict(vt_status, risk, malicious, suspicious, total)

    result_lines = [
        "�━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"📋 File: {entry.get('file_name') or 'unknown'}",
        f"Size: {entry.get('file_size', 0):,} bytes" if entry.get('file_size') else "",
        "📄━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
    ]
    
    # Remove empty lines
    result_lines = [line for line in result_lines if line]
    
    # Add file type information
    if entry.get("mime_type") or entry.get("category") or entry.get("vt_magic") or entry.get("vt_type"):
        result_lines.append("📋 FILE TYPE INFORMATION")
        if entry.get("mime_type"):
            result_lines.append(f"  MIME Type: {entry.get('mime_type')}")
        if entry.get("category"):
            result_lines.append(f"  Category: {entry.get('category')}")
        if entry.get("vt_magic"):
            result_lines.append(f"  Magic: {entry.get('vt_magic')}")
        if entry.get("vt_type"):
            result_lines.append(f"  Type Description: {entry.get('vt_type')}")
        if entry.get("vt_type_tag"):
            result_lines.append(f"  Type Tag: {entry.get('vt_type_tag')}")
        result_lines.append("")
    
    # Add cryptographic hashes
    if entry.get("md5") or entry.get("sha1") or entry.get("sha256") or entry.get("vhash") or entry.get("ssdeep") or entry.get("tlsh"):
        result_lines.append("🔐 CRYPTOGRAPHIC HASHES")
        if entry.get("md5"):
            result_lines.append(f"  MD5: {entry.get('md5')}")
        if entry.get("sha1"):
            result_lines.append(f"  SHA-1: {entry.get('sha1')}")
        if entry.get("sha256"):
            result_lines.append(f"  SHA-256: {entry.get('sha256')}")
        if entry.get("vhash"):
            result_lines.append(f"  Vhash: {entry.get('vhash')}")
        if entry.get("ssdeep"):
            result_lines.append(f"  SSDEEP: {entry.get('ssdeep')}")
        if entry.get("tlsh"):
            result_lines.append(f"  TLSH: {entry.get('tlsh')}")
        result_lines.append("")
    
    # Add security analysis report
    result_lines.extend([
        "🛡️ SECURITY ANALYSIS REPORT",
        f"Status: {vt_status or 'unknown'}",
        "",
        "═══════════════════════════════",
        "📊 DETECTION SUMMARY",
        "═══════════════════════════════",
        f"Total Checks: {total}",
        f"Risk Level: {risk}",
        f"  ✅ Harmless: {harmless} ({(harmless/total*100 if total > 0 else 0):.0f}%)",
        f"  🔴 Malicious: {malicious} ({(malicious/total*100 if total > 0 else 0):.0f}%)",
        f"  🟡 Suspicious: {suspicious} ({(suspicious/total*100 if total > 0 else 0):.0f}%)",
        "",
        "═══════════════════════════════",
        "📋 ANALYSIS SUMMARY",
        "═══════════════════════════════",
        description,
        "",
        "═══════════════════════════════",
        "📋 FINAL VERDICT",
        "═══════════════════════════════",
        final_verdict,
        "",
    ])
    
    if entry.get("vt_error"):
        result_lines.append(f"⚠️ Error: {entry['vt_error']}")
    
    return "\n".join(result_lines)


def _build_vt_description(vt_status, harmless, malicious, suspicious, total, risk):
    if vt_status in {"queued", "in_progress", "pending_upload"}:
        return (
            "The model pipeline is running multi-engine checks on this file. "
            "It is still processing the signals and correlating results. "
            "Final risk will be computed once all checks complete. "
            "Please wait for the completed status."
        )

    if vt_status == "completed":
        if risk == "High":
            reason = "multiple engines flagged it as malicious or suspicious"
        elif risk == "Medium":
            reason = "some engines reported suspicious activity"
        elif risk == "Low":
            reason = "few or no engines raised concerns"
        else:
            reason = "the engines returned limited signals"

        return (
            f"The model evaluated the file across {total} checks. "
            f"It recorded {harmless} harmless, {malicious} malicious, and {suspicious} suspicious signals. "
            f"Overall risk is {risk} because {reason}. "
            "If the file is unexpected, treat it with caution and verify the source."
        )

    return (
        "The analysis could not be completed due to a processing error. "
        "The model did not finish scoring this file. "
        "Try again later or resubmit the file. "
        "If the issue persists, check the server configuration."
    )


def _generate_final_verdict(vt_status, risk, malicious, suspicious, total):
    """Generate final verdict and recommendation"""
    if vt_status != "completed":
        return "⏳ Analysis incomplete. Please wait for final results."
    
    if risk == "High":
        return (
            "⛔ UNSAFE - DO NOT USE\n"
            f"This file is flagged as HIGH RISK with {malicious} malicious "
            f"and {suspicious} suspicious detections out of {total} engines.\n"
            "🚨 Recommendation: DELETE this file immediately and do not execute it. "
            "It may contain malware, viruses, or other harmful code."
        )
    elif risk == "Medium":
        return (
            "⚠️  CAUTION ADVISED\n"
            f"This file shows MEDIUM RISK with {malicious} malicious "
            f"and {suspicious} suspicious detections out of {total} engines.\n"
            "🔍 Recommendation: Proceed with extreme caution. Verify the source, "
            "scan with additional tools, and avoid opening on important systems."
        )
    else:
        # Treat both Low risk and Unknown as SAFE
        return (
            "✅ SAFE TO USE\n"
            f"This file appears SAFE with only {malicious} malicious "
            f"and {suspicious} suspicious detections out of {total} engines.\n"
            "✓ Recommendation: File appears clean. However, always verify the source "
            "and stay vigilant with unknown files."
        )



async def _wait_for_vt(item_id, timeout_sec=180):
    start = asyncio.get_event_loop().time()
    while True:
        if asyncio.get_event_loop().time() - start > timeout_sec:
            return None

        resp = await asyncio.to_thread(_get_status, item_id)
        if resp.status_code != 200:
            await asyncio.sleep(5)
            continue

        entry = resp.json()
        vt_status = entry.get("vt_status")

        if vt_status in {"completed", "upload_failed", "check_failed", "VT API key missing"}:
            return entry

        await asyncio.sleep(6)


async def handle_message(update, context):
    msg = update.message
    if not msg:
        return

    text = msg.text or ""
    urls = URL_REGEX.findall(text)

    payload = {
        "username": msg.from_user.username if msg.from_user else None,
        "text": text or None,
        "urls": urls,
        "message_id": msg.message_id,
        "chat_id": msg.chat_id,
    }

    file_obj = None
    file_name = None
    mime_type = None
    file_size = None

    if msg.document:
        file_obj = msg.document
        file_name = msg.document.file_name
        mime_type = msg.document.mime_type
        file_size = msg.document.file_size
    elif msg.photo:
        file_obj = msg.photo[-1]
        file_name = f"photo_{msg.message_id}.jpg"
        mime_type = "image/jpeg"
        file_size = msg.photo[-1].file_size

    item_id = None
    has_file = bool(file_obj)
    if file_obj:
        payload.update(
            {
                "file_id": file_obj.file_id,
                "file_name": file_name,
                "mime_type": mime_type,
                "file_size": file_size,
            }
        )
        tg_file = await context.bot.get_file(file_obj.file_id)
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp_path = tmp.name
        try:
            await tg_file.download_to_drive(custom_path=tmp_path)
            resp = await asyncio.to_thread(_post_file, payload, tmp_path, file_name, mime_type)
            if resp.status_code == 200:
                item_id = resp.json().get("id")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    else:
        resp = await asyncio.to_thread(_post_json, payload)
        if resp.status_code == 200:
            item_id = resp.json().get("id")

    if item_id:
        LATEST_ITEM_BY_CHAT[msg.chat_id] = item_id

    if not item_id or not has_file:
        if item_id:
            await msg.reply_text(
                f"✅ Received! Sent to website. Tracking ID: {item_id}\n"
                "Use /report to export the latest report."
            )
        else:
            await msg.reply_text("✅ Received! Sent to website.")
        return

    await msg.reply_text(
        f"⏳ File received. Analyzing with our Model, please wait...\n"
        f"Tracking ID: {item_id} (use /report {item_id})"
    )
    entry = await _wait_for_vt(item_id)
    if not entry:
        await msg.reply_text("⏳ Analysis is taking longer than expected. Please try again later.")
        return

    await msg.reply_text(_format_vt_result(entry))


async def handle_report(update, context):
    msg = update.message
    if not msg:
        return

    args = context.args or []
    export_format = "json"
    item_id = None

    if args:
        if args[0].lower() in {"json", "csv", "txt"}:
            export_format = args[0].lower()
            if len(args) > 1:
                item_id = args[1]
        else:
            item_id = args[0]
            if len(args) > 1 and args[1].lower() in {"json", "csv", "txt"}:
                export_format = args[1].lower()

    if not item_id:
        item_id = LATEST_ITEM_BY_CHAT.get(msg.chat_id)

    if not item_id:
        await msg.reply_text("⚠️ No recent item found. Send a file or use /report <id>.")
        return

    resp = await asyncio.to_thread(_get_export, item_id, export_format)
    if resp.status_code != 200:
        await msg.reply_text("❌ Export failed. Please try again later.")
        return

    file_name = f"report_{item_id}.{export_format}"
    data = io.BytesIO(resp.content)
    data.name = file_name
    await msg.reply_document(document=data, filename=file_name, caption="📥 Exported report")


app = ApplicationBuilder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("report", handle_report))
app.add_handler(CommandHandler("export", handle_report))
app.add_handler(MessageHandler(filters.ALL, handle_message))

app.run_polling()
