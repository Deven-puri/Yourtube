import express from "express";
import { 
  toggleSubscription, 
  getSubscriberCount, 
  checkSubscription,
  getUserSubscriptions 
} from "../controllers/subscription.js";

const routes = express.Router();

routes.post("/:channelId", toggleSubscription);
routes.get("/count/:channelId", getSubscriberCount);
routes.get("/check/:userId/:channelId", checkSubscription);
routes.get("/user/:userId", getUserSubscriptions);

export default routes;
