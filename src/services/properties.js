// src/services/properties.js

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// MAIN SERVICE FUNCTION
export async function getProperties() {
  try {
    const query = `
      SELECT 
        id,
        address,
        size_sqft,
        rent,
        lease_expiry,
        operator,
        source,
        url,
        created_at
      FROM properties
      ORDER BY created_at DESC
      LIMIT 200;
    `;

    const result = await pool.query(query);

    return {
      count: result.rows.length,
      items: result.rows
    };

  } catch (err) {
    console.error("Error in properties service:", err);
    throw err;
  }
}
