# Smart Interviewer

**AI-powered interview practice platform integrated with Presage Vitals Sensing.**

This monorepo contains the Next.js frontend and the C++ Presage Vitals Engine for real-time physiological monitoring.

## Features

- **Real-Time Vitals**: Contactless heart rate and breathing rate monitoring via webcam.
- **Glassmorphism UI**: Modern, responsive design with animated gradients.
- **Remote Control**: Start tracking sessions directly from the web UI.
- **Privacy First**: Processed locally on the device.

---

## 🏗️ Project Structure

```
smart-interviewer/
├── src/                    # Next.js Frontend
│   ├── app/                # App Router (Pages & APIs)
│   ├── components/         # React Components
│   └── ...
├── presage_quickstart/     # C++ Vitals Engine
│   ├── hello_vitals.cpp    # Main Application
│   ├── include/            # Headers (inc. MJPEG Streamer)
│   └── build/              # Compiled Binaries
└── ...
```

---

## 🚀 Getting Started

You need to run both the C++ Engine (backend) and the Next.js App (frontend) simultaneously.

### 1. C++ Vitals Engine (Backend)

**Prerequisites & Installation (Ubuntu/WSL):**

```bash
# 1. Install Dependencies
sudo apt update
sudo apt install -y build-essential git lsb-release pkg-config curl gpg \
libcurl4-openssl-dev libssl-dev libv4l-dev libgles2-mesa-dev libunwind-dev \
libgoogle-glog-dev libatlas-base-dev libopencv-dev

# 2. Install CMake 3.27.0
curl -L -o cmake-3.27.0-linux-x86_64.sh https://github.com/Kitware/CMake/releases/download/v3.27.0/cmake-3.27.0-linux-x86_64.sh
chmod +x cmake-3.27.0-linux-x86_64.sh
sudo ./cmake-3.27.0-linux-x86_64.sh --skip-license --prefix=/usr/local

# 3. Setup Presage Repository
curl -s "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/presage-technologies.gpg >/dev/null
sudo curl -s --compressed -o /etc/apt/sources.list.d/presage-technologies.list "https://presage-security.github.io/PPA/presage-technologies.list"
sudo apt update

# 4. Force install and lock SDK version 2.0.4
sudo apt install -y libsmartspectra-dev=2.0.4 libphysiologyedge-dev=2.0.4
sudo apt-mark hold libsmartspectra-dev
sudo apt-mark hold libphysiologyedge-dev
```

**Build & Run:**

```bash
cd presage_quickstart
mkdir build && cd build
cmake ..
make

# Run the engine (Must be running for video feed to appear)
./hello_vitals + API_KEY
```

*The engine will start an MJPEG stream on `http://localhost:8080/video_feed` and write realtime data to `latest_vitals.json`.*

### 2. Next.js App (Frontend)

Open a new terminal window.

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🖥️ Usage

1.  **Launch**: Ensure `./hello_vitals` is running in the background.
2.  **Setup**: Fill out the interview details on the home page.
3.  **Start**: Click "Start Interview".
4.  **Monitor**:
    *   The camera feed will appear on the interview page.
    *   **Heart Rate** and **Breathing Rate** will update in real-time below the video.
    *   Colors indicate status: **Green** (Relaxed), **Yellow** (Normal), **Red** (Stress).
5.  **Record**: Click **"Start Session"** to trigger recording. This signals the C++ engine to start logging data for the specific question.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion.
- **Backend / AI**: C++17, OpenCV 4, Presage SmartSpectra SDK.
- **Communication**: MJPEG Stream (Video), JSON Polling (Data), File-based IPC (Triggers).

## License

MIT License
