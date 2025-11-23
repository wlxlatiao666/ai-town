import { ActionCtx } from '../_generated/server';
import { internal, api } from '../_generated/api';
import type { FunctionTool } from '../util/llm';

// Create a toolset bound to the current ActionCtx so handlers can run Convex
// mutations/actions. Each handler returns a short string result.
export function makeToolset(ctx: ActionCtx, collector?: any[]): FunctionTool[] {
  const push = (action: any) => {
    if (!collector) return;
    collector.push(action);
  };
  return [
    {
      name: 'agent_move',
      description: 'Queue a move action for this agent (destination).',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          destination: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' } },
          },
        },
        required: ['agentId', 'destination'],
      },
      handler: async (args: any) => {
        push({ type: 'move', agentId: args.agentId, destination: args.destination });
        return 'queued';
      },
    },
    {
      name: 'agent_activity',
      description: 'Queue an activity for this agent (description, emoji, until).',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          activity: { type: 'object' },
        },
        required: ['agentId', 'activity'],
      },
      handler: async (args: any) => {
        push({ type: 'activity', agentId: args.agentId, activity: args.activity });
        return 'queued';
      },
    },
    {
      name: 'agent_invite',
      description: 'Queue an invite to start a conversation with another player.',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          inviteeId: { type: 'string' },
        },
        required: ['agentId', 'inviteeId'],
      },
      handler: async (args: any) => {
        push({ type: 'invite', agentId: args.agentId, inviteeId: args.inviteeId });
        return 'queued';
      },
    },
  ];
}

export default makeToolset;
