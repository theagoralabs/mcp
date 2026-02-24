/**
 * AgoraApiClient - Thin HTTP wrapper for Theagora API
 *
 * One method per API endpoint. Auth header set from env var.
 * Agent ID cached after first GET /v1/me call.
 */

const DEFAULT_API_URL = 'https://api.theagoralabs.ai';

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export class AgoraApiClient {
  private baseUrl: string;
  private apiKey: string;
  private cachedAgentId: string | null = null;

  constructor() {
    const apiKey = process.env.THEAGORA_API_KEY;
    if (!apiKey) {
      throw new Error('THEAGORA_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = (process.env.THEAGORA_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  }

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = opts;

    let url = `${this.baseUrl}/v1${path}`;

    // Append query params
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Theagora-Source': 'mcp',
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API ${method} ${path} failed (${res.status}): ${errorBody}`);
    }

    return res.json() as Promise<T>;
  }

  /** Get agent ID (cached after first call) */
  async getAgentId(): Promise<string> {
    if (this.cachedAgentId) return this.cachedAgentId;
    const profile = await this.getProfile();
    const agentId = profile.agentId || profile.id;
    this.cachedAgentId = agentId;
    return agentId;
  }

  // === Identity ===

  async getProfile(): Promise<any> {
    return this.request('/me');
  }

  async linkIdentity(body: {
    chainId: number;
    tokenId: string;
    registryAddress: string;
    signature: string;
    signerAddress: string;
  }): Promise<any> {
    return this.request('/agents/link-identity', { method: 'POST', body });
  }

  async unlinkIdentity(): Promise<any> {
    return this.request('/agents/link-identity', { method: 'DELETE' });
  }

  async getWallet(agentId: string): Promise<any> {
    return this.request(`/policy-wallets/agent/${agentId}`);
  }

  async createDeposit(walletId: string, amountCents: number): Promise<any> {
    return this.request(`/policy-wallets/${walletId}/deposit`, {
      method: 'POST',
      body: { amountCents },
    });
  }

  // === Discovery ===

  async listFunctions(params?: {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    provider?: string;
  }): Promise<any> {
    return this.request('/functions', { params: params as any });
  }

  async getTrending(params?: { period?: string; limit?: number }): Promise<any> {
    return this.request('/functions/trending', { params: params as any });
  }

  async getReputation(agentId: string, params?: {
    functionId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    return this.request(`/agents/${agentId}/reputation`, { params: params as any });
  }

  // === Buying ===

  async createEscrow(body: {
    functionId: string;
    providerAgentId: string;
    agreedPriceCents?: number;
    input?: Record<string, any>;
    metadata?: Record<string, any>;
    waitForExecution?: boolean;
  }): Promise<any> {
    return this.request('/escrows', { method: 'POST', body });
  }

  async getEscrow(escrowId: string): Promise<any> {
    return this.request(`/escrows/${escrowId}`);
  }

  async getTransactions(): Promise<any> {
    return this.request('/transactions');
  }

  async getEscrowOutput(escrowId: string): Promise<any> {
    return this.request(`/escrows/${escrowId}/output`);
  }

  // === Selling ===

  async registerFunction(body: {
    fid: string;
    name: string;
    description: string;
    price: { unit: string; amount: number };
    qos?: { p95Ms?: number; maxTokens?: number };
    outputSchema?: object;
    inputSchema?: object;
    executionUrl?: string;
    category?: string;
    disputeTerms?: { arbiter?: string; evidenceFormat?: string; resolutionHours?: number };
  }): Promise<any> {
    return this.request('/functions', { method: 'POST', body });
  }

  async updateFunction(fid: string, body: {
    name?: string;
    description?: string;
    price?: { unit?: string; amount?: number };
    qos?: { p95Ms?: number; maxTokens?: number };
    outputSchema?: object;
    inputSchema?: object | null;
    isActive?: boolean;
    category?: string;
    disputeTerms?: { arbiter?: string; evidenceFormat?: string; resolutionHours?: number };
  }): Promise<any> {
    return this.request(`/functions/${fid}`, { method: 'PATCH', body });
  }

  async getMyFunctions(): Promise<any> {
    return this.request('/functions/my');
  }

  async pollJobs(): Promise<any> {
    return this.request('/jobs');
  }

  async submitDelivery(body: {
    escrowId: string;
    outputRef: string;
    outputHash: string;
    outputSchema?: string;
  }): Promise<any> {
    return this.request('/deliveries', { method: 'POST', body });
  }

  async getEarnedToday(): Promise<any> {
    return this.request('/transactions/earned-today');
  }

  // === Social (Invites) ===

  async createInvite(body: {
    providerEmail: string;
    functionId: string;
    agreedPriceCents: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.request('/invites', { method: 'POST', body });
  }

  async listInvites(): Promise<any> {
    return this.request('/invites');
  }

  async acceptInvite(token: string): Promise<any> {
    return this.request(`/invites/${token}/accept`, { method: 'POST' });
  }

  // === Market Data ===

  async getMarketDataFunction(functionId: string, params?: { window?: string }): Promise<any> {
    return this.request(`/market-data/functions/${functionId}`, { params: params as any });
  }

  async getMarketDataSummary(params?: { window?: string }): Promise<any> {
    return this.request('/market-data/summary', { params: params as any });
  }

  // === Exchange (Orders) ===

  async placeOrder(body: {
    side: 'BID' | 'ASK';
    functionId?: string;
    category?: string;
    description?: string;
    priceCents: number;
    minReputation?: number;
    maxLatencyMs?: number;
    expiresAt?: string;
    metadata?: Record<string, any>;
    input?: Record<string, any>;
    dryRun?: boolean;
  }): Promise<any> {
    return this.request('/orders', { method: 'POST', body });
  }

  async listOrders(params?: {
    side?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    return this.request('/orders', { params: params as any });
  }

  async cancelOrder(orderId: string): Promise<any> {
    return this.request(`/orders/${orderId}`, { method: 'DELETE' });
  }

  async getOrderBook(params?: {
    functionId?: string;
    category?: string;
  }): Promise<any> {
    return this.request('/orderbook', { params: params as any });
  }

  // === Trust (Disputes) ===

  async createDispute(body: { escrowId: string; reason: string }): Promise<any> {
    return this.request('/disputes', { method: 'POST', body });
  }

  async listDisputes(): Promise<any> {
    return this.request('/disputes');
  }

  // === Analytics ===

  async getProviderAnalytics(providerId: string, params?: { window?: string; functionId?: string }): Promise<any> {
    return this.request(`/analytics/providers/${providerId}`, { params: params as any });
  }

  async getFunctionAnalytics(functionId: string, params?: { window?: string }): Promise<any> {
    return this.request(`/analytics/functions/${functionId}`, { params: params as any });
  }
}
