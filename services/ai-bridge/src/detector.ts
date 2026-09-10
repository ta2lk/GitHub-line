import { AIRequirements, AICapability } from './types.js';

export interface FileEntry {
  path: string;
  content: string;
}

export class AIDetector {
  /**
   * Performs static analysis across manifests and source code files
   */
  public detect(files: Map<string, string> | FileEntry[]): AIRequirements {
    const fileList: FileEntry[] = Array.isArray(files) 
      ? files 
      : Array.from(files.entries()).map(([path, content]) => ({ path, content }));

    const detectedProviders = new Set<string>();
    const detectedSDKs = new Set<string>();
    const detectedCapabilities = new Set<AICapability>();
    const detectedEnvVars = new Set<string>();
    const detectedModels = new Set<string>();

    let confidencePoints = 0;

    for (const file of fileList) {
      const lowerContent = file.content.toLowerCase();
      const path = file.path.toLowerCase();

      // 1. OpenAI Detection
      if (
        lowerContent.includes('openai') ||
        lowerContent.includes('gpt-4') ||
        lowerContent.includes('text-embedding-3') ||
        lowerContent.includes('api.openai.com')
      ) {
        detectedProviders.add('openai');
        detectedSDKs.add('openai');
        detectedCapabilities.add('chat');
        detectedEnvVars.add('OPENAI_API_KEY');
        confidencePoints += 25;
      }

      // 2. Gemini / Google GenAI Detection
      if (
        lowerContent.includes('@google/genai') ||
        lowerContent.includes('@google/generative-ai') ||
        lowerContent.includes('google-generativeai') ||
        lowerContent.includes('google.genai') ||
        lowerContent.includes('gemini-')
      ) {
        detectedProviders.add('gemini');
        detectedSDKs.add('gemini');
        detectedCapabilities.add('chat');
        detectedEnvVars.add('GEMINI_API_KEY');
        confidencePoints += 30;
      }

      // 3. Anthropic Claude Detection
      if (
        lowerContent.includes('@anthropic-ai/sdk') ||
        lowerContent.includes('anthropic') ||
        lowerContent.includes('claude-3') ||
        lowerContent.includes('anthropic_api_key')
      ) {
        detectedProviders.add('anthropic');
        detectedSDKs.add('anthropic');
        detectedCapabilities.add('chat');
        detectedEnvVars.add('ANTHROPIC_API_KEY');
        confidencePoints += 25;
      }

      // 4. Ollama Detection
      if (
        lowerContent.includes('ollama') ||
        lowerContent.includes('localhost:11434') ||
        lowerContent.includes('ollama/run')
      ) {
        detectedProviders.add('ollama');
        detectedSDKs.add('ollama');
        detectedCapabilities.add('chat');
        detectedEnvVars.add('OLLAMA_URL');
        confidencePoints += 20;
      }

      // 5. LangChain Detection
      if (
        lowerContent.includes('langchain') ||
        lowerContent.includes('@langchain/') ||
        lowerContent.includes('langgraph')
      ) {
        detectedSDKs.add('langchain');
        detectedCapabilities.add('chat');
        detectedCapabilities.add('reasoning');
        confidencePoints += 25;
      }

      // 6. LlamaIndex Detection
      if (
        lowerContent.includes('llamaindex') ||
        lowerContent.includes('llama-index') ||
        lowerContent.includes('rag')
      ) {
        detectedSDKs.add('llamaindex');
        detectedCapabilities.add('embeddings');
        detectedCapabilities.add('chat');
        confidencePoints += 25;
      }

      // 7. Vercel AI SDK Detection
      if (
        lowerContent.includes('@ai-sdk/') ||
        lowerContent.includes('ai/react') ||
        lowerContent.includes('streamtext')
      ) {
        detectedSDKs.add('vercel-ai');
        detectedCapabilities.add('chat');
        confidencePoints += 25;
      }

      // 8. AutoGen & CrewAI Detection
      if (lowerContent.includes('autogen') || lowerContent.includes('pyautogen')) {
        detectedSDKs.add('autogen');
        detectedCapabilities.add('reasoning');
        confidencePoints += 25;
      }
      if (lowerContent.includes('crewai') || lowerContent.includes('crew_ai')) {
        detectedSDKs.add('crewai');
        detectedCapabilities.add('reasoning');
        confidencePoints += 25;
      }

      // 9. MCP (Model Context Protocol)
      if (
        lowerContent.includes('@modelcontextprotocol') ||
        lowerContent.includes('mcp.server') ||
        lowerContent.includes('model-context-protocol')
      ) {
        detectedSDKs.add('mcp');
        detectedCapabilities.add('reasoning');
        confidencePoints += 25;
      }

      // 10. Groq / Together / OpenRouter / HuggingFace
      if (lowerContent.includes('groq') || lowerContent.includes('groq-sdk')) {
        detectedProviders.add('groq');
        detectedSDKs.add('groq');
        detectedEnvVars.add('GROQ_API_KEY');
        confidencePoints += 20;
      }
      if (lowerContent.includes('together') || lowerContent.includes('together-ai')) {
        detectedProviders.add('together');
        detectedSDKs.add('together');
        detectedEnvVars.add('TOGETHER_API_KEY');
        confidencePoints += 20;
      }
      if (lowerContent.includes('openrouter')) {
        detectedProviders.add('openrouter');
        detectedSDKs.add('openrouter');
        detectedEnvVars.add('OPENROUTER_API_KEY');
        confidencePoints += 20;
      }
      if (lowerContent.includes('huggingface') || lowerContent.includes('@huggingface/inference') || lowerContent.includes('transformers')) {
        detectedProviders.add('huggingface');
        detectedSDKs.add('huggingface');
        confidencePoints += 20;
      }

      // Model extraction heuristics
      const modelMatches = file.content.match(/(?:gpt-4o(?:-mini)?|gpt-3\.5-turbo|gemini-(?:3\.8|3\.1|1\.5)-(?:flash|pro)|claude-3-5-[a-z]+|llama3(?:\.[0-9])?|qwen[0-9.]*)/gi);
      if (modelMatches) {
        modelMatches.forEach((m) => detectedModels.add(m.toLowerCase()));
      }

      // Capability checks
      if (lowerContent.includes('embed') || lowerContent.includes('vector') || lowerContent.includes('cosine')) {
        detectedCapabilities.add('embeddings');
      }
      if (lowerContent.includes('vision') || lowerContent.includes('image_url') || lowerContent.includes('multimodal')) {
        detectedCapabilities.add('vision');
      }
    }

    const isRequired = detectedProviders.size > 0 || detectedSDKs.size > 0;
    const confidence = isRequired ? Math.min(0.99, Math.max(0.60, confidencePoints / 100)) : 0;

    return {
      required: isRequired,
      providers: Array.from(detectedProviders),
      sdk: Array.from(detectedSDKs),
      capabilities: Array.from(detectedCapabilities),
      environmentVariables: Array.from(detectedEnvVars),
      models: Array.from(detectedModels),
      confidence
    };
  }
}

export const aiDetector = new AIDetector();
