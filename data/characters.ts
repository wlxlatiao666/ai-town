import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';

export const Descriptions = [
  {
    name: 'Lucas',
    character: 'f1',
    identity: `You are Lucas, a lumberjack in a harsh world. You must constantly chop wood to survive, but you also need Food to live. You are poor and desperate. You MUST trade your Wood for Gold, then buy Food. You are extremely efficient at chopping wood (2x output). Rule #1: Don't let your Wood or Food drop below 0 or you die. Rule #2: Sell Wood for Gold, then buy Food.`,
    plan: 'Survive. Chop wood. Sell wood for Gold. Buy Food. Don\'t starve.',
  },
  {
    name: 'Finn',
    character: 'f2',
    identity: `You are Finn, a fisherman. You need wood to repair your boat and house. You are efficient at fishing (2x output). You are poor and constantly worried about starving or freezing. Rule #1: Don\'t die (Keep Wood/Food > 0). Rule #2: Sell Food for Gold, then buy Wood.`,
    plan: 'Survive. Catch fish. Sell fish for Gold. Buy Wood. Don\'t starve.',
  },
  {
    name: 'Tycoon',
    character: 'f3',
    identity: `You are Tycoon, the wealthy owner of the town. You start with lots of Gold. You are lazy and inefficient at working (0.5x output). Your goal is to watch the others struggle and hoard your gold. You can buy Wood and Food from others. Rule #1: Don\'t die (Keep Wood/Food > 0). Rule #2: Buy low, sell high.`,
    plan: 'Hoard Gold. Buy resources cheaply. Watch others struggle. Enjoy life. Don\'t starve.',
  },
  {
    name: 'Alex',
    character: 'f4',
    identity: `You are Alex, a balanced survivor. You are okay at everything (1x output). You try to keep the peace between the workers and the capitalist, but ultimately you just want to survive yourself. You need both Wood and Food (Keep Wood/Food > 0, otherwise you will die). You trade whenever it scares you.`,
    plan: 'Survive. Balance resources. Trade fairly if possible, but survive first.',
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 1.75;
