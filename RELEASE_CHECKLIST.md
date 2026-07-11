# Sentinel Final Release Checklist

This checklist tracks the status of the final pre-submission tasks. All technical verification, database bootstrapping, and documentation tasks have been successfully automated.

---

## 1. Automated Verification Tasks (Completed)
- [x] **Repository Audits:** Checked configurations for README.md, LICENSE, .gitignore, and docker-compose.yml.
- [x] **Automatic Database Bootstrapping:** Verified `entrypoint.sh` logic for fresh environments.
- [x] **Constrained AI Grammar validation:** Tested strictly enforced schemas under Fireworks AI.
- [x] **SLA Latency Auditing:** Verified that RAG + reasoning traces execute within the 30-second budget.
- [x] **Submission Documentation Generation:** Built all documents under the `submission/` directory.

---

## 2. Final Manual Checklist
Before submitting, please complete the following manual review items:
- [ ] **Generate Screenshots:** Run the automated script locally to populate `docs/images/`:
  - Run: `npm install puppeteer`
  - Run: `node scripts/generate_screenshots.js`
- [ ] **Record Demo Video:** Follow the step-by-step walkthrough in [demo_script.md](file:///Users/tiffanychristabelanggriawan/Documents/AMD%20Hackathon/submission/demo_script.md). Ensure the video is under the 3-minute hackathon limit.
- [ ] **Slide Review & PDF Export:** Verify the slides represent the technical innovation (Mermaid graphs, RAG pipeline) and export to PDF.
- [ ] **Public Railway Verification:** Verify that the backend and frontend are healthy on Railway:
  - Backend: `https://sentinel-production-9b3f.up.railway.app/api/health`
- [ ] **Double Check Environment Variables:** Confirm `FIREWORKS_API_KEY` is set in Railway and local `.env`.
- [ ] **Submit Form:** Copy values from [executive_summary.md](file:///Users/tiffanychristabelanggriawan/Documents/AMD%20Hackathon/submission/executive_summary.md) directly into the hackathon submission form.

