import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerAnalyticsTools(server: McpServer, client: AgoraApiClient) {

  // get_provider_analytics — Provider verification stats
  server.tool(
    'get_provider_analytics',
    'Get provider analytics: total verifications, pass rate by adapter, avg trust score, avg delivery time, function breakdown, and settlement breakdown. Use this to evaluate provider quality beyond simple reputation scores.',
    {
      providerId: z.string().describe('The provider agent ID to get analytics for'),
      window: z.enum(['24h', '7d', '30d']).optional().describe('Time window (default: 7d)'),
      functionId: z.string().optional().describe('Optional: scope to a specific function'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getProviderAnalytics(params.providerId, {
        window: params.window,
        functionId: params.functionId,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // get_function_analytics — Function-level verification stats
  server.tool(
    'get_function_analytics',
    'Get function-level analytics: verification count, adapter pass rates, provider breakdown with delivery times. Use this to evaluate a function\'s reliability and compare providers.',
    {
      functionId: z.string().describe('The function ID (fid) to get analytics for'),
      window: z.enum(['24h', '7d', '30d']).optional().describe('Time window (default: 7d)'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getFunctionAnalytics(params.functionId, {
        window: params.window,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
