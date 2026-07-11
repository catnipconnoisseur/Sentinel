# Presentation Notes: Sentinel Pitch (3-5 Minutes)

Use these presentation speaker notes for your hackathon submission video.

---

## Slide 1: Introduction (0:00 - 0:45)
> *"Hello judges, we are excited to present Sentinel, an AI Industrial Investigation Agent built for Track 3 of the AMD Developer Challenge. Traditional predictive maintenance dashboards do a great job of alerting teams when sensors cross a threshold. But they leave the hardest question unanswered: **Why did it fail, and what should we do right now?** Today, reliability engineers must manually comb through thousand-page manuals, past work logs, and hundreds of telemetry points to find answers. Sentinel automates this entire Root Cause Analysis process in real time."*

---

## Slide 2: How It Works & AMD Compute (0:45 - 1:45)
> *"Sentinel operates like a Senior Reliability Engineer. When an anomaly is detected, it triggers a multi-source RAG query. It pulls 24 hours of telemetry stats from SQLite and queries ChromaDB to locate exact OEM engineering procedures and past historical cases. It then feeds this context to a Fireworks AI reasoning pipeline served on **AMD Instinct™ MI300X accelerators**. By compiling strict JSON schemas directly in the model's grammar decoder, we enforce absolute structural validity on the output and achieve lightning-fast response times—completing deep causal traces in under 28 seconds."*

---

## Slide 3: The Causal Reasoning Graph & Audit (1:45 - 2:45)
> *"Instead of a static text response, Sentinel generates a dynamic causal reasoning network visualized in React Flow. This graph connects telemetry anomalies to symptoms, failure modes, operational risks, and phased actions. Furthermore, Sentinel challenges itself: it runs a self-audit, detailing supporting facts, highlighting conflicting signals (like recent maintenance that should have resolved the issue), and specifying missing evidence."*

---

## Slide 4: Conclusion & Value (2:45 - 3:30)
> *"By transforming predictive maintenance from basic warnings into explainable, traceable incident reports, Sentinel prevents repeated equipment failures, reduces diagnostic time from hours to seconds, and minimizes downtime costs. Sentinel is fully containerized, supports automated database bootstrapping, and is ready for production. Thank you."*
