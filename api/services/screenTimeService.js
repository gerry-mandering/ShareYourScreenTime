import { sql } from '@vercel/postgres';
import { generateSVG } from '../utils/svgGenerator.js';

export async function getLatestScreenTimeSVG() {
  const { rows } = await sql`
    SELECT app_name, usage_time, icon_url
    FROM screen_times
    WHERE date = (SELECT MAX(date) FROM screen_times)
    ORDER BY usage_time DESC 
    LIMIT 5
  `;

  return generateSVG(rows);
}
