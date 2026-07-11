# Frequently Asked Questions (FAQ) for Judges

This document outlines key technical questions judges are likely to ask during evaluations, along with engineering-grade answers.

---

## 1. AI & Reasoning Questions

### Q1: How does the Reasoning Graph ensure it doesn't output random node types or invalid JSON?
We leverage **Fireworks AI's constrained grammar decoding** in strict JSON schema mode. By passing our structured Pydantic schemas (with Literal types for nodes and edges) directly to the API request, the Fireworks engine compiles the schema into context-free grammar constraints. The token generator is physically restricted to only outputting token transitions that satisfy the schema, completely preventing JSON parsing failures.

### Q2: What is RAG doing in this application?
The RAG pipeline retrieves unstructured technical text from our shared industrial library. When an investigation starts, Sentinel queries ChromaDB with the telemetry anomalies to pull relevant OEM operating limits, troubleshooting SOPs, and historical incident cases. These excerpts are injected into the LLM context to ground its diagnostic reasoning.

---

## 2. Infrastructure & AMD Compute

### Q3: How does Sentinel utilize AMD compute resources?
Sentinel is integrated with the **Fireworks AI API**, which serves Llama 3.1 70B and other open-source models natively on **AMD Instinct™ MI300X accelerators**. This offloads heavy multi-step logical reasoning to AMD hardware, yielding time-to-first-token latencies and allowing us to compile complex causal networks in under 28 seconds.

### Q4: Is the database generation mock data or real?
When Sentinel first boots, a bootstrapping script generates 48 hours of highly realistic synthetic industrial sensor telemetry (vibration, voltage, rotation, pressure) simulating normal operations, transient faults, and pre-failure degradation. This represents a representative machinery environment.

---

## 3. Architecture & Security

### Q5: How handles concurrent requests?
The FastAPI backend runs RAG searches and Fireworks inference in a **thread-pool executor** using `asyncio.to_thread`. This prevents CPU-bound context building and IO-bound API waits from blocking the FastAPI event loop, allowing the server to handle multiple investigations concurrently without freeze or timeout issues.
