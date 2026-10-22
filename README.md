# 🤘 BullPark USF — Nearest-to-Class Parking Navigator

**BullPark USF** is a modular parking intelligence and nearest-to-class navigation system designed specifically for the University of South Florida (USF) Tampa campus. It guides commuter and resident students to the optimal legal parking spot closest to their academic lecture building, minimizing walking distance, beating the Florida heat/rain, and preventing tardiness.

---

## 🏗️ Modular Architecture Overview

The codebase is split into distinct, decoupled modules to ensure each feature can be understood, tested, and debugged independently:

```
antigravity-test/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── campus/         # USF Tampa geography, building codes (BSN, CPR, ISA, ENG, etc.), facilities, and permit rules
│   │   │   ├── routing/        # Sidewalk walking distance, permit validator, & composite scoring
│   │   │   ├── weather-sweat/  # Tampa heat index & rain routing (prefers covered garages in rain/heat)
│   │   │   ├── occupancy/      # Real-time lot capacity & USF class changeover turnover prediction
│   │   │   ├── transit/        # Bull Runner shuttle network & multimodal Park & Ride fallback
│   │   │   ├── schedule/       # Canvas/OASIS student schedule sync & proactive departure alarms
│   │   │   └── spot-exchange/  # "Bull Trade" P2P spot handoffs & Bluetooth uncoupling telemetry
│   │   ├── debug/              # Dedicated CLI test/debug runners for every single module
│   │   └── server.ts           # Modular REST API endpoints exposing all features
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── USFMap.tsx          # Interactive SVG USF Tampa campus map with live density
    │   │   ├── RouteCard.tsx       # Ranked parking lots with walking time & citation safety badges
    │   │   ├── MultimodalCard.tsx  # Bull Runner Park & Ride alert banner when garages are full
    │   │   ├── SchedulePlanner.tsx # Canvas schedule sync & countdown to leave
    │   │   ├── BullTradeFeed.tsx   # Peer-to-peer spot exchange & Bluetooth beacon simulator
    │   │   └── DebuggerDrawer.tsx  # Built-in live time-travel and simulation inspector
    │   ├── App.tsx
    │   └── main.tsx
```

---

## 🚀 Running the App in VS Code

### 1. Start Both Backend & Frontend Concurrently:
```bash
npm run dev
```
* **Frontend Web UI**: `http://localhost:5173`
* **Backend API**: `http://localhost:3001`

### Or Run Them Separately:
```bash
# Terminal 1: backend API
npm run dev:backend

# Terminal 2: Frontend Vite UI
npm run dev:frontend
```

---

## 🧪 Isolated CLI Module Debugging

Each module includes its own dedicated standalone debug runner. You can test and inspect any specific feature directly from the terminal without launching the frontend:

| Command | Module Debugged | What It Tests |
| :--- | :--- | :--- |
| `npm run debug:routing` | **Routing & Permits** | Evaluates distance to BSN/CPR/LIB and tests the **USF After-5:30 PM Rule** (unlocking Faculty Lot 8A for Student Commuter S permits). |
| `npm run debug:occupancy` | **Occupancy & Turnover** | Tests campus hourly fill curves and **class changeover dismissal windows** (10:45 AM, 12:15 PM, 1:45 PM). |
| `npm run debug:weather` | **Tampa Sweat Index** | Computes NOAA heat index + walking duration penalties, contrasting covered garages vs. open surface lots during heat surges and rain downpours. |
| `npm run debug:schedule` | **Schedule Sync** | Ingests sample student courses, calculates departure times with parking buffers, and outputs proactive alarm status. |
| `npm run debug:transit` | **Bull Runner Shuttles** | Tests multimodal fallback routes connecting Lot 43 (Yuengling Center) to central academic buildings via Route A/B/C. |
| `npm run debug:all` | **Full Test Suite** | Runs all module debug runners in sequence with clean formatted console output. |

---

## 🎮 Built-in In-App Live Debugger Drawer

Click the **"Module Debugger"** button in the top-right corner of the web UI to test real-time scenarios interactively:
1. **Time Machine**: Fast-forward to **10:48 AM** to observe class turnover spot clearing, or **5:45 PM** to watch faculty lots instantly turn green for student commuters.
2. **Weather Override**: Toggle between a sunny afternoon (96°F) and a sudden **Tampa Downpour** to see covered garages automatically leap to #1 recommendation.
3. **Congestion Trigger**: Force Crescent Hill & Beard garages to 98% capacity to trigger the **Bull Runner Shuttle Multimodal recommendation** banner.
4. **Bluetooth Signal Simulator**: Simulate entering/leaving parking garages with Bluetooth disconnect/reconnect events.
5. **Raw JSON Inspector**: View the live API response payloads in real time.

## Campus map (no API key required)

The app uses Leaflet with OpenStreetMap tiles. It loads directly inside the app,
with one Full campus view, zoom controls, selectable building pins, building search,
parking markers, destination pins, and a saved-car marker.

Walk here draws a pedestrian route and shows distance, estimated time, and instructions
in the same screen. Drive to parking uses your location for a driving route. Routes use
OSRM through FOSSGIS's separate pedestrian and car services; the pedestrian endpoint
uses its own foot graph even though OSRM's URL profile segment is named `driving`.
No Google key, map ID, or Google scripts are used.

My location requests browser permission and shows your position and estimated accuracy.
Stop sharing location clears the watch. HTTPS or localhost is required. Position remains
in frontend memory; route endpoints go to the routing provider only when you request
or refresh directions. GPS updates move your marker without automatically requesting
new routes. Press Walk here again to update a route from your latest position.

Optional provider settings are documented in `frontend/.env.example`. Restart Vite after
changing environment files. Public OSM tiles and FOSSGIS routing are best-effort community
services. Routing requests are limited to one every 1.1 seconds per browser, not continuously
polled. Use a hosted or self-hosted service for production traffic, especially across many
concurrent users. Retain provider attribution and comply with the provider usage policy.
No tile prefetch or offline downloads are implemented.

Parking availability, schedules, exchanges, weather, and ranked walking estimates remain
simulated/local data. These are independent of the route shown by OSRM.

References:
- https://leafletjs.com/examples/quick-start/
- https://operations.osmfoundation.org/policies/tiles/
- https://routing.openstreetmap.de/about.html
