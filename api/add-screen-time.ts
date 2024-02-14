import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const screenTimeData = request.body;
    if (!Array.isArray(screenTimeData) || screenTimeData.length === 0) {
      throw new Error('Screen time data must be a non-empty array');
    }
    
    await sql`BEGIN`;
    
    for (const { date, appName, usageTime } of screenTimeData) {
      if (!date || !appName || usageTime == null) {
        throw new Error('Date, app name, and usage time are required for each record');
      }
      const { rows: appIconRows } = await sql`
        SELECT icon_url FROM app_icons WHERE app_name = ${appName};
      `;
      const iconUrl = appIconRows.length > 0 ? appIconRows[0].icon_url : '';
      
      // Insert data into ScreenTime, including the icon URL
      await sql`
        INSERT INTO screen_times (date, app_name, usage_time, icon_url)
        VALUES (${date}, ${appName}, ${usageTime}, ${iconUrl});
      `;
    }
    
    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json({ message: 'Screen time data added successfully' });
}