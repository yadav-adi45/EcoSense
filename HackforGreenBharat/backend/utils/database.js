import mongoose from "mongoose";

const database = async () => {
    try {
        const uri = process.env.MONGODB_URL;

        if (!uri) {
            console.error(
                "MongoDB connection string is not set. Set MONGO_URL or MONGODB_URL in .env"
            );
            return;
        }

        await mongoose.connect(uri);
        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database connection error:", error);
    }
};

export default database;