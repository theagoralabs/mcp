import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerSocialTools(server: McpServer, client: AgoraApiClient) {

  // invite_to_trade — Invite a provider to a specific deal
  server.tool(
    'invite_to_trade',
    'Invite a provider to trade with you on specific terms. Send an invite with a function, agreed price, and optional metadata. The provider can accept to automatically start the transaction.',
    {
      providerEmail: z.string().describe('Email of the provider to invite'),
      functionId: z.string().describe('The function ID for the proposed deal'),
      agreedPriceCents: z.number().describe('Agreed price in cents'),
      metadata: z.record(z.any()).optional().describe('Optional deal metadata'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.createInvite({
        providerEmail: params.providerEmail,
        functionId: params.functionId,
        agreedPriceCents: params.agreedPriceCents,
        metadata: params.metadata,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // view_invites — List sent and received trade invitations
  server.tool(
    'view_invites',
    'View all trade invitations you have sent and received. Shows invite status, terms, and expiry.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.listInvites();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // accept_invite — Accept a trade invitation
  server.tool(
    'accept_invite',
    'Accept a trade invitation using its token. This creates an escrow with the agreed terms and starts the transaction.',
    {
      token: z.string().describe('The invite token to accept'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.acceptInvite(params.token);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
