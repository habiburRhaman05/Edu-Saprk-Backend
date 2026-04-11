import { startServer } from "./app";
import { configureCloudinary } from "./config/cloudinary.config";
import { connectToDatabase } from "./config/db";

(async () => {
  await connectToDatabase();
 await configureCloudinary()
  await startServer();
})();
