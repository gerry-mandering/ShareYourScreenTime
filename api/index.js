import Fastify from 'fastify'
import fetch from 'node-fetch';
import sharp from 'sharp';
import { sql } from '@vercel/postgres'
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

  try {
    const response = await fetch(imgUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const buffer = await response.buffer();
    const dataURL = await sharp(buffer)
      .png()
      .toBuffer()
      .then(data => `data:image/png;base64,${data.toString('base64')}`);
    return dataURL;
  } catch (error) {
    throw error;
  }
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
      <rect x="20" y="${yPos}" width="${iconSize}" height="${iconSize}" class="iconPlaceholder"/>
      <image href="${base64Icon}" x="20" y="${yPos}" width="${iconSize}" height="${iconSize}" class="iconImage"/>
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
      <text x="260" y="${yPos + textPaddingTop}" class="appUsage">${Math.round(item.usage_time / 60)} min</text>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <style>
        .borderBox { fill: none; stroke: #D3D3D3; stroke-width: ${borderThickness}; rx: ${borderBoxRadius}; }
        .header { font: bold 16px sans-serif; fill: #505050; }
        .iconPlaceholder { fill: lightgray; rx: ${iconBorderRadius}px; }
        .iconImage { border-radius: ${iconBorderRadius}px; }
        .appUsage { font: 13px sans-serif; font-weight: 600; fill: #808080; }
      </style>
      <!-- Border Box -->
      <rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}" class="borderBox"/>
      <!-- Header -->
      <text x="20" y="${headerPaddingTop}" class="header">Yesterday's Screen Time</text>
      <!-- App Icons -->
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