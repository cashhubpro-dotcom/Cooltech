import { Router } from "express";
import { getDashboard } from "../controllers/smController.js";
import { listChannels, toggleChannel } from "../controllers/channelController.js";

const router = Router();

// Single call that powers SocialDashboard.jsx (KPIs + channels + posts + campaigns + weekly)
router.get("/dashboard", getDashboard);

// Channels (new — your existing backend has no Channel model yet)
router.get("/channels", listChannels);
router.patch("/channels/:channelId/toggle", toggleChannel);

export default router;
