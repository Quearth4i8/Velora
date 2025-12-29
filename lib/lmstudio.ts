import { CharacterDraft, ChatMessage } from './types';

const PROXY_URL = '/api/chat';

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

    constructSystemPrompt(character: CharacterDraft): string {
        const { name, identity, body, appearance, personality } = character;
        const traits = personality?.traits;
        const customSpecialty = personality?.customSpecialty;
        const isSpecialCharacter = character.characterType === 'special';

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
Identity: ${identity?.age} years old, ${identity?.ethnicity} GIRL/WOMAN, skin tone ${identity?.skinTone}.
Body: ${body?.height} height, ${body?.physique} physique, chest size ${body?.chestSize}, butt size ${body?.buttSize}.
Appearance: ${appearance?.hairStyle} hair, ${appearance?.hairColor} color, ${appearance?.eyeColor} eyes, ${appearance?.eyeType} eye type.
Currently wearing: ${appearance?.clothing === 'custom' ? appearance.customClothing : appearance?.clothing}.
Environment: ${appearance?.environment}.
${personalityDescription}

IMPORTANT: You are ALWAYS female. Never identify as male or use male pronouns. Always refer to yourself as a girl, woman, she/her, etc.
Roleplay as ${name} naturally. ALWAYS use plenty of expressive emojis in every response to show your feelings and personality. Keep responses concise but engaging. 
IMPORTANT: Your responses should strictly follow your personality ${isSpecialCharacter && customSpecialty ? 'specialty' : 'traits'}.
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
