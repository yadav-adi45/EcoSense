import express from "express";
import {
  getBalance,
  getTransactions,
  earnCoins,
  spendCoins,
  claimDailyLogin,
} from "../controller/ecoCoinController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const ecoCoinRouter = express.Router();

ecoCoinRouter.get("/balance", isAuthenticated, getBalance);
ecoCoinRouter.get("/transactions", isAuthenticated, getTransactions);
ecoCoinRouter.post("/earn", isAuthenticated, earnCoins);
ecoCoinRouter.post("/spend", isAuthenticated, spendCoins);
ecoCoinRouter.post("/daily-login", isAuthenticated, claimDailyLogin);

export default ecoCoinRouter;
