import { ActionCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { internal, api } from '../_generated/api';
import type { FunctionTool } from '../util/llm';

// Create a toolset bound to the current ActionCtx so handlers can run Convex
// mutations/actions. Each handler returns a short string result.
export function makeToolset(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  agentId: string,
  otherPlayerId: string,
  collector?: any[],
): FunctionTool[] {
  const push = (action: any) => {
    if (!collector) return;
    collector.push(action);
  };
  return [
    {
      name: 'agent_trade',
      description: 'Propose a trade with the other player in the conversation.',
      parameters: {
        type: 'object',
        properties: {
          pricewood: { type: 'number', description: 'Price per unit of wood. Must be >= 0.' },
          tradewood: {
            type: 'number',
            description:
              'Amount of wood to trade. Positive to BUY from other, negative to SELL to other.',
          },
          pricefood: { type: 'number', description: 'Price per unit of food. Must be >= 0.' },
          tradefood: {
            type: 'number',
            description:
              'Amount of food to trade. Positive to BUY from other, negative to SELL to other.',
          },
        },
        required: ['pricewood', 'tradewood', 'pricefood', 'tradefood'],
      },
      handler: async (args: any) => {
        console.log(`[agent_trade] agentId=${agentId} args=${JSON.stringify(args)}`);
        push({
          type: 'trade',
          agentId,
          pricewood: args.pricewood,
          tradewood: args.tradewood,
          pricefood: args.pricefood,
          tradefood: args.tradefood,
        });
        return 'queued';
      },
    },
  ];
}

export default makeToolset;
