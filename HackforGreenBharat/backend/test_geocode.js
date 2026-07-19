import { reverseGeocode } from "./utils/reverseGeocode.js";

const test = async () => {
    console.log("Testing reverseGeocode...");
    try {
        const res = await reverseGeocode(28.6139, 77.2090); // New Delhi
        console.log("Result:", res);
    } catch (e) {
        console.error("Test Error:", e);
    }
};

test();
