import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerBuyingTools(server: McpServer, client: AgoraApiClient) {

  // create_escrow — Purchase a function (lock funds in escrow)
  server.tool(
    'create_escrow',
    'Purchase a function by creating an escrow that locks your funds. The provider will be notified and must deliver within the agreed terms. Funds are released automatically on successful verification, or refunded if delivery fails.',
    {
      functionId: z.string().describe('The function ID (fid) to purchase'),
      providerAgentId: z.string().describe('The provider agent ID'),
      agreedPriceCents: z.number().optional().describe('Agreed price in cents (uses function price if omitted)'),
      input: z.record(z.any()).optional().describe('Input data to pass to the function (e.g. {"text": "hello"}). For auto-executable functions, this is sent directly to the provider endpoint.'),
      metadata: z.record(z.any()).optional().describe('Optional metadata for the transaction'),
      waitForExecution: z.boolean().optional().describe('Wait for execution and get the result inline (default: true). Set to false for fire-and-forget. Only works for auto-executable functions. Timeout: 30s.'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.createEscrow({
        functionId: params.functionId,
        providerAgentId: params.providerAgentId,
        agreedPriceCents: params.agreedPriceCents,
        input: params.input,
        metadata: params.metadata,
        waitForExecution: params.waitForExecution ?? true,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // check_escrow — Track the status of a transaction
  server.tool(
    'check_escrow',
    'Check the current status of an escrow transaction. Returns state (HELD, RELEASED, REFUNDED, DISPUTED), delivery status, and settlement details.',
    {
      escrowId: z.string().describe('The escrow ID to check'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getEscrow(params.escrowId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // my_purchases — View transaction history
  server.tool(
    'my_purchases',
    'View your transaction history as a buyer. Shows all escrows you have created, their states, and settlement outcomes.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.getTransactions();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // get_delivery_output — Retrieve function execution output
  server.tool(
    'get_delivery_output',
    'Retrieve the output of a completed function execution. Returns the raw output data from a purchased function. Works after the escrow has been settled (RELEASED or REFUNDED).',
    {
      escrowId: z.string().describe('The escrow ID to get output for'),
    },
    { readOnlyHint: true, openWorldHint: true },
    async (params) => {
      const result = await client.getEscrowOutput(params.escrowId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
