if (
  process.env.LD_LIBRARY_PATH == null ||
  !process.env.LD_LIBRARY_PATH.includes(
    `${process.env.PWD}/node_modules/canvas/build/Release:`,
  )
) {
  process.env.LD_LIBRARY_PATH = `${
    process.env.PWD
  }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ''}`;
}

import Fastify from 'fastify'
import { sql } from '@vercel/postgres'
import { createCanvas, loadImage } from 'canvas';
import { getMonochromeTone } from '../utils/colorUtils.js'

const app = Fastify({
  logger: true,
})

app.get('/', async (req, reply) => {
  const { rows } = await sql`
    SELECT app_name, usage_time, icon_url
    FROM screen_times
    WHERE date = (SELECT MAX(date) FROM screen_times)
    ORDER BY usage_time DESC 
    LIMIT 5
  `
  const svg = await generateSVG(rows);
  return reply.status(200).type('image/svg+xml').send(svg);
})

async function getBase64Image(imgUrl) {
  if (!imgUrl) {
    throw new Error('Invalid image URL');
  }

  return new Promise(async (resolve, reject) => {
      try {
          const img = await loadImage(imgUrl);
          const canvas = createCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          console.log('Image loaded:', dataURL.substring(0, 50) + '...');
          resolve(dataURL);
      } catch (error) {
          reject(error);
      }
  });
}

async function generateSVG(data) {
  const maxBarWidth = 200;
  const maxUsageTime = Math.max(...data.map(item => item.usage_time));
  const barPaddingTop = 4;
  const barHeight = 12;
  const barSpacing = 30;
  const iconSize = 20;
  const iconPaddingTop = 5;
  const textPaddingTop = 15;
  const barBorderRadius = 6;
  const iconBorderRadius = 4;
  const headerHeight = 40;
  const headerPaddingTop = 30;
  const svgWidth = 320;
  const svgHeight = data.length * barSpacing + iconPaddingTop + headerHeight + 5;
  const borderThickness = 1;
  const borderBoxRadius = 10;
  const baseHue = Math.floor(Math.random() * 360);

  // Convert icon URLs to Base64 strings
  const base64Icons = await Promise.all(data.map(async (item) => {
    try {
      return await getBase64Image(item.icon_url);
    } catch (error) {
      console.error(`Error loading image from URL ${item.icon_url}:`, error);
      return null;
    }
  }));

  let iconContent = data.map((item, index) => {
    const yPos = barSpacing * index + iconPaddingTop + headerHeight;
    const base64Icon = base64Icons[index];
    return `
      <rect x="20" y="${yPos}" width="${iconSize}" height="${iconSize}" rx="${iconBorderRadius}" class="iconPlaceholder"/>
      <image href="${base64Icon}" x="20" y="${yPos}" width="${iconSize}" height="${iconSize}" />
    `;
  }).join('');
  
  let barContent = data.map((item, index) => {
    const barWidth = (item.usage_time / maxUsageTime) * maxBarWidth;
    const yPos = barSpacing * index + iconPaddingTop + headerHeight;
    const barColor = getMonochromeTone(baseHue);
    return `
      <rect x="50" y="${yPos + barPaddingTop}" width="${barWidth}" height="${barHeight}" rx="${barBorderRadius}" fill="${barColor}" />
    `;
  }).join('');

  let appUsageContent = data.map((item, index) => {
    const yPos = barSpacing * index + iconPaddingTop + headerHeight;
    return `
      <text x="260" y="${yPos + textPaddingTop}" class="appText">${Math.round(item.usage_time / 60)} min</text>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <style>
        .appText { font: 13px sans-serif; font-weight: 600; fill: #808080; }
        .iconPlaceholder { fill: lightgray; }
        .header { font: bold 16px sans-serif; fill: #505050; }
        .borderBox { fill: none; stroke: #D3D3D3; stroke-width: ${borderThickness}; rx: ${borderBoxRadius}; }
      </style>
      <!-- Border Box -->
      <rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}" class="borderBox"/>
      <!-- Header -->
      <text x="20" y="${headerPaddingTop}" class="header">Yesterday's Screen Time</text>
      <!-- Placeholder for App Icons -->
      ${iconContent}
      <!-- Horizontal Bars representing App Usage -->
      ${barContent}
      <!-- App Usage Text -->
      ${appUsageContent}
    </svg>
  `;
}

export default async function handler(req, res) {
  await app.ready()
  app.server.emit('request', req, res)
}