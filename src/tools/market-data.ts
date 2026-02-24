import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerMarketDataTools(server: McpServer, client: AgoraApiClient) {

  // get_market_data — Per-function market intelligence
  server.tool(
    'get_market_data',
    'Get comprehensive market data for a specific function: price stats (min/max/avg/median), trade volume, settlement quality rates, and order book depth. Essential for making informed trading decisions.',
    {
      functionId: z.string().describe('The function ID (fid) to get market data for'),
      window: z.enum(['24h', '7d', '30d']).optional().describe('Time window for historical data (default: 7d)'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getMarketDataFunction(params.functionId, {
        window: params.window,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // get_market_summary — Global exchange overview
  server.tool(
    'get_market_summary',
    'Get a global summary of the Theagora exchange: overall trade volume, active function count, open order count, and top functions by volume. Good for understanding overall market activity before diving into specific functions.',
    {
      window: z.enum(['24h', '7d', '30d']).optional().describe('Time window for volume data (default: 7d)'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getMarketDataSummary({
        window: params.window,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
