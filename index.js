import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./src/database/db.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

let dbConnectionInstance = null;

try {
  dbConnectionInstance = await connectDatabase();
  console.log("database connected :", dbConnectionInstance.connections[0].name);
} catch (error) {
  console.log(error);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { dbConnectionInstance };
