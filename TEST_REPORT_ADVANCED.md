# Advanced Black Box Test Report - Turf War Scenario

**Date:** 2025-12-26
**Tester:** Automated Script (`simulation_advanced.py`)

## Summary
A targeted "Turf War" simulation was executed to verify the territory capture and conflict mechanics. The test simulated two opposing teams (Blue vs. Red) establishing separate bases and then engaging in a takeover attempt.

## Test Environment
- **URL:** https://localhost:3001
- **Browser:** Chromium (2 Contexts)
- **Framework:** Playwright (Python)
- **Script:** `simulation_advanced.py`

## Test Execution Details

### Phase 1: Deployment & Base Establishment
| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Deployment | **Passed** | Blue deployed to Zone A (South). Red deployed to Zone B (North). |
| 2 | Base Creation | **Passed** | Both teams simultaneously walked 40m square paths in their respective zones. |
| 3 | Verification | **Passed** | Screenshots confirm distinct polygons rendered for both teams. |

### Phase 2: The Offensive (Blue Invades Red)
| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 4 | Travel | **Passed** | Blue traveled from Zone A to Zone B. |
| 5 | Invasion | **Passed** | Blue walked a 50m square path *around* Red's existing territory. |
| 6 | Result | **Observed** | The system allowed Blue to create a new territory polygon on top of Red's. |

## Key Findings & Observations
1.  **Territory Layering:** The current system handles conflict by simply layering the new territory on top of the old one. There is no logic to "erase" or "contest" the rival territory yet. Visually, the last claimed territory appears on top.
2.  **Multiplayer Sync:** Both players could see the territories updating in real-time (implied by screenshots showing the polygons).
3.  **Stability:** The application handled two simultaneous users creating geometry without crashing.

## Recommendations
- **Implement Conflict Logic:** Decide on game rules for overlapping territories. Should the old one shrink? Be deleted? Or is layering intended?
- **Visual Feedback:** Add visual indicators when entering enemy territory (e.g., screen flash, warning text).
- **Defense Mechanics:** Allow Red to "defend" by walking their perimeter to reinforce it.

---

# Alternatives and Suggestions

You asked for "free better alternatives". Based on the current stack (React, Vite, Firebase, Leaflet), here are some suggestions:

## 1. Testing Frameworks
*   **Cypress (Free, Open Source):** Very popular for frontend testing. It runs *inside* the browser, making it easier to debug and see what's happening in real-time. It has a great UI.
*   **Selenium WebDriver (Free, Open Source):** The industry standard for years. Supports many languages (Java, Python, C#, etc.). Great if you need cross-browser testing on older browsers.

## 2. Map Libraries
*   **MapLibre GL JS (Free, Open Source):** A fork of Mapbox GL JS. Uses WebGL for vector tiles, offering smoother zooming, rotation, and 3D terrain compared to Leaflet.
*   **OpenLayers (Free, Open Source):** Extremely powerful and feature-rich. Handles complex map projections better than Leaflet.

## 3. Backend / Realtime Database
*   **Supabase (Free Tier, Open Source):** A popular Firebase alternative using PostgreSQL. Provides Auth, Realtime, Storage, and Edge Functions.
*   **PocketBase (Free, Open Source):** A single-file backend (Go + SQLite). Easiest to deploy for small games.
*   **Appwrite (Free, Open Source):** Another complete backend-as-a-service solution.

## 4. UI Frameworks
*   **Mantine (Free, MIT):** A fully featured React component library.
*   **Chakra UI (Free, MIT):** Great for rapid development with accessible components.
