import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const result = await sql`
      CREATE TABLE screen_times (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        app_name VARCHAR(255) NOT NULL,
        usage_time INT NOT NULL,
        icon_url VARCHAR(255) NOT NULL,
        UNIQUE (date, app_name)
      );
    `;
    return response.status(200).json({ result });
  } catch (error) {
    return response.status(500).json({ error });
  }
}
