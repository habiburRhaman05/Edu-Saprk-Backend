import { startServer } from "./app";
import { configureCloudinary } from "./config/cloudinary.config";
import { connectToDatabase } from "./config/db";
import { auth } from "./lib/auth";

(async () => {
  await connectToDatabase();
 await configureCloudinary()

 
  await startServer();
})();
