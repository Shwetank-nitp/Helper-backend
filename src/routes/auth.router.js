import { Router } from "express";
import {
  changePassword,
  createAccount,
  deleteAccount,
  getAccountInfo,
  login,
  logout,
  updateAccountInfo,
  updateAvatar,
} from "../controller/auth.controller.js";
import { auth } from "../middleweres/auth.middleware.js";
import { upload } from "../middleweres/multer.middleware.js";
import {
  authMiddle,
  authToken,
  oauthCallback,
  sendMail,
} from "../middleweres/mail.middleware.js";

const router = Router();

router.post("/create", upload.single("avatar"), createAccount);
router.put("/updateinfo", auth, updateAccountInfo);
router.get("/getaccountinfo", auth, getAccountInfo);
router.delete("/deleteaccount", auth, deleteAccount);
router.put("/updateimage", upload.single("avatar"), auth, updateAvatar);
router.post("/updatepassword", changePassword);
router.post("/login", login);
router.post("/logout", logout);
router.get("/sendmailconf", authMiddle, sendMail);
router.get("/accesstoken", authToken);
router.get("/redirected", oauthCallback, sendMail);

export { router };

// --All controller--
//   createAccount,
//   getAccountInfo,
//   updateAccountInfo,
//   updateAvatar,
//   changePassword,
//   deleteAccount,
//   logout,
//   login,
