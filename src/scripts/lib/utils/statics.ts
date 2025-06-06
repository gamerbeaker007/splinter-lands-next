
export const NATURAL_RESOURCES = ['GRAIN', 'WOOD', 'STONE', 'IRON'];
export const MULTIPLE_CONSUMING_RESOURCES = new Set(['RESEARCH', 'AURA', 'SPS']);
export const CONSUMES_ONLY_GRAIN = new Set(NATURAL_RESOURCES);
export const PRODUCING_RESOURCES = [
    'GRAIN',
    'WOOD',
    'STONE',
    'IRON',
    'RESEARCH',
    'AURA',
    'SPS',
];

export const CONSUME_RATES: Record<string, number> = {
    GRAIN: 0.01,
    WOOD: 0.005,
    STONE: 0.002,
    IRON: 0.0005,
};

export const GRAIN_CONVERSION_RATIOS: Record<string, number> = {
    GRAIN: 1,
    WOOD: 4,
    STONE: 10,
    IRON: 40,
};