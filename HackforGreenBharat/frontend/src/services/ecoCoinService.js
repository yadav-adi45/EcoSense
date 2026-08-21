import axios from "axios";
import { serverUrl } from "../config";
import { getAuthHeaders } from "../utils/auth";

const API_BASE = `${serverUrl}/api/v12`;

export const ecoCoinService = {
  // Get balance & daily login eligibility
  getBalance: async () => {
    const res = await axios.get(`${API_BASE}/balance`, {
      headers: { ...getAuthHeaders() },
      withCredentials: true,
    });
    return res.data;
  },

  // Get transaction logs (paginated)
  getTransactions: async (page = 1, limit = 10) => {
    const res = await axios.get(`${API_BASE}/transactions`, {
      params: { page, limit },
      headers: { ...getAuthHeaders() },
      withCredentials: true,
    });
    return res.data;
  },

  // Earn coins for an activity
  earnCoins: async (source, amount, description = "", relatedId = "") => {
    const res = await axios.post(
      `${API_BASE}/earn`,
      { source, amount, description, relatedId },
      {
        headers: { ...getAuthHeaders() },
        withCredentials: true,
      }
    );
    return res.data;
  },

  // Spend coins on product purchase
  spendCoins: async (amount, productId, productName, originalPrice) => {
    const res = await axios.post(
      `${API_BASE}/spend`,
      { amount, productId, productName, originalPrice },
      {
        headers: { ...getAuthHeaders() },
        withCredentials: true,
      }
    );
    return res.data;
  },

  // Claim daily login bonus
  claimDailyLogin: async () => {
    const res = await axios.post(
      `${API_BASE}/daily-login`,
      {},
      {
        headers: { ...getAuthHeaders() },
        withCredentials: true,
      }
    );
    return res.data;
  },
};
