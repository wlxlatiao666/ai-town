import { ActionCtx, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { GameId, playerId } from '../aiTown/ids';
import { makeToolset } from '../aiTown/llmTools';
import { chatCompletionWithFunctions } from '../util/llm';

export async function startIndependentThought(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  playerId: GameId<'players'>,
  agentId: GameId<'agents'>,
) {
  const { player, agent } = await ctx.runQuery(internal.agent.independent.queryIndependentThoughtData, {
    worldId,
    playerId,
    agentId,
  });

  const prompt = [
    `You are ${player.name}.`,
    `About you: ${agent.identity}`,
    `Your goals: ${agent.plan}`,
    `You are currently not in a conversation.`,
    `What would you like to do next? You can move to a location, perform an activity, or start a conversation with someone nearby.`,
  ];

  const collector: any[] = [];
  // passing player.id as otherPlayerId is a bit of a hack, but makeToolset requires it. 
  // We might need to refactor makeToolset if it heavily relies on otherPlayerId for "invite" logic context.
  // For now, let's see if we can pass a dummy or self.
  const tools = makeToolset(ctx, worldId, agent.id, player.id, collector);
  
  const { content } = await chatCompletionWithFunctions({
    messages: [
      {
        role: 'system',
        content: prompt.join('\n'),
      },
      {
        role: 'user',
        content: 'What is your next move?',
      },
    ],
    max_tokens: 300,
    toolset: tools,
  } as any);

  return { text: content, actions: collector };
}

import { v } from 'convex/values';

export const queryIndependentThoughtData = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`World ${args.worldId} not found`);
    }
    const player = world.players.find((p) => p.id === args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!playerDescription) {
      throw new Error(`Player description for ${args.playerId} not found`);
    }
    const agent = world.agents.find((a) => a.id === args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    const agentDescription = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', agent.id))
      .first();
    if (!agentDescription) {
      throw new Error(`Agent description for ${agent.id} not found`);
    }
    
    return {
      player: { name: playerDescription.name, ...player },
      agent: { identity: agentDescription.identity, plan: agentDescription.plan, ...agent },
    };
  },
});
