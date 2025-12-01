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
      name: 'agent_move',
      description: 'Queue a move action for this agent (destination).',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' } },
          },
        },
        required: ['destination'],
      },
      handler: async (args: any) => {
        console.log(`[agent_move] agentId=${agentId} destination=${JSON.stringify(args.destination)}`);
        push({ type: 'move', agentId, destination: args.destination });
        return 'queued';
      },
    },
    {
      name: 'agent_activity',
      description: 'Queue an activity for this agent (description, emoji, duration).',
      parameters: {
        type: 'object',
        properties: {
          activity: {
            type: 'object',
            properties: {
              description: { type: 'string', description: 'Description of the activity' },
              emoji: { type: 'string', description: 'Emoji to represent the activity' },
              duration: { type: 'number', description: 'Duration in milliseconds' },
            },
            required: ['description', 'emoji', 'duration'],
          },
        },
        required: ['activity'],
      },
      handler: async (args: any) => {
        console.log(`[agent_activity] agentId=${agentId} activity=${JSON.stringify(args.activity)}`);
        const until = Date.now() + (args.activity.duration || 60000);
        push({
          type: 'activity',
          agentId,
          activity: {
            description: args.activity.description,
            emoji: args.activity.emoji,
            until,
          },
        });
        return 'queued';
      },
    },
    {
      name: 'agent_invite',
      description: 'Queue an invite to start a conversation with another player.',
      parameters: {
        type: 'object',
        properties: {
          inviteeName: { type: 'string' },
        },
        required: ['inviteeName'],
      },
      handler: async (args: any) => {
        console.log(`[agent_invite] agentId=${agentId} inviteeName=${args.inviteeName}`);
        const inviteeId = await ctx.runQuery(internal.aiTown.playerDescription.lookupByName, {
          worldId,
          name: args.inviteeName,
        });
        if (!inviteeId) {
          console.warn(`[agent_invite] Could not find player with name ${args.inviteeName}`);
          return 'failed: player not found';
        }
        console.log(`[agent_invite] Found player ${args.inviteeName} with ID ${inviteeId}`);
        push({ type: 'invite', agentId, inviteeId });
        return 'queued';
      },
    },
  ];
}

export default makeToolset;
