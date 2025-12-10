// src/services/OperatorService.ts

import axios from "axios";

const API_URL = "https://acquire-intel-api.onrender.com/api/operators";

// Fetch all operators
const fetchOperators = async () => {
  const res = await axios.get(API_URL);
  return Array.isArray(res.data) ? res.data : [];
};

// Create new operator
const createOperator = async (operatorData: any) => {
  const res = await axios.post(API_URL, operatorData);
  return res.data;
};

// DEFAULT EXPORT (REQUIRED BY YOUR VIEWS)
export default {
  fetchOperators,
  createOperator,
};
