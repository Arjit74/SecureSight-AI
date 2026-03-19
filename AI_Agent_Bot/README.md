# AI_Agent_Bot Directory

## Folder Path

- AI_Agent_Bot

## Purpose

Flask web app and Telegram bot integration layer for upload, scan, status, and report workflows.

## Subfolders

- static/ (AI_Agent_Bot/static)
- templates/ (AI_Agent_Bot/templates)
- uploads/ (AI_Agent_Bot/uploads)

## Files Overview

| File | Type | Size | Lines | Notes |
|---|---|---:|---:|---|
| .env | .env file | 0.22 KB | 4 | Project artifact file. |
| .gitignore | .gitignore file | 0.16 KB | 12 | Project artifact file. |
| app.py | Python source | 23.31 KB | 612 | Python implementation script. |
| bot.py | Python source | 13.01 KB | 299 | Python implementation script. |
| QUICKSTART.md | Documentation | 4.65 KB | 148 | Documentation content. |
| requirements.txt | Text data | 0.1 KB | 5 | Project artifact file. |
| securesight_threat_xgboost_v1.h5 | ML model artifact | 13.05 KB | - | Binary model artifact for inference. |
| UPDATES.md | Documentation | 7.6 KB | 236 | Documentation content. |
| VISUAL_GUIDE.md | Documentation | 9.59 KB | 285 | Documentation content. |

## Function and Class Reference

### app.py

Dependencies/imports detected:
- from datetime import datetime
- from dotenv import load_dotenv
- from flask import Flask, jsonify, render_template, request, send_from_directory, Response, session, redirect, url_for, flash
- from functools import wraps
- from werkzeug.security import generate_password_hash, check_password_hash
- from werkzeug.utils import secure_filename
- import csv
- import hashlib
- import io
- import json
- import mimetypes
- import os
- import re
- import requests
- import threading
- import time
- import uuid

- function _load_users() (line 47)
- function login_required(f) (line 77)
- function decorated_function(*args, **kwargs) (line 79)
- function admin_required(f) (line 86)
- function decorated_function(*args, **kwargs) (line 88)
- function _ensure_csrf_token() (line 95)
- function inject_security_context() (line 104)
- function _client_ip() (line 111)
- function _cleanup_old_attempts(client_ip) (line 118)
- function _is_login_rate_limited(client_ip) (line 126)
- function _record_login_failure(client_ip) (line 130)
- function _clear_login_failures(client_ip) (line 136)
- function _calculate_file_hashes(file_path) (line 140)
- function _get_file_info(file_path, filename) (line 164)
- function _vt_headers() (line 200)
- function _vt_upload_file(file_path, entry) (line 206)
- function _vt_check_analysis(entry) (line 238)
- function _compute_risk(stats) (line 299)
- function _final_verdict(stats, status) (line 316)
- function _build_report(entry) (line 345)
- function _report_to_text(report) (line 385)
- function _report_to_csv_row(report) (line 417)
- function receive() (line 441)
- function upload() (line 496)
- function data() (line 553)
- function status(item_id) (line 558)
- function export_report(item_id) (line 570)
- function suggest() (line 609)
- function _add_suggestion(value, kind) (line 617)
- function login() (line 645)
- function logout() (line 681)
- function admin_panel() (line 688)
- function index() (line 702)
- function uploads(filename) (line 711)

### bot.py

Dependencies/imports detected:
- from dotenv import load_dotenv
- from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, filters
- import asyncio
- import io
- import os
- import re
- import requests
- import tempfile

- function _post_json(payload) (line 20)
- function _post_file(payload, file_path, file_name, mime_type) (line 24)
- function _get_status(item_id) (line 30)
- function _get_export(item_id, export_format) (line 34)
- function _format_vt_result(entry) (line 38)
- function _build_vt_description(vt_status, harmless, malicious, suspicious, total, risk) (line 136)
- function _generate_final_verdict(vt_status, risk, malicious, suspicious, total) (line 170)
- async function _wait_for_vt(item_id, timeout_sec=180) (line 203)
- async function handle_message(update, context) (line 223)
- async function handle_report(update, context) (line 307)


## Integration Notes

- Keep this README updated whenever files are added/removed or function signatures change.
- For architecture and API contracts, cross-reference docs in docs/ and major module READMEs.
- This README is generated to provide folder-level and function-level visibility for maintainers and evaluators.