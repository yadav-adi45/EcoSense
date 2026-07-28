import mongoose from "mongoose";
import https from "https";

const tlsAgent = new https.Agent({ rejectUnauthorized: false });

const database = async () => {
    try {
        const uri = process.env.MONGODB_URL;

        if (!uri) {
            console.error(
                "MongoDB connection string is not set. Set MONGO_URL or MONGODB_URL in .env"
            );
            return;
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000,
            heartbeatFrequencyMS: 2000,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
        });
        console.log("✅ Database Connected Successfully");
    } catch (error) {
        console.error("Database connection error:", error.message);
    }
};

export default database;
