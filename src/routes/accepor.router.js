import {
  getAllAcceptorDocuments,
  getDocById,
  makeDocRequest,
  removeRequst,
  searchAcceptor,
  updateDetails,
} from "../controller/request.controller.js";
import { Router } from "express";
import { auth } from "../middleweres/auth.middleware.js";

const router = Router();

router.post("/makerequest", auth, makeDocRequest);
router.get("/getallacceptors", auth, getAllAcceptorDocuments);
router.get("/getdocbyid", getDocById);
router.delete("/removedoc", removeRequst);
router.put("/updaterequest", auth, updateDetails);
router.get("/searchacceptor", searchAcceptor);

export { router };

//   makeDocRequest,
//   getAllDonerRequests,
//   getDocById,
//   removeDonation,
//   searchAcceptor,
//   removeDonation,
