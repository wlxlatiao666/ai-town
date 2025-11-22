import { ActionCtx } from '../_generated/server';
import { internal, api } from '../_generated/api';
import type { FunctionTool } from '../util/llm';

// Create a toolset bound to the current ActionCtx so handlers can run Convex
// mutations/actions. Each handler returns a short string result.
export function makeToolset(ctx: ActionCtx): FunctionTool[] {
  return [
    {
      name: 'agent_send_message',
      description: 'Have an agent send a message in a conversation. Returns OK on success.',
      parameters: {
        type: 'object',
        properties: {
          worldId: { type: 'string' },
          agentId: { type: 'string' },
          playerId: { type: 'string' },
          conversationId: { type: 'string' },
          messageUuid: { type: 'string' },
          text: { type: 'string' },
          leaveConversation: { type: 'boolean' },
        },
        required: ['worldId', 'agentId', 'playerId', 'conversationId', 'messageUuid', 'text'],
      },
      handler: async (args: any) => {
        const { worldId, agentId, playerId, conversationId, messageUuid, text, leaveConversation } =
          args;
        await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
          worldId,
          conversationId,
          agentId,
          playerId,
          text,
          messageUuid,
          leaveConversation: !!leaveConversation,
          operationId: `llm-${Date.now()}`,
        } as any);
        return 'OK';
      },
    },
    {
      name: 'agent_remember_conversation',
      description: 'Ask an agent to summarize and store a conversation as a memory.',
      parameters: {
        type: 'object',
        properties: {
          worldId: { type: 'string' },
          agentId: { type: 'string' },
          playerId: { type: 'string' },
          conversationId: { type: 'string' },
        },
        required: ['worldId', 'agentId', 'playerId', 'conversationId'],
      },
      handler: async (args: any) => {
        const { worldId, agentId, playerId, conversationId } = args;
        await ctx.scheduler.runAfter(0, internal.aiTown.agentOperations.agentRememberConversation, {
          worldId,
          playerId,
          agentId,
          conversationId,
          operationId: `llm-${Date.now()}`,
        });
        return 'scheduled';
      },
    },
    {
      name: 'agent_generate_message',
      description: 'Ask an agent to generate a message (start|continue|leave) and send it.',
      parameters: {
        type: 'object',
        properties: {
          worldId: { type: 'string' },
          agentId: { type: 'string' },
          playerId: { type: 'string' },
          conversationId: { type: 'string' },
          otherPlayerId: { type: 'string' },
          type: { type: 'string', enum: ['start', 'continue', 'leave'] },
          messageUuid: { type: 'string' },
        },
        required: ['worldId', 'agentId', 'playerId', 'conversationId', 'type', 'messageUuid'],
      },
      handler: async (args: any) => {
        await ctx.scheduler.runAfter(0, internal.aiTown.agentOperations.agentGenerateMessage, args);
        return 'scheduled';
      },
    },
    {
      name: 'agent_finish_do_something',
      description: 'Finish an agent operation (move/invite/activity).',
      parameters: {
        type: 'object',
        properties: {
          worldId: { type: 'string' },
          agentId: { type: 'string' },
          destination: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' } },
          },
          invitee: { type: 'string' },
          activity: { type: 'object' },
        },
        required: ['worldId', 'agentId'],
      },
      handler: async (args: any) => {
        // Use existing sendInput path that agentOperations expects
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: `llm-${Date.now()}`,
            agentId: args.agentId,
            destination: args.destination,
            invitee: args.invitee,
            activity: args.activity,
          },
        } as any);
        return 'scheduled';
      },
    },
  ];
}

export default makeToolset;
