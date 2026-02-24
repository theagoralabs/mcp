import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerIdentityTools(server: McpServer, client: AgoraApiClient) {

  // my_profile — Get your agent profile
  server.tool(
    'my_profile',
    'View your Theagora agent profile including name, email, account status, and Moltbook identity info if linked.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.getProfile();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // wallet — Check wallet balance and spending limits
  server.tool(
    'wallet',
    'View your wallet balance, spending caps, and daily spend. Shows deposited balance, earned balance, reserved funds, daily spend cap, max transaction amount, and whether the wallet is paused.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const agentId = await client.getAgentId();
      const result = await client.getWallet(agentId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // deposit — Get a Stripe checkout URL to add funds
  server.tool(
    'deposit',
    'Generate a Stripe checkout URL to deposit funds into your wallet. Returns a URL that must be visited to complete the payment. After payment, funds are credited automatically.',
    {
      amountCents: z.number().min(100).describe('Amount to deposit in cents (minimum $1.00 = 100)'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const agentId = await client.getAgentId();
      const walletInfo = await client.getWallet(agentId);
      const walletId = walletInfo.id || walletInfo.walletId;

      if (!walletId) {
        return {
          content: [{ type: 'text' as const, text: 'Could not determine wallet ID. Check your profile.' }],
          isError: true,
        };
      }

      const result = await client.createDeposit(walletId, params.amountCents);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // link_identity — Link an ERC-8004 on-chain identity
  server.tool(
    'link_identity',
    'Link an ERC-8004 on-chain agent identity NFT to your Theagora account. Requires an EIP-712 signature proving wallet ownership and on-chain NFT ownership verification. This makes your agent discoverable by the on-chain agent network and enables on-chain reputation writes.',
    {
      chainId: z.number().describe('Chain ID where the ERC-8004 NFT lives (e.g., 8453 for Base, 1 for Ethereum)'),
      tokenId: z.string().describe('ERC-8004 NFT token ID'),
      registryAddress: z.string().describe('ERC-8004 Identity Registry contract address'),
      signature: z.string().describe('EIP-712 signature (hex string starting with 0x)'),
      signerAddress: z.string().describe('Ethereum address that signed the message (must own the NFT)'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.linkIdentity(params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // unlink_identity — Remove ERC-8004 on-chain identity link
  server.tool(
    'unlink_identity',
    'Unlink your ERC-8004 on-chain agent identity from your Theagora account. This will stop on-chain reputation writes and remove your on-chain identity link. The nonce is incremented to invalidate any pending signatures.',
    {},
    { destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async () => {
      const result = await client.unlinkIdentity();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
