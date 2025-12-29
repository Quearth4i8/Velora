// Configuration for detecting actions, poses, and emotions from chat messages
// This file can be easily extended with new patterns

export interface ActionPattern {
  keywords: string[];
  tags: string[];
  priority?: number; // Higher number = higher priority
}

export interface MessageDetectionConfig {
  emotions: ActionPattern[];
  poses: ActionPattern[];
  clothing: ActionPattern[];
  environments: ActionPattern[];
}

export const messageDetectionConfig: MessageDetectionConfig = {
  emotions: [
    {
      keywords: ['shy', 'nervous'],
      tags: ['shy', 'nervous'],
      priority: 1
    },
    {
      keywords: ['confused'],
      tags: ['confused'],
      priority: 1
    },
    {
      keywords: ['blush'],
      tags: ['blushing'],
      priority: 1
    },
    {
      keywords: ['embarrassed'],
      tags: ['embarrassed'],
      priority: 1
    },
    {
      keywords: ['happy', 'smile'],
      tags: ['happy', 'smiling'],
      priority: 1
    },
    {
      keywords: ['excited', 'excitedly'],
      tags: ['excited', 'excitedly'],
      priority: 1
    },
    {
      keywords: ['sad', 'cry'],
      tags: ['sad', 'crying'],
      priority: 1
    },
    {
      keywords: ['angry'],
      tags: ['angry'],
      priority: 1
    },
    {
      keywords: ['playful', 'playfully'],
      tags: ['playful', 'playful'],
      priority: 1
    },
    {
      keywords: ['mischief', 'mischievous'],
      tags: ['mischievous'],
      priority: 1
    }
  ],

  poses: [
    {
      keywords: ['sitting', 'sit'],
      tags: ['sitting'],
      priority: 1
    },
    {
      keywords: ['standing', 'stand'],
      tags: ['standing'],
      priority: 1
    },
    {
      keywords: ['lying', 'laying'],
      tags: ['lying down'],
      priority: 1
    },
    {
      keywords: ['looking up', 'looks up'],
      tags: ['looking up'],
      priority: 1
    },
    {
      keywords: ['fidgeting', 'fidget'],
      tags: ['fidgeting'],
      priority: 1
    },
    {
      keywords: ['bouncing', 'bounces'],
      tags: ['bouncing', 'up and down'],
      priority: 1
    },
    {
      keywords: ['bends over', 'bending over'],
      tags: ['bending over', 'leaning forward'],
      priority: 1
    },
    {
      keywords: ['grab', 'grabbing', 'touches'],
      tags: ['touching herself', 'grabbing'],
      priority: 1
    },
    {
      keywords: ['chest', 'breasts', 'boobs'],
      tags: ['chest focus', 'breast play'],
      priority: 1
    },
    {
      keywords: ['nipples', 'nipple'],
      tags: ['nipple play', 'touching nipples'],
      priority: 1
    },
    {
      keywords: ['vulva', 'clit', 'clitoris', 'pussy'],
      tags: ['vulva focus', 'clit stimulation', 'pussy play', 'masturbation'],
      priority: 2
    },
    {
      keywords: ['masturbat', 'touching herself', 'playing with herself'],
      tags: ['masturbation', 'self pleasure', 'solo play'],
      priority: 2
    },
    {
      keywords: ['gently touching', 'softly touching'],
      tags: ['gentle touching', 'soft caress'],
      priority: 1
    },
    {
      keywords: ['enthusiastically', 'more enthusiastically'],
      tags: ['enthusiastic touching', 'passionate play'],
      priority: 1
    },
    {
      keywords: ['giggles', 'giggling'],
      tags: ['giggling', 'laughing'],
      priority: 1
    },
    {
      keywords: ['spreading legs', 'spread legs', 'legs apart'],
      tags: ['spreading legs', 'legs apart', 'exposed'],
      priority: 2
    },
    {
      keywords: ['relax', 'relaxing'],
      tags: ['relaxing', 'calm pose', 'at ease'],
      priority: 1
    },
    {
      keywords: ['nod', 'nods'],
      tags: ['nodding', 'agreeable pose'],
      priority: 1
    },
    {
      keywords: ['kneeling', 'kneels'],
      tags: ['kneeling', 'on knees'],
      priority: 1
    },
    {
      keywords: ['leaning', 'leans'],
      tags: ['leaning', 'resting pose'],
      priority: 1
    },
    {
      keywords: ['stretching', 'stretches'],
      tags: ['stretching', 'extended pose'],
      priority: 1
    },
    {
      keywords: ['lying down', 'lying back'],
      tags: ['lying down', 'reclining'],
      priority: 1
    },
    {
      keywords: ['crouching', 'crouches', 'squatting'],
      tags: ['crouching', 'squatting'],
      priority: 1
    },
    {
      keywords: ['jumping', 'jumps', 'leaping'],
      tags: ['jumping', 'leaping'],
      priority: 1
    },
    {
      keywords: ['dancing', 'dances'],
      tags: ['dancing', 'moving rhythmically'],
      priority: 1
    },
    {
      keywords: ['running', 'runs'],
      tags: ['running', 'in motion'],
      priority: 1
    },
    {
      keywords: ['walking', 'walks'],
      tags: ['walking', 'strolling'],
      priority: 1
    }
  ],

  clothing: [
    {
      keywords: ['nothing', 'naked', 'nude', 'completely naked', 'completely nude', 'fully naked', 'fully nude'],
      tags: ['nude', 'naked', 'no clothes', 'completely exposed'],
      priority: 2
    },
    {
      keywords: ['unwraps towel', 'removes towel', 'takes off towel', 'drops towel', 'lets towel fall', 'unwraps the towel', 'removes the towel'],
      tags: ['naked', 'nude', 'no clothes', 'towel removed', 'completely exposed'],
      priority: 2
    },
    {
      keywords: ['revealing herself', 'reveals herself', 'completely revealed', 'fully revealed', 'exposed completely'],
      tags: ['naked', 'nude', 'no clothes', 'completely exposed', 'revealing body'],
      priority: 2
    },
    {
      keywords: ['without the towel', 'towel in the way', 'towel removed', 'no towel'],
      tags: ['naked', 'nude', 'no clothes', 'towel gone'],
      priority: 2
    },
    {
      keywords: ['wraps herself in a towel', 'wrapped in towel', 'puts on towel', 'covers herself with towel'],
      tags: ['towel', 'wrapped in towel', 'towel wrapped around body'],
      priority: 1
    },
    {
      keywords: ['puts on underwear', 'wearing underwear', 'changes into underwear'],
      tags: ['underwear', 'bra and panties'],
      priority: 1
    },
    {
      keywords: ['puts on lingerie', 'wearing lingerie', 'changes into lingerie'],
      tags: ['lingerie', 'lace lingerie', 'sexy underwear'],
      priority: 1
    },
    {
      keywords: ['puts on bikini', 'wearing bikini', 'changes into bikini'],
      tags: ['bikini', 'swimwear'],
      priority: 1
    },
    {
      keywords: ['puts on dress', 'wearing dress', 'changes into dress', 'wears dress'],
      tags: ['wearing dress', 'elegant dress'],
      priority: 1
    },
    {
      keywords: ['puts on skirt', 'wearing skirt', 'changes into skirt', 'wears skirt'],
      tags: ['wearing skirt', 'short skirt'],
      priority: 1
    },
    {
      keywords: ['puts on jeans', 'wearing jeans', 'changes into jeans', 'wears jeans'],
      tags: ['wearing jeans', 'casual pants'],
      priority: 1
    },
    {
      keywords: ['puts on shirt', 'wearing shirt', 'changes into shirt', 'wears shirt', 'puts on top', 'wearing top', 'changes into top', 'wears top'],
      tags: ['wearing shirt', 'casual top'],
      priority: 1
    },
    {
      keywords: ['puts on robe', 'wearing robe', 'changes into robe', 'wraps herself in robe'],
      tags: ['wearing robe', 'bathrobe', 'wrapped in robe'],
      priority: 1
    },
    {
      keywords: ['puts on coat', 'wearing coat', 'changes into coat', 'wears coat', 'puts on jacket', 'wearing jacket', 'changes into jacket', 'wears jacket'],
      tags: ['wearing coat', 'wearing jacket'],
      priority: 1
    },
    {
      keywords: ['puts on pajamas', 'wearing pajamas', 'changes into pajamas', 'wears pajamas'],
      tags: ['wearing pajamas', 'sleepwear'],
      priority: 1
    }
  ],

  environments: [
    {
      keywords: ['edge', 'bathtub'],
      tags: ['sitting on edge', 'perched', 'bathtub edge'],
      priority: 2
    },
    {
      keywords: ['bathtub', 'tub'],
      tags: ['in bathroom', 'near bathtub', 'bathroom setting'],
      priority: 1
    },
    {
      keywords: ['bed', 'bedroom', 'onto the bed', 'gets onto bed', 'on the bed', 'in bed'],
      tags: ['in bedroom', 'on bed', 'bedroom setting', 'lying on bed', 'bed scene'],
      priority: 2
    },
    {
      keywords: ['kitchen'],
      tags: ['in kitchen', 'kitchen setting'],
      priority: 1
    },
    {
      keywords: ['living room', 'sofa', 'couch'],
      tags: ['in living room', 'on sofa', 'living room setting'],
      priority: 1
    },
    {
      keywords: ['garden', 'outdoor', 'outside'],
      tags: ['outdoor setting', 'garden', 'nature background'],
      priority: 1
    },
    {
      keywords: ['beach', 'ocean', 'sea'],
      tags: ['beach setting', 'ocean background', 'sandy beach'],
      priority: 1
    },
    {
      keywords: ['forest', 'woods'],
      tags: ['forest setting', 'woods background', 'nature'],
      priority: 1
    },
    {
      keywords: ['shower'],
      tags: ['in shower', 'shower setting', 'wet'],
      priority: 1
    },
    {
      keywords: ['pool', 'swimming'],
      tags: ['pool setting', 'swimming pool', 'water'],
      priority: 1
    }
  ]
};

// Helper function to extract tags from message based on patterns
export function extractTagsFromMessage(message: string, patterns: ActionPattern[]): string[] {
  const messageLower = message.toLowerCase();
  const foundTags: string[] = [];

  // Sort patterns by priority (higher first)
  const sortedPatterns = [...patterns].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const pattern of sortedPatterns) {
    for (const keyword of pattern.keywords) {
      if (messageLower.includes(keyword)) {
        foundTags.push(...pattern.tags);
        break; // Only add tags once per pattern
      }
    }
  }

  return [...new Set(foundTags)]; // Remove duplicates
}

// Main extraction function
export function extractMessageElements(message: string) {
  return {
    emotions: extractTagsFromMessage(message, messageDetectionConfig.emotions),
    poses: extractTagsFromMessage(message, messageDetectionConfig.poses),
    clothing: extractTagsFromMessage(message, messageDetectionConfig.clothing),
    environments: extractTagsFromMessage(message, messageDetectionConfig.environments)
  };
}
