import { ObjectType, v } from 'convex/values';
import { internalQuery } from '../_generated/server';
import { GameId, parseGameId, playerId } from './ids';

export const serializedPlayerDescription = {
  playerId,
  name: v.string(),
  description: v.string(),
  character: v.string(),
};
export type SerializedPlayerDescription = ObjectType<typeof serializedPlayerDescription>;

export class PlayerDescription {
  playerId: GameId<'players'>;
  name: string;
  description: string;
  character: string;

  constructor(serialized: SerializedPlayerDescription) {
    const { playerId, name, description, character } = serialized;
    this.playerId = parseGameId('players', playerId);
    this.name = name;
    this.description = description;
    this.character = character;
  }

  serialize(): SerializedPlayerDescription {
    const { playerId, name, description, character } = this;
    return {
      playerId,
      name,
      description,
      character,
    };
  }
}

export const lookupByName = internalQuery({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('name', (q) => q.eq('worldId', args.worldId).eq('name', args.name))
      .first();
    return playerDescription?.playerId;
  },
});
