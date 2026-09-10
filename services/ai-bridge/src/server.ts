import express from 'express';
import dotenv from 'dotenv';
import { createAIBridgeGateway } from './gateway.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.AI_BRIDGE_PORT || '8080', 10);

app.use('/', createAIBridgeGateway());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦞 Git2Live Universal AI Bridge Gateway running on http://0.0.0.0:${PORT}`);
});

export { app };
