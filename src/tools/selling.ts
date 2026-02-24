import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgoraApiClient } from '../client.js';

export function registerSellingTools(server: McpServer, client: AgoraApiClient) {

  // register_function — List a new function for sale
  server.tool(
    'register_function',
    'Register a new function on the Theagora marketplace. Provide pricing, QoS guarantees, and an output schema. Other agents will be able to discover and purchase your function.',
    {
      fid: z.string().describe('Unique function identifier (e.g., "my-cool-function")'),
      name: z.string().describe('Human-readable function name'),
      description: z.string().describe('What this function does'),
      priceUnit: z.string().describe('Price unit (e.g., "cents")'),
      priceAmount: z.number().describe('Price amount per call'),
      qosP95Ms: z.number().optional().describe('P95 latency guarantee in milliseconds'),
      qosMaxTokens: z.number().optional().describe('Max tokens per response'),
      outputSchema: z.record(z.any()).optional().describe('JSON Schema for output validation'),
      inputSchema: z.record(z.any()).optional().describe('JSON Schema for input validation. BID inputs will be validated against this schema before matching and auto-execution.'),
      executionUrl: z.string().optional().describe('Webhook URL for automated execution'),
      category: z.string().optional().describe('Service category (e.g., "code-generation", "data-analysis")'),
      disputeArbiter: z.string().optional().describe('Dispute arbiter (default: "theagora-platform")'),
      disputeEvidenceFormat: z.string().optional().describe('Evidence format for disputes (default: "delivery-hash-and-verification-result")'),
      disputeResolutionHours: z.number().optional().describe('Hours to resolve disputes (default: 48)'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const disputeTerms = (params.disputeArbiter || params.disputeEvidenceFormat || params.disputeResolutionHours)
        ? { arbiter: params.disputeArbiter, evidenceFormat: params.disputeEvidenceFormat, resolutionHours: params.disputeResolutionHours }
        : undefined;
      const result = await client.registerFunction({
        fid: params.fid,
        name: params.name,
        description: params.description,
        price: { unit: params.priceUnit, amount: params.priceAmount },
        qos: {
          p95Ms: params.qosP95Ms,
          maxTokens: params.qosMaxTokens,
        },
        outputSchema: params.outputSchema,
        inputSchema: params.inputSchema,
        executionUrl: params.executionUrl,
        category: params.category,
        disputeTerms,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // update_function — Modify a function listing or deactivate it
  server.tool(
    'update_function',
    'Update your function listing. Change name, description, pricing, QoS, or deactivate it by setting isActive to false. Only the owning provider can update a function.',
    {
      fid: z.string().describe('The function ID to update'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      priceUnit: z.string().optional().describe('New price unit'),
      priceAmount: z.number().optional().describe('New price amount'),
      qosP95Ms: z.number().optional().describe('New P95 latency guarantee'),
      qosMaxTokens: z.number().optional().describe('New max tokens'),
      outputSchema: z.record(z.any()).optional().describe('New output schema'),
      inputSchema: z.record(z.any()).optional().describe('New input schema for BID input validation'),
      isActive: z.boolean().optional().describe('Set to false to deactivate'),
      category: z.string().optional().describe('Service category (e.g., "code-generation", "data-analysis")'),
      disputeArbiter: z.string().optional().describe('Dispute arbiter (default: "theagora-platform")'),
      disputeEvidenceFormat: z.string().optional().describe('Evidence format for disputes'),
      disputeResolutionHours: z.number().optional().describe('Hours to resolve disputes'),
    },
    { destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async (params) => {
      const body: any = {};
      if (params.name !== undefined) body.name = params.name;
      if (params.description !== undefined) body.description = params.description;
      if (params.priceUnit !== undefined || params.priceAmount !== undefined) {
        body.price = {};
        if (params.priceUnit !== undefined) body.price.unit = params.priceUnit;
        if (params.priceAmount !== undefined) body.price.amount = params.priceAmount;
      }
      if (params.qosP95Ms !== undefined || params.qosMaxTokens !== undefined) {
        body.qos = {};
        if (params.qosP95Ms !== undefined) body.qos.p95Ms = params.qosP95Ms;
        if (params.qosMaxTokens !== undefined) body.qos.maxTokens = params.qosMaxTokens;
      }
      if (params.outputSchema !== undefined) body.outputSchema = params.outputSchema;
      if (params.inputSchema !== undefined) body.inputSchema = params.inputSchema;
      if (params.isActive !== undefined) body.isActive = params.isActive;
      if (params.category !== undefined) body.category = params.category;
      if (params.disputeArbiter !== undefined || params.disputeEvidenceFormat !== undefined || params.disputeResolutionHours !== undefined) {
        body.disputeTerms = {};
        if (params.disputeArbiter !== undefined) body.disputeTerms.arbiter = params.disputeArbiter;
        if (params.disputeEvidenceFormat !== undefined) body.disputeTerms.evidenceFormat = params.disputeEvidenceFormat;
        if (params.disputeResolutionHours !== undefined) body.disputeTerms.resolutionHours = params.disputeResolutionHours;
      }

      const result = await client.updateFunction(params.fid, body);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // my_functions — View your function listings
  server.tool(
    'my_functions',
    'View all functions you have registered on the marketplace. Shows active listings with pricing, QoS, and registration details.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.getMyFunctions();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // poll_jobs — Check for pending work
  server.tool(
    'poll_jobs',
    'Check for pending jobs assigned to you as a provider. Returns escrows in HELD state where you need to deliver. Use this to find work that buyers have purchased from you.',
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.pollJobs();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // submit_delivery — Deliver work for an escrow
  server.tool(
    'submit_delivery',
    'Submit a delivery for a pending escrow. Include the output reference (URL or content), SHA-256 hash for verification, and optional schema. The system will verify your delivery and settle funds automatically.',
    {
      escrowId: z.string().describe('The escrow ID to deliver against'),
      outputRef: z.string().describe('Output reference (URL or inline content)'),
      outputHash: z.string().describe('SHA-256 hash of the output for verification'),
      outputSchema: z.string().optional().describe('JSON Schema string for output validation'),
    },
    { destructiveHint: true, idempotentHint: false, openWorldHint: true },
    async (params) => {
      const result = await client.submitDelivery({
        escrowId: params.escrowId,
        outputRef: params.outputRef,
        outputHash: params.outputHash,
        outputSchema: params.outputSchema,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // my_sales — View today's earnings
  server.tool(
    'my_sales',
    "Check how much you've earned today as a provider. Shows settled transactions and total revenue for the current day.",
    {},
    { readOnlyHint: true, openWorldHint: true },
    async () => {
      const result = await client.getEarnedToday();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
