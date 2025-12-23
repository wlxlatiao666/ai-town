import { useMemo, useRef, useState } from 'react';
import PixiGame from './PixiGame.tsx';

import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;

  const game = useServerGame(worldId);

  // Send a periodic heartbeat to our world to keep it alive.
  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);

  const scrollViewRef = useRef<HTMLDivElement>(null);

  const agentGoldLeaderboard = useMemo(() => {
    if (!game) return [];
    return [...game.world.agents.values()]
      .map((agent) => {
        const playerName = game.playerDescriptions.get(agent.playerId)?.name;
        return {
          id: agent.id,
          name: playerName ?? `Agent ${agent.id}`,
          gold: agent.gold ?? 0,
        };
      })
      .sort((a, b) => b.gold - a.gold);
  }, [game]);

  if (!worldId || !engineId || !game) {
    return null;
  }

  return (
    <>
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <div className="w-full flex justify-center mb-3 px-4">
        <div className="w-full max-w-[1400px] box bg-brown-800/80 border-brown-900 shadow-solid p-3">
          <h2 className="font-display text-xl sm:text-2xl text-brown-50 tracking-wider text-center">
            Agent Gold
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-2">
            {agentGoldLeaderboard.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-2 bg-brown-900 text-brown-100 border border-brown-700 shadow-solid min-w-[140px] text-center"
              >
                <div className="font-semibold text-sm sm:text-base">{entry.name}</div>
                <div
                  className={
                    entry.gold > 10
                      ? 'text-emerald-300 text-lg sm:text-xl'
                      : entry.gold < 10
                      ? 'text-red-400 text-lg sm:text-xl'
                      : 'text-amber-200 text-lg sm:text-xl'
                  }
                >
                  {entry.gold} gold
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-[1400px] min-h-[480px] game-frame">
        {/* Game area */}
        <div className="relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            <div className="container">
              <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
                {/* Re-propagate context because contexts are not shared between renderers.
https://github.com/michalochman/react-pixi-fiber/issues/145#issuecomment-531549215 */}
                <ConvexProvider client={convex}>
                  <PixiGame
                    game={game}
                    worldId={worldId}
                    engineId={engineId}
                    width={width}
                    height={height}
                    historicalTime={historicalTime}
                    setSelectedElement={setSelectedElement}
                  />
                </ConvexProvider>
              </Stage>
            </div>
          </div>
        </div>
        {/* Right column area */}
        <div
          className="flex flex-col overflow-y-auto shrink-0 px-4 py-6 sm:px-6 lg:w-96 xl:pr-6 border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900  bg-brown-800 text-brown-100"
          ref={scrollViewRef}
        >
          <PlayerDetails
            worldId={worldId}
            engineId={engineId}
            game={game}
            playerId={selectedElement?.id}
            setSelectedElement={setSelectedElement}
            scrollViewRef={scrollViewRef}
          />
        </div>
      </div>
    </>
  );
}
