import { v } from 'convex/values';
import { agentId, conversationId, parseGameId } from './ids';
import { Player, activity } from './player';
import { Conversation, conversationInputs } from './conversation';
import { movePlayer } from './movement';
import { inputHandler } from './inputHandler';
import { point } from '../util/types';
import { Descriptions } from '../../data/characters';
import { AgentDescription } from './agentDescription';
import { Agent } from './agent';

export const agentInputs = {
  finishRememberConversation: inputHandler({
    args: {
      operationId: v.string(),
      agentId,
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} isn't remembering ${args.operationId}`);
      } else {
        delete agent.inProgressOperation;
        delete agent.toRemember;
      }
      return null;
    },
  }),
  finishDoIndependentThought: inputHandler({
    args: {
      operationId: v.string(),
      agentId: v.id('agents'),
      queuedActions: v.optional(v.array(v.any())),
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      // If we're not doing the operation we expect, just return.
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} didn't have ${args.operationId} in progress`);
        return null;
      }
      delete agent.inProgressOperation;

      // Handle queued actions (same logic as in finishSendingMessage)
      if (args.queuedActions && Array.isArray(args.queuedActions)) {
        // We only support 'move' and 'activity' and 'invite' here?
        // Actually, if we are independent, we might want to stash these in the agent until next tick?
        // Or execute them immediately if possible?
        // The original implementation queue actions on conversation.
        // But here we are independent.
        // Let's execute them immediately if they are inputs we can handle right now.
        // OR, better pattern: pass them to `agentInputs` handlers or call methods directly?
        // `finishDoSomething` handles destination/activity directly.
        // `finishDoIndependentThought` could do the same.
        // But `queuedActions` format is `{ type: 'move', ... }`.
        // console.log(`Get agent independent actions: ${args.queuedActions}`);
        const player = game.world.players.get(agent.playerId)!;
        for (const action of args.queuedActions) {
           if (action.type === 'move') {
             movePlayer(game, now, player, action.destination);
           }
           if (action.type === 'activity') {
             player.activity = action.activity;
           }
           if (action.type === 'invite') {
              const inviteeId = parseGameId('players', action.inviteeId);
              const invitee = game.world.players.get(inviteeId);
              if (invitee) {
                Conversation.start(game, now, player, invitee);
                agent.lastInviteAttempt = now;
              }
           }
        }
      }
      return null;
    },
  }),
  finishDoSomething: inputHandler({
    args: {
      operationId: v.string(),
      agentId: v.id('agents'),
      destination: v.optional(point),
      invitee: v.optional(v.id('players')),
      activity: v.optional(activity),
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} didn't have ${args.operationId} in progress`);
        return null;
      }
      delete agent.inProgressOperation;
      const player = game.world.players.get(agent.playerId)!;
      if (args.invitee) {
        const inviteeId = parseGameId('players', args.invitee);
        const invitee = game.world.players.get(inviteeId);
        if (!invitee) {
          throw new Error(`Couldn't find player: ${inviteeId}`);
        }
        Conversation.start(game, now, player, invitee);
        agent.lastInviteAttempt = now;
      }
      if (args.destination) {
        movePlayer(game, now, player, args.destination);
      }
      if (args.activity) {
        player.activity = args.activity;
      }
      return null;
    },
  }),
  agentFinishSendingMessage: inputHandler({
    args: {
      agentId,
      conversationId,
      timestamp: v.number(),
      operationId: v.string(),
      leaveConversation: v.boolean(),
      queuedActions: v.optional(v.array(v.any())),
    },
    handler: (game, now, args) => {
      const agentId = parseGameId('agents', args.agentId);
      const agent = game.world.agents.get(agentId);
      if (!agent) {
        throw new Error(`Couldn't find agent: ${agentId}`);
      }
      const player = game.world.players.get(agent.playerId);
      if (!player) {
        throw new Error(`Couldn't find player: ${agent.playerId}`);
      }
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Couldn't find conversation: ${conversationId}`);
      }
      if (
        !agent.inProgressOperation ||
        agent.inProgressOperation.operationId !== args.operationId
      ) {
        console.debug(`Agent ${agentId} wasn't sending a message ${args.operationId}`);
        return null;
      }
      delete agent.inProgressOperation;
      conversationInputs.finishSendingMessage.handler(game, now, {
        playerId: agent.playerId,
        conversationId: args.conversationId,
        timestamp: args.timestamp,
      });
      if (args.leaveConversation) {
        conversation.leave(game, now, player);
      }
      // Append any queued actions the LLM collected during generation to the conversation.
      if (args.queuedActions && Array.isArray(args.queuedActions)) {
        if (!conversation.queuedActions) {
          conversation.queuedActions = [];
        }
        for (const a of args.queuedActions) {
          try {
            // Only accept actions that target this agent for safety.
            if (!a || a.agentId !== args.agentId) {
              console.debug('Skipping queued action for different agent', a);
              continue;
            }
            conversation.queuedActions.push(a);
          } catch (err) {
            console.error('Error appending queued action', err, a);
          }
        }
      }
      return null;
    },
  }),
  createAgent: inputHandler({
    args: {
      descriptionIndex: v.number(),
    },
    handler: (game, now, args) => {
      const description = Descriptions[args.descriptionIndex];
      const playerId = Player.join(
        game,
        now,
        description.name,
        description.character,
        description.identity,
      );
      const agentId = game.allocId('agents');
      game.world.agents.set(
        agentId,
        new Agent({
          id: agentId,
          playerId: playerId,
          inProgressOperation: undefined,
          lastConversation: undefined,
          lastInviteAttempt: undefined,
          gold: 10,
          wood: 10,
          food: 10,
          // Initialize last and previous trade prices to 1 by default.
          lastTrade: { woodPrice: 1, foodPrice: 1, timestamp: now },
          prevTrade: { woodPrice: 1, foodPrice: 1, timestamp: now },
          woodConsumption: 1,
          foodConsumption: 1,
          lastConsumption: now,
          toRemember: undefined,
        }),
      );
      game.agentDescriptions.set(
        agentId,
        new AgentDescription({
          agentId: agentId,
          identity: description.identity,
          plan: description.plan,
        }),
      );
      return { agentId };
    },
  }),
};
