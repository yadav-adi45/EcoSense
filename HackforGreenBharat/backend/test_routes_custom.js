import dotenv from "dotenv";
import { routeController } from "./controller/routesController.js";

dotenv.config();

const req = {
  body: {
    originCity: "Delhi",
    destinationCity: "Noida",
    preferences: {
      isPregnancyMode: true,
      preferWellLit: true,
      season: "winter"
    }
  },
  query: {}
};

const res = {
  status: (code) => {
    console.log("Status Code:", code);
    return res;
  },
  json: (data) => {
    console.log("JSON response success status:", data.success);
    if (data.success) {
      console.log("Origin:", data.origin);
      console.log("Destination:", data.destination);
      console.log("Routes count:", data.routes?.length);
      if (data.routes && data.routes.length > 0) {
        console.log("First Route Name:", data.routes[0].name);
        console.log("First Route Score:", data.routes[0].score);
        console.log("First Route healthAdvice:", data.routes[0].healthAdvice);
        console.log("First Route travelTip:", data.routes[0].travelTip);
        console.log("First Route Segment sample roadAttributes:", data.routes[0].pollutionSegments[0]?.roadAttributes);
      }
    } else {
      console.log("Error message:", data.message);
    }
  }
};

async function runTest() {
  console.log("Running routesController integration test with pregnancy, well-lit, and winter preferences...");
  await routeController(req, res);
  process.exit(0);
}

runTest();
