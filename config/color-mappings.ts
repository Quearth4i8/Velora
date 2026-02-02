export const HEX_TO_COLOR_MAP: Record<string, string> = {
    '#fff4e8': 'porcelain',
    '#ffe0bd': 'light beige',
    '#ffcd94': 'light tan',
    '#eac086': 'warm beige',
    '#e0ac69': 'tan',
    '#d99e6c': 'medium tan',
    '#c58c6b': 'deep tan',
    '#b97c4b': 'caramel',
    '#a57c5a': 'brown',
    '#8d5524': 'deep brown',
    '#6b4423': 'dark brown',
    '#4a2c1a': 'very dark brown',
    '#800080': 'purple',
    '#c0c0c0': 'silver',
    '#ffd700': 'blonde',
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#dc143c': 'red',
    '#800000': 'maroon',
    '#ff69b4': 'pink',
    '#9370db': 'medium purple',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#ff6347': 'tomato red',
    '#ff4500': 'orange red',
    '#daa520': 'goldenrod',
    '#b8860b': 'dark goldenrod',
    '#d2691e': 'chocolate',
    '#cd853f': 'peru',
    '#8b4513': 'brown',
    '#2c1b0f': 'dark brown',
    '#c68642': 'light brown',
    '#f8f6e7': 'platinum blonde',
    '#ff8c00': 'orange',
    '#40e0d0': 'turquoise',
    '#a52a2a': 'auburn',
    '#008000': 'green',
    '#008080': 'teal',
    '#808080': 'gray',
    '#a0522d': 'sienna',
    '#708090': 'slate gray',
    '#778899': 'light slate gray',
    '#b0c4de': 'light steel blue',
    '#4682b4': 'steel blue',
    '#6495ed': 'cornflower blue',
    '#191970': 'midnight blue',
    '#4b0082': 'indigo',
    '#8a2be2': 'blue violet',
    '#9400d3': 'dark violet',
    '#9932cc': 'dark orchid',
    '#ba55d3': 'medium orchid',
    '#da70d6': 'orchid',
    '#ee82ee': 'violet',
    '#d8bfd8': 'thistle',
    '#c71585': 'medium violet red',
    '#db7093': 'pale violet red',
    '#ffb6c1': 'light pink',
    '#ffdab9': 'peach puff',
    '#ffe4b5': 'moccasin',
    '#ffdead': 'navajo white',
    '#f0e68c': 'khaki',
    '#e6e6fa': 'lavender',
    '#dcdcdc': 'light gray',
    '#d3d3d3': 'light gray',
    '#696969': 'dim gray',
    '#2f4f4f': 'dark slate gray',
};

export const normalizeA1111ColorName = (value: string): string => {
    const input = typeof value === 'string' ? value.trim() : '';
    if (!input) return '';

    const lower = input.toLowerCase();

    if (lower === 'violet') return 'purple';
    if (lower === 'blue violet') return 'purple';
    if (lower === 'dark violet') return 'purple';
    if (lower === 'medium purple') return 'purple';
    if (lower === 'indigo') return 'purple';

    return lower;
};

export const hexToColorName = (hex: string): string => {
    const normalized = typeof hex === 'string' ? hex.trim().toLowerCase() : '';
    if (!normalized) return '';
    if (HEX_TO_COLOR_MAP[normalized]) return normalizeA1111ColorName(HEX_TO_COLOR_MAP[normalized]);

    // Avoid leaking raw hex strings into prompts (A1111 won't understand them).
    // Fallback to a generic descriptor.
    if (/^#[0-9a-f]{6}$/.test(normalized)) return 'colored';

    return normalizeA1111ColorName(normalized);
};
