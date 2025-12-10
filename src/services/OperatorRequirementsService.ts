// src/services/OperatorRequirementsService.ts

import axios from "axios";

const API_URL = "https://acquire-intel-api.onrender.com/api/operator-requirements";

export const fetchRequirements = async () => {
  const res = await axios.get(API_URL);
  return Array.isArray(res.data) ? res.data : [];
};

export const createRequirement = async (payload: any) => {
  const res = await axios.post(API_URL, payload);
  return res.data;
};

export const uploadRequirementsCsv = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_URL}/upload-csv`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
