import { alertCache } from "../utils/alertCache.js";

// Store alerts in memory (or database)
// For hackathon, simple in-memory cache
export const receiveAlert = async (req, res) => {
    try {
        const data = req.body;
        // console.log("🔥 Received Data from Pathway:", data); // Verbose logging off

        // Store data
        alertCache.set("latest_pathway_data", data);

        res.status(200).json({ success: true, message: "Data received" });
    } catch (error) {
        console.error("Error receiving data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getLatestAlert = async (req, res) => {
    try {
        const data = alertCache.get("latest_pathway_data");
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
