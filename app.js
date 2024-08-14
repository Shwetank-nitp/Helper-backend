import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { ErrorResponse } from "./src/utils/ErrorResponse.js";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

const app = express();

// Construct __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" directory
app.use(
  session({
    secret: "keyboard cat", //replace it
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(express.static(path.join(__dirname, "src", "assets", "public")));

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

//Router settings
const API_VERSION = "/api/v1/";

import { router as matchupRouteHandler } from "./src/routes/matchup.router.js";
import { router as acceptorRouteHandler } from "./src/routes/accepor.router.js";
import { router as authRouteHandler } from "./src/routes/auth.router.js";
import { router as donationRouteHander } from "./src/routes/donation.router.js";

app.get("/public/passwordChange", (req, res, next) => {
  try {
    res.sendFile(path.join(__dirname, "src", "public", "index.html"));
  } catch (error) {
    next(error);
  }
});

app.use(API_VERSION + "auth", authRouteHandler); //done
app.use(API_VERSION + "matchup", matchupRouteHandler); //done
app.use(API_VERSION + "acceptor", acceptorRouteHandler); //done
app.use(API_VERSION + "donations", donationRouteHander); //done

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof ErrorResponse) {
    //Error related to server client handling
    const data = error.getMessage();
    res.status(error.code || 500).json(data);
  } else {
    // error related to server code errors
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default app;
