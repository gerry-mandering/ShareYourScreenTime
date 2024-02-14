import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const result = await sql`
      CREATE TABLE app_icons (
        app_name VARCHAR(255) PRIMARY KEY,
        icon_url VARCHAR(255) NOT NULL
      );
    `;
    return response.status(200).json({ result });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}