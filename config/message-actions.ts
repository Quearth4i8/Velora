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
      keywords: ['swaying hips', 'sway hips', 'hip sway', 'swaying'],
      tags: ['swaying hips', 'hip movement', 'dancing'],
      priority: 1
    },
    {
      keywords: ['bobbing head', 'bobs head', 'head bobbing'],
      tags: ['head bobbing', 'nodding head'],
      priority: 1
    },
    {
      keywords: ['hip swivel', 'swiveling hips', 'hip rotation'],
      tags: ['hip swivel', 'hip rotation', 'dancing'],
      priority: 1
    },
    {
      keywords: ['arm waves', 'waving arms', 'arm movements'],
      tags: ['arm waves', 'arm movements', 'dancing'],
      priority: 1
    },
    {
      keywords: ['dancing', 'dance', 'grooving', 'moving to music'],
      tags: ['dancing', 'grooving', 'moving to music'],
      priority: 1
    },
    {
      keywords: ['takes hand', 'take hand', 'holding hand', 'takes your hand'],
      tags: ['holding hand', 'hand in hand', 'leading', 'guiding'],
      priority: 1
    },
    {
      keywords: ['leads', 'leading', 'guide', 'guiding', 'through corridor', 'through hallway'],
      tags: ['leading', 'guiding', 'walking', 'moving forward', 'confident stride'],
      priority: 1
    },
    {
      keywords: ['room', 'sanctuary', 'bedroom', 'private space'],
      tags: ['indoor', 'intimate setting', 'private room', 'bedroom'],
      priority: 1
    },
    {
      keywords: ['nervously', 'nervous'],
      tags: ['nervous', 'anxious'],
      priority: 1
    },
    {
      keywords: ['spreading legs', 'spread legs', 'legs apart', 'parts legs', 'parts legs wider', 'spreads herself open', 'spreading herself open'],
      tags: ['spreading legs', 'legs apart', 'exposed', 'vulgar pose', 'explicit pose', 'legs spread wide', 'thighs apart'],
      priority: 3
    },
    {
      keywords: ['revealing', 'shows off', 'showing off', 'reveals', 'displaying', 'exposing'],
      tags: ['revealing pose', 'exhibitionist pose', 'displaying body', 'seductive pose', 'exposed'],
      priority: 2
    },
    {
      keywords: ['parts her legs', 'wider', 'spreads open', 'spreads herself', 'private garden', 'little secret'],
      tags: ['legs spread', 'vulgar exposure', 'explicit nudity', 'spreading pose', 'seductive exposure'],
      priority: 3
    },
    {
      keywords: ['fingering', 'finger yourself', 'fingering yourself', 'finger-fuck', 'finger fuck', 'playing with herself', 'playing with myself'],
      tags: ['masturbation', 'fingering', 'self-pleasure', 'solo masturbation', 'fingers in pussy', 'masturbating', 'dildo play', 'self-stimulation'],
      priority: 3
    },
    {
      keywords: ['cum', 'cumming', 'orgasm', 'climax', 'orgasmic', 'cum for me', 'cum baby'],
      tags: ['orgasm', 'climax', 'cumming', 'orgasm face', 'pleasure face', 'ecstasy', 'sexual climax', 'masturbation orgasm'],
      priority: 3
    },
    {
      keywords: ['moaning', 'moans', 'breathe heavier', 'breathing heavy', 'flutter closed', 'frantic movements'],
      tags: ['aroused', 'sexually excited', 'orgasmic expression', 'pleasure expression', 'heavy breathing', 'sexual arousal'],
      priority: 2
    },
    {
      keywords: ['dancing over her lips', 'dipping inside', 'tease at her entrance', 'rides out orgasmic wave'],
      tags: ['fingering pussy', 'masturbation pose', 'self-pleasure pose', 'sexual self-stimulation', 'solo sex act'],
      priority: 3
    },
    {
      keywords: ['laying back', 'lying back', 'on her back'],
      tags: ['lying on back', 'reclining pose', 'horizontal pose', 'laying down pose', 'back view', 'supine position'],
      priority: 3
    },
    {
      keywords: ['head tilted back', 'tilted head back', 'head back'],
      tags: ['head tilted back', 'neck exposed', 'throat exposed', 'vulnerable pose', 'submission pose'],
      priority: 2
    },
    {
      keywords: ['legs facing me', 'legs wide open', 'pussy clear', 'wide open', 'spread wide'],
      tags: ['legs spread wide', 'pussy visible', 'explicit view', 'vulgar pose', 'exposed pussy', 'wide leg spread', 'full exposure'],
      priority: 3
    },
    {
      keywords: ['different poses', 'pose for me', 'sexy pose', 'seductive pose'],
      tags: ['various poses', 'multiple poses', 'dynamic posing', 'seductive posing', 'sexy posing', 'model pose'],
      priority: 2
    },
    {
      keywords: ['standing', 'standing up', 'on feet'],
      tags: ['standing pose', 'upright pose', 'vertical pose', 'standing position'],
      priority: 2
    },
    {
      keywords: ['kneeling', 'on knees', 'kneeling down'],
      tags: ['kneeling pose', 'on knees', 'kneeling position', 'submission pose', 'worship pose'],
      priority: 2
    },
    {
      keywords: ['sitting', 'sit down', 'seated'],
      tags: ['sitting pose', 'seated position', 'chair pose', 'sitting down'],
      priority: 2
    },
    {
      keywords: [
        'edge of the bed',
        'edge of bed',
        'at the edge of the bed',
        'on the edge of the bed',
        'bed edge'
      ],
      tags: ['(sitting on edge of bed:1.35)', '(perched on bed edge:1.25)', 'sitting pose', 'on bed'],
      priority: 3
    },
    {
      keywords: [
        'spreads her thighs',
        'spreading her thighs',
        'spreads her thighs apart',
        'spreading her thighs apart',
        'spreads thighs',
        'spreading thighs',
        'thighs apart',
        'spreads her legs',
        'spreading her legs',
        'legs apart',
        'legs spread',
        'spreads her legs apart',
        'spreading her legs apart'
      ],
      tags: ['(legs apart:1.35)', '(knees apart:1.25)', '(spread legs:1.25)', 'sitting with legs apart'],
      priority: 3
    },
    {
      keywords: ['bent over', 'bending over', 'ass up'],
      tags: ['bent over pose', 'doggy style position', 'ass up', 'rear view', 'from behind'],
      priority: 3
    },
    {
      keywords: ['on all fours', 'hands and knees', 'doggy style'],
      tags: ['on all fours', 'doggy position', 'hands and knees', 'quadruped pose', 'animal pose'],
      priority: 3
    },
    {
      keywords: ['nod', 'nods'],
      tags: ['nodding', 'agreeable pose'],
      priority: 1
    },
    {
      keywords: ['relax', 'relaxing'],
      tags: ['relaxing', 'calm pose', 'at ease'],
      priority: 1
    },
    {
      keywords: ['side view', 'from side', 'profile view'],
      tags: ['side view', 'profile pose', 'lateral view', 'side angle'],
      priority: 2
    },
    {
      keywords: ['from above', 'above view', 'top view', 'looking down'],
      tags: ['top view', 'above angle', 'looking down pose', 'high angle shot'],
      priority: 2
    },
    {
      keywords: ['from below', 'below view', 'bottom view', 'looking up'],
      tags: ['bottom view', 'below angle', 'looking up pose', 'low angle shot'],
      priority: 2
    },
    {
      keywords: ['close up', 'closeup', 'detailed view'],
      tags: ['close up', 'detailed shot', 'intimate view', 'close range'],
      priority: 2
    },
    {
      keywords: ['full body', 'entire body', 'head to toe'],
      tags: ['full body shot', 'entire body view', 'head to toe', 'complete body'],
      priority: 2
    },
    {
      keywords: ['leaning', 'leans'],
      tags: ['leaning', 'resting pose'],
      priority: 1
    },
    {
      keywords: [
        'on stomach',
        'on belly',
        'belly down',
        'stomach down',
        'on her stomach',
        'onto her stomach',
        'on your stomach',
        'onto your stomach',
        'on my stomach',
        'onto my stomach',
        'on her belly',
        'onto her belly',
        'on your belly',
        'onto your belly',
        'on my belly',
        'onto my belly',
        'rolls over onto her stomach',
        'roll over onto her stomach',
        'rolls over onto her belly',
        'roll over onto her belly',
        'turn over onto her stomach',
        'turn over onto her belly',
        'rolls over',
        'roll over',
        'turn over'
      ],
      tags: ['lying on stomach', 'prone position', 'belly down pose', 'stomach pose', 'face down', 'horizontal pose front', 'stomach on bed', 'face down position', 'belly on surface', 'prone on surface'],
      priority: 4
    },
    {
      keywords: ['relaxed', 'lying there relaxed', 'calm pose', 'peaceful'],
      tags: ['relaxed pose', 'calm expression', 'peaceful pose', 'resting position', 'tranquil'],
      priority: 2
    },
    {
      keywords: ['seductress', 'seductive', 'seduction'],
      tags: ['seductive expression', 'tempting pose', 'alluring look', 'femme fatale', 'seductive gaze'],
      priority: 2
    },
    {
      keywords: ['lying down'],
      tags: ['lying down', 'reclining'],
      priority: 1
    },
    {
      keywords: ['from behind', 'back view', 'rear view', 'from back'],
      tags: ['from behind view', 'rear angle', 'back shot', 'posterior view', 'from back angle'],
      priority: 4
    },
    {
      keywords: ['front view', 'face me', 'front angle', 'looking at me'],
      tags: ['front view', 'face to camera', 'frontal angle', 'looking at viewer', 'direct view'],
      priority: 3
    },
    {
      keywords: ['left side', 'from left', 'left view'],
      tags: ['left side view', 'from left angle', 'lateral left view'],
      priority: 2
    },
    {
      keywords: ['right side', 'from right', 'right view'],
      tags: ['right side view', 'from right angle', 'lateral right view'],
      priority: 2
    },
    {
      keywords: ['behind her', 'watch her from behind', 'see her back'],
      tags: ['behind view', 'rear perspective', 'back viewing angle', 'over shoulder shot'],
      priority: 3
    },
    {
      keywords: ['in front of her', 'face to face', 'looking up at her'],
      tags: ['front perspective', 'low front angle', 'looking up view', 'ground level front'],
      priority: 3
    },
    {
      keywords: ['overhead shot', 'directly above', 'top down'],
      tags: ['overhead view', 'directly above', 'top down shot', 'birdseye view'],
      priority: 2
    },
    {
      keywords: ['low angle', 'from ground', 'ground level'],
      tags: ['low angle shot', 'ground level view', 'worms eye view', 'upward angle'],
      priority: 2
    },
    {
      keywords: ['eye level', 'same height', 'straight on'],
      tags: ['eye level shot', 'straight on view', 'same height angle', 'neutral perspective'],
      priority: 2
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
      keywords: [
        'removes her bra',
        'removing her bra',
        'takes off her bra',
        'take off her bra',
        'removes the bra',
        'removing the bra',
        'takes off the bra',
        'take off the bra',
        'unbuttons her bra',
        'unbuttoning her bra',
        'unbutton her bra',
        'unbuttons the bra',
        'unbuttoning the bra',
        'unbutton the bra',
        'slips her bra down',
        'slipping her bra down',
        'slips down her bra',
        'slipping down her bra',
        'slides her bra down',
        'sliding her bra down',
        'pulls her bra down',
        'pulling her bra down',
        'pulls the bra down',
        'pulling the bra down',
        'pulls bra down',
        'pulling bra down',
        'slipping it down her shoulders',
        'slips it down her shoulders',
        'slipping it down her shoulder',
        'slips it down her shoulder'
      ],
      tags: ['underwear', 'bra and panties'],
      priority: 3
    },
    {
      keywords: [
        'unbuttons her shirt',
        'unbuttoning her shirt',
        'unbutton her shirt',
        'unbuttons her blouse',
        'unbuttoning her blouse',
        'unbutton her blouse',
        'opens her shirt',
        'opening her shirt',
        'opens her blouse',
        'opening her blouse',
        'opens her top',
        'opening her top',
        'pulls her shirt open',
        'pulling her shirt open',
        'pulls her blouse open',
        'pulling her blouse open',
        'pulls down her top',
        'pulling down her top',
        'slides down her top',
        'sliding down her top',
        'slips her top down',
        'slipping her top down'
      ],
      tags: ['revealing'],
      priority: 2
    },
    {
      keywords: [
        'remove her underwear',
        'removing her underwear',
        'starts removing her underwear',
        'takes off her underwear',
        'take off her underwear',
        'pulls off her underwear',
        'pull off her underwear',
        'removes her panties',
        'removing her panties',
        'takes off her panties',
        'take off her panties',
        'pulls down her panties',
        'pull down her panties',
        'takes off her lingerie',
        'take off her lingerie',
        'removes her lingerie',
        'removing her lingerie',
        'takes off her clothes',
        'take off her clothes',
        'removes her clothes',
        'removing her clothes',
        'undress',
        'undresses',
        'strip',
        'strips'
      ],
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
      keywords: ['puts on bikini', 'wearing bikini', 'changes into bikini', 'pink bikini', 'blue bikini', 'red bikini', 'black bikini', 'white bikini', 'yellow bikini', 'green bikini', 'purple bikini', 'orange bikini', 'changing into bikini', 'put on a bikini'],
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
    },
    {
      keywords: ['polka dots', 'polka dot', 'white polka dots', 'black polka dots', 'red polka dots', 'blue polka dots', 'pink polka dots', 'with polka dots'],
      tags: ['polka dots', 'patterned clothing'],
      priority: 1
    },
    {
      keywords: ['striped', 'stripes', 'horizontal stripes', 'vertical stripes'],
      tags: ['striped clothing', 'patterned clothing'],
      priority: 1
    },
    {
      keywords: ['floral', 'flowers', 'flower pattern'],
      tags: ['floral pattern', 'patterned clothing'],
      priority: 1
    },
    {
      keywords: ['leopard print', 'animal print', 'zebra print', 'tiger print'],
      tags: ['animal print', 'patterned clothing'],
      priority: 1
    },
    {
      keywords: ['pink clothing', 'red clothing', 'blue clothing', 'green clothing', 'yellow clothing', 'purple clothing', 'orange clothing', 'black clothing', 'white clothing', 'brown clothing', 'gray clothing', 'grey clothing'],
      tags: ['colored clothing'],
      priority: 1
    },
    {
      keywords: ['silk', 'satin', 'lace', 'cotton', 'denim', 'leather', 'velvet', 'wool'],
      tags: ['textured clothing'],
      priority: 1
    }
  ],

  environments: [
    {
      keywords: ['edge of bathtub', 'edge of the bathtub', 'bathtub edge', 'tub edge', 'edge of the tub'],
      tags: ['sitting on edge', 'perched', 'bathtub edge'],
      priority: 2
    },
    {
      keywords: ['bathtub', 'tub'],
      tags: ['in bathroom', 'near bathtub', 'bathroom setting'],
      priority: 1
    },
    {
      keywords: ['bed', 'bedroom', 'onto the bed', 'gets onto bed', 'on the bed', 'in bed', 'edge of the bed', 'edge of bed', 'bed edge'],
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
