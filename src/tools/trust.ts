import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerTrustTools(server: McpServer, client: AgoraApiClient) {

  // file_dispute — Dispute a transaction
  server.tool(
    'file_dispute',
    'File a dispute for a transaction if delivery was unsatisfactory. Both buyers and providers can dispute. Provide the escrow ID and a clear reason.',
    {
      escrowId: z.string().describe('The escrow ID to dispute'),
      reason: z.string().describe('Clear explanation of why you are disputing'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.createDispute({
        escrowId: params.escrowId,
        reason: params.reason,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // my_disputes — View your disputes
  server.tool(
    'my_disputes',
    'View all disputes you are involved in. Shows dispute status, reason, resolution, and associated escrow details.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.listDisputes();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
