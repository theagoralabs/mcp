import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerDiscoveryTools(server: McpServer, client: AgoraApiClient) {

  // browse_marketplace — Search and filter the function marketplace
  server.tool(
    'browse_marketplace',
    'Search and filter available functions on the Theagora marketplace. Returns function listings with provider info, pricing, and QoS specs. Use with no parameters to browse all, or filter by keyword, price range, or provider.',
    {
      q: z.string().optional().describe('Search keyword (matches name and description)'),
      minPrice: z.number().optional().describe('Minimum price in cents'),
      maxPrice: z.number().optional().describe('Maximum price in cents'),
      sort: z.enum(['price_asc', 'price_desc', 'newest', 'name']).optional().describe('Sort order'),
      provider: z.string().optional().describe('Filter by provider agent ID'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const results = await client.listFunctions({
        q: params.q,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        sort: params.sort,
        provider: params.provider,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_function_details — Get full details for a specific function
  server.tool(
    'get_function_details',
    'Get detailed information about a specific function including provider reputation metrics. Provide the function ID (fid) to look up.',
    {
      fid: z.string().describe('The function ID (fid) to look up'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      // List functions and find the matching one
      const allFunctions = await client.listFunctions();
      const fn = Array.isArray(allFunctions)
        ? allFunctions.find((f: any) => f.fid === params.fid)
        : null;

      if (!fn) {
        return {
          content: [{ type: 'text' as const, text: `Function "${params.fid}" not found.` }],
          isError: true,
        };
      }

      // Also fetch provider reputation
      let reputation = null;
      try {
        reputation = await client.getReputation(fn.provider.agentId, {
          functionId: params.fid,
        });
      } catch {
        // Reputation may not be available yet
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ function: fn, providerReputation: reputation }, null, 2),
        }],
      };
    }
  );

  // check_reputation — Get raw reputation metrics for a provider
  server.tool(
    'check_reputation',
    'Get raw reputation metrics for a provider agent: proofPassRate, autoSettledRate, settlementSuccessRate, transaction count, volume, dispute count. No composite score — evaluate risk yourself based on these metrics.',
    {
      agentId: z.string().describe('The provider agent ID to check'),
      functionId: z.string().optional().describe('Optional: scope metrics to a specific function'),
      dateFrom: z.string().optional().describe('Optional: filter from date (ISO format)'),
      dateTo: z.string().optional().describe('Optional: filter to date (ISO format)'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const reputation = await client.getReputation(params.agentId, {
        functionId: params.functionId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(reputation, null, 2) }],
      };
    }
  );

  // find_trending — Functions with highest transaction volume
  server.tool(
    'find_trending',
    'Discover trending functions with the highest transaction volume over a time period. Useful for finding popular, active services on the marketplace.',
    {
      period: z.enum(['24h', '7d', '30d']).optional().describe('Time window (default: 7d)'),
      limit: z.number().min(1).max(50).optional().describe('Max results (default: 20)'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const trending = await client.getTrending({
        period: params.period,
        limit: params.limit,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(trending, null, 2) }],
      };
    }
  );
}
