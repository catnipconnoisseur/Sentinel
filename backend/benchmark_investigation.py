#!/usr/bin/env python3
"""
benchmark_investigation.py — Sentinel Investigation Pipeline Benchmark

Fires N consecutive POST /api/investigate requests to the running backend,
measures detailed timing, and prints a summary table.

Usage:
    # Start the backend first, then run:
    cd backend
    source venv/bin/activate
    python benchmark_investigation.py [--runs 10] [--machine-id 1] [--base-url http://localhost:8000]

Requirements: requests (pip install requests)
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("ERROR: 'requests' is not installed. Run: pip install requests")
    sys.exit(1)


# ─── Configuration ───────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_MACHINE_ID = 1
DEFAULT_RUNS = 20
DEFAULT_QUESTION = "Why did this machine fail recently?"
CLIENT_TIMEOUT_SECONDS = 120  # hard cap per request; accounts for retry scenario (75s backend + overhead)


# ─── Formatting ──────────────────────────────────────────────────────────────

RESET  = "\033[0m"
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"


def ts():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def status_color(success: bool) -> str:
    return GREEN if success else RED


# ─── Benchmark ───────────────────────────────────────────────────────────────

def run_investigation(base_url: str, machine_id: int, question: str) -> dict:
    """Run a single investigation request and return detailed timing metrics."""
    url = f"{base_url}/api/investigate"
    payload = {"machine_id": machine_id, "question": question}

    result = {
        "url": url,
        "machine_id": machine_id,
        "question": question,
        "request_start_ts": ts(),
        "success": False,
        "http_status": None,
        "error": None,
        "total_s": None,
        "ttfb_s": None,      # Time to first byte (server start of response)
        "nodes": None,
        "edges": None,
        "ui_stuck": False,
    }

    t0 = time.perf_counter()
    try:
        resp = requests.post(
            url,
            json=payload,
            timeout=CLIENT_TIMEOUT_SECONDS,
            stream=False,
        )
        t1 = time.perf_counter()

        result["http_status"] = resp.status_code
        result["total_s"] = round(t1 - t0, 3)
        result["ttfb_s"] = result["total_s"]  # requests doesn't expose TTFB separately

        if resp.ok:
            data = resp.json()
            result["success"] = True
            result["nodes"] = len(data.get("nodes", []))
            result["edges"] = len(data.get("edges", []))
        else:
            try:
                err_body = resp.json()
                result["error"] = err_body.get("detail", f"HTTP {resp.status_code}")
            except Exception:
                result["error"] = f"HTTP {resp.status_code}: {resp.text[:200]}"
            result["ui_stuck"] = resp.status_code in (504, 408, 429)

    except requests.exceptions.Timeout:
        t1 = time.perf_counter()
        result["total_s"] = round(t1 - t0, 3)
        result["error"] = f"CLIENT TIMEOUT after {CLIENT_TIMEOUT_SECONDS}s"
        result["ui_stuck"] = True

    except requests.exceptions.ConnectionError as e:
        t1 = time.perf_counter()
        result["total_s"] = round(t1 - t0, 3)
        result["error"] = f"CONNECTION ERROR: {e}"
        result["ui_stuck"] = True

    except Exception as e:
        t1 = time.perf_counter()
        result["total_s"] = round(t1 - t0, 3)
        result["error"] = f"UNEXPECTED: {e}"
        result["ui_stuck"] = True

    return result


# ─── Table Renderer ──────────────────────────────────────────────────────────

def render_table(results: list[dict]):
    rows = []
    for i, r in enumerate(results, 1):
        status = f"{GREEN}✓ OK{RESET}" if r["success"] else f"{RED}✗ FAIL{RESET}"
        stuck  = f"{RED}YES{RESET}" if r["ui_stuck"] else f"{GREEN}NO{RESET}"
        total  = f"{r['total_s']:.3f}s" if r["total_s"] is not None else "—"
        err    = (r["error"] or "")[:60]
        nodes  = str(r["nodes"]) if r["nodes"] is not None else "—"
        rows.append((str(i), total, status, nodes, stuck, err))

    col_widths = [5, 10, 12, 7, 10, 62]
    headers    = ["Run #", "Total(s)", "Result", "Nodes", "UI Stuck", "Error"]

    sep = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    hdr = "|" + "|".join(f" {h:<{col_widths[i]}} " for i, h in enumerate(headers)) + "|"

    print(sep)
    print(f"{BOLD}{hdr}{RESET}")
    print(sep)
    for row in rows:
        line = "|" + "|".join(f" {row[i]:<{col_widths[i]}} " for i in range(len(row))) + "|"
        print(line)
    print(sep)


def render_summary(results: list[dict]):
    successes    = [r for r in results if r["success"]]
    failures     = [r for r in results if not r["success"]]
    stuck        = [r for r in results if r["ui_stuck"]]
    total_times  = [r["total_s"] for r in results if r["total_s"] is not None]

    print(f"\n{BOLD}{CYAN}── Summary ─────────────────────────────────────────{RESET}")
    print(f"  Runs:      {len(results)}")
    print(f"  Successes: {GREEN}{len(successes)}{RESET}")
    print(f"  Failures:  {RED}{len(failures)}{RESET}")
    print(f"  UI Stuck:  {RED if stuck else GREEN}{len(stuck)}{RESET}")
    if total_times:
        print(f"  Avg time:  {sum(total_times)/len(total_times):.3f}s")
        print(f"  Min time:  {min(total_times):.3f}s")
        print(f"  Max time:  {max(total_times):.3f}s")

    if failures:
        print(f"\n{BOLD}{RED}── Failure Details ─────────────────────────────────{RESET}")
        for r in failures:
            print(f"  error={r['error']!r}  http_status={r['http_status']}")

    # Root-cause hint
    print(f"\n{BOLD}── Diagnosis ───────────────────────────────────────{RESET}")
    timeouts = [r for r in failures if r["error"] and ("TIMEOUT" in r["error"].upper() or "504" in str(r.get("http_status", "")))]
    rate_limits = [r for r in failures if r.get("http_status") == 429]
    conn_errors = [r for r in failures if r["error"] and "CONNECTION" in r["error"].upper()]

    if not failures:
        print(f"  {GREEN}All requests succeeded. No reliability issues detected.{RESET}")
    elif timeouts:
        print(f"  {YELLOW}Likely cause: Fireworks AI timeout / latency spike ({len(timeouts)} timeout(s)){RESET}")
    elif rate_limits:
        print(f"  {YELLOW}Likely cause: Fireworks AI rate limiting ({len(rate_limits)} 429 response(s)){RESET}")
    elif conn_errors:
        print(f"  {YELLOW}Likely cause: Network / connectivity issue ({len(conn_errors)} connection error(s)){RESET}")
    else:
        print(f"  {YELLOW}Mixed failures — check error column for details.{RESET}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Sentinel Investigation Pipeline Benchmark")
    parser.add_argument("--runs", type=int, default=DEFAULT_RUNS, help="Number of consecutive investigations")
    parser.add_argument("--machine-id", type=int, default=DEFAULT_MACHINE_ID, help="Machine ID to investigate")
    parser.add_argument("--base-url", type=str, default=DEFAULT_BASE_URL, help="Backend base URL")
    parser.add_argument("--question", type=str, default=DEFAULT_QUESTION, help="Question to ask each time")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay in seconds between runs (default 0.5)")
    parser.add_argument("--output-json", type=str, default=None, help="Optional path to write raw results JSON")
    args = parser.parse_args()

    print(f"\n{BOLD}{CYAN}Sentinel Investigation Benchmark{RESET}")
    print(f"  Backend:    {args.base_url}")
    print(f"  Machine ID: {args.machine_id}")
    print(f"  Runs:       {args.runs}")
    print(f"  Question:   {args.question!r}")
    print(f"  Delay:      {args.delay}s between runs")
    print(f"  Client timeout: {CLIENT_TIMEOUT_SECONDS}s per request")
    print()

    # Health check
    try:
        health = requests.get(f"{args.base_url}/api/health", timeout=5)
        print(f"  {GREEN}Health check OK — {health.json()}{RESET}\n")
    except Exception as e:
        print(f"  {RED}Health check FAILED — is the backend running? ({e}){RESET}")
        sys.exit(1)

    results = []
    for i in range(1, args.runs + 1):
        print(f"{CYAN}[{i}/{args.runs}]{RESET} Sending investigation request... ", end="", flush=True)
        r = run_investigation(args.base_url, args.machine_id, args.question)
        results.append(r)

        if r["success"]:
            print(f"{GREEN}✓{RESET} {r['total_s']:.3f}s — nodes={r['nodes']}, edges={r['edges']}")
        else:
            print(f"{RED}✗{RESET} {r['total_s']:.3f}s — {r['error']}")

        if i < args.runs:
            time.sleep(args.delay)

    print(f"\n{BOLD}── Results Table ───────────────────────────────────{RESET}")
    render_table(results)
    render_summary(results)

    if args.output_json:
        with open(args.output_json, "w") as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n  Raw results written to: {args.output_json}")

    print()


if __name__ == "__main__":
    main()
