import { Router } from "express";
import {
  acceptDonation,
  getAllByAcceptedDonations,
  getDocsByAcceptorMadeRequest,
} from "../controller/match.controller.js";
import { auth } from "../middleweres/auth.middleware.js";

const router = Router();

router.post("/doneraccept", auth, acceptDonation);
router.get("/getallbyaccepteddonations", auth, getAllByAcceptedDonations);
router.get("/getallfullfilledrequests", auth, getDocsByAcceptorMadeRequest);

export { router };

//   acceptDonation,
//   getAllByAcceptedDonations,
//   getDocsByAcceptorMadeRequest,
