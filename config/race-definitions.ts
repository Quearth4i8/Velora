import { CharacterStyle } from '@/lib/types';

type RaceDefinition = {
  label: string;
  description?: string;
  mainTag?: string;
  specialPrompt?: string;
  specialNegativePrompt?: string;
  loraNames?: string[];
  loraName?: string;
  loraWeight?: number | null;
  imageSrc?: string;
};

export const RACE_DEFINITIONS: Record<CharacterStyle, { races: Record<string, RaceDefinition> }> = {
  [CharacterStyle.ANIME]: {
    races: {
      human: {
        label: 'Human',
        description: 'Default human appearance',
        loraName: undefined,
        loraWeight: null,
      },
      angel: {
        label: 'Angel',
        mainTag: 'angel',
        specialPrompt: 'long shiny white wings, barefoot, angel_wings',
        loraName: 'angel_wings.safetensors',
        loraWeight: 0.8,
      },
      elf: {
        label: 'Elf',
        mainTag: 'elf',
        specialPrompt:
          'long pointed ears, longer ears, slender figure, long legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: undefined,
        loraWeight: null,
      },
      fairy: {
        label: 'Fairy',
        mainTag: 'fairy',
        specialPrompt:
          'butterfly wings, blue wings, fairy, fairymge, pointy ears, fairy wings, tiny fairy, petite fairy, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'fairy.safetensors',
        loraWeight: 1,
      },
    },
  },
  [CharacterStyle.ARTISTIC]: {
    races: {
      lamia: {
        label: 'Lamia',
        mainTag: 'lamia',
        specialPrompt:
          'lamia, snake woman, anime fantasy girl, serpent tail, mythical creature, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'lamia.safetensors',
        loraWeight: 0.7,
      },
      harpy: {
        label: 'Harpy',
        mainTag: 'harpy',
        specialPrompt:
          'Harpy, wings, talons, monster girl, winged arms, feathered wings, bird legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'harpy.safetensors',
        loraWeight: 0.7,
      },
      centaur: {
        label: 'Centaur',
        mainTag: 'centaur',
        specialPrompt:
          'deer taur, centaur, monster girl, human upper body, deer lower body, quadruped, (four legs:1.4), (four hooves:1.3), visible hind legs, detailed fur, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'centaur.safetensors',
        loraWeight: 0.8,
      },
      'goblin-girl': {
        label: 'Goblin Girl',
        mainTag: 'goblin girl',
        specialPrompt:
          'female goblin, colored skin, freckles, long pointed ears, wide hips, large breasts, sharp teeth, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'goblina.safetensors',
        loraWeight: 0.9,
      },
      elf: {
        label: 'Elf',
        mainTag: 'elf',
        specialPrompt:
          'elf, pointy ears, light skin, elfmge, blue eyes, long hair, green hair, ahoge',
        loraName: 'elf.safetensors',
        loraWeight: 0.85,
      },
      fairy: {
        label: 'Fairy',
        mainTag: 'fairy',
        specialPrompt:
          'butterfly wings, blue wings, fairy, fairymge, pointy ears, fairy wings, tiny fairy, petite fairy, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'fairy.safetensors',
        loraWeight: 1,
      },
      demon: {
        label: 'Demon',
        mainTag: 'demon',
        specialPrompt:
          'demonmge, demon girl, monster girl, (demon horns:1.25), horns match skin, same color horns, (bat wings:1.15), (spade-tipped tail:1.2), prehensile tail, claws, sharp fangs, slit pupils, colored skin, dark aura, gothic fantasy, high detail, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        specialNegativePrompt:
          'extra horns, multiple horns, deformed horns, missing horns, extra wings, multiple wings, extra tail, multiple tails, duplicated limbs, asymmetrical face',
        loraName: 'demon.safetensors',
        loraWeight: 0.9,
      },
      succubus: {
        label: 'Succubus',
        mainTag: 'succubus',
        specialPrompt:
          'succubus, demon girl, monster girl, pointy ears, demon tail, demon horns, colored skin, colored sclera, black sclera, spade-tipped tail, prehensile tail, claws, dark purple tail, no wings, small horns, womb tattoo, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraNames: ['demon.safetensors', 'womb_tattoo.safetensors'],
        loraName: undefined,
        loraWeight: 0.8,
      },
    },
  },
  [CharacterStyle.REALISTIC]: {
    races: {
      human: {
        label: 'Human',
        description: 'Default human appearance',
        loraName: undefined,
        loraWeight: null,
      },
      goth: {
        label: 'Goth',
        mainTag: 'goth',
        specialPrompt:
          'seductive goth girl, pale porcelain skin, intense smoky eyes with sharp eyeliner, long dark lashes, deep crimson lips, beautiful intricate detailed eyes, perfectly symmetrical piercing gaze, crystal-clear pupils reflecting dim light, mysterious and alluring expression, raven black hair cascading over shoulders, dark Victorian lace choker, subtle gothic makeup accentuating flawless features, captivating and enigmatic beauty',
        loraName: 'goth.safetensors',
        loraWeight: 0.75,
      },
      vampire: {
        label: 'Vampire',
        mainTag: 'vampire',
        specialPrompt:
          'Vampire Fangs, cute freckled vampire woman, Extremely high-resolution details, photographic, realism pushed to extreme, fine texture, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'vampire.safetensors',
        loraWeight: 0.8,
      },
      'cyberpunk-girl': {
        label: 'Cyberpunk Girl',
        mainTag: 'cyberpunk girl',
        specialPrompt:
          'cyberpunk girls style, neon lights, high detail, vibrant colors, cybernetic fashion, gritty sci-fi aesthetic, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'cyber.safetensors',
        loraWeight: 0.6,
      },
    },
  },
  [CharacterStyle.SPECIAL]: {
    races: {
      arachne: {
        label: 'Arachne',
        mainTag: 'arachne',
        specialPrompt:
          'arachnecpt, arachne, spider girl, monster girl, arthropod abdomen, (eight legs:1.4), (spider legs:1.35), (no human legs:1.3), detailed carapace, silk threads, upright upper body, hands visible and free, (facing viewer:1.2), (normal orientation:1.2)',
        specialNegativePrompt:
          'human legs, human feet, human lower body, bipedal, two legs, standing on two legs, extra human limbs, fused legs, missing spider legs, deformed legs, extra abdomen, asymmetrical body, duplicated torso, hands on ground, all fours, crawling pose, crouching with hands down, kneeling on hands, hands touching floor, on all fours pose, quadruped stance, upside down, inverted, hanging, bottom view, underside view, from below, looking up at camera, head at bottom, feet at top, reversed orientation, flipped',
        loraName: 'arachne.safetensors',
        loraWeight: 1,
      },
      centaur: {
        label: 'Centaur',
        mainTag: 'centaur',
        specialPrompt:
          'deer taur, centaur, monster girl, human upper body, deer lower body, quadruped, (four legs:1.4), (four hooves:1.3), visible hind legs, detailed fur, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'centaur.safetensors',
        loraWeight: 0.8,
      },
      harpy: {
        label: 'Harpy',
        mainTag: 'harpy',
        specialPrompt:
          'Harpy, wings, talons, monster girl, winged arms, feathered wings, bird legs, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'harpy.safetensors',
        loraWeight: 0.7,
      },
      lamia: {
        label: 'Lamia',
        mainTag: 'lamia',
        specialPrompt:
          'lamia, snake woman, anime fantasy girl, serpent tail, mythical creature, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'lamia.safetensors',
        loraWeight: 0.7,
      },
      'slime-girl': {
        label: 'Slime Girl',
        mainTag: 'slime girl',
        specialPrompt:
          'slime girl, slime (substance), fully transparent body, uniform translucent slime, consistent transparency throughout body, no opaque patches, entire body made of slime, homogeneous slime texture, (transparent body:1.3), (see-through:1.2), (translucent skin:1.2), blue slime covering entire body, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'slime_girl.safetensors',
        loraWeight: 1,
      },
      'goblin-girl': {
        label: 'Goblin Girl',
        mainTag: 'goblin girl',
        specialPrompt:
          'female goblin, colored skin, freckles, long pointed ears, wide hips, large breasts, sharp teeth, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraName: 'goblina.safetensors',
        loraWeight: 0.9,
      },
      demon: {
        label: 'Demon',
        mainTag: 'demon',
        specialPrompt:
          'demonmge, demon girl, monster girl, (demon horns:1.25), horns match skin, same color horns, (bat wings:1.15), (spade-tipped tail:1.2), prehensile tail, claws, sharp fangs, slit pupils, colored skin, dark aura, gothic fantasy, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        specialNegativePrompt:
          'extra horns, multiple horns, deformed horns, missing horns, extra wings, multiple wings, extra tail, multiple tails, duplicated limbs, asymmetrical face',
        loraName: 'demon.safetensors',
        loraWeight: 0.9,
      },
      succubus: {
        label: 'Succubus',
        mainTag: 'succubus',
        specialPrompt:
          'succubus, demon girl, monster girl, pointy ears, demon tail, demon horns, colored skin, spade-tipped tail, prehensile tail, claws,  no wings, small horns, womb tattoo, beautiful detailed eyes, perfect symmetrical eyes, clear pupils, sharp eye details, expressive eyes',
        loraNames: ['demon.safetensors', 'womb_tattoo.safetensors'],
        loraName: undefined,
        loraWeight: 0.8,
      },
    },
  },
};
