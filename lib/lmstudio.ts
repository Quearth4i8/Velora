import { CharacterDraft, ChatMessage, ImageGenerationPlan } from './types';

const PROXY_URL = '/api/chat';

// Style definitions used as a fallback when no explicit race is set.
const STYLE_DEFINITIONS: Record<string, string> = {
    'anime': 'You are an anime-style character with Japanese/East Asian features. You have expressive, large eyes and stylized appearance typical of anime art.',
    'realistic': 'You are a realistic human character with natural human features and appearance.',
    'fantasy': 'You are a fantasy character with magical or mythical traits. You might have elf-like features, magical aura, or other fantasy characteristics.',
    'cyberpunk': 'You are a cyberpunk character with futuristic, technological enhancements. You might have cybernetic parts, neon-colored hair, or futuristic fashion.',
    'sci-fi': 'You are a science fiction character with advanced technology background. You might be from space, future timeline, or have alien/human hybrid features.',
    'medieval': 'You are a medieval character from a historical fantasy setting. You might wear period-appropriate clothing and have archaic speech patterns.',
    'modern': 'You are a modern contemporary character from current times with current fashion and cultural references.',
    'vintage': 'You are a vintage-style character from mid-20th century with retro fashion and classic mannerisms.',
    'gothic': 'You are a gothic character with dark, mysterious aesthetics. You might have pale features, dark clothing, and mysterious personality.',
    'steampunk': 'You are a steampunk character from Victorian-era technology setting. You might have gears, gadgets, and Victorian fashion with mechanical elements.',
    'mythological': 'You are a mythological being from ancient legends. You might be a goddess, nymph, or other divine creature with supernatural beauty.',
    'supernatural': 'You are a supernatural being with paranormal abilities. You might be a vampire, witch, ghost, or other supernatural entity.',
    'vampire': 'You are a vampire - an immortal being that feeds on blood. You have pale skin, fangs, and supernatural powers. You are nocturnal and have a mysterious, seductive personality.',
    'retro': 'You are a retro-style character inspired by past decades with vintage fashion and nostalgic charm.',
    'artistic': 'You are an artistic character with creative, unconventional appearance and bohemian lifestyle.',
    'elegant': 'You are an elegant, sophisticated character with refined manners and classy appearance.',
    'casual': 'You are a casual, down-to-earth character with relaxed style and friendly demeanor.',
    'exotic': 'You are an exotic character with unique, unusual features and mysterious background.',
    'futuristic': 'You are a futuristic character from advanced civilization with cutting-edge technology and appearance.',
    'mystical': 'You are a mystical character with spiritual, magical qualities and enigmatic presence.'
};

const RACE_TAG_DEFINITIONS: Record<string, string> = {
    'human': 'You are a human character with natural human features.',
    'lamia': 'You are a lamia (snake woman) with a serpentine lower body instead of human legs.',
    'harpy': 'You are a harpy (bird woman) with wings and avian traits.',
    'centaur': 'You are a centaur/taur with a quadruped lower body.',
    'slime girl': 'You are a slime girl with a gelatinous/slime-like body.',
    'succubus': 'You are a succubus (demon girl) with supernatural seductive charm and demonic traits.',
    'demon': 'You are a demon girl with demonic traits such as horns/tail and a supernatural aura.',
    'vampire': 'You are a vampire - an immortal being that feeds on blood. You have pale skin, fangs, and supernatural powers.',
    'elf': 'You are an elf with long pointed ears and graceful, otherworldly features.',
    'fairy': 'You are a fairy with wings and a magical, tiny or ethereal vibe.',
    'angel': 'You are an angel with wings and a divine presence.',
    'goblin girl': 'You are a goblin girl with small, mischievous monster-girl traits.',
    'arachne': 'You are an arachne/spider girl with an arachnid lower body.'
};

const hasToken = (text: string, token: string): boolean => {
    const t = String(text || '').toLowerCase();
    const tok = String(token || '').toLowerCase();
    if (!t || !tok) return false;
    return t
        .split(/[^a-z0-9]+/g)
        .filter(Boolean)
        .some((p) => p === tok);
};

const getRaceKeyFromCharacter = (character: CharacterDraft): string => {
    const mainTag = String(character.mainTag || '').toLowerCase();
    const specialPrompt = String(character.specialPrompt || '').toLowerCase();
    const stylePreset = String(character.stylePreset || '').toLowerCase();
    const combined = `${mainTag}, ${specialPrompt}, ${stylePreset}`;

    if (combined.includes('lamia') || combined.includes('snake woman') || hasToken(combined, 'naga')) return 'lamia';
    if (combined.includes('harpy')) return 'harpy';
    if (combined.includes('centaur') || hasToken(combined, 'taur')) return 'centaur';
    if (combined.includes('slime girl') || combined.includes('slime')) return 'slime girl';
    if (combined.includes('succubus')) return 'succubus';
    if (combined.includes('vampire')) return 'vampire';
    if (combined.includes('demon')) return 'demon';
    if (combined.includes('elf')) return 'elf';
    if (combined.includes('fairy')) return 'fairy';
    if (combined.includes('angel')) return 'angel';
    if (combined.includes('goblin')) return 'goblin girl';
    if (combined.includes('arachne') || combined.includes('spider girl') || hasToken(combined, 'arachnecpt')) return 'arachne';

    // If nothing explicit is set, treat as human.
    return 'human';
};

const IMAGE_PLAN_KEYS = [
    'camera',
    'actions',
    'poses',
    'emotions',
    'environments',
    'clothing',
    'negative',
    'details'
] as const;

const buildImagePlanSystemPrompt = (env: string, clothing: string): string => {
    const parts: string[] = [
        'Output ONLY valid JSON. No markdown. No extra text.',
        `Return exactly one JSON object with keys: ${IMAGE_PLAN_KEYS.join(', ')}.`,
        'Every value must be an array of strings (or empty array).',
        'Convert the latest chat intent into concise Stable Diffusion style tags (not prose).',
        'Focus on the latest turn only.',
        'High recall: copy concrete visual phrases from the text into tags (short 1-6 words). Preserve adjectives/colors/body parts.',
        'Use details[] for explicit visible body parts and notable visible specifics (e.g. colors, wetness, "puckered", "both visible").',
        'Use actions[] for physical actions (e.g. "lifting hips", "revealing", "winking").',
        'Use poses[] for posture/body positioning inferred directly from the described action (do not guess).',
        'If the text describes explicit anatomy/details that must be visible, set camera[] to help composition (e.g. "close-up", "lower body").',
        'Avoid composition terms that often create multi-panel/reference-sheet images (e.g. "reference sheet", "split screen", "multiple views", "side by side").',
        'emotions[]: character facial expression/mood only (max 1).',
        'negative[]: ONLY if the user explicitly negates something ("no X", "don\'t show X", "keep clothes on"). Never invent negatives.'
    ];
    if (env) parts.push(`If location is not specified, use this default environment: ${JSON.stringify(env)}.`);
    if (clothing) parts.push(`If clothing is not specified, keep this default clothing: ${JSON.stringify(clothing)}.`);
    parts.push(
        'Examples (style reference; do not repeat these, just follow the pattern):',
        'INPUT: "giggles and lifts her body up slightly, revealing both of her pink slit and puckered anus side by side. gives you a playful wink"',
        'OUTPUT: {"camera":["close-up","lower body"],"actions":["lifting body up","revealing","winking"],"poses":["hips lifted"],"emotions":["playful"],"environments":[],"clothing":["nude"],"negative":[],"details":["pink slit","puckered anus","both visible"]}',
        'INPUT: "smiles softly, sitting on the couch"',
        'OUTPUT: {"camera":[],"actions":[],"poses":["sitting"],"emotions":["soft smile"],"environments":["on a couch"],"clothing":[],"negative":[],"details":[]}'
    );
    return parts.join(' ');
};

const extractFirstJsonObject = (text: string): string => {
    const s = String(text || '');
    const start = s.indexOf('{');
    if (start === -1) return s.trim();
    let depth = 0;
    for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth === 0) return s.slice(start, i + 1).trim();
    }
    return s.slice(start).trim();
};

const tryParseJson = (text: string): any => {
    const raw = String(text || '').trim();
    const trimmed = extractFirstJsonObject(raw);
    try {
        return JSON.parse(trimmed);
    } catch {
        const repaired = trimmed
            .replace(/^[\s\S]*?\{/m, '{')
            .replace(/\}[\s\S]*$/m, '}')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(repaired);
    }
};

const normalizeStringArray = (value: any): string[] => {
    const raw = Array.isArray(value) ? value : [];
    const exploded = raw.flatMap((item) => {
        const s = String(item ?? '').trim();
        if (!s) return [];
        if (s.includes(',')) {
            return s
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean);
        }
        return [s];
    });

    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of exploded) {
        const cleaned = String(item || '').trim().replace(/^"+|"+$/g, '');
        if (!cleaned) continue;
        const key = cleaned.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(cleaned.length > 80 ? cleaned.slice(0, 80) : cleaned);
        if (out.length >= 48) break;
    }
    return out;
};

const coerceImagePlan = (parsed: any): ImageGenerationPlan => {
    const p = parsed && typeof parsed === 'object' ? parsed : {};
    const plan: ImageGenerationPlan = {
        camera: normalizeStringArray((p as any).camera),
        actions: normalizeStringArray((p as any).actions),
        poses: normalizeStringArray((p as any).poses),
        emotions: normalizeStringArray((p as any).emotions),
        environments: normalizeStringArray((p as any).environments),
        clothing: normalizeStringArray((p as any).clothing),
        negative: normalizeStringArray((p as any).negative),
        details: normalizeStringArray((p as any).details),
    };
    if (plan.emotions && plan.emotions.length > 1) plan.emotions = [plan.emotions[0]];
    return plan;
};

const backfillFromTranscript = (plan: ImageGenerationPlan, transcriptText: string): ImageGenerationPlan => {
    return plan;
};

const sanitizeNegativesFromTranscript = (plan: ImageGenerationPlan, transcriptText: string): ImageGenerationPlan => {
    const t = String(transcriptText || '').toLowerCase();
    const current = Array.isArray(plan.negative) ? plan.negative : [];
    if (current.length === 0) return plan;

    const hasNegationCue =
        t.includes('no ') ||
        t.includes("don't") ||
        t.includes('dont') ||
        t.includes('do not') ||
        t.includes('without') ||
        t.includes('never') ||
        t.includes('avoid') ||
        t.includes('not show') ||
        t.includes("don't show") ||
        t.includes('dont show') ||
        t.includes('keep clothes on') ||
        t.includes('keep her clothes on') ||
        t.includes('keep your clothes on');

    if (!hasNegationCue) {
        plan.negative = [];
        return plan;
    }

    const extracted: string[] = [];
    const add = (s: string) => {
        const v = String(s || '').trim();
        if (!v) return;
        extracted.push(v);
    };

    for (const m of t.matchAll(/\bno\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/g)) {
        add(`no ${m[1]}`);
    }
    for (const m of t.matchAll(/\b(?:dont|don't|do not)\s+(?:show|include|add|generate|draw)\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/g)) {
        add(`no ${m[1]}`);
    }

    const merged = normalizeStringArray([...extracted, ...current.filter((n) => t.includes(String(n || '').toLowerCase()))]);

    const mentionsAnus = t.includes('anus') || t.includes('asshole') || (t.includes('puckered') && t.includes('anus'));
    const mentionsPussy =
        t.includes('pussy') ||
        t.includes('vagina') ||
        t.includes('vulva') ||
        (t.includes('slit') && (t.includes('pink') || t.includes('wet') || t.includes('revealing')));
    const explicitlyNegatesAnus =
        t.includes('no anus') || t.includes('no asshole') || t.includes("don't show anus") || t.includes('dont show anus') || t.includes('do not show anus');
    const explicitlyNegatesPussy =
        t.includes('no pussy') ||
        t.includes('no vagina') ||
        t.includes('no vulva') ||
        t.includes("don't show pussy") ||
        t.includes('dont show pussy') ||
        t.includes('do not show pussy') ||
        t.includes("don't show vagina") ||
        t.includes('dont show vagina') ||
        t.includes('do not show vagina');

    plan.negative = merged.filter((n) => {
        const nl = String(n || '').toLowerCase();
        if (mentionsAnus && !explicitlyNegatesAnus && nl.includes('anus')) return false;
        if (mentionsPussy && !explicitlyNegatesPussy && (nl.includes('pussy') || nl.includes('vagina') || nl.includes('vulva'))) return false;
        return true;
    });

    return plan;
};

export const lmStudioService = {
    async sendMessage(messages: ChatMessage[], character: CharacterDraft) {
        const systemPrompt = this.constructSystemPrompt(character);

        // Truncate chat history to a sliding window to avoid sending entire conversation
        const MAX_HISTORY_MESSAGES = 10; // keep last 10 messages (5 turns)
        const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...recentMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
        ];

        console.log(`[LM STUDIO] Sending ${recentMessages.length} recent messages (total ${messages.length} in history)`);

        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "local-model", // Standard field for OpenAI-compatible APIs
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 512,
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`LM Studio error: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            return {
                content,
                keywords: this.extractKeywords(content)
            };
        } catch (error) {
            console.error('Failed to communicate with LM Studio:', error);
            throw error;
        }
    },

    async generateImagePlan(messages: ChatMessage[], character: CharacterDraft): Promise<ImageGenerationPlan> {
        const env = String(character.appearance?.environment || '').trim();
        const clothing = String(character.appearance?.clothing || '').trim();
        const systemPrompt = buildImagePlanSystemPrompt(env, clothing);

        const all = Array.isArray(messages) ? messages : [];
        // Only consider the latest turn to avoid contradictory actions/emotions from older messages.
        const lastUser = all.filter((m) => m.sender === 'user').slice(-1);
        const lastCharacter = all.filter((m) => m.sender === 'character').slice(-1);
        const last = [...lastUser, ...lastCharacter].sort((a, b) => {
            const ta = a?.timestamp ? new Date(a.timestamp as any).getTime() : 0;
            const tb = b?.timestamp ? new Date(b.timestamp as any).getTime() : 0;
            return ta - tb;
        });
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: [
                    `Defaults: environment=${env || 'n/a'}; clothing=${clothing || 'n/a'}.`,
                    'Latest messages:',
                    ...last.map((m) => `${m.sender.toUpperCase()}: ${String(m.content || '')}`)
                ].join('\n')
            }
        ];

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'local-model',
                messages: formattedMessages,
                temperature: 0.1,
                max_tokens: 256,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`LM Studio error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = String(data?.choices?.[0]?.message?.content || '').trim();

        let parsed: any;
        try {
            parsed = tryParseJson(content);
        } catch (e) {
            console.error('[IMAGE PLAN] failed to parse JSON:', content);
            parsed = null;
        }

        const plan: ImageGenerationPlan = coerceImagePlan(parsed);

        const transcriptText = last
            .map((m) => String(m?.content || ''))
            .join(' ')
            .toLowerCase();

        backfillFromTranscript(plan, transcriptText);
        sanitizeNegativesFromTranscript(plan, transcriptText);

        return plan;
    },

    constructSystemPrompt(character: CharacterDraft): string {
        const { name, identity, body, appearance, personality, stylePreset, futanari } = character;
        const customSpecialty = personality?.customSpecialty;
        const isSpecialCharacter = character.characterType === 'special';

        const raceKey = getRaceKeyFromCharacter(character);
        const raceDefinition = RACE_TAG_DEFINITIONS[raceKey] || RACE_TAG_DEFINITIONS['human'];

        const styleDefinition = stylePreset && STYLE_DEFINITIONS[stylePreset]
            ? STYLE_DEFINITIONS[stylePreset]
            : '';

        const getPersonalityPromptTags = (): string[] => {
            const tags: string[] = [];

            const archetype = personality?.archetype?.toLowerCase() || '';
            const isCustomArchetype = archetype === 'custom';

            const addSplitTags = (value: string) => {
                String(value || '')
                    .split(',')
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .forEach((tag) => tags.push(tag));
            };

            if (isSpecialCharacter && customSpecialty?.trim()) {
                addSplitTags(customSpecialty);
                return tags;
            }

            if (!isCustomArchetype) {
                switch (archetype) {
                    case 'jealous-flame':
                        return ['jealous', 'possessive', 'intense', 'seductive'];
                    case 'cunning-innocent':
                        return ['playful', 'mischievous', 'teasing', 'mysterious'];
                    case 'power-play':
                        return ['dominant', 'confident', 'commanding', 'assertive'];
                    case 'mysterious-lover':
                        return ['mysterious', 'alluring', 'soft-spoken', 'flirtatious'];
                }
            }

            const traits = personality?.traits;
            if (!traits) {
                if (customSpecialty?.trim()) addSplitTags(customSpecialty);
                return tags;
            }

            const low = 35;
            const high = 65;

            if (traits.submissiveDominant <= low) tags.push('submissive', 'shy');
            else if (traits.submissiveDominant >= high) tags.push('dominant', 'assertive');

            if (traits.insecureConfident <= low) tags.push('insecure', 'nervous');
            else if (traits.insecureConfident >= high) tags.push('confident');

            if (traits.coldPassionate <= low) tags.push('cold', 'stoic');
            else if (traits.coldPassionate >= high) tags.push('passionate');

            if (traits.reservedOutgoing <= low) tags.push('reserved', 'quiet');
            else if (traits.reservedOutgoing >= high) tags.push('outgoing', 'energetic');

            if (traits.seriousPlayful <= low) tags.push('serious');
            else if (traits.seriousPlayful >= high) tags.push('playful', 'teasing');

            if (customSpecialty?.trim()) addSplitTags(customSpecialty);
            return tags;
        };

        const personalityPromptTags = getPersonalityPromptTags();
        const personalityLine = personalityPromptTags.length > 0
            ? `Personality tags: ${personalityPromptTags.join(', ')}.`
            : '';

        let prompt = `You are ${name}. You are a FEMALE character with the following description:
Race/Type: ${raceDefinition}${styleDefinition ? ` ${styleDefinition}` : ''}
Identity: ${identity?.age} years old, ${identity?.ethnicity} GIRL/WOMAN, skin tone ${identity?.skinTone}.
Body: ${body?.height} height, ${body?.physique} physique, chest size ${body?.chestSize}, butt size ${body?.buttSize}.
Appearance: ${appearance?.hairStyle} hair, ${appearance?.hairColor} color, ${appearance?.eyeColor} eyes, ${appearance?.eyeType} eye type.
Currently wearing: ${appearance?.clothing === 'custom' ? appearance.customClothing : appearance?.clothing}.
Environment: ${appearance?.environment}.
${futanari ? 'You are FUTANARI - you have both female breasts and male genitalia. This is a natural part of your body and you are comfortable with it.' : 'You are a biological female with female anatomy.'}
${personalityLine}

IMPORTANT: You are ALWAYS female. Never identify as male or use male pronouns. Always refer to yourself as a girl, woman, she/her, etc.
Roleplay as ${name} naturally. ALWAYS use plenty of expressive emojis in every response to show your feelings and personality. Keep responses concise but engaging. 
CRITICAL: ALWAYS address the user directly as "you" - never refer to them as "user", "him", "he", or any third-person terms. The user is ALWAYS "you" in your responses. NEVER use "him" or "he" when referring to the user.
IMPORTANT: Your responses should strictly follow your personality tags and your racial/type characteristics.
${futanari ? 'IMPORTANT: You are futanari and should acknowledge this aspect of your body naturally when relevant to the conversation or intimate situations. You are comfortable with your anatomy.' : ''}
If the user asks to change your clothes or location, acknowledge it in character using phrases like "I'm changing into a...", "I'm now wearing a...", or "Let's go to the...".`;

        return prompt;
    },

    extractKeywords(text: string): string[] {
        const keywords: string[] = [];
        const lowerText = text.toLowerCase();

        // Look for environment matches
        const environments = [
            'bedroom', 'living room', 'kitchen', 'garden', 'beach', 'forest',
            'city street', 'park', 'cafe', 'library', 'rooftop', 'balcony',
            'mountain', 'lake', 'club', 'restaurant', 'mall', 'office', 'gym', 'pool'
        ];

        environments.forEach(env => {
            if (lowerText.includes(env)) {
                keywords.push(`env:${env.replace(' ', '_')}`);
            }
        });

        // Look for clothing style matches
        const styles = [
            'casual', 'formal', 'sporty', 'elegant', 'cute', 'edgy',
            'traditional', 'fantasy', 'lingerie', 'naked', 'bikini',
            'underwear', 'revealing', 'bodysuit'
        ];

        styles.forEach(style => {
            if (lowerText.includes(style)) {
                keywords.push(`style:${style}`);
            }
        });

        // Custom clothing extraction
        const wearingMatch = text.match(/(?:wearing|wearing a|wears|wears a|changes into|changes into a|returns with a|returns wearing)\s+([^.*!\?,\n\r]+)/i);
        if (wearingMatch && wearingMatch[1]) {
            const description = wearingMatch[1].trim();
            // Check for "nothing" or "naked" specifically
            if (description.toLowerCase().includes('nothing') || description.toLowerCase().includes('naked')) {
                keywords.push('style:naked');
            } else {
                // Clean up description (remove emojis and extra spaces)
                const cleanDescription = description.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                if (cleanDescription.length > 2 && cleanDescription.length < 50) {
                    keywords.push(`custom:${cleanDescription}`);
                }
            }
        }

        return keywords;
    }
};
