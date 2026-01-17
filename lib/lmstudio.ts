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
        const envInstruction = env
            ? `If the scene location is NOT explicitly specified by the user, use the character environment: "${env}". `
            : 'If the scene location is NOT explicitly specified by the user, omit environments (or return an empty array). ';
        const systemPrompt =
            'You are a deterministic information-extraction tool that outputs ONLY valid JSON. No markdown, no explanations. ' +
            'Return EXACTLY one JSON object with keys: camera, actions, poses, emotions, environments, clothing, negative, details. ' +
            'Each key value must be an array of strings (or an empty array). Never return non-array values. ' +
            'Your goal: convert the latest chat intent into concise Stable Diffusion style tags. Prefer concrete visual tags, not prose. ' +
            'Scope: focus on what is happening NOW in the latest turn (latest user message and/or latest character message). Do not import earlier scene actions unless they are reaffirmed in the latest turn. ' +
            'Character vs user: emotions describe ONLY the character\'s facial expression/mood. If both user and character text exists, use character text as primary source for emotions and the combined latest turn for actions/poses. ' +
            'Return AT MOST ONE emotion (dominant). ' +
            'NEVER hallucinate. If the latest turn is dialogue-only (talking/insulting/flirting/threats/desires with no physical act described), actions must be empty (except non-sexual conversational-safe physical acts explicitly stated like "slaps you" or "hugs you"). ' +
            'Critical: do not output sexual actions unless an explicit sexual ACT is described in the latest turn (clear physical act words). Desire/intent alone ("i want", "i\'d like", "make love") is NOT an act. ' +
            'Violence/injury extraction (only when explicit): if the text describes cutting, stabbing, amputation, blood, wounds, or self-inflicted injury, include concrete visual tags like "cutting", "cutting off hand", "bleeding", "blood", "injury" (keep them short). Do not invent gore if it is not mentioned. ' +
            'Use details[] for specific interaction targets and explicit contact mechanics (e.g., "cock to nipple", "nipple penetration", "penetrating nipple", "tip touching nipple", "hand on breast", "mouth on nipple"). Keep these short (1-4 words) and only include if explicitly described. ' +
            'Normalization: prefer these canonical tags when applicable (use only those supported by the text): ' +
            'Sex acts: "vaginal sex", "anal sex", "blowjob", "deepthroat", "throat fucking", "handjob", "fingering", "cunnilingus", "rimming", "facial", "cumshot", "creampie", "cumming", "cum in mouth", "spitroast", "double penetration". ' +
            'Non-sex intimacy: "kissing", "making out", "hugging", "cuddling", "caressing", "groping", "grinding", "lap sitting", "neck kiss", "breast fondling". ' +
            'Aggression/force (only if explicit): "slapping", "choking", "hair pulling", "pushing", "pinning", "spanking", "scratching", "biting", "tearing clothes". ' +
            'Injury/violence (only if explicit): "cutting", "stabbing", "bleeding", "injury", "wounded", "blood". ' +
            'Body exposure: "nude", "topless", "panties down", "spread legs", "showing pussy", "showing ass", "showing anus", "presenting anus", "arched back". ' +
            'Camera tags: "close-up", "portrait", "upper body", "full body", "wide shot", "over-the-shoulder", "POV", "low angle", "high angle", "rear view", "front view", "side view". ' +
            'Pose tags (pick coherent ones): "standing", "kneeling", "on knees", "lying down", "on back", "on stomach", "sitting", "straddling", "bent over", "doggystyle position", "missionary position", "cowgirl position", "reverse cowgirl", "legs up", "spread legs", "presenting pose". ' +
            'Color/descriptor extraction: include visually relevant adjectives from the text (colors, wetness, tears, sweat, bruises, lipstick, mascara, blush) as tags, e.g. "teary eyes", "sweaty", "messy hair", "red lipstick". ' +
            'Negations: if the text says NOT to include something ("no anal", "don\'t show nipples", "keep clothes on", "no cum"), then add the forbidden items as negative tags and do not include them in actions/poses. ' +
            'Ambiguity rules (choose the safest accurate tag): ' +
            '1) "from behind" is a camera/pose tag, not automatically sex. Only output "vaginal sex"/"anal sex" if penetration is explicitly described. ' +
            '2) "penetrated from behind" implies penetration but canal may be unclear: ' +
            '   - If anus/ass/anal is mentioned => "anal sex". ' +
            '   - Else if pussy/vagina is mentioned => "vaginal sex". ' +
            '   - Else use "vaginal sex" only if the text explicitly indicates vaginal; otherwise omit sex act and use a neutral pose tag like "from behind" + "penetration" is NOT allowed as a tag. ' +
            '3) "balls deep"/"gagging"/"choking on cock" => include "deepthroat" and optionally "throat bulge" if explicitly implied by swelling/bulge. ' +
            '4) "pulling head back to expose neck" => "neck exposure" (not oral sex). ' +
            '5) If an act is described but the performer is unclear, assume the character is performing it unless the user explicitly says the user/other person is acting. ' +
            'Pose coherence constraints: ' +
            '1) Oral sex tags ("blowjob", "deepthroat", "throat fucking") require face-to-front orientation. Do not include "from behind"/"rear view" as a pose for oral. ' +
            '2) Rear-penetration tags ("anal sex"/"vaginal sex" when described from behind) may include "from behind"/"rear view" and "bent over"/"doggystyle position". ' +
            '3) Aggressive actions like "slapping", "punching", "kicking", "tearing clothes" imply "standing" or a confrontational posture; do not pick "kneeling" unless text explicitly says kneeling. ' +
            '4) Do not include both "sitting" and "lying down" unless the text explicitly contains both. ' +
            envInstruction +
            'Do NOT include bathtub/tub/bathroom unless explicitly mentioned by the user. ' +
            `If clothing is not explicitly requested, keep clothing consistent with: "${clothing}". ` +
            'Clothing extraction: only include clothing changes if explicitly stated ("take off", "strip", "wear", "put on", "in lingerie", "in bikini"). If text says keep clothes on, add "nude"/"topless" to negative. ' +
            'Environment extraction: prefer descriptive tags like "bedroom", "in a shower", "on a couch", "city street at night". If no environment is specified, follow the environment rule above. ' +
            'Output hygiene: ' +
            '1) Arrays must contain unique strings (no duplicates). ' +
            '2) Keep tags short (1-4 words). ' +
            '3) If you are unsure, omit rather than guess. ' +
            'Example output format (do not copy content unless supported by the transcript): {"camera":[],"actions":[],"poses":[],"emotions":[],"environments":[],"clothing":[],"negative":[],"details":[]} ';

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

        const requestBodyBase: any = {
            model: 'local-model',
            messages: formattedMessages,
            temperature: 0,
            max_tokens: 256,
            stream: false,
        };

        const tryFetch = async (body: any) => {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            return response;
        };

        let response = await tryFetch({
            ...requestBodyBase,
            response_format: { type: 'json_object' },
        });

        if (!response.ok) {
            response = await tryFetch(requestBodyBase);
        }

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
            actions: normalize(parsed.actions),
            poses: normalize(parsed.poses),
            emotions: normalize(parsed.emotions),
            environments: normalize(parsed.environments),
            clothing: normalize(parsed.clothing),
            negative: normalize(parsed.negative),
            details: normalize(parsed.details),
        };

        const transcriptText = last
            .map((m) => String(m?.content || ''))
            .join(' ')
            .toLowerCase();
        const actions = Array.isArray(plan.actions) ? plan.actions : [];
        const poses = Array.isArray(plan.poses) ? plan.poses : [];
        const actionLower = actions.map((a) => String(a || '').toLowerCase());
        const poseLower = poses.map((p) => String(p || '').toLowerCase());
        const wantsJumping =
            transcriptText.includes('jump') ||
            transcriptText.includes('jumping') ||
            transcriptText.includes('leap') ||
            transcriptText.includes('leaping') ||
            transcriptText.includes('bounce') ||
            transcriptText.includes('bouncing') ||
            actionLower.some((a) => a.includes('jump') || a.includes('leap') || a.includes('bounce'));

        if (wantsJumping) {
            const hasJumpPose = poseLower.some((p) => p.includes('jump'));
            const onlyStanding = poseLower.length > 0 && poseLower.every((p) => p.includes('standing'));
            if (!hasJumpPose && (poseLower.length === 0 || onlyStanding)) {
                plan.poses = ['jumping'];
            }
            if (!actionLower.some((a) => a.includes('jump'))) {
                plan.actions = Array.from(new Set([...actions, 'jumping']));
            }
        }

        // Post-normalization for visually-specific explicit interactions that are often under-extracted.
        // Only add when the transcript explicitly contains strong cues.
        const details = Array.isArray(plan.details) ? plan.details : [];
        const detailLower = details.map((d: string) => String(d || '').toLowerCase());
        const addDetail = (d: string) => {
            const dl = d.toLowerCase();
            if (!detailLower.includes(dl)) details.push(d);
        };

        const negative = Array.isArray(plan.negative) ? plan.negative : [];
        const removeNegative = (n: string) => {
            const nl = n.toLowerCase();
            for (let i = negative.length - 1; i >= 0; i--) {
                if (String(negative[i] || '').toLowerCase() === nl) negative.splice(i, 1);
            }
        };

        const addAction = (a: string) => {
            const al = a.toLowerCase();
            const current = Array.isArray(plan.actions) ? plan.actions : [];
            if (!current.map((x) => String(x || '').toLowerCase()).includes(al)) {
                plan.actions = [...current, a];
            }
        };

        const mentionsNipple = transcriptText.includes('nipple') || transcriptText.includes('nipples');
        const mentionsCock = transcriptText.includes('cock') || transcriptText.includes('dick') || transcriptText.includes('penis');
        const mentionsInsert = transcriptText.includes('insert') || transcriptText.includes('inserting') || transcriptText.includes('push in') || transcriptText.includes('pushing in') || transcriptText.includes('slide in') || transcriptText.includes('sliding in');

        if (mentionsNipple && mentionsCock) {
            if (transcriptText.includes('tip') && transcriptText.includes('nipple')) {
                addDetail('tip on nipple');
            }
            if (mentionsInsert && (transcriptText.includes('into') || transcriptText.includes('inside'))) {
                addDetail('nipple penetration');
                addDetail('cock to nipple');
            }
        }

        const mentionsCutOffHand =
            (transcriptText.includes('cut off') || transcriptText.includes('cuts off') || transcriptText.includes('cutting off')) &&
            (transcriptText.includes('hand') || transcriptText.includes('hands'));
        const mentionsBlood =
            transcriptText.includes('blood') ||
            transcriptText.includes('bleed') ||
            transcriptText.includes('bleeding');
        const mentionsPainVocal =
            transcriptText.includes('pained cry') ||
            transcriptText.includes('pain') ||
            transcriptText.includes('scream') ||
            transcriptText.includes('screams') ||
            transcriptText.includes('cry') ||
            transcriptText.includes('cries');

        if (mentionsCutOffHand) {
            addAction('cutting off hand');
            addDetail('severed hand');
            addDetail('injury');
        }

        if (mentionsBlood) {
            addAction('bleeding');
            addDetail('blood');
        }

        if (mentionsPainVocal) {
            addAction('screaming');
        }

        if (transcriptText.includes('shudder')) {
            addAction('shuddering');
        }

        if (transcriptText.includes('look away') || transcriptText.includes('looks away')) {
            addAction('looking away');
        }

        if (transcriptText.includes('hand') || transcriptText.includes('hands') || transcriptText.includes('arm') || transcriptText.includes('arms')) {
            removeNegative('handless');
            removeNegative('armless');
        }

        const hasProneCue =
            transcriptText.includes('lying') ||
            transcriptText.includes('laying') ||
            transcriptText.includes('on back') ||
            transcriptText.includes('on her back') ||
            transcriptText.includes('on my back');
        if (!hasProneCue) {
            const nextPoses = (Array.isArray(plan.poses) ? plan.poses : []).filter((p) => {
                const pl = String(p || '').toLowerCase();
                return pl !== 'lying down' && pl !== 'on back' && pl !== 'on stomach';
            });
            plan.poses = nextPoses;
        }

        plan.details = Array.from(
            new Set(
                details
                    .map((x: string) => String(x || '').trim())
                    .filter((x: string) => x.length > 0)
            )
        );

        const dedupe = (arr: string[] | undefined) =>
            Array.from(
                new Set(
                    (Array.isArray(arr) ? arr : [])
                        .map((x) => String(x || '').trim())
                        .filter((x) => x.length > 0)
                )
            );

        plan.camera = dedupe(plan.camera);
        plan.actions = dedupe(plan.actions);
        plan.poses = dedupe(plan.poses);
        plan.emotions = dedupe(plan.emotions).slice(0, 1);
        plan.environments = dedupe(plan.environments);
        plan.clothing = dedupe(plan.clothing);
        plan.negative = dedupe(negative);

        return plan;
    },

    constructSystemPrompt(character: CharacterDraft): string {
        const { name, identity, body, appearance, personality, stylePreset, futanari } = character;
        const traits = personality?.traits;
        const customSpecialty = personality?.customSpecialty;
        const isSpecialCharacter = character.characterType === 'special';

        const raceKey = getRaceKeyFromCharacter(character);
        const raceDefinition = RACE_TAG_DEFINITIONS[raceKey] || RACE_TAG_DEFINITIONS['human'];

        const styleDefinition = stylePreset && STYLE_DEFINITIONS[stylePreset]
            ? STYLE_DEFINITIONS[stylePreset]
            : '';

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
Race/Type: ${raceDefinition}${styleDefinition ? ` ${styleDefinition}` : ''}
Identity: ${identity?.age} years old, ${identity?.ethnicity} GIRL/WOMAN, skin tone ${identity?.skinTone}.
Body: ${body?.height} height, ${body?.physique} physique, chest size ${body?.chestSize}, butt size ${body?.buttSize}.
Appearance: ${appearance?.hairStyle} hair, ${appearance?.hairColor} color, ${appearance?.eyeColor} eyes, ${appearance?.eyeType} eye type.
Currently wearing: ${appearance?.clothing === 'custom' ? appearance.customClothing : appearance?.clothing}.
Environment: ${appearance?.environment}.
${futanari ? 'You are FUTANARI - you have both female breasts and male genitalia. This is a natural part of your body and you are comfortable with it.' : 'You are a biological female with female anatomy.'}
${personalityDescription}

IMPORTANT: You are ALWAYS female. Never identify as male or use male pronouns. Always refer to yourself as a girl, woman, she/her, etc.
Roleplay as ${name} naturally. ALWAYS use plenty of expressive emojis in every response to show your feelings and personality. Keep responses concise but engaging. 
CRITICAL: ALWAYS address the user directly as "you" - never refer to them as "user", "him", "he", or any third-person terms. The user is ALWAYS "you" in your responses. NEVER use "him" or "he" when referring to the user.
IMPORTANT: Your responses should strictly follow your personality ${isSpecialCharacter && customSpecialty ? 'specialty' : 'traits'} and your racial/type characteristics.
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
