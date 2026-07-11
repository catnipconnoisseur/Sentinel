# Step-by-Step Demonstration Flow: Sentinel

Follow this script to record your 3-minute screen share demo.

---

## 1. Preparation
- Launch the Sentinel frontend in your browser: `http://localhost:5175` (or your deployed URL).
- Go to the main dashboard.
- Prepare to click on **Machine 1** (a 10-year-old compressor/motor).

---

## 2. Part 1: Dashboard Overview (0:00 - 0:40)
- **Action:** Show the dashboard landing page. Hover over warning cards.
- **Talking Points:**
  - *"Here is the Sentinel dashboard. We see a real-time health list of our factory's critical assets. Machine 1 is currently flagged with a **Warning** status. If we click in, we see its detail page."*

---

## 3. Part 2: Detail Page & Ask Investigation (0:40 - 1:20)
- **Action:** Click on **Machine 1**. Scroll down to see telemetry history (voltage spikes, pressure drops). Scroll down to the search box at the bottom.
- **Action:** Type or paste: `Why did this machine fail recently?` and hit Enter.
- **Talking Points:**
  - *"We are looking at Machine 1's recent history: we see a voltage spike exceeding 185V, a sudden drop in pressure, and rising vibration. No failure has been formally logged yet. We ask Sentinel: 'Why did this machine fail recently?'"*

---

## 4. Part 3: AI Reasoning Loop & Progress (1:20 - 2:00)
- **Action:** Point out the loader with stages changing.
- **Talking Points:**
  - *"Sentinel doesn't just return a chatbot answer. It triggers an evidence-gathering loop. It retrieves raw telemetry boundaries, searches the vector library for relevant sections of the Motor Maintenance Manual and Case 14, and sends this context to Fireworks AI served on AMD MI300X accelerators."*

---

## 5. Part 4: Reviewing Results (2:00 - 3:00)
- **Action:** When the results finish loading, show the full report.
- **Action:** Hover over the nodes in the **Causal Reasoning Graph** (React Flow). Click a node to show its evidence details on the side.
- **Action:** Scroll down to show:
  1. The **Chronological Event Timeline** showing the sequence of events.
  2. The **Engineering Self-Challenge Audit** listing conflicting maintenance logs and missing sensor types.
  3. The **Phased Action Plan** showing Immediate, Short-Term, and Preventive actions, each with its engineering justification.
- **Talking Points:**
  - *"Sentinel has generated a full Root Cause Analysis. Looking at the graph, we see the voltage spike is causally linked to motor winding insulation degradation. Clicking on the node exposes the exact section of the OEM Motor Maintenance manual retrieved via RAG. Below, the chronological timeline maps out the degradation. Most importantly, the agent challenged its own diagnosis, indicating a data gap in motor current draw, and prioritized immediate actions—Megger insulation testing—with safety rationales."*
