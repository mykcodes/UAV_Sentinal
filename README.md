<div align="center">
  <img src="https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange?style=for-the-badge&logo=hackaday" alt="SIH 2026" />
  <img src="https://img.shields.io/badge/Organization-DRDO-blue?style=for-the-badge" alt="DRDO" />
  <img src="https://img.shields.io/badge/Theme-Robotics%20%26%20Drones-success?style=for-the-badge" alt="Theme" />
  
  <h1>🚁 UAV Sentinal</h1>
  <p><b>Mission-Aware Hybrid Digital Twin for Aero-Piston Engine Health</b></p>
  <p><i>Sense ➔ Synchronize ➔ Understand ➔ Predict ➔ Simulate ➔ Decide</i></p>
</div>

---

## ⚠️ 1. The Problem 
Medium Altitude Long Endurance (MALE) UAVs are deployed for critical strategic missions. However, conventional engine monitoring systems are **reactive and threshold-based**, meaning they only alert operators *after* a catastrophic abnormality has occurred. 

Aero-piston engines operate under dynamic conditions (variable RPM, altitude, load, and temperatures). A sensor value that is "normal" at sea level might be a critical failure indicator at 18,000 feet. Present systems cannot predict degradation, estimate Remaining Useful Life (RUL), or simulate how an engine will behave during a planned mission.

## 💡 2. Our Solution: The Core Differentiator
**UAV-Sentinel** is not just a sensor dashboard or a generic machine learning classifier. It is a continuously updated digital representation of an aero-piston engine that combines:
**Physics-Based Expected Behavior + Real-Time Simulated Telemetry + AI Anomaly Detection**

We shift the paradigm from asking *"Is something wrong?"* to answering the critical operational question: 
> **"Of how the engine is right now in condition? And what are the measures wo could instantly take up in order to Increase the Health!"**

---

## 🏗️ 3. System Architecture & Workflow
Our architecture is divided into 6 modular layers designed for scalability and defense-grade deployment:

1. **Layer 1: Engine Simulator** - Generates realistic time-series telemetry under normal profiles and progressive degradation (fault injection).
2. **Layer 2: Telemetry Transport** - MQTT/WebSocket streaming for real-time data ingestion.
3. **Layer 3: Digital Twin Core** - Maintains the *Actual State* (live telemetry) vs. the *Expected State* (physics model) to calculate behavioral residuals.
4. **Layer 4: AI / PHM Engine** - Processes residuals using Isolation Forests and XGBoost for anomaly detection, fault diagnosis, and RUL estimation.
5. **Layer 5: Mission Reliability Engine** - Combines the engine's current State of Health (SOH) with the intended mission profile to calculate mission success probability.
6. **Layer 6: Ground Control UI** - A Three.js powered 3D digital twin, providing explainable alerts and interactive mission decision support.

---

## ✨ 4. Key Features & Implementability

* 🧠 **Hybrid Physics + AI Pipeline:** By calculating the *residual* between a physics-based model and actual telemetry, our AI detects complex degradation patterns that purely data-driven or purely physics-driven models miss.
* 🎯 **Explainable Alerts:** Every alert answers: *What is happening? Why? How confident are we? What is the impact?* (e.g., "Bearing Degradation Suspected: 89% Probability due to +21% Vibration RMS and +7% Oil Temp over 14 mins").
* 🔮 **Interactive What-If Mission Simulator:** Operators can input a proposed mission (e.g., 8 hours at 28,000 ft) and the system will simulate the engine's health trajectory and output a Mission Reliability Score.
* 📊 **Engine Health Index & RUL:** A normalized 0-100 score mapping Thermal, Lubrication, Mechanical, Combustion, and Boost health, alongside an uncertainty-aware RUL (e.g., "76 hours ± 12 hours").

---

## 💻 5. Tech Stack
Built for low-latency, edge-capable, and modular deployment:

### **Frontend (Ground Control UI)**
* **Framework:** React + TypeScript + Vite
* **3D Visualization:** Three.js / React Three Fiber
* **Styling & Charts:** Tailwind CSS, Framer Motion, Plotly/Recharts

### **Backend & Telemetry**
* **Core API:** Python + FastAPI
* **Data Transport:** MQTT (Mosquitto) & WebSockets
* **Data Validation:** Pydantic

### **AI & Data Layer**
* **Machine Learning:** scikit-learn, XGBoost, PyTorch (Temporal models)
* **Edge Inference:** ONNX Runtime
* **Database:** PostgreSQL + TimescaleDB (for high-performance time-series data)

---

## 🚀 6. Demonstration & Presentation Strategy
To prove implementability to the SIH Judges, we utilize a **Two-Laptop Demonstration Architecture**:
* **Laptop 1 (UAV/Engine Simulator):** Runs the physics-driven telemetry generator. Judges can manually "inject faults" (e.g., progressive lubrication degradation or sensor drift).
* **Laptop 2 (Ground Control):** Runs the Live Digital Twin. Judges will watch the real-time AI detect the injected anomalies, update the 3D model, recalculate the RUL, and dynamically adjust the Mission Reliability score based on live data streams.

<div align="center">
  <pre><code>
Team Members
----------------
• Mayank Kumar
• Vadanta Kumar Chauhaan
• Mayank Sharma
• Mayank Chaudhary
• Arnav Tyagi
• Vanshika Rana
  </code></pre>
</div>

---
<div align="center">
  <p><b>Team Base:</b> ABES Engineering College | <b>Project Lead:</b> <code>Mayank Kumar</code></p>
  <p><i>Ready for Smart India Hackathon 2026</i></p>
</div>
