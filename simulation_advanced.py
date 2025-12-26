import asyncio
from playwright.async_api import async_playwright, BrowserContext, Page
import json
import math
import random

# ----- Configuration -----
# Central Park area approx
ZONE_A_LAT = 40.7820  # Blue Home
ZONE_A_LNG = -73.9650

ZONE_B_LAT = 40.7830  # Red Home (slightly north)
ZONE_B_LNG = -73.9650

STEP_SIZE_METERS = 5
WALK_DELAY = 1.0

def calculate_new_coord(lat, lng, d_lat_meters, d_lng_meters):
    r_earth = 6378137
    pi = math.pi
    d_lat = (d_lat_meters / r_earth) * (180 / pi)
    d_lng = (d_lng_meters / r_earth) * (180 / pi) / math.cos(lat * pi / 180)
    return lat + d_lat, lng + d_lng

class Player:
    def __init__(self, context: BrowserContext, name: str, team: str, start_lat: float, start_lng: float):
        self.context = context
        self.page = None
        self.name = name
        self.team = team
        self.lat = start_lat
        self.lng = start_lng

    async def init(self):
        self.page = await self.context.new_page()
        await self.context.set_geolocation({"latitude": self.lat, "longitude": self.lng})
        await self.context.grant_permissions(["geolocation"])

        await self.page.goto("https://localhost:3001", timeout=60000)

        try:
            await self.page.wait_for_selector("input[placeholder='e.g. Maverick']", timeout=10000)
            await self.page.fill("input[placeholder='e.g. Maverick']", self.name)
            await self.page.click(f"button:has-text('{self.team.upper()}')")
            await self.page.click("button:has-text('Enter The Grid')")
            await self.page.wait_for_selector(".leaflet-container", timeout=20000)
            print(f"[{self.name}] Logged in at {self.lat}, {self.lng}")
        except Exception as e:
            print(f"[{self.name}] Login failed: {e}")
            raise e

    async def move_to(self, d_lat_m, d_lng_m):
        new_lat, new_lng = calculate_new_coord(self.lat, self.lng, d_lat_m, d_lng_m)
        self.lat = new_lat
        self.lng = new_lng
        await self.context.set_geolocation({"latitude": self.lat, "longitude": self.lng})
        await asyncio.sleep(WALK_DELAY)

    async def teleport_to(self, lat, lng):
        print(f"[{self.name}] Teleporting/Traveling to target zone...")
        # Simulate travel by jumping (or fast walking if we wanted)
        # For speed, we just teleport but wait for map to catch up
        self.lat = lat
        self.lng = lng
        await self.context.set_geolocation({"latitude": self.lat, "longitude": self.lng})
        await asyncio.sleep(3)

    async def walk_square(self, side_length_meters):
        steps = int(side_length_meters / STEP_SIZE_METERS)
        print(f"[{self.name}] Claiming territory ({side_length_meters}m box)...")

        for _ in range(steps): await self.move_to(STEP_SIZE_METERS, 0) # N
        for _ in range(steps): await self.move_to(0, STEP_SIZE_METERS) # E
        for _ in range(steps): await self.move_to(-STEP_SIZE_METERS, 0) # S
        for _ in range(steps + 2): await self.move_to(0, -STEP_SIZE_METERS) # W (Close loop)

        print(f"[{self.name}] Territory loop complete.")

    async def screenshot(self, filename):
        await self.page.screenshot(path=filename)
        print(f"[{self.name}] Screenshot saved: {filename}")

async def run_simulation():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Setup
        ctx_blue = await browser.new_context(ignore_https_errors=True, viewport={'width': 800, 'height': 600})
        ctx_red = await browser.new_context(ignore_https_errors=True, viewport={'width': 800, 'height': 600})

        # BLUE starts at ZONE A, RED starts at ZONE B
        blue = Player(ctx_blue, "BlueGeneral", "blue", ZONE_A_LAT, ZONE_A_LNG)
        red = Player(ctx_red, "RedDefender", "red", ZONE_B_LAT, ZONE_B_LNG)

        print("--- PHASE 0: Deployment ---")
        await asyncio.gather(blue.init(), red.init())
        await asyncio.sleep(2)
        await blue.screenshot("1_deployment_blue.png")
        await red.screenshot("1_deployment_red.png")

        print("\n--- PHASE 1: Establish Bases ---")
        # Both teams claim their starting zones simultaneously
        await asyncio.gather(
            blue.walk_square(40),
            red.walk_square(40)
        )
        await asyncio.sleep(3) # Allow polygons to render
        await blue.screenshot("2_bases_established_blue_view.png")
        await red.screenshot("2_bases_established_red_view.png")

        print("\n--- PHASE 2: Blue Offensive ---")
        # Blue travels to Red's Zone (B)
        await blue.teleport_to(ZONE_B_LAT, ZONE_B_LNG)

        # Blue attempts to capture Red's territory by walking a slightly larger square around it
        await blue.walk_square(50)

        await asyncio.sleep(3)
        await blue.screenshot("3_blue_invades_red_view.png")
        await red.screenshot("3_red_witnesses_invasion.png")

        await browser.close()

        # Generate Report
        report = {
            "test_date": "2025-12-26",
            "scenarios": [
                {"name": "Establish Bases", "status": "Executed", "details": "Both teams created polygons in separate zones."},
                {"name": "Invasion", "status": "Executed", "details": "Blue moved to Red zone and created overlapping polygon."}
            ]
        }
        with open("simulation_report.json", "w") as f:
            json.dump(report, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_simulation())
