import { v } from 'convex/values';
import { playerId, conversationId } from '../aiTown/ids';
import { defineTable } from 'convex/server';
import { EMBEDDING_DIMENSION } from '../util/llm';

export const memoryFields = {
  playerId,
  description: v.string(),
  embeddingId: v.id('memoryEmbeddings'),
  importance: v.number(),
  lastAccess: v.number(),
  data: v.union(
    // Setting up dynamics between players
    v.object({
      type: v.literal('relationship'),
      // The player this memory is about, from the perspective of the player
      // whose memory this is.
      playerId,
    }),
    v.object({
      type: v.literal('conversation'),
      conversationId,
      // The other player(s) in the conversation.
      playerIds: v.array(playerId),
    }),
    v.object({
      type: v.literal('reflection'),
      relatedMemoryIds: v.array(v.id('memories')),
    }),
  ),
};
export const memoryTables = {
  memories: defineTable(memoryFields)
    .index('embeddingId', ['embeddingId'])
    .index('playerId_type', ['playerId', 'data.type'])
    .index('playerId', ['playerId']),
  memoryEmbeddings: defineTable({
    playerId,
    embedding: v.array(v.float64()),
  }).vectorIndex('embedding', {
    vectorField: 'embedding',
    filterFields: ['playerId'],
    dimensions: EMBEDDING_DIMENSION,
  }),
};

export const agentTables = {
  ...memoryTables,
  agents: defineTable({
    playerId,
    gold: v.optional(v.number()),
    wood: v.optional(v.number()),
    food: v.optional(v.number()),
    lastTrade: v.optional(v.object({ woodPrice: v.optional(v.number()), foodPrice: v.optional(v.number()), timestamp: v.optional(v.number()) })),
    prevTrade: v.optional(v.object({ woodPrice: v.optional(v.number()), foodPrice: v.optional(v.number()), timestamp: v.optional(v.number()) })),
    woodConsumption: v.optional(v.number()),
    foodConsumption: v.optional(v.number()),
    lastConsumption: v.optional(v.number()),
    toRemember: v.optional(conversationId),
    lastConversation: v.optional(v.number()),
    lastInviteAttempt: v.optional(v.number()),
    nextIndependentThought: v.optional(v.number()),
    nextActivity: v.optional(v.number()),
    inProgressOperation: v.optional(
      v.object({
        name: v.string(),
        operationId: v.string(),
        started: v.number(),
      }),
    ),
  }),
  agentDescriptions: defineTable({
    worldId: v.id('worlds'),
    agentId: v.id('agents'),
    identity: v.string(),
    plan: v.string(),
  }).index('worldId', ['worldId', 'agentId']),
  embeddingsCache: defineTable({
    textHash: v.bytes(),
    embedding: v.array(v.float64()),
  }).index('text', ['textHash']),
};
