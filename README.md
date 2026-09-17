# HOLORACT

> **Wearable-Free Hand Tracking · Interactive Holographic STEM · Computer Vision · Research**

A real-time, gesture-controlled holographic framework for interactive STEM education. HOLORACT enables users to manipulate 3D educational content using natural hand gestures through a standard RGB camera — without gloves, depth sensors, or specialized tracking hardware.

The system combines **MediaPipe**, **Python-based gesture recognition**, **OpenCV**, **React**, and **Three.js** into a low-latency pipeline designed for immersive educational interaction.

[![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=threedotjs)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hand%20Tracking-4285F4?logo=google)](https://ai.google.dev/edge/mediapipe/solutions/guide)
[![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-5C3EE8?logo=opencv)](https://opencv.org/)

---

## 🎥 System Demonstration

### Demo 1 — Real-Time Hand Tracking

Real-time demonstration of hand tracking and gesture-controlled interaction with 3D holographic content.

[Watch Demo](https://fortuner47.github.io/ThalhaPortfolio/Holoract%20Demo_1.mp4)

### Demo 2 — Interactive Holographic Learning

Extended demonstration showcasing holographic projection and interactive STEM learning modules.

[Watch Demo](https://fortuner47.github.io/ThalhaPortfolio/Holoract%20Demo_2.mp4)

---

## 🖼️ System Interface

![HOLORACT System Interface](https://fortuner47.github.io/ThalhaPortfolio/holoract_interface.png)

### System Interface

Real-time hand tracking interface displaying the camera feed, gesture information, and interactive learning modules.

![HOLORACT Holographic Display](https://fortuner47.github.io/ThalhaPortfolio/holoract_hologram.png)

### Holographic Display

Interactive 3D educational content rendered through a WebGL-based holographic interface.

---

## 📌 Overview

**HOLORACT** is a gesture-controlled holographic framework designed for interactive STEM education.

The system allows students to interact with and manipulate 3D educational objects using natural hand gestures captured through a conventional RGB camera.

Unlike traditional gesture interfaces that require specialized hardware, HOLORACT uses a **wearable-free and sensor-free approach**, relying on computer vision and hand landmark detection.

The complete pipeline combines real-time computer vision with WebGL-based 3D rendering:

```text
┌─────────────────────────┐
│   Standard RGB Camera  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ MediaPipe Hand Tracking │
│   Landmark Detection    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Custom Gesture          │
│ Recognition Pipeline   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Real-Time Socket        │
│ Communication           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ React + Three.js        │
│ WebGL Rendering Engine  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Interactive Holographic │
│ STEM Visualization      │
└─────────────────────────┘
```

---

## ✨ Key Features

### ✋ Wearable-Free Hand Tracking

HOLORACT requires only a standard RGB camera.

No:

* Gloves
* Depth cameras
* Motion controllers
* Specialized tracking hardware

are required for gesture interaction.

### 🎯 94% Gesture Recognition Accuracy

The custom gesture recognition pipeline achieved approximately **94% recognition accuracy** across the evaluated gesture set.

### ⚡ Real-Time Performance

The system is designed for responsive interaction, achieving:

* **60 FPS** real-time processing
* **~68 ms** end-to-end latency
* Real-time hand landmark tracking
* Low-latency gesture transmission

### 🧠 Computer Vision Pipeline

MediaPipe detects hand landmarks from the RGB camera stream.

The extracted landmarks are then processed by a custom Python gesture recognition pipeline to determine the user's intended interaction.

```text
Camera Frame
     ↓
Hand Detection
     ↓
21-Point Hand Landmarks
     ↓
Feature Processing
     ↓
Gesture Recognition
     ↓
Interaction Command
```

### 🌐 Interactive 3D Rendering

Recognized gestures are transmitted to the frontend, where **React and Three.js** translate them into real-time interactions with 3D educational content.

Users can interact with holographic objects through natural hand movements.

### 🔄 Real-Time Communication

The computer vision pipeline and WebGL interface communicate through low-latency socket connections, allowing gesture events to be reflected in the 3D environment in real time.

---

## 🏗️ System Architecture

```text
                         INPUT
                           │
                           ▼
              ┌──────────────────────┐
              │    RGB Camera        │
              │   Live Video Feed    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     MediaPipe        │
              │ Hand Landmark Model  │
              └──────────┬───────────┘
                         │
                    Landmarks
                         │
                         ▼
              ┌──────────────────────┐
              │ Python Gesture       │
              │ Recognition Pipeline │
              └──────────┬───────────┘
                         │
                  Gesture Events
                         │
                         ▼
              ┌──────────────────────┐
              │ Socket Communication │
              │   Real-Time Data     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ React + Three.js     │
              │ WebGL Environment    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Holographic STEM     │
              │ Visualization        │
              └──────────────────────┘
```

---

## 📊 Results & Metrics

| Metric                       |                   Result |
| ---------------------------- | -----------------------: |
| Gesture Recognition Accuracy |                  **94%** |
| Processing Rate              |               **60 FPS** |
| End-to-End Latency           |               **~68 ms** |
| Tracking Method              | MediaPipe Hand Landmarks |
| Input Hardware               |      Standard RGB Camera |

---

## 🧪 Research

HOLORACT was developed as a research-oriented system exploring the use of **computer vision, gesture recognition, and holographic visualization for STEM education**.

The project resulted in a research paper submitted to the **SCRS CIMA Conference (Springer)** and is currently under review.

The research explores how natural hand interaction can be used to create more immersive educational experiences without requiring wearable hardware.

---

## 🛠️ Tech Stack

### Computer Vision & AI

* **MediaPipe** — Hand landmark detection
* **OpenCV** — Image processing
* **Python** — Gesture recognition pipeline
* **Custom Gesture Model** — Gesture classification

### Frontend & 3D

* **React**
* **Three.js**
* **WebGL**
* **JavaScript / TypeScript**
* **Holographic HUD**

### Backend & Networking

* **Python**
* **Socket Communication**
* **Real-Time Data Pipeline**

### Storage

* **SQLite**
* Session logging

---

## 📂 Project Structure

```text
HOLORACT/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── shaders/
│   │   ├── hooks/
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── gesture/
│   ├── tracking/
│   ├── socket/
│   └── ...
│
├── models/
│
├── research/
│
├── README.md
└── ...
```

---

## 🚀 How It Works

### 1. Capture

A standard RGB camera captures the user's hand movements.

### 2. Detect

MediaPipe identifies the hand and extracts its landmark coordinates.

### 3. Recognize

The Python gesture pipeline processes the landmark data and determines the corresponding gesture.

### 4. Transmit

The recognized gesture is sent to the frontend through a real-time socket connection.

### 5. Render

React and Three.js process the interaction and update the 3D holographic environment.

### 6. Interact

The educational object responds immediately to the user's gesture.

```text
Gesture
   ↓
Recognition
   ↓
Socket Event
   ↓
3D Interaction
   ↓
Visual Feedback
```

---

## 🎓 Educational Applications

HOLORACT can be adapted for interactive STEM learning scenarios such as:

* 🧬 Biology — interactive anatomical models
* ⚛️ Physics — 3D simulations and physical concepts
* 🧪 Chemistry — molecular visualization
* 🌍 Earth Science — planetary and geological models
* 📐 Mathematics — interactive 3D geometry
* 🚀 Engineering — component and system visualization

The framework is designed to make abstract concepts more interactive and spatially understandable.

---

## 🔮 Future Improvements

Potential extensions include:

* [ ] Multi-hand gesture interaction
* [ ] More advanced gesture classification
* [ ] Custom-trained deep learning gesture models
* [ ] Voice + gesture multimodal interaction
* [ ] Multi-user collaboration
* [ ] WebXR / AR integration
* [ ] Improved holographic display hardware
* [ ] Cloud-based session analytics
* [ ] Expanded STEM learning modules
* [ ] Adaptive educational content
* [ ] Larger gesture vocabulary

---

## 🔗 Links

**GitHub Repository:**
https://github.com/Fortuner47/HOLORACT

**Portfolio:**
https://fortuner47.github.io/ThalhaPortfolio/

**Research:**
Research paper submitted to the SCRS CIMA Conference (Springer), currently under review.

---

## 👨‍💻 Author

**Thalha Ahamed T**

Artificial Intelligence & Data Science · Computer Vision · Machine Learning · 3D Visualization · Interactive AI

---

## 📄 License

This project is intended for research, educational, and demonstration purposes.
