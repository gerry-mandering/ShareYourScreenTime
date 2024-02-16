import Fastify from 'fastify'
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
  const svg = generateSVG(rows)
  return reply.status(200).type('image/svg+xml').send(svg)
})

function generateSVG(data) {
  const maxBarWidth = 200;
  const maxUsageTime = Math.max(...data.map(item => item.usage_time));
  const barPaddingTop = 4;
  const barHeight = 12;
  const barSpacing = 30;
  const iconSize = 20;
  const iconPaddingTop = 5;
  const textPaddingTop = 15;
  const barBorderRadius = 6; // Border radius for bars
  const iconBorderRadius = 4; // Border radius for icons and bars
  const headerHeight = 40; // Height for the header
  const headerPaddingTop = 30; // Padding for the header
  const svgWidth = 320;
  const svgHeight = data.length * barSpacing + iconPaddingTop + headerHeight + 5;
  const borderThickness = 1; // Increased border thickness
  const borderBoxRadius = 10; // Border radius for the border box
  const baseHue = Math.floor(Math.random() * 360);
  
  let svgContent = data.map((item, index) => {
    const barWidth = (item.usage_time / maxUsageTime) * maxBarWidth;
    const yPos = barSpacing * index + iconPaddingTop + headerHeight;
    const barColor = getMonochromeTone(baseHue);
    return `
      <rect x="50" y="${yPos + barPaddingTop}" width="${barWidth}" height="${barHeight}" rx="${barBorderRadius}" fill="${barColor}" />
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
      ${data.map((item, index) => {
        const yPos = barSpacing * index + iconPaddingTop + headerHeight;
        return `
          <rect x="20" y="${yPos}" width="${iconSize}" height="${iconSize}" rx="${iconBorderRadius}" class="iconPlaceholder"/>
          <image href="${item.icon_url}" x="20" y="${yPos}" width="${iconSize}" height="${iconSize}" />
        `;
      }).join('')}
      <!-- Horizontal Bars for App Usage -->
      ${svgContent}
    </svg>
  `;
}

export default async function handler(req, res) {
  await app.ready()
  app.server.emit('request', req, res)
}