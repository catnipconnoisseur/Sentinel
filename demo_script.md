# Sentinel Demo Script (AMD Developer Challenge)

**Target Time:** 2 minutes
**Presenter:** Dev A / Team Lead

---

## 1. The Hook (0:00 - 0:20)
*Screen shows the Sentinel Dashboard with 100 machines.*

**Presenter:** "Factories generate terabytes of data daily: telemetry, error logs, maintenance records. But when a machine breaks, engineers spend hours sifting through these fragmented systems to find out *why*."

*Cursor hovers over the single red machine.*

**Presenter:** "This is Sentinel. An AI reasoning engine built on AMD MI300X accelerators that transforms raw industrial data into an explainable investigation."

## 2. The Investigation (0:20 - 0:50)
*Click on Machine 14 (Critical Status).*
*Screen transitions to the Machine Detail view. Briefly scroll down to show the raw data (Errors, Maintenance, Telemetry).*

**Presenter:** "Here's Machine 14. It just went offline. We can see some error codes and a spike in vibration... but instead of guessing, let's ask Sentinel."

*Type into the Query Input: "Why did this machine fail?"*
*Click 'Investigate'. The 'Reasoning...' progress bar appears.*

**Presenter:** "Sentinel uses a local RAG pipeline to pull exactly the right telemetry slices, error logs, and PDF manual pages. Then, it uses Fireworks AI's Llama 3.1 70B running on AMD to perform multi-step causal reasoning."

## 3. The "Wow" Moment (0:50 - 1:30)
*The Reasoning Graph animates in, layer by layer.*

**Presenter:** "Notice the structured output. Sentinel isn't just generating text; it is actively constructing a causal graph. It found that overdue maintenance led to bearing wear, which caused the abnormal vibration, culminating in the pressure drop and failure."

*Click on the "Bearing Wear" node. The Evidence Drawer slides out.*

**Presenter:** "And crucially, every node is cited. If I click 'Bearing Wear', we can see the exact telemetry data point and the paragraph from the machine manual that Sentinel used to make this deduction. It is 100% explainable."

## 4. The Conclusion (1:30 - 2:00)
*Click on the "Recommended Action" node in the graph, or read the recommendation below.*

**Presenter:** "It tells our engineers exactly what to fix and how to prevent it. By leveraging AMD's massive compute capability through Fireworks AI, Sentinel reduces downtime investigations from hours to seconds. Thank you."

---

## Golden Path Preparation
- Ensure the database has Machine 14 in a `critical` state.
- Ensure `FIREWORKS_API_KEY` is loaded.
- Type exactly: `Why did this machine fail?`
- Practice the timing of the graph animation.
