import Fastify from 'fastify'
import { sql } from '@vercel/postgres'
import { DateTime } from 'luxon'

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
  reply.header("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https://is1-ssl.mzstatic.com;");
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
  const svgWidth = 305;
  const svgHeight = data.length * barSpacing + iconPaddingTop + headerHeight + 5;
  const borderThickness = 1; // Increased border thickness
  const borderBoxRadius = 10; // Border radius for the border box
  const baseHue = Math.floor(Math.random() * 360);

  function getRandomPastelColor() {
    let color;
    let lightness;
    do {
      const baseLight = 210; // Base lightness for pastel colors
      const colorVariation = 45; // Variation in colors
      const r = baseLight + Math.floor(Math.random() * colorVariation);
      const g = baseLight + Math.floor(Math.random() * colorVariation);
      const b = baseLight + Math.floor(Math.random() * colorVariation);
      color = `rgb(${r}, ${g}, ${b})`;
      // Calculate lightness to ensure it's not too close to white
      lightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } while (lightness > 240); // Adjust threshold as needed
    return color;
  }
  
  function getRetroToneColor() {
    const retroColors = [
      "#FFD700", // Gold
      "#FF5733", // Persimmon
      "#C04000", // Mahogany
      "#FFC0CB", // Pink
      "#800080", // Purple
      "#008080", // Teal
      "#000080", // Navy
      "#808080", // Grey
      "#008000", // Green
      "#FF0000", // Red
    ];
    // Randomly select a color from the list
    const randomIndex = Math.floor(Math.random() * retroColors.length);
    return retroColors[randomIndex];
  }

  function getVibrantColor() {
    // Generate a color with high saturation and brightness
    const hue = Math.floor(Math.random() * 360); // Hue between 0 and 360
    const saturation = 75 + Math.floor(Math.random() * 25); // Saturation between 75% and 100%
    const lightness = 50 + Math.floor(Math.random() * 25); // Lightness between 50% and 75%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function getMonochromeTone(baseHue, variation = 40) {
    // Adjust the baseHue by a random amount within the variation range
    const hueVariation = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
    const adjustedHue = (baseHue + hueVariation + 360) % 360; // Ensure hue is within 0-359
    
    const lightness = 20 + Math.floor(Math.random() * 60); // Lightness between 20% and 80%
    const saturation = 50 + Math.floor(Math.random() * 50); // Saturation between 50% and 100%
    
    return `hsl(${adjustedHue}, ${saturation}%, ${lightness}%)`;
  }
  
  let svgContent = data.map((item, index) => {
    const barWidth = (item.usage_time / maxUsageTime) * maxBarWidth;
    const yPos = barSpacing * index + iconPaddingTop + headerHeight;
    const barColor = getMonochromeTone(baseHue);
    return `
      <rect x="45" y="${yPos + barPaddingTop}" width="${barWidth}" height="${barHeight}" rx="${barBorderRadius}" fill="${barColor}" />
      <text x="255" y="${yPos + textPaddingTop}" class="appText">${Math.round(item.usage_time / 60)} min</text>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <style>
        .appText { font: 13px sans-serif; font-weight: 600; fill: #808080; }
        .iconPlaceholder { fill: lightgray; }
        .header { font: bold 16px sans-serif; fill: #696969; }
        .borderBox { fill: none; stroke: #D3D3D3; stroke-width: ${borderThickness}; rx: ${borderBoxRadius}; }
      </style>
      <!-- Border Box -->
      <rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}" class="borderBox"/>
      <!-- Header -->
      <text x="15" y="${headerPaddingTop}" class="header">Yesterday's Screen Time</text>
      <!-- Placeholder for App Icons -->
      ${data.map((item, index) => {
        const yPos = barSpacing * index + iconPaddingTop + headerHeight;
        return `
          <rect x="15" y="${yPos}" width="${iconSize}" height="${iconSize}" rx="${iconBorderRadius}" class="iconPlaceholder"/>
          <image href="${item.icon_url}" x="15" y="${yPos}" width="${iconSize}" height="${iconSize}" />
        `;
      }).join('')}
      <!-- Horizontal Bars for App Usage -->
      ${svgContent}
    </svg>
  `;
}

app.addHook('onSend', (request, reply, payload, done) => {
  reply.header("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https://is1-ssl.mzstatic.com;");
  done();
});

export default async function handler(req, res) {
  await app.ready()
  app.server.emit('request', req, res)
}