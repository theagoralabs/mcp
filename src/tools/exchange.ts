import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerExchangeTools(server: McpServer, client: AgoraApiClient) {

  // place_order — Place a BID or ASK on the exchange
  server.tool(
    'place_order',
    'Place a BID or ASK on the exchange. Immediate match if counter-order exists.',
    {
      side: z.enum(['BID', 'ASK']).describe('BID to buy, ASK to sell'),
      functionId: z.string().optional().describe('Specific function ID (required for ASK, optional for BID)'),
      category: z.string().optional().describe('Service category for loose matching (e.g., "code-generation", "data-analysis")'),
      description: z.string().optional().describe('What you want (BID) or what you offer (ASK)'),
      priceCents: z.number().describe('Max price to pay (BID) or asking price (ASK) in cents'),
      minReputation: z.number().optional().describe('BID only: minimum provider reputation (0-1)'),
      maxLatencyMs: z.number().optional().describe('BID only: maximum acceptable P95 latency in ms'),
      expiresAt: z.string().optional().describe('ISO 8601 expiry time. Omit for good-til-cancelled'),
      metadata: z.record(z.any()).optional().describe('Optional metadata'),
      input: z.record(z.any()).optional().describe('Input data to pass to the function (e.g. {"text": "hello"}). For auto-executable functions, this is sent directly to the provider endpoint.'),
      dryRun: z.boolean().optional().describe('Simulate order without creating records or locking funds. Returns what WOULD match, including input validation results.'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.placeOrder({
        side: params.side,
        functionId: params.functionId,
        category: params.category,
        description: params.description,
        priceCents: params.priceCents,
        minReputation: params.minReputation,
        maxLatencyMs: params.maxLatencyMs,
        expiresAt: params.expiresAt,
        metadata: params.metadata,
        input: params.input,
        dryRun: params.dryRun,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // my_orders — View your orders
  server.tool(
    'my_orders',
    'View your open and recent orders on the exchange.',
    {
      side: z.enum(['BID', 'ASK']).optional().describe('Filter by side'),
      status: z.enum(['OPEN', 'FILLED', 'CANCELLED', 'EXPIRED']).optional().describe('Filter by status'),
      limit: z.number().optional().describe('Max results (default 50)'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.listOrders({
        side: params.side,
        status: params.status,
        limit: params.limit,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // cancel_order — Cancel an open order
  server.tool(
    'cancel_order',
    'Cancel one of your open orders on the exchange.',
    {
      orderId: z.string().describe('The order ID to cancel'),
    },
    { destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.cancelOrder(params.orderId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // view_orderbook — See current bids and asks
  server.tool(
    'view_orderbook',
    'See current bids and asks on the exchange, with spread information. Filter by function or category.',
    {
      functionId: z.string().optional().describe('Filter by specific function ID'),
      category: z.string().optional().describe('Filter by service category'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getOrderBook({
        functionId: params.functionId,
        category: params.category,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
