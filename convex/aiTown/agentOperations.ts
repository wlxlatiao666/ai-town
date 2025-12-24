import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { WorldMap, serializedWorldMap } from './worldMap';
import { rememberConversation } from '../agent/memory';
import { GameId, agentId, conversationId, playerId } from './ids';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';
import { serializedAgent } from './agent';
import { ACTIVITIES, ACTIVITY_COOLDOWN, CONVERSATION_COOLDOWN } from '../constants';
import { api, internal } from '../_generated/api';
import { sleep } from '../util/sleep';
import { serializedPlayer } from './player';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.worldId,
      args.agentId as GameId<'agents'>,
      args.playerId as GameId<'players'>,
      args.conversationId as GameId<'conversations'>,
    );
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishRememberConversation',
      args: {
        agentId: args.agentId,
        operationId: args.operationId,
      },
    });
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    // Trigger trade_begin to collect both participants' resources before
    // invoking the LLM completion function.
    try {
      const tradeInfo = await ctx.runQuery(internal.aiTown.agentOperations.tradeBegin, {
        worldId: args.worldId as any,
        playerId: args.playerId as any,
        otherPlayerId: args.otherPlayerId as any,
      } as any);
      console.log('tradeBegin info:', JSON.stringify(tradeInfo));
    } catch (e) {
      console.error('Error running tradeBegin query', e);
    }

    const result = await completionFn(
      ctx,
      args.worldId,
      args.conversationId as GameId<'conversations'>,
      args.playerId as GameId<'players'>,
      args.otherPlayerId as GameId<'players'>,
    );
    const text = typeof result === 'string' ? result : result.text;
    const queuedActions = result && typeof result === 'object' ? result.actions : undefined;

    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
      queuedActions,
    } as any);
  },
});

export const tradeBegin = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId: v.id('players'),
    otherPlayerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const worldDoc = await ctx.db.get(args.worldId);
    if (!worldDoc) {
      throw new Error(`No world found: ${args.worldId}`);
    }
    const agents = worldDoc.agents || [];
    const a1 = agents.find((a: any) => a.playerId === args.playerId);
    const a2 = agents.find((a: any) => a.playerId === args.otherPlayerId);
    const result = {
      agentA: a1
        ? { id: a1.id, gold: a1.gold ?? 0, wood: a1.wood ?? 0, food: a1.food ?? 0 }
        : null,
      agentB: a2
        ? { id: a2.id, gold: a2.gold ?? 0, wood: a2.wood ?? 0, food: a2.food ?? 0 }
        : null,
    };
    // Optionally log or persist trade-begin event here.
    console.log('tradeBegin', result);
    return result;
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: v.object(serializedPlayer),
    agent: v.object(serializedAgent),
    map: v.object(serializedWorldMap),
    otherFreePlayers: v.array(v.object(serializedPlayer)),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { player, agent } = args;
    const map = new WorldMap(args.map);
    const now = Date.now();
    // Don't try to start a new conversation if we were just in one.
    const justLeftConversation =
      agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN;
    // Don't try again if we recently tried to find someone to invite.
    const recentlyAttemptedInvite =
      agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;
    const recentActivity = player.activity && now < player.activity.until + ACTIVITY_COOLDOWN;
    // Decide whether to do an activity or wander somewhere.
    if (!player.pathfinding) {
      if (recentActivity || justLeftConversation) {
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: wanderDestination(map),
          },
        });
        return;
      } else {
        // Decide activity based on current gold using helper.
        const chosen = chooseActivity(agent.gold ?? 0, agent.wood ?? 0, agent.food ?? 0, agent.id);
        if (!chosen) {
          // No valid activities — wander instead.
          await sleep(Math.random() * 1000);
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: wanderDestination(map),
            },
          });
          return;
        }
        const activity = chosen;
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            activity: {
              description: activity.description,
              emoji: activity.emoji,
              gold: activity.gold,
              wood: activity.wood,
              food: activity.food,
              until: Date.now() + activity.duration,
            },
          },
        });
        return;
      }
    }
    const invitee =
      justLeftConversation || recentlyAttemptedInvite
        ? undefined
        : await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
            now,
            worldId: args.worldId,
            player: args.player,
            otherFreePlayers: args.otherFreePlayers,
          });

    // TODO: We hit a lot of OCC errors on sending inputs in this file. It's
    // easy for them to get scheduled at the same time and line up in time.
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishDoSomething',
      args: {
        operationId: args.operationId,
        agentId: args.agent.id,
        invitee,
      },
    });
  },
});

function wanderDestination(worldMap: WorldMap) {
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (worldMap.width - 2)),
    y: 1 + Math.floor(Math.random() * (worldMap.height - 2)),
  };
}

// Helper: choose an activity based on current gold.
function chooseActivity(currentGold: number, currentWood: number, currentFood: number, agentId: any) {
  // Filter out activities that would make any tracked resource negative.
  const valid = ACTIVITIES.filter((a) => {
    const g = a.gold ?? 0;
    const w = a.wood ?? 0;
    const f = a.food ?? 0;
    if (g < 0 && currentGold + g < 0) return false;
    return true;
  });
  
  //TODO: 根据具体的资源情况调整选择策略

  

  if (valid.length === 0) return null;
  // Currently simple strategy: choose uniformly among valid activities.
  return valid[Math.floor(Math.random() * valid.length)];
}
