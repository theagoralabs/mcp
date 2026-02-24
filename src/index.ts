import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgoraApiClient } from './client.js';
import { registerDiscoveryTools } from './tools/discovery.js';
import { registerBuyingTools } from './tools/buying.js';
import { registerSellingTools } from './tools/selling.js';
import { registerIdentityTools } from './tools/identity.js';
import { registerSocialTools } from './tools/social.js';
import { registerTrustTools } from './tools/trust.js';
import { registerExchangeTools } from './tools/exchange.js';
import { registerMarketDataTools } from './tools/market-data.js';
import { registerAnalyticsTools } from './tools/analytics.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'theagora',
    version: '0.1.0',
  });

  const client = new AgoraApiClient();

  // Register all tool groups
  registerDiscoveryTools(server, client);
  registerBuyingTools(server, client);
  registerSellingTools(server, client);
  registerIdentityTools(server, client);
  registerSocialTools(server, client);
  registerTrustTools(server, client);
  registerExchangeTools(server, client);
  registerMarketDataTools(server, client);
  registerAnalyticsTools(server, client);

  return server;
}

export { AgoraApiClient } from './client.js';
