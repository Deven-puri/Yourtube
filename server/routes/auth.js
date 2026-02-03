import express from "express";
import { login, updateprofile, firebaseAuth, requestOTP, verifyOTPAndLogin } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.post("/firebase-auth", firebaseAuth);
routes.post("/request-otp", requestOTP);
routes.post("/verify-otp", verifyOTPAndLogin);
export default routes;
