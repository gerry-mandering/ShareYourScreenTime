import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Handler function for adding screen time data to the database
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    // Extract screen time data
    const screenTimeData = request.body;
    if (!Array.isArray(screenTimeData) || screenTimeData.length === 0) {
      throw new Error('Screen time data must be a non-empty array');
    }
    
    // Begin a database transaction
    await sql`BEGIN`;
    
    // Iterate over each screen time record
    for (const { date, appName, usageTime } of screenTimeData) {
      if (!date || !appName || usageTime == null) {
        throw new Error('Date, app name, and usage time are required for each record');
      }

      // Query the app_icons table for the icon URL of the app
      const { rows: appIconRows } = await sql`
        SELECT icon_url FROM app_icons WHERE app_name = ${appName};
      `;

      // Use the found icon URL or default to an empty string if not found
      const iconUrl = appIconRows.length > 0 ? appIconRows[0].icon_url : '';
      
      // Insert or update the screen time record in the screen_times table
      await sql`
        INSERT INTO screen_times (date, app_name, usage_time, icon_url)
        VALUES (${date}, ${appName}, ${usageTime}, ${iconUrl})
        ON CONFLICT (date, app_name) DO UPDATE
        SET usage_time = EXCLUDED.usage_time;
      `;
    }
    
    // Commit the transaction if all operations are successful
    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json({ message: 'Screen time data added successfully' });
}