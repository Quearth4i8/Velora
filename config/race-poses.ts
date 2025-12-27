import { AspectRatioId } from './aspect-ratios';

type RacePoseDefinition = {
  portrait: string[];
  landscape: string[];
  square: string[];
  cinematic: string[];
  mobile: string[];
  wide: string[];
};

export const HAND_POSE_VARIATIONS_GENERIC: string[] = [
  'arms relaxed at sides, natural hands',
  'one hand on hip, other hand relaxed',
  'arms crossed, hands tucked in',
  'hands gently clasped in front',
  'hands behind back, shoulders relaxed',
  'one hand touching cheek, thoughtful pose',
  'one hand playing with hair, casual pose',
  'hands holding a small object, natural grip',
  'arms raised above head, hands relaxed',
  'hands resting on thighs, elegant posture',
];

export const HAND_POSE_VARIATIONS_ARACHNE: string[] = [
  'hands resting on thighs, hands off the ground',
  'arms crossed, hands off the ground',
  'one hand on hip, other hand holding silk thread',
  'hands gently clasped at chest, hands off the ground',
  'one hand touching cheek, other hand relaxed, hands off the ground',
  'holding a strand of silk between fingers, hands off the ground',
  'hands behind back, poised upper body, hands off the ground',
  'hands resting on knees, upright posture, hands off the ground',
];

type RacePoses = Record<string, RacePoseDefinition>;

// Default poses for normal species (from aspect-ratios.ts)
const DEFAULT_POSES: RacePoseDefinition = {
  portrait: [
    'standing gracefully, full body portrait, elegant posture',
    'sitting elegantly, full body visible, relaxed pose',
    'walking forward, dynamic full body stride',
    'leaning slightly, three-quarter view, natural stance',
    'arms crossed, confident pose, full body view',
    'hands in pockets, casual stance, complete body',
    'one hand on hip, playful pose, full portrait',
    'looking up slightly, dreamy expression, full body',
  ],
  landscape: [
    'lying on her side, full body visible, head resting on arm, relaxed and natural pose',
    'reclining gracefully on her back, arms above head, legs slightly bent, full body in frame',
    'lying in a lush meadow, entire body shown, one knee raised, peaceful expression',
    'curled up slightly on her side, full body portrait, cozy and comfortable position',
    'stretched out leisurely on the ground, arms behind head, full body visible',
    'lounging naturally on soft grass, one leg extended, the other bent, complete body view',
    'resting on stomach, chin propped on hands, legs kicked up behind, full body shot',
    'sitting with legs extended forward, leaning back on hands, full body visible',
    'sitting sideways with legs tucked to one side, graceful full body pose',
    'kneeling gently, sitting back on heels, full body in view',
    'leaning against a tree or rock, one leg bent, full body shown',
    'sitting cross-legged, hands resting on knees, entire body framed',
    'walking gracefully toward the viewer, full body stride, gentle motion',
    'standing with weight on one leg, hip cocked, full body visible',
    'turning slightly to look over shoulder, full body three-quarter view',
    'reaching upward toward the sky, arms raised, full body stretched',
    'floating gently above ground, lying horizontally in air, full body visible',
  ],
  square: [
    'standing centered, balanced pose, full body in frame',
    'sitting cross-legged, centered composition, complete body view',
    'kneeling pose, centered framing, full body visible',
    'lying curled up, centered position, entire body shown',
    'standing with arms outstretched, balanced full body pose',
    'sitting with legs folded, centered meditation pose',
    'crouching low, centered stance, full body portrait',
    'standing on one leg, yoga pose, centered composition',
  ],
  cinematic: [
    'lying on her side, full body visible, head resting on arm, relaxed and natural pose, gentle curves',
    'reclining gracefully on her back, arms above head, legs slightly bent, full body in frame, elegant and serene',
    'lying in a lush meadow, entire body shown, one knee raised, peaceful and dreamy expression',
    'curled up slightly on her side, full body portrait, cozy and comfortable position, tail gently wrapped around if applicable',
    'stretched out leisurely on the ground, arms behind head, full body visible, relaxed and carefree stance',
    'lounging naturally on soft grass, one leg extended, the other bent, complete body view, casual and inviting',
    'resting on stomach, chin propped on hands, legs kicked up behind, full body shot, playful and relaxed',
    'sitting with legs extended forward, leaning back on hands, full body visible, relaxed posture',
    'sitting sideways with legs tucked to one side, tail visible, graceful full body pose, elegant and calm',
    'kneeling gently, sitting back on heels, full body in view, serene and traditional pose',
    'leaning against a tree or rock, one leg bent, full body shown, contemplative and natural',
    'sitting cross-legged, hands resting on knees, entire body framed, peaceful meditative pose',
    'walking gracefully toward the viewer, full body stride, gentle motion, wind-swept hair',
    'standing with weight on one leg, hip cocked, full body visible, confident relaxed stance',
    'turning slightly to look over shoulder, full body three-quarter view, elegant twist, flowing hair',
    'reaching upward toward the sky, arms raised, full body stretched, wondrous and free pose',
    'floating gently above ground, lying horizontally in air, full body visible, ethereal and dreamy',
    'lying near a calm lake, reflection visible, full body on the shore, tranquil and reflective',
    'resting among wildflowers, full body surrounded by blooms, soft natural lighting, whimsical pose',
    'basking in sunlight on a hill, lying back with arms spread, complete body basking, warm and joyful',
    'gazing at distant horizon, sitting with knees drawn up, full body silhouette against sky, introspective mood',
  ],
  mobile: [
    'standing tall, vertical full body pose, elegant posture',
    'sitting gracefully, full body portrait, relaxed position',
    'walking upward, dynamic vertical pose, full body in frame',
    'leaning against wall, vertical stance, complete body view',
    'stretching upward, arms raised, full body vertical pose',
    'kneeling gracefully, vertical composition, full body visible',
    'crouching low, vertical framing, entire body shown',
    'standing with one leg raised, ballet pose, full body portrait',
  ],
  wide: [
    'standing centered, balanced horizontal pose, full body visible',
    'lying horizontally, stretched out pose, complete body in frame',
    'sitting with legs spread, stable wide stance, full body view',
    'reclining sideways, horizontal composition, entire body shown',
    'crouching with arms wide, balanced pose, full body portrait',
    'lying on back, arms outstretched, horizontal full body pose',
    'kneeling with arms extended, wide stable stance, complete body view',
    'standing in archer pose, horizontal position, full body visible',
  ],
};

// Race-specific poses
export const RACE_POSES: RacePoses = {
  // Arachne-specific poses
  arachne: {
    portrait: [
      'standing confidently, full body visible, elegant posture, spider lower body poised, upright orientation',
      'sitting upright on a web, hands resting on thighs, calm expression, spider legs arranged gracefully, facing forward',
      'perched on a web strand, balanced pose, three-quarter full body view, spider legs tucked neatly, upright',
      'crouched low with arms crossed, hands off the ground, full body visible, spider legs positioned elegantly, normal orientation',
      'leaning against a tree trunk, arms folded, three-quarter full body view, spider lower body visible, upright',
      'kneeling with hands resting on thighs, poised and elegant, spider legs arranged symmetrically, facing viewer',
      'standing with one hand on hip, confident pose, full body view, spider legs in natural position, upright stance',
      'sitting on a rock ledge, upper body visible, full body portrait, spider lower body relaxed, normal orientation',
      'clinging to a vertical wall, spider legs anchored, upright pose, full body visible, facing outward',
      'perched on a rooftop edge, city skyline behind, spider legs gripping surface, confident stance, upright',
      'standing gracefully on web, arms at sides, full body visible, spider legs spread elegantly, normal upright pose',
    ],
    landscape: [
      'reclining on a web hammock, relaxed pose, full body view, spider legs draped naturally',
      'lying on a large web, arms behind head, legs slightly bent, spider legs spread comfortably',
      'curled up on a silk platform, full body portrait, spider legs tucked around body',
      'stretched out on a web blanket, arms relaxed, spider legs extended naturally',
      'lounging on a silk sheet, one leg bent, spider legs arranged in decorative pattern',
      'resting on stomach, chin propped on hands, spider legs kicked back gently',
      'lying among silk threads, peaceful expression, spider legs positioned elegantly',
      'reclining against silk pillows, relaxed pose, spider legs spread comfortably',
      'perched between two walls on a web bridge, spider legs gripping both sides, full body in frame',
      'climbing across a wall-side web, diagonal composition, spider legs anchored, dynamic pose',
      'sitting on a rooftop web nest, wide city background, spider legs arranged elegantly',
    ],
    square: [
      'centered on a web, balanced pose, full body in square frame, spider legs symmetric',
      'sitting cross-legged on silk, centered composition, spider legs tucked neatly',
      'perched in web center, symmetric pose, full body visible, spider legs arranged evenly',
      'crouching in web middle, centered stance, spider legs positioned radially',
      'standing in web center, arms outstretched, balanced spider leg arrangement',
      'kneeling on silk platform, centered meditation pose, spider legs folded gracefully',
      'clinging to a flat wall surface, centered composition, spider legs spread evenly, full body visible',
    ],
    cinematic: [
      'standing confidently on a dramatic web, full body visible, elegant posture, spider lower body poised against backdrop',
      'sitting upright on an intricate web, hands resting on thighs, calm expression, spider legs arranged gracefully, cinematic lighting',
      'reclining on a massive web hammock, relaxed pose, full body view, spider legs draped naturally, epic background',
      'crouched low on a web strand, arms crossed, hands off the ground, full body visible, spider legs positioned elegantly, dramatic setting',
      'leaning against ancient tree with web support, arms folded, three-quarter full body view, spider lower body visible, atmospheric lighting',
      'perched on a web overlooking scenery, balanced pose, three-quarter full body view, spider legs tucked neatly, vast background',
      'lying on a sprawling web platform, peaceful expression, spider legs positioned elegantly, expansive environment',
      'standing on web at sunset, confident pose, full body view, spider legs in natural position, golden hour lighting',
      'clinging to a towering wall, moonlit atmosphere, spider legs gripping stone, cinematic perspective',
      'perched on a rooftop web, neon city lights below, spider legs anchored, dramatic angle',
      'hanging from silk threads above a street, full body silhouette, cinematic lighting and depth',
    ],
    mobile: [
      'standing tall on web, vertical full body pose, spider legs positioned elegantly',
      'sitting gracefully on silk strand, vertical full body portrait, relaxed position',
      'perched upright on web, vertical pose, spider legs tucked neatly',
      'crouching vertically on web, mobile framing, spider legs arranged symmetrically',
      'standing with arms up on web, vertical composition, spider lower body visible',
      'kneeling gracefully on silk, vertical pose, spider legs folded elegantly',
      'climbing a vertical wall, upward motion, spider legs anchored, full body vertical framing',
    ],
    wide: [
      'standing centered on wide web, balanced horizontal pose, spider legs spread naturally',
      'lying horizontally on large web, stretched out pose, spider legs extended comfortably',
      'sitting with spider legs spread, stable wide stance, full body view',
      'reclining sideways on web platform, horizontal composition, spider legs arranged decoratively',
      'crouching with spider legs wide, balanced pose, full body portrait',
      'standing on web with arms wide, horizontal position, spider legs in natural arrangement',
      'perched across a wide rooftop web, panoramic skyline, spider legs gripping edges, full body visible',
    ],
  },
};

// Helper function to get random pose for a race and aspect ratio
export const getRandomRacePose = (race: string, aspectRatio: AspectRatioId): string => {
  const racePoses = RACE_POSES[race.toLowerCase()];
  const poses = racePoses ? racePoses[aspectRatio] : DEFAULT_POSES[aspectRatio];

  if (!poses || poses.length === 0) {
    return DEFAULT_POSES[aspectRatio][Math.floor(Math.random() * DEFAULT_POSES[aspectRatio].length)];
  }

  return poses[Math.floor(Math.random() * poses.length)];
};

// Helper function to get all poses for a race
export const getRacePoses = (race: string): RacePoseDefinition => {
  return RACE_POSES[race.toLowerCase()] || DEFAULT_POSES;
};

// Helper function to check if a race has custom poses
export const hasCustomPoses = (race: string): boolean => {
  return race.toLowerCase() in RACE_POSES;
};
