import Fastify from 'fastify';
import healthcheck from 'fastify-healthcheck';
import { getLatestScreenTimeSVG } from './services/screenTimeService.js';

const app = Fastify({
  logger: true,
});

app.register(healthcheck);

app.get('/', async (req, reply) => {
  try {
    const svg = await getLatestScreenTimeSVG();
    return reply.status(200).type('image/svg+xml').send(svg);
  } catch (error) {
    console.error(error);
    return reply.status(500).send('Internal Server Error');
  }
});

export default async function handler(req, res) {
  await app.ready();
  app.server.emit('request', req, res);
}
