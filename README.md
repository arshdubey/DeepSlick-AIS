# 🛰️ DeepSlick-AIS

**Orbital Surveillance & Forensic Attribution Engine for Marine Oil Spills**

![DeepSlick-AIS Tactical Dashboard](test.jpg)

DeepSlick-AIS is an autonomous marine surveillance platform designed to combat illegal ocean dumping. By combining space-based radar, advanced hydrodynamic drift modeling, and maritime tracking data, the system not only detects oil spills but mathematically traces them back to the exact responsible vessel.

---

## 🌊 The Problem
Illegal bilge dumping and oil spills happen frequently at sea, causing devastating ecological damage. Because the oceans are vast, the evidence disperses quickly, and by the time a slick is discovered, the perpetrator is usually hundreds of miles away. 

## 🚀 The Solution
DeepSlick-AIS introduces **attribution** to spill tracking through a three-stage forensic pipeline:

1. **SAR Satellite Segmentation:** Ingests Sentinel-1/ICEYE Synthetic Aperture Radar (SAR) imagery to autonomously detect and map oil slicks, regardless of cloud cover or darkness.
2. **Lagrangian Drift Engine:** Utilizes MetOcean data (wind and sea currents) and a 4th-order Runge-Kutta (RK4) integrator to run a **Hindcast**—modeling the oil's drift backward in time to pinpoint the initial discharge origin. It also runs a **Forecast** to predict future coastal impacts.
3. **AIS Trajectory Correlation:** Cross-references the hindcasted origin window against historical Automatic Identification System (AIS) maritime data, flagging the specific suspect vessel whose trajectory intersects the spill origin.

All data is visualized in a high-performance, hardware-accelerated 3D tactical dashboard built for Coast Guards and Environmental Protection Agencies.

---

## 🛠️ Technology Stack

**Frontend (Mission Control):**
* [Next.js 16](https://nextjs.org/) & React
* [Deck.gl](https://deck.gl/) & [React-Map-GL](https://visgl.github.io/react-map-gl/) (Hardware-accelerated geospatial visualization)
* [Three.js](https://threejs.org/) (Custom 3D orbital background & satellites)
* [Tailwind CSS](https://tailwindcss.com/) (Cyber/Tactical UI styling)

**Backend (Drift Engine & Analytics):**
* [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python API)
* [SciPy](https://scipy.org/) & [NumPy](https://numpy.org/) (Runge-Kutta hydrodynamic integration)
* [Shapely](https://shapely.readthedocs.io/) (Geospatial geometry processing)

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.9+)

### 1. Start the Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
*The backend API will run on `http://localhost:8000`*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The tactical dashboard will be available at `http://localhost:3000`*

---

## 🏆 Smart India Hackathon 2026
This project was developed for the Smart India Hackathon (SIH) 2026. 
* **Theme:** Space Technology / CleanTech
* **Category:** Software

---
*DeepSlick-AIS - Holding polluters accountable from orbit.*
