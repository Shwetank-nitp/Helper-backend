import { Router } from "express";
import {
  getAllDonerRequests,
  getDocById,
  makeDonation,
  removeDonation,
  searchDoner,
  updateDetails,
} from "../controller/donation.controller.js";
import { auth } from "../middleweres/auth.middleware.js";

const router = Router();

router.post("/makedonations", auth, makeDonation);
router.get("/getdoenrbyid", getDocById);
router.get("/getalldoners", auth, getAllDonerRequests);
router.put("/updatedetails", updateDetails);
router.get("/seatchdoner", searchDoner);
router.delete("/removedoner", auth, removeDonation);

export { router };

//   searchdoner
//   makeDonation,
//   getAllDonerRequests,
//   updateDetails,
//   searchDoner,
//   getDocById,
