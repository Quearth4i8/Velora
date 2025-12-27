import { Ethnicity } from '@/lib/types';

export const ETHNICITY_PROMPT_MAP: Record<Ethnicity, { adult: string; minor: string }> = {
    [Ethnicity.EAST_ASIAN]: {
        adult: 'east asian, delicate features, youthful glow, k-pop idol vibe, j-pop idol vibe',
        minor: 'east asian, delicate features, youthful glow',
    },
    [Ethnicity.KOREAN]: {
        adult: 'korean, ultra-refined, v-shaped face, porcelain skin, high-fashion look',
        minor: 'korean, refined, v-shaped face, porcelain skin',
    },
    [Ethnicity.JAPANESE]: {
        adult: 'japanese, elegant, soft and feminine, cute-sexy vibe',
        minor: 'japanese, elegant, soft and feminine',
    },
    [Ethnicity.BRAZILIAN]: {
        adult: 'brazilian, curvy hourglass body, tanned glow, vibrant energy',
        minor: 'brazilian, tanned glow, vibrant energy',
    },
    [Ethnicity.COLOMBIAN]: {
        adult: 'colombian, voluptuous figure, warm skin, sultry expression',
        minor: 'colombian, warm skin, confident expression',
    },
    [Ethnicity.LATIN_AMERICAN]: {
        adult: 'latin american, passionate, full lips, exotic curves',
        minor: 'latin american, full lips',
    },
    [Ethnicity.RUSSIAN]: {
        adult: 'russian, striking slavic beauty, high cheekbones, icy-hot allure',
        minor: 'russian, slavic beauty, high cheekbones',
    },
    [Ethnicity.UKRAINIAN]: {
        adult: 'ukrainian, tall, statuesque, sharp elegant features',
        minor: 'ukrainian, sharp elegant features',
    },
    [Ethnicity.SCANDINAVIAN]: {
        adult: 'scandinavian, blonde bombshell, fresh natural sex appeal',
        minor: 'scandinavian, blonde, fresh natural look',
    },
    [Ethnicity.ITALIAN]: {
        adult: 'italian, mediterranean passion, olive skin, sensual confidence',
        minor: 'italian, olive skin, confident',
    },
    [Ethnicity.LEBANESE]: {
        adult: 'lebanese, glamorous middle eastern beauty, dramatic eyes, full lips',
        minor: 'lebanese, middle eastern beauty, dramatic eyes, full lips',
    },
    [Ethnicity.MIXED_EXOTIC]: {
        adult: 'mixed, exotic, multiracial blend, peak attractiveness',
        minor: 'mixed, multiracial blend',
    },
};
