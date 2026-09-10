import express, { Request, Response } from 'express';
import { modelRouter } from './router.js';
import { policyEngine } from './policy.js';
import { aiHealthMonitor } from './health.js';
import { ChatCompletionRequest, EmbeddingRequest } from './types.js';
import { AIBridgeError } from './errors.js';

export function createAIBridgeGateway() {
  const router = express.Router();
  router.use(express.json({ limit: '10mb' }));

  // CORS for sandboxed internal network containers
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // GET /health
  router.get('/health', async (req: Request, res: Response) => {
    const report = await aiHealthMonitor.getHealth();
    res.status(report.status === 'UNAVAILABLE' ? 503 : 200).json(report);
  });

  // GET /models & /v1/models (OpenAI compatible)
  router.get(['/models', '/v1/models'], async (req: Request, res: Response) => {
    const models = await modelRouter.getAvailableModels();
    res.json({
      object: 'list',
      data: models
    });
  });

  // POST /chat/completions & /v1/chat/completions (OpenAI compatible)
  router.post(['/chat/completions', '/v1/chat/completions'], async (req: Request, res: Response) => {
    try {
      const body = req.body as ChatCompletionRequest;
      const clientIp = req.ip || 'internal-container';

      if (!body.messages || !Array.isArray(body.messages)) {
        return res.status(400).json({ error: { message: "'messages' array is required in chat completions." } });
      }

      // Security policy check
      policyEngine.validateRequest(body, clientIp);

      // Handle streaming mode if requested
      if (body.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Route non-stream internally then yield in chunks for OpenAI clients
        const fullResponse = await modelRouter.routeCompletion(body);
        const text = fullResponse.choices[0]?.message?.content || '';
        const words = (typeof text === 'string' ? text : '').split(' ');

        for (let i = 0; i < words.length; i++) {
          const delta = i === 0 ? words[i] : ' ' + words[i];
          const chunk = {
            id: fullResponse.id,
            object: 'chat.completion.chunk',
            created: fullResponse.created,
            model: fullResponse.model,
            choices: [{ index: 0, delta: { content: delta }, finish_reason: null }]
          };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          await new Promise((r) => setTimeout(r, 15));
        }

        const finalChunk = {
          id: fullResponse.id,
          object: 'chat.completion.chunk',
          created: fullResponse.created,
          model: fullResponse.model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
        };
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const response = await modelRouter.routeCompletion(body);
      res.json(response);
    } catch (err: any) {
      if (err instanceof AIBridgeError) {
        return res.status(err.statusCode).json(err.toJSON());
      }
      res.status(500).json({ error: { message: err.message || 'Internal AI Bridge error' } });
    }
  });

  // POST /responses & /v1/responses (OpenAI Responses API compatibility alias)
  router.post(['/responses', '/v1/responses'], async (req: Request, res: Response) => {
    try {
      const { model = 'gemini-2.5-flash', input = '' } = req.body;
      const chatReq: ChatCompletionRequest = {
        model,
        messages: [{ role: 'user', content: input }]
      };
      const result = await modelRouter.routeCompletion(chatReq);
      res.json({
        id: result.id,
        object: 'response',
        output: result.choices[0]?.message?.content || '',
        model: result.model
      });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // POST /embeddings & /v1/embeddings (OpenAI compatible)
  router.post(['/embeddings', '/v1/embeddings'], async (req: Request, res: Response) => {
    try {
      const body = req.body as EmbeddingRequest;
      const result = await modelRouter.routeEmbedding(body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // GET /providers
  router.get('/providers', async (req: Request, res: Response) => {
    const health = await aiHealthMonitor.getHealth();
    res.json(health.activeProviders);
  });

  return router;
}
