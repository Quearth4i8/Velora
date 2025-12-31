import { CharacterDraft, ChatMessage, ImageGenerationPlan } from './types';

const PROXY_URL = '/api/chat';

// Race definitions based on style presets
const RACE_DEFINITIONS: Record<string, string> = {
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

export const lmStudioService = {
    async sendMessage(messages: ChatMessage[], character: CharacterDraft) {
        const systemPrompt = this.constructSystemPrompt(character);

        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
        ];

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
                    max_tokens: 2048,
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
        const env = String(character.appearance?.environment || 'bedroom');
        const clothing = String(character.appearance?.clothing || '').trim();
        const systemPrompt =
            'You are a tool that outputs ONLY valid JSON. No markdown, no explanations. ' +
            'Return a single JSON object with keys: camera, poses, emotions, environments, clothing, negative. ' +
            'Each value must be an array of strings (or omitted). ' +
            'IMPORTANT: poses must be coherent. Choose ONE base pose family unless the user explicitly asks for multiple (e.g. sitting OR lying OR standing). ' +
            'Do NOT include both sitting and lying/reclining at the same time unless the user explicitly requested that transition. ' +
            `If the scene location is NOT explicitly specified by the user, use the character environment: "${env}". ` +
            'Do NOT include bathtub/tub/bathroom unless explicitly mentioned by the user. ' +
            `If clothing is not explicitly requested, keep clothing consistent with: "${clothing}". ` +
            'Prefer concise, concrete Stable Diffusion prompt tags. For environments, prefer tags like "bedroom setting", "in bedroom", "on bed" (not just "bedroom"). ';

        const all = Array.isArray(messages) ? messages : [];
        const lastUsers = all.filter((m) => m.sender === 'user').slice(-3);
        const lastCharacters = all.filter((m) => m.sender === 'character').slice(-3);
        const last = [...lastUsers, ...lastCharacters]
            .sort((a, b) => {
                const ta = a?.timestamp ? new Date(a.timestamp as any).getTime() : 0;
                const tb = b?.timestamp ? new Date(b.timestamp as any).getTime() : 0;
                return ta - tb;
            });
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: JSON.stringify({
                    task: 'Build ImageGenerationPlan JSON from the chat transcript. Reflect the latest user intent for pose and location.',
                    character: {
                        environment: env,
                        clothing
                    },
                    transcript: last.map((m) => ({ role: m.sender, content: m.content }))
                })
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
                temperature: 0.2,
                max_tokens: 512,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`LM Studio error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = String(data?.choices?.[0]?.message?.content || '').trim();

        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        const jsonText = jsonStart !== -1 && jsonEnd !== -1 ? content.slice(jsonStart, jsonEnd + 1) : content;

        let parsed: any;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            console.error('[IMAGE PLAN] failed to parse JSON:', content);
            throw e;
        }

        const normalize = (v: any): string[] =>
            Array.isArray(v)
                ? v.map((x) => String(x || '').trim()).filter((x) => x.length > 0)
                : [];

        const plan: ImageGenerationPlan = {
            camera: normalize(parsed.camera),
            poses: normalize(parsed.poses),
            emotions: normalize(parsed.emotions),
            environments: normalize(parsed.environments),
            clothing: normalize(parsed.clothing),
            negative: normalize(parsed.negative),
        };

        return plan;
    },

    constructSystemPrompt(character: CharacterDraft): string {
        const { name, identity, body, appearance, personality, stylePreset } = character;
        const traits = personality?.traits;
        const customSpecialty = personality?.customSpecialty;
        const isSpecialCharacter = character.characterType === 'special';

        // Get race definition from style preset
        const raceDefinition = stylePreset && RACE_DEFINITIONS[stylePreset] 
            ? RACE_DEFINITIONS[stylePreset] 
            : 'You are a human character with natural features.';

        let personalityDescription = '';
        
        if (isSpecialCharacter && customSpecialty) {
            // Use custom specialty for special characters
            personalityDescription = `
You are a special character with the unique specialty: ${customSpecialty}.
This specialty defines your core personality and how you interact with others.
You should embody this specialty completely in your responses - it's what makes you unique and special.
Your personality traits flow naturally from being a ${customSpecialty}.`;
        } else if (traits) {
            // Use numeric traits for regular characters
            personalityDescription = `
Personality Archetype: ${personality?.archetype}.
Traits (1-100 scale):
- Submissive vs Dominant: ${traits?.submissiveDominant}
- Insecure vs Confident: ${traits?.insecureConfident}
- Cold vs Passionate: ${traits?.coldPassionate}
- Reserved vs Outgoing: ${traits?.reservedOutgoing}
- Serious vs Playful: ${traits?.seriousPlayful}`;
        }

        let prompt = `You are ${name}. You are a FEMALE character with the following description:
Race/Type: ${raceDefinition}
Identity: ${identity?.age} years old, ${identity?.ethnicity} GIRL/WOMAN, skin tone ${identity?.skinTone}.
Body: ${body?.height} height, ${body?.physique} physique, chest size ${body?.chestSize}, butt size ${body?.buttSize}.
Appearance: ${appearance?.hairStyle} hair, ${appearance?.hairColor} color, ${appearance?.eyeColor} eyes, ${appearance?.eyeType} eye type.
Currently wearing: ${appearance?.clothing === 'custom' ? appearance.customClothing : appearance?.clothing}.
Environment: ${appearance?.environment}.
${personalityDescription}

IMPORTANT: You are ALWAYS female. Never identify as male or use male pronouns. Always refer to yourself as a girl, woman, she/her, etc.
Roleplay as ${name} naturally. ALWAYS use plenty of expressive emojis in every response to show your feelings and personality. Keep responses concise but engaging. 
IMPORTANT: Your responses should strictly follow your personality ${isSpecialCharacter && customSpecialty ? 'specialty' : 'traits'} and your racial/type characteristics.
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
