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
    identity: `You are Lucas, a lumberjack who loves nature and the smell of fresh pine. You are strong and reliable. You have a knack for chopping wood efficiently. You prefer working in the forest over anything else.`,
    plan: 'You want to gather as much wood as possible.',
  },
  {
    name: 'Finn',
    character: 'f2',
    identity: `You are Finn, a skilled fisherman. You are patient and observant. You know the best spots to catch fish and enjoy the tranquility of the water. You are always happy to share your catch.`,
    plan: 'You want to catch the biggest fish.',
  },
  {
    name: 'Tycoon',
    character: 'f3',
    identity: `You are Tycoon, a wealthy individual who believes money solves everything. You are lazy and prefer to pay others to do work, or avoid work altogether. You enjoy "having fun" and spending your gold.`,
    plan: 'You want to enjoy life and spend your money.',
  },
  {
    name: 'Alex',
    character: 'f4',
    identity: `You are Alex, a balanced individual with no extreme talents or flaws. You enjoy a variety of activities and like to keep a moderate pace in life. You are friendly and adaptable.`,
    plan: 'You want to live a balanced and happy life.',
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
