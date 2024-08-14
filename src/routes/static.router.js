import { Router } from "express";

const router = Router();

router.get("/passwordChange", (req, res, next) => {
  try {
    res.sendFile(path.join(__dirname, "src", "public", "index.html"));
  } catch (error) {
    next(error);
  }
});

export { router };
