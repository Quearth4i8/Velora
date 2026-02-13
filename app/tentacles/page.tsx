'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import type { CharacterDraft, CharacterImage } from '@/lib/types';
import { buildTentaclesPrompts } from '@/lib/tentaclesPrompt';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { Download, ZoomIn, Trash2, RefreshCw, Waves } from 'lucide-react';
import { useDialog } from '@/components/ui/DialogProvider';

type TentacleToolId = 'wrap' | 'tease' | 'bind' | 'lift' | 'ink' | 'pulse';

const TOOLS: Array<{ id: TentacleToolId; label: string; intensityBase: number; promptBase: string; presetId: TentaclesPresetId }> = [
  { id: 'wrap', label: 'Wrap', intensityBase: 55, promptBase: 'tentacles coiling around her body', presetId: 'wrap_arms' },
  { id: 'tease', label: 'Tease', intensityBase: 35, promptBase: 'tentacles teasing and caressing', presetId: 'teasing_touch' },
  { id: 'bind', label: 'Bind', intensityBase: 70, promptBase: 'restrained, wrists and ankles bound by tentacles', presetId: 'restraint' },
  { id: 'lift', label: 'Lift', intensityBase: 60, promptBase: 'lifted and suspended pose', presetId: 'lift_pose' },
  { id: 'ink', label: 'Ink Mist', intensityBase: 45, promptBase: 'inky mist, bioluminescent particles', presetId: 'ink_mist' },
  { id: 'pulse', label: 'Pulse', intensityBase: 50, promptBase: 'pulsing rhythm, dynamic motion blur', presetId: 'dynamic_motion' },
];

const TENTACLE_IMAGES = [
  '/tentacles/1.png',
  '/tentacles/2.png',
  '/tentacles/3.png',
  '/tentacles/4.png',
  '/tentacles/5.png',
  '/tentacles/6.png',
  '/tentacles/7.png',
];

const TENTACLE_BOTTOM_FOOTER = '/tentacles/bottom.jpg';

type TentaclesPresetId =
  | 'wrap_arms'
  | 'wrap_legs'
  | 'teasing_touch'
  | 'restraint'
  | 'slime_tentacles'
  | 'ink_mist'
  | 'lift_pose'
  | 'surrounded'
  | 'multiple_tentacles'
  | 'coiling'
  | 'pull_close'
  | 'face_covered'
  | 'wet_gloss'
  | 'dripping_slime'
  | 'bioluminescent_glow'
  | 'fog'
  | 'dramatic_lighting'
  | 'cinematic_angle'
  | 'close_up'
  | 'low_angle'
  | 'backlit_silhouette'
  | 'dynamic_motion'
  | 'hair_grab'
  | 'handheld_camera'
  | 'depth_of_field'
  | 'tentacle_crown'
  | 'chains'
  | 'shibari_rope'
  | 'kneeling_pose'
  | 'arched_back'
  | 'torn_fabric'
  | 'ripped_stockings'
  | 'scratch_marks'
  | 'nipple_insertion'
  | 'nipple_inflation'
  | 'nipple_milking'
  | 'lactation'
  | 'belly_bulge'
  | 'oviposition'
  | 'egg_belly'
  | 'egg_birth'
  | 'monster_birth'
  | 'mouth_play'
  | 'impregnation'
  // New extreme tentacle presets
  | 'huge_tentacles'
  | 'veiny_tentacles'
  | 'glowing_tentacles'
  | 'knotty_tentacles'
  | 'extreme_restraint'
  | 'suspended_air'
  | 'spread_arms_legs'
  | 'arms_behind_back'
  | 'tentacle_pit'
  | 'magic_circle'
  | 'background_tentacles'
  | 'extreme_intensity'
  | 'breast_manipulation'
  | 'breast_fluids'
  | 'extreme_nipple_play'
  | 'extreme_throat'
  | 'emotional_distress'
  | 'extreme_cumshot'
  | 'open_breasts'
  | 'tentacle_penetration'
  | 'bdsm_tentacles';

type PresetCategoryId =
  | 'pose_restraint'
  | 'tentacle_behavior'
  | 'atmosphere'
  | 'cinematography'
  | 'details'
  | 'explicit'
  | 'xray';

type PresetCategory = { id: PresetCategoryId; label: string };

type XRayPartId =
  | 'breasts'
  | 'nipples'
  | 'belly_womb'
  | 'mouth_throat'
  | 'ass_anal';

const XRAY_PARTS: Array<{ id: XRayPartId; label: string; prompt: string }> = [
  { id: 'breasts', label: 'Breasts', prompt: 'breast x-ray, transparent skin, visible breasts, internal view' },
  { id: 'nipples', label: 'Nipples', prompt: 'nipple x-ray, transparent skin, nipples cross-section, internal view' },
  { id: 'belly_womb', label: 'Belly / Womb', prompt: 'womb x-ray, transparent skin, womb visible, belly internal view, uterus, reproductive organs' },
  { id: 'mouth_throat', label: 'Mouth / Throat', prompt: 'throat x-ray, transparent skin, throat view, mouth interior, esophagus visible, tongue visible, oral cavity' },
  { id: 'ass_anal', label: 'Ass / Anal', prompt: 'anal x-ray, transparent skin, pelvis internal view, anal internal view, rectum' },
];

const PRESET_CATEGORIES: PresetCategory[] = [
  { id: 'pose_restraint', label: 'Pose & Restraint' },
  { id: 'tentacle_behavior', label: 'Tentacle Behavior' },
  { id: 'atmosphere', label: 'Atmosphere' },
  { id: 'cinematography', label: 'Cinematography' },
  { id: 'details', label: 'Details' },
  { id: 'explicit', label: 'Explicit' },
  { id: 'xray', label: 'X-ray' },
];

const TENTACLES_PRESETS: Array<{ id: TentaclesPresetId; label: string; prompt: string; category: PresetCategoryId; subcategory?: string }> = [
  // Poses & Restraint
  { id: 'wrap_arms', label: 'Wrap Arms', prompt: 'tentacles wrapping around arms, arms up, restrained', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'wrap_legs', label: 'Wrap Legs', prompt: 'tentacles wrapping around legs, ankles bound, dynamic pose', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'restraint', label: 'Restraint', prompt: 'restrained posture, wrists and ankles secured, controlled pose', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'lift_pose', label: 'Lift Pose', prompt: 'lifted and suspended pose, toes pointed, dramatic composition', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'kneeling_pose', label: 'Kneeling', prompt: 'kneeling pose, shoulders back, submissive posture', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'arched_back', label: 'Arched Back', prompt: 'arched back, chest forward, tense silhouette', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'chains', label: 'Chains', prompt: 'decorative chains, restrained aesthetic, metallic highlights', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'shibari_rope', label: 'Rope', prompt: 'rope harness, intricate knots, restraint aesthetic', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'extreme_restraint', label: 'Extreme Restraint', prompt: 'restrained by tentacles, arms restrained by tentacles, restrained_tentacles, tight bondage', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'suspended_air', label: 'Suspended in Air', prompt: 'suspended in air, suspension, floating, levitating, hanging by tentacles', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'spread_arms_legs', label: 'Spread Arms & Legs', prompt: 'spread arms, outstretched arms, spread legs, forced spread position', category: 'pose_restraint', subcategory: 'Poses & Restraint' },
  { id: 'arms_behind_back', label: 'Arms Behind Back', prompt: 'arms behind back, reverse prayer position, restrained arms', category: 'pose_restraint', subcategory: 'Poses & Restraint' },

  // Tentacle Behavior
  { id: 'teasing_touch', label: 'Teasing Touch', prompt: 'teasing touch, gentle caress, slow tension, seductive atmosphere', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'surrounded', label: 'Surrounded', prompt: 'surrounded by tentacles, encircled, looming shapes', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'multiple_tentacles', label: 'Many Tentacles', prompt: 'multiple tentacles, layered coils, complex shapes', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'coiling', label: 'Coiling', prompt: 'tight coiling, spiral wraps, squeezing embrace', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'pull_close', label: 'Pull Close', prompt: 'pulled close, pinned against rock, controlled movement', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'face_covered', label: 'Face Covered', prompt: 'face partly covered by coils, obscured expression, dramatic mood', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'tentacle_crown', label: 'Tentacle Crown', prompt: 'tentacle crown silhouette, framing the head, elegant menace', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'hair_grab', label: 'Hair Grab', prompt: 'hair pulled back, tense posture, dominant framing', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'dynamic_motion', label: 'Dynamic Motion', prompt: 'dynamic motion, motion blur, dramatic angle', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'huge_tentacles', label: 'Huge Tentacles', prompt: 'huge tentacle, massive tentacles, giant tentacles, enormous tentacles', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'veiny_tentacles', label: 'Veiny Tentacles', prompt: 'veins tentacle, veiny tentacles, throbbing veins, vascular tentacles', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'glowing_tentacles', label: 'Glowing Tentacles', prompt: 'glowing tentacles, bioluminescent tentacles, radiant tentacles, ethereal glow', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },
  { id: 'knotty_tentacles', label: 'Knotty Tentacles', prompt: 'knotty tentacles, knotted tentacles, textured surface, bumpy tentacles', category: 'tentacle_behavior', subcategory: 'Tentacle Behavior' },

  // Atmosphere & Effects
  { id: 'slime_tentacles', label: 'Slime Tentacles', prompt: 'slimy tentacles, glossy wet texture, wet shine', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'dripping_slime', label: 'Dripping Slime', prompt: 'dripping slime, viscous trails, glossy highlights', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'wet_gloss', label: 'Wet Gloss', prompt: 'wet gloss, specular highlights, moisture in the air', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'ink_mist', label: 'Ink Mist', prompt: 'inky mist, dark fog, floating particles', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'bioluminescent_glow', label: 'Bio Glow', prompt: 'bioluminescent glow, neon rim light, glowing spores', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'fog', label: 'Fog', prompt: 'thick fog, volumetric light, moody cave air', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'dramatic_lighting', label: 'Dramatic Light', prompt: 'dramatic lighting, high contrast, sharp shadows', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'backlit_silhouette', label: 'Backlit', prompt: 'backlit silhouette, rim light, strong outline', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'tentacle_pit', label: 'Tentacle Pit', prompt: 'tentacle pit, pit full of tentacles, surrounded by tentacles, tentacle nest', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'magic_circle', label: 'Magic Circle', prompt: 'magic circle, ritual circle, glowing runes, summoning circle, mystical symbols', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },
  { id: 'background_tentacles', label: 'Background Tentacles', prompt: 'background fill tentacle, tentacle background, surrounded by tentacles, tentacle environment', category: 'atmosphere', subcategory: 'Atmosphere & Effects' },

  // Camera & Cinematography
  { id: 'cinematic_angle', label: 'Cinematic', prompt: 'cinematic composition, rule of thirds, film still', category: 'cinematography', subcategory: 'Camera & Cinematography' },
  { id: 'close_up', label: 'Close-Up', prompt: 'close-up framing, intimate crop, skin detail', category: 'cinematography', subcategory: 'Camera & Cinematography' },
  { id: 'low_angle', label: 'Low Angle', prompt: 'low angle shot, looming perspective, powerful framing', category: 'cinematography', subcategory: 'Camera & Cinematography' },
  { id: 'handheld_camera', label: 'Handheld', prompt: 'handheld camera feel, subtle shake, gritty realism', category: 'cinematography', subcategory: 'Camera & Cinematography' },
  { id: 'depth_of_field', label: 'Depth of Field', prompt: 'shallow depth of field, bokeh, subject separation', category: 'cinematography', subcategory: 'Camera & Cinematography' },

  // Details & Extras
  { id: 'torn_fabric', label: 'Torn Fabric', prompt: 'torn fabric scraps, ruined cloth, dramatic texture', category: 'details', subcategory: 'Details & Extras' },
  { id: 'ripped_stockings', label: 'Ripped Stockings', prompt: 'ripped stockings, torn lace, distressed outfit remnants', category: 'details', subcategory: 'Details & Extras' },
  { id: 'scratch_marks', label: 'Scratch Marks', prompt: 'scratch marks on stone, torn marks, signs of struggle', category: 'details', subcategory: 'Details & Extras' },
  { id: 'extreme_intensity', label: 'Extreme Intensity', prompt: 'extremely, extreme intensity, hardcore, brutal, intense', category: 'details', subcategory: 'Details & Extras' },
  { id: 'emotional_distress', label: 'Emotional Distress', prompt: 'look of fear, tears, runny nose, drool, crying, distressed expression', category: 'details', subcategory: 'Details & Extras' },

  // Breasts
  { id: 'nipple_insertion', label: 'Nipple Insertion', prompt: 'tentacles focused on nipples, nipple insertion, nipples teased', category: 'explicit', subcategory: 'Breasts' },
  { id: 'nipple_inflation', label: 'Nipple Inflation', prompt: 'nipple inflation, swollen nipples, tentacles inflating nipples', category: 'explicit', subcategory: 'Breasts' },
  { id: 'nipple_milking', label: 'Nipple Milking', prompt: 'nipple milking, milk leaking, lactation pressure, nipples milked by tentacles', category: 'explicit', subcategory: 'Breasts' },
  { id: 'lactation', label: 'Lactation', prompt: 'lactation, milky nipples, milk dripping, glossy milk', category: 'explicit', subcategory: 'Breasts' },
  { id: 'breast_manipulation', label: 'Breast Manipulation', prompt: 'grabbing breasts, squeezing breasts, bloated breasts, breast manipulation', category: 'explicit', subcategory: 'Breasts' },
  { id: 'breast_fluids', label: 'Breast Fluids', prompt: 'breasts dripping, nipples dripping, breast fluids, nipple fluids', category: 'explicit', subcategory: 'Breasts' },
  { id: 'extreme_nipple_play', label: 'Extreme Nipple Play', prompt: 'nipplepen, nipple penetration, nipple insertion, extreme nipple play', category: 'explicit', subcategory: 'Breasts' },
  { id: 'open_breasts', label: 'Open Breasts', prompt: 'open breasts, exposed breasts, breast exposure, chest exposure', category: 'explicit', subcategory: 'Breasts' },

  // Vagina & Penetration
  { id: 'tentacle_penetration', label: 'Tentacle Penetration', prompt: 'tentacle sex, vaginal penetration, double penetration, tentacle fuck, tentacle insertation', category: 'explicit', subcategory: 'Vagina & Penetration' },

  // Belly & Womb
  { id: 'belly_bulge', label: 'Belly Bulge', prompt: 'belly bulge, inflated belly, tentacles pressing against belly', category: 'explicit', subcategory: 'Belly & Womb' },
  { id: 'oviposition', label: 'Oviposition', prompt: 'oviposition, eggs inside belly, egg laying, egg-filled belly', category: 'explicit', subcategory: 'Belly & Womb' },
  { id: 'egg_belly', label: 'Egg Belly', prompt: 'egg belly, eggs visible under skin, round egg bulges, swollen belly', category: 'explicit', subcategory: 'Belly & Womb' },
  { id: 'egg_birth', label: 'Egg Birth', prompt: 'egg birth, laying eggs, eggs emerging, dripping fluids', category: 'explicit', subcategory: 'Belly & Womb' },
  { id: 'monster_birth', label: 'Monster Birth', prompt: 'monster birth, birthing scene, creature emerging, wet birth fluids', category: 'explicit', subcategory: 'Belly & Womb' },
  { id: 'impregnation', label: 'Impregnation', prompt: 'impregnation, breeding, tentacles filling womb, swollen belly', category: 'explicit', subcategory: 'Belly & Womb' },

  // Mouth & Throat
  { id: 'mouth_play', label: 'Mouth Play', prompt: 'open mouth, tentacle near mouth, saliva strings', category: 'explicit', subcategory: 'Mouth & Throat' },
  { id: 'extreme_throat', label: 'Extreme Throat', prompt: 'extreme deep throat, mouth bulge, throat bulge, esophagus bulge', category: 'explicit', subcategory: 'Mouth & Throat' },

  // Fluids & Cum
  { id: 'extreme_cumshot', label: 'Extreme Fluids', prompt: 'bukkake, facial, excessive cum, cum in mouth, cum drip, cum over, cum in pussy', category: 'explicit', subcategory: 'Fluids & Cum' },

  // BDSM & Domination
  { id: 'bdsm_tentacles', label: 'BDSM Tentacles', prompt: 'bdsm, tentacle bdsm, bondage, submission, domination, power play', category: 'explicit', subcategory: 'BDSM & Domination' },

  // New extreme tentacle presets
];

function toPresetMap(list: typeof TENTACLES_PRESETS) {
  const map = new Map<TentaclesPresetId, (typeof TENTACLES_PRESETS)[number]>();
  for (const p of list) map.set(p.id, p);
  return map;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeToolPrompt(opts: {
  characterName?: string | null;
  tool: TentacleToolId;
  intensity: number;
  consentMode: 'soft' | 'explicit';
}) {
  const name = opts.characterName || 'the character';
  const intensityText = opts.intensity <= 35 ? 'gentle' : opts.intensity <= 65 ? 'firm' : 'intense';

  const consentLine =
    opts.consentMode === 'explicit'
      ? 'Keep it consensual and check in before escalating.'
      : 'Keep it soft, playful, and non-graphic.';

  const toolLine: Record<TentacleToolId, string> = {
    wrap: `Several sleek tentacles coil around ${name} in a slow, controlled embrace.`,
    tease: `A few tentacles trace teasing patterns around ${name}, testing reactions.`,
    bind: `Tentacles secure ${name} in place with confident precision, holding posture.`,
    lift: `Tentacles lift ${name} slightly and reposition them for a dramatic moment.`,
    ink: `A shimmering ink-like mist swirls, dimming the lights and amplifying tension.`,
    pulse: `The tentacles pulse rhythmically, syncing with breath and movement.`,
  };

  return [
    `Roleplay with a modern, cinematic tone.`,
    consentLine,
    `Intensity: ${opts.intensity}/100 (${intensityText}).`,
    toolLine[opts.tool],
    `Describe sensations, atmosphere, and body language — keep it immersive.`
  ].join('\n');
}

export default function TentaclesPage() {
  const dialog = useDialog();
  const [allCharacters, setAllCharacters] = useState<CharacterDraft[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [characterQuery, setCharacterQuery] = useState('');
  const [presetQuery, setPresetQuery] = useState('');
  const [activePresetCategory, setActivePresetCategory] = useState<PresetCategoryId>('pose_restraint');
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'system'; content: string }>>([
    {
      id: 'intro',
      sender: 'system',
      content:
        'Select a character, then use the tentacle tools to generate scene prompts. This is a lightweight interactive playground (no model call yet).'
    }
  ]);

  const [consentMode, setConsentMode] = useState<'soft' | 'explicit'>('soft');
  const [intensity, setIntensity] = useState(45);
  const [activeTool, setActiveTool] = useState<TentacleToolId>('wrap');
  const [autoGenerateFromTools, setAutoGenerateFromTools] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<TentaclesPresetId[]>([]);
  const [selectedXRayParts, setSelectedXRayParts] = useState<XRayPartId[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const { blurNSFW, setBlurNSFW, toggleBlurNSFW } = useBlurNSFW();
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [zoomedImageSource, setZoomedImageSource] = useState<'character' | 'global'>('character');

  const [globalTentacleImages, setGlobalTentacleImages] = useState<CharacterImage[]>([]);
  const imageStoreRef = useRef<CharacterImage[]>([]);
  const [isLoadingGlobalTentacleImages, setIsLoadingGlobalTentacleImages] = useState(false);
  const loadingRef = useRef(false);
  const [globalTentaclePage, setGlobalTentaclePage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

  const [controlTab, setControlTab] = useState<'scene' | 'tools' | 'advanced'>('scene');
  const [resultsTab, setResultsTab] = useState<'character' | 'feed'>('character');
  const [mainTab, setMainTab] = useState<'build' | 'generate' | 'results'>('build');
  const [tabDirection, setTabDirection] = useState<'left' | 'right'>('right');

  const setMainTabWithDirection = (newTab: typeof mainTab) => {
    const order = ['build', 'generate', 'results'];
    const currentIndex = order.indexOf(mainTab);
    const newIndex = order.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 'right' : 'left');
    setMainTab(newTab);
  };

  const [genWidth, setGenWidth] = useState(768);
  const [genHeight, setGenHeight] = useState(1344);
  const [genSteps, setGenSteps] = useState(40);
  const [genCfg, setGenCfg] = useState(7);
  const [genSampler, setGenSampler] = useState('DPM++ 2M Karras');
  const [genSeed, setGenSeed] = useState(-1);
  const [useHires, setUseHires] = useState(false);

  const [showAllSelectedPresets, setShowAllSelectedPresets] = useState(false);
  const [showFullPromptPreview, setShowFullPromptPreview] = useState(false);

  const xrayText = useMemo(() => {
    if (selectedXRayParts.length === 0) return '';
    const partTags = selectedXRayParts
      .map((id) => XRAY_PARTS.find((p) => p.id === id)?.prompt)
      .filter((x): x is string => Boolean(x && x.trim()))
      .map((prompt) => prompt.split(', '))
      .flat()
      .map((t) => t.trim())
      .filter(Boolean);

    // Dedupe base tags that appear on every part
    const baseTags = new Set(['transparent skin']);
    const unique = Array.from(new Set(partTags));
    const deduped = unique.filter((tag) => !baseTags.has(tag));

    // Build final clause: [specific x-ray types], transparent skin, [unique part tags...]
    const final = [...deduped].join(', ');
    return final;
  }, [selectedXRayParts]);

  const composedAction = useMemo(() => {
    const presetText = selectedPresets
      .map((id) => TENTACLES_PRESETS.find((p) => p.id === id)?.prompt)
      .filter((x): x is string => Boolean(x && x.trim()))
      .join(', ');

    const freeText = String(actionInput || '').trim();

    const parts = [presetText, xrayText, freeText].filter((x) => x && x.trim());
    return parts.join(', ');
  }, [actionInput, selectedPresets, selectedXRayParts, xrayText]);

  const toggleXRayPart = (id: XRayPartId) => {
    setSelectedXRayParts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearXRay = () => setSelectedXRayParts([]);

  const presetMap = useMemo(() => toPresetMap(TENTACLES_PRESETS), []);

  const filteredPresetsByCategory = useMemo(() => {
    const q = String(presetQuery || '').trim().toLowerCase();
    const list = !q
      ? TENTACLES_PRESETS
      : TENTACLES_PRESETS.filter((p) => {
          const label = String(p.label || '').toLowerCase();
          const prompt = String(p.prompt || '').toLowerCase();
          return label.includes(q) || prompt.includes(q);
        });

    const grouped = new Map<PresetCategoryId, typeof TENTACLES_PRESETS>();
    for (const p of list) {
      const arr = grouped.get(p.category) || [];
      arr.push(p);
      grouped.set(p.category, arr);
    }
    return grouped;
  }, [presetQuery]);

  const visiblePresets = useMemo(() => {
    if (showAllPresets) return TENTACLES_PRESETS;
    if (presetQuery.trim()) return TENTACLES_PRESETS;
    if (activePresetCategory === 'xray') return [];
    return TENTACLES_PRESETS.filter((p) => p.category === activePresetCategory);
  }, [activePresetCategory, presetQuery, showAllPresets]);

  const togglePreset = (id: TentaclesPresetId) => {
    setSelectedPresets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearPresets = () => setSelectedPresets([]);

  useEffect(() => {
    const load = async () => {
      setLoadingCharacters(true);
      try {
        const [custom, special] = await Promise.all([
          characterAPI.getCharacters(),
          characterAPI.getSpecialCharacters(),
        ]);

        const next: CharacterDraft[] = [];
        if (custom.success && Array.isArray(custom.data)) next.push(...custom.data);
        if (special.success && Array.isArray(special.data)) next.push(...special.data);

        setAllCharacters(next);

        if (!selectedId) {
          const first = next.find((c) => c?.id)?.id;
          if (first) setSelectedId(first);
        }
      } finally {
        setLoadingCharacters(false);
      }
    };

    load();
  }, []);

  const charactersById = useMemo(() => {
    const map = new Map<string, CharacterDraft>();
    for (const c of allCharacters) {
      if (c?.id) map.set(c.id, c);
    }
    return map;
  }, [allCharacters]);

  const selectedCharacter = useMemo(() => {
    if (!selectedId) return null;
    return charactersById.get(selectedId) || null;
  }, [charactersById, selectedId]);

  const filteredCharacters = useMemo(() => {
    const q = String(characterQuery || '').trim().toLowerCase();
    const list = Array.from(charactersById.values());
    if (!q) return list;
    return list.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const archetype = String(c.personality?.archetype || '').toLowerCase();
      const tag = String(c.mainTag || '').toLowerCase();
      return name.includes(q) || archetype.includes(q) || tag.includes(q);
    });
  }, [characterQuery, charactersById]);

  const selectedImage = selectedCharacter?.generation?.generatedImage || '';

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pushMessage = (sender: 'user' | 'system', content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, sender, content },
    ]);
  };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Load character images
  useEffect(() => {
    if (selectedId) {
      loadCharacterImages();
    }
  }, [selectedId]);

  const loadCharacterImages = async () => {
    if (!selectedId) return;
    try {
      const res = await characterAPI.getCharacterImages(selectedId);
      if (res.success && Array.isArray(res.data)) {
        setCharacterImages(res.data);
      }
    } catch {
      setToast('Failed to load images');
    }
  };

  const GLOBAL_TENTACLE_PAGE_SIZE = 16; // 2 rows × 8 columns (2xl screen)

  useEffect(() => {
    const loadGlobalTentacleImages = async (page: number) => {
      const safePage = Math.max(0, Number(page) || 0);
      
      // Prevent race conditions from multiple rapid calls using ref
      if (loadingRef.current) {
        console.log('Already loading, skipping...');
        return;
      }
      
      loadingRef.current = true;
      setIsLoadingGlobalTentacleImages(true);
      console.log(`[LOAD START] Page ${safePage}, showAll=${showAllImages}`);
      
      try {
        if (showAllImages) {
          // Normal pagination for "Show All" mode
          const fetchOffset = safePage * GLOBAL_TENTACLE_PAGE_SIZE;
          const fetchLimit = GLOBAL_TENTACLE_PAGE_SIZE;
          
          console.log(`Loading page ${safePage}, offset ${fetchOffset}, limit ${fetchLimit}, showAll=${showAllImages}`);
          const res = await characterAPI.getAllCharacterImagesPagedGlobal({
            limit: fetchLimit,
            offset: fetchOffset,
          });

          if (!res.success || !Array.isArray(res.data)) {
            console.log('API call failed or returned invalid data');
            setGlobalTentacleImages([]);
            return;
          }

          setGlobalTentacleImages(res.data);
          imageStoreRef.current = res.data;
        } else {
          // For "Tentacles Only" mode, fetch multiple batches to find scattered tentacle images
          // API has max limit of 100 per request, so we make multiple calls
          const BATCH_SIZE = 100;
          const MAX_BATCHES = 10; // Fetch up to 1000 images total
          
          console.log(`Loading tentacles: fetching up to ${BATCH_SIZE * MAX_BATCHES} images in ${MAX_BATCHES} batches`);
          
          let allImages: CharacterImage[] = [];
          
          for (let batch = 0; batch < MAX_BATCHES; batch++) {
            const offset = batch * BATCH_SIZE;
            const res = await characterAPI.getAllCharacterImagesPagedGlobal({
              limit: BATCH_SIZE,
              offset: offset,
            });
            
            if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
              break; // No more images
            }
            
            allImages = [...allImages, ...res.data];
            
            // If we got fewer than BATCH_SIZE results, we've reached the end
            if (res.data.length < BATCH_SIZE) {
              break;
            }
          }
          
          console.log(`Fetched ${allImages.length} total images from all batches`);
          
          // Filter to only tentacle images
          const tentacleKeywords = ['tentacle', 'tentacles', 'extreme_tentacles', '<lora:extreme_tentacles', 'lora:extreme'];
          const allTentacleImages = allImages.filter((img) => {
            const prompt = String(img.generationPrompt || '').toLowerCase();
            const hasTentacle = tentacleKeywords.some(kw => prompt.includes(kw));
            
            // Debug: log first few image prompts to see what we're working with
            if (allImages.indexOf(img) < 5) {
              console.log(`Image ${img.id} prompt:`, prompt.substring(0, 150));
            }
            
            return hasTentacle;
          });
          
          console.log(`Found ${allTentacleImages.length} tentacle images out of ${allImages.length} total`);
          
          // Paginate the filtered results
          const startIndex = safePage * GLOBAL_TENTACLE_PAGE_SIZE;
          const endIndex = startIndex + GLOBAL_TENTACLE_PAGE_SIZE;
          const paginatedTentacles = allTentacleImages.slice(startIndex, endIndex);
          
          console.log(`Showing tentacles ${startIndex} to ${endIndex - 1}, count: ${paginatedTentacles.length}`);
          // Use functional update to avoid stale closure issues
          imageStoreRef.current = paginatedTentacles;
          setGlobalTentacleImages(() => paginatedTentacles);
          // Force re-render to ensure images display
          setRenderTick(t => t + 1);
        }
      } catch (error) {
        console.error('Error loading tentacle images:', error);
        setGlobalTentacleImages([]);
      } finally {
        loadingRef.current = false;
        setIsLoadingGlobalTentacleImages(false);
      }
    };

    loadGlobalTentacleImages(globalTentaclePage);
    
    return () => {
      // Reset loading ref when effect cleans up (important for React StrictMode)
      loadingRef.current = false;
    };
  }, [globalTentaclePage, showAllImages]);

  const tentacleImages = useMemo(() => {
    const tentacleKeywords = ['tentacle', 'tentacles', 'extreme_tentacles', '<lora:extreme_tentacles'];
    return characterImages.filter((img) => {
      const prompt = img.generationPrompt?.toLowerCase() || '';
      return tentacleKeywords.some(kw => prompt.includes(kw));
    });
  }, [characterImages]);

  const zoomImages = useMemo(() => {
    return zoomedImageSource === 'global' ? imageStoreRef.current : tentacleImages;
  }, [zoomedImageSource, tentacleImages, globalTentacleImages]);

  // Keyboard navigation for zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomed) return;
      
      if (e.key === 'Escape') {
        setIsZoomed(false);
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setZoomedImageIndex((prev) => {
          const newIndex = prev - 1;
          return newIndex < 0 ? zoomImages.length - 1 : newIndex;
        });
      }
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setZoomedImageIndex((prev) => {
          const newIndex = prev + 1;
          return newIndex >= zoomImages.length ? 0 : newIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, zoomImages]);

  const handlePreviousImage = () => {
    setZoomedImageIndex((prev) => (prev === 0 ? zoomImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setZoomedImageIndex((prev) => (prev === zoomImages.length - 1 ? 0 : prev + 1));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied');
    } catch {
      setToast('Copy failed');
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setToast('Downloaded');
    } catch {
      setToast('Download failed');
    }
  };

  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const deleteCharacterImageWithModal = async (imageId: string) => {
    const ok = await dialog.confirm({
      title: 'Delete image?',
      message: 'This will permanently delete this image from your library (database + storage). This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    setDeletingImageId(imageId);
    try {
      const result = await characterAPI.deleteCharacterImageFromGallery(imageId);
      if (!result.success) {
        await dialog.alert({ title: 'Error', message: 'Failed to delete image. Please try again.' });
        return;
      }

      setCharacterImages((prev) => prev.filter((img) => img.id !== imageId));
      setToast('Image deleted');
    } catch {
      await dialog.alert({ title: 'Error', message: 'Failed to delete image. Please try again.' });
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDeleteTentacleImage = async (imageId: string) => {
    const ok = await dialog.confirm({
      title: 'Delete image?',
      message: 'This will permanently delete this image from your library (database + storage). This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (!ok) return;

    setDeletingImageId(imageId);
    try {
      const result = await characterAPI.deleteCharacterImageFromGallery(imageId);
      if (!result.success) {
        await dialog.alert({ title: 'Error', message: 'Failed to delete image. Please try again.' });
        return;
      }

      imageStoreRef.current = imageStoreRef.current.filter((img) => img.id !== imageId);
      setGlobalTentacleImages((prev) => prev.filter((img) => img.id !== imageId));
      setRenderTick((t) => t + 1);
      setToast('Image deleted');
    } catch {
      await dialog.alert({ title: 'Error', message: 'Failed to delete image. Please try again.' });
    } finally {
      setDeletingImageId(null);
    }
  };

  const regenerateImage = async (imageId: string) => {
    const image = characterImages.find((img) => img.id === imageId);
    if (!image || !selectedCharacter) return;
    const characterModel = selectedCharacter.generation?.model;
    if (!characterModel) {
      setToast('This character has no base model selected');
      return;
    }
    setGeneratingIds((prev) => new Set(prev).add(imageId));
    try {
      const res = await automatic1111API.generateDirectImage({
        prompt: image.generationPrompt || '',
        negative_prompt: selectedCharacter.generation?.negativePrompt || '',
        width: 512,
        height: 768,
        steps: 30,
        cfg_scale: 6,
        sampler_name: 'Euler a',
        seed: -1,
        model_name: characterModel,
        override_settings: {
          sd_model_checkpoint: characterModel,
        },
      });
      if (res && res.length > 0) {
        await characterAPI.updateCharacterImage(selectedId, res);
        await loadCharacterImages();
        setToast('Regenerated');
      }
    } catch {
      setToast('Regeneration failed');
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const exportSceneText = () => {
    const lines = messages
      .filter((m) => m.sender !== 'system')
      .map((m) => m.content)
      .join('\n\n---\n\n');
    return lines.trim();
  };

  const runTool = async (tool: TentacleToolId) => {
    setActiveTool(tool);
    if (!selectedCharacter) {
      setToast('Select a character first');
      return;
    }
    const characterModel = selectedCharacter.generation?.model;
    if (!characterModel) {
      setToast('This character has no base model selected');
      return;
    }

    const toolConfig = TOOLS.find((t) => t.id === tool);
    if (toolConfig) {
      togglePreset(toolConfig.presetId);
    }

    if (!autoGenerateFromTools) {
      setToast('Tool applied');
      return;
    }

    setIsGenerating(true);
    try {
      const toolConfigLocal = TOOLS.find((t) => t.id === tool);
      const base = toolConfig?.intensityBase ?? 50;
      const blended = clamp(Math.round((intensity + base) / 2), 0, 100);
      const intensityText = blended <= 35 ? 'gentle' : blended <= 65 ? 'firm' : 'intense';
      const consentText = consentMode === 'explicit' ? 'playful and intense' : 'soft and playful';

      const { prompt, negative_prompt } = buildTentaclesPrompts({
        character: selectedCharacter,
        action:
          composedAction ||
          `${toolConfigLocal?.promptBase || ''} ${selectedCharacter.name}, Intensity: ${blended}/100 (${intensityText}), ${consentText}`,
        loraName: 'extreme_tentacles',
        loraWeight: 0.7,
      });

      const res = await automatic1111API.generateDirectImage({
        prompt,
        negative_prompt,
        width: genWidth,
        height: genHeight,
        steps: genSteps,
        cfg_scale: genCfg,
        sampler_name: genSampler,
        seed: genSeed,
        model_name: characterModel,
        override_settings: {
          sd_model_checkpoint: characterModel,
        },
      });

      if (res && res.length > 0) {
        await characterAPI.addCharacterImage(
          selectedId,
          res,
          prompt,
          selectedCharacter.generation?.model ? String(selectedCharacter.generation.model) : undefined,
          selectedCharacter.generation?.style || undefined
        );
        await loadCharacterImages();
        setToast('Image generated');
      }
    } catch {
      setToast('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendCustom = () => {
    const text = String(customInput || '').trim();
    if (!text) return;
    pushMessage('user', text);
    setCustomInput('');
  };

  const generateFromAction = async () => {
    if (!selectedCharacter) {
      setToast('Select a character first');
      return;
    }
    const characterModel = selectedCharacter.generation?.model;
    if (!characterModel) {
      setToast('This character has no base model selected');
      return;
    }

    const { prompt, negative_prompt } = buildTentaclesPrompts({
      character: selectedCharacter,
      action: composedAction,
      loraName: 'extreme_tentacles',
      loraWeight: 0.7,
    });

    setIsGenerating(true);
    try {
      const res = useHires 
        ? await automatic1111API.generateHiresImage({
            prompt,
            negative_prompt,
            width: genWidth,
            height: genHeight,
            steps: genSteps,
            cfg_scale: genCfg,
            sampler_name: genSampler,
            seed: genSeed,
            model_name: characterModel,
            override_settings: {
              sd_model_checkpoint: characterModel,
            },
          })
        : await automatic1111API.generateDirectImage({
            prompt,
            negative_prompt,
            width: genWidth,
            height: genHeight,
            steps: genSteps,
            cfg_scale: genCfg,
            sampler_name: genSampler,
            seed: genSeed,
            model_name: characterModel,
            override_settings: {
              sd_model_checkpoint: characterModel,
            },
          });

      if (res && res.length > 0) {
        // Use the same approach as CharacterGallery - pass base64 directly to addCharacterImage
        try {
          const uploadResult = await characterAPI.addCharacterImage(
            selectedId,
            res, // Pass base64 directly, not URL
            prompt,
            selectedCharacter.generation?.model ? String(selectedCharacter.generation.model) : undefined,
            selectedCharacter.generation?.style || undefined
          );
          
          if (uploadResult.success) {
            await loadCharacterImages();
            setToast(useHires ? 'Hi-res image generated' : 'Image generated');
          } else {
            throw new Error(uploadResult.error);
          }
        } catch (uploadError) {
          console.error('Failed to save generated image:', uploadError);
          setToast(useHires ? 'Hi-res image generated but failed to save' : 'Image generated but failed to save');
        }
      }
    } catch {
      setToast('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCharacter = (id: string) => {
    setSelectedId(id);
    setIsPickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070510] relative overflow-hidden">
      <AnimatedBackground />

      {/* Base background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070510] via-[#0B0A16] to-[#05020C]" />
        <div className="absolute -top-56 -left-56 w-[780px] h-[780px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-64 w-[860px] h-[860px] rounded-full bg-cyan-400/10 blur-[160px]" />
        <div className="absolute -bottom-72 left-1/3 w-[980px] h-[980px] rounded-full bg-purple-500/10 blur-[180px]" />
      </div>

      {/* Bottom background art */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[1] [mask-image:linear-gradient(to_bottom,transparent_0%,black_22%,black_100%)]">
        <img
          src={TENTACLE_BOTTOM_FOOTER}
          alt=""
          className="w-full h-[420px] sm:h-[520px] md:h-[600px] object-cover object-bottom translate-y-16 blur-[1.5px]"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#070510] via-[#070510]/70 to-transparent" />
      </div>

      {/* Tentacle PNG layers (lightweight) */}
      <div className="absolute inset-0 pointer-events-none z-[2] [mask-image:linear-gradient(to_bottom,black_0%,black_78%,transparent_100%)]">
        <motion.img
          src={TENTACLE_IMAGES[0]}
          alt=""
          className="absolute -left-32 top-28 w-[360px] sm:w-[420px] md:w-[520px] opacity-[0.10] mix-blend-screen blur-[2.8px] saturate-100"
          initial={{ y: 0, rotate: -12 }}
          animate={{ y: [0, 10, 0], rotate: [-12, -8, -12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          draggable={false}
        />
        <motion.img
          src={TENTACLE_IMAGES[1]}
          alt=""
          className="absolute right-[-180px] top-12 w-[420px] sm:w-[520px] md:w-[680px] opacity-[0.10] mix-blend-screen blur-[3px] saturate-100 hidden sm:block"
          initial={{ y: 0, rotate: 16 }}
          animate={{ y: [0, 12, 0], rotate: [16, 12, 16] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          draggable={false}
        />
        <motion.img
          src={TENTACLE_IMAGES[2]}
          alt=""
          className="absolute left-[22%] -bottom-64 w-[520px] md:w-[760px] opacity-[0.07] mix-blend-screen blur-[4px] saturate-95 hidden md:block"
          initial={{ y: 0, rotate: 6 }}
          animate={{ y: [0, -10, 0], rotate: [6, 3, 6] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          draggable={false}
        />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full border border-white/10 bg-dark-900/70 backdrop-blur text-white/90 text-sm shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Readability scrim (keeps UI crisp, doesn't touch bottom art area too hard) */}
        <div className="absolute inset-x-0 top-0 h-[560px] pointer-events-none bg-gradient-to-b from-black/55 via-black/25 to-transparent" />
        <Navbar />

        <div className="w-full px-4 sm:px-6 lg:px-10 py-6">
          <div className="w-full max-w-[1440px] mx-auto">

            <Tabs.Root value={mainTab} onValueChange={(v) => setMainTabWithDirection(v as typeof mainTab)} className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-100px)]">
                <div className="lg:col-span-9 flex flex-col min-h-0 relative overflow-hidden">
                  {/* Tab content area - scrollable */}
                  <div className="flex-1 min-h-0 overflow-hidden relative">
                    <AnimatePresence mode="wait" initial={false}>
                      {mainTab === 'build' && (
                        <motion.div
                          key="build"
                          initial={{ opacity: 0, x: -40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="absolute inset-0"
                          style={{ willChange: 'transform, opacity' }}
                        >
                          <motion.div 
                            className="rounded-t-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15, delay: 0.05 }}
                          >
                            <div className="p-3 border-b border-white/10">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <h2 className="text-white font-semibold">Scene Builder</h2>
                                  <span className="text-xs text-white/50">{selectedPresets.length > 0 ? `${selectedPresets.length} selected` : ''}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative w-52">
                                    <input
                                      value={presetQuery}
                                      onChange={(e) => setPresetQuery(e.target.value)}
                                      placeholder="Search tags..."
                                      className="w-full px-3 py-1.5 rounded-xl bg-black/35 border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 text-sm"
                                    />
                                  </div>
                                  {selectedPresets.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={clearPresets}
                                      className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/75 hover:text-white transition text-xs"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="p-3 flex-1 min-h-0 overflow-hidden">
                              <div className="h-full overflow-y-auto pr-1">
                                <div
                                  className={`flex flex-wrap items-center gap-2 mb-3 rounded-2xl border border-white/10 bg-black/15 p-2 transition-opacity duration-150 ${(selectedPresets.length === 0 && selectedXRayParts.length === 0) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                >
                                      {(showAllSelectedPresets ? selectedPresets : selectedPresets.slice(0, 8)).map((id) => {
                                        const p = presetMap.get(id);
                                        if (!p) return null;
                                        return (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => togglePreset(p.id)}
                                            className="px-2.5 py-1 rounded-full text-[11px] border border-fuchsia-300/30 bg-fuchsia-500/10 text-white/90 hover:bg-fuchsia-500/15 transition"
                                          >
                                            {p.label}
                                          </button>
                                        );
                                      })}
                                      {(showAllSelectedPresets ? selectedXRayParts : selectedXRayParts.slice(0, 4)).map((id) => {
                                        const part = XRAY_PARTS.find((p) => p.id === id);
                                        if (!part) return null;
                                        return (
                                          <button
                                            key={`xray_${id}`}
                                            type="button"
                                            onClick={() => toggleXRayPart(id)}
                                            className="px-2.5 py-1 rounded-full text-[11px] border border-cyan-300/20 bg-cyan-500/10 text-white/90 hover:text-white transition"
                                          >
                                            X-ray: {part.label}
                                          </button>
                                        );
                                      })}
                                      {(selectedPresets.length > 8 || selectedXRayParts.length > 4) && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllSelectedPresets((v) => !v)}
                                          className="px-2.5 py-1 rounded-full text-[11px] border border-white/20 bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition"
                                        >
                                          {showAllSelectedPresets ? 'Show Less' : `+${selectedPresets.length - 8 + selectedXRayParts.length - 4} more`}
                                        </button>
                                      )}
                                      <div className="ml-auto flex items-center gap-2">
                                        {selectedPresets.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={clearPresets}
                                            className="px-2.5 py-1 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:text-white transition text-[11px]"
                                          >
                                            Clear
                                          </button>
                                        )}
                                        {selectedXRayParts.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={clearXRay}
                                            className="px-2.5 py-1 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:text-white transition text-[11px]"
                                          >
                                            Clear X-ray
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                {/* Category Tabs - Redesigned */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                  {PRESET_CATEGORIES.map((cat) => {
                                    const active = cat.id === activePresetCategory;
                                    return (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActivePresetCategory(cat.id)}
                                        className={`group relative px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 overflow-hidden ${active
                                          ? 'bg-gradient-to-r from-fuchsia-500/30 to-cyan-500/20 text-white shadow-lg shadow-fuchsia-500/20 border border-fuchsia-400/40'
                                          : 'bg-black/30 text-white/60 hover:text-white/90 border border-white/5 hover:border-white/15 hover:bg-white/5'
                                          }`}
                                      >
                                        <span className="relative z-10 flex items-center gap-1.5">
                                          {active && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-300 animate-pulse" />
                                          )}
                                          {cat.label}
                                        </span>
                                        {active && (
                                          <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-cyan-500/10 to-fuchsia-500/10 opacity-50" />
                                        )}
                                      </button>
                                    );
                                  })}
                                  
                                  <div className="ml-auto flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setShowAllPresets((v) => !v)}
                                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${showAllPresets
                                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                                        : 'bg-black/30 text-white/60 hover:text-white/90 border border-white/5 hover:border-white/15'
                                        }`}
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showAllPresets ? (
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        ) : (
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                      </svg>
                                      {showAllPresets ? 'Focused' : 'Show All'}
                                    </button>
                                  </div>
                                </div>

                                {/* Custom Input */}
                                <div className="relative mb-3">
                                  <textarea
                                    value={actionInput}
                                    onChange={(e) => setActionInput(e.target.value)}
                                    placeholder="Add custom action or extra details..."
                                    rows={1}
                                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/30 text-sm resize-none transition-all"
                                  />
                                </div>

                                {/* Preset Grid - Organized by Subcategory */}
                                {activePresetCategory === 'xray' ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                    {XRAY_PARTS.map((part) => (
                                      <motion.button
                                        key={part.id}
                                        type="button"
                                        onClick={() => toggleXRayPart(part.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`group relative px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-left leading-snug overflow-hidden ${selectedXRayParts.includes(part.id)
                                          ? 'bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 text-white border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                                          : 'bg-black/40 text-white/70 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/10'
                                          }`}
                                      >
                                        {selectedXRayParts.includes(part.id) && (
                                          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                                        )}
                                        {selectedXRayParts.includes(part.id) && (
                                          <span className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent" />
                                        )}
                                        <span className="relative z-10">{part.label}</span>
                                        {!selectedXRayParts.includes(part.id) && (
                                          <span className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                        )}
                                      </motion.button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {(() => {
                                      // Group by subcategory
                                      const grouped = new Map<string, typeof TENTACLES_PRESETS>();
                                      visiblePresets.forEach((p) => {
                                        const sub = p.subcategory || 'Other';
                                        const arr = grouped.get(sub) || [];
                                        arr.push(p);
                                        grouped.set(sub, arr);
                                      });

                                      // Define subcategory order for consistent display
                                      const order = [
                                        'Poses & Restraint',
                                        'Tentacle Behavior',
                                        'Breasts',
                                        'Vagina & Penetration',
                                        'Belly & Womb',
                                        'Mouth & Throat',
                                        'Fluids & Cum',
                                        'BDSM & Domination',
                                        'Atmosphere & Effects',
                                        'Camera & Cinematography',
                                        'Details & Extras',
                                        'Other'
                                      ];

                                      const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
                                        const idxA = order.indexOf(a[0]);
                                        const idxB = order.indexOf(b[0]);
                                        if (idxA === -1 && idxB === -1) return a[0].localeCompare(b[0]);
                                        if (idxA === -1) return 1;
                                        if (idxB === -1) return -1;
                                        return idxA - idxB;
                                      });

                                      return sortedGroups.map(([subcategory, presets]) => (
                                        <div key={subcategory}>
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="h-px flex-1 bg-gradient-to-r from-fuchsia-500/30 to-transparent" />
                                            <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider">{subcategory}</h3>
                                            <div className="h-px flex-1 bg-gradient-to-l from-fuchsia-500/30 to-transparent" />
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                            {presets.map((p) => (
                                              <motion.button
                                                key={p.id}
                                                type="button"
                                                onClick={() => togglePreset(p.id)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`group relative px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-left leading-snug overflow-hidden ${selectedPresets.includes(p.id)
                                                  ? 'bg-gradient-to-br from-fuchsia-500/30 via-fuchsia-500/20 to-cyan-500/10 text-white border border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/20'
                                                  : 'bg-black/40 text-white/70 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/10'
                                                  }`}
                                              >
                                                {selectedPresets.includes(p.id) && (
                                                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-fuchsia-300 animate-pulse" />
                                                )}
                                                {selectedPresets.includes(p.id) && (
                                                  <span className="absolute inset-0 bg-gradient-to-br from-fuchsia-400/5 to-transparent" />
                                                )}
                                                <span className="relative z-10">{p.label}</span>
                                                {!selectedPresets.includes(p.id) && (
                                                  <span className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                )}
                                              </motion.button>
                                            ))}
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}

                      {mainTab === 'generate' && (
                        <motion.div
                          key="generate"
                          initial={{ opacity: 0, x: tabDirection === 'right' ? 40 : -40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: tabDirection === 'right' ? -40 : 40 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="absolute inset-0"
                          style={{ willChange: 'transform, opacity' }}
                        >
                          <motion.div 
                            className="rounded-t-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15, delay: 0.05 }}
                          >
                            <div className="p-3 border-b border-white/10">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <h2 className="text-white font-semibold">Generation</h2>
                                  <p className="text-white/55 text-xs mt-1">Quality + resolution + sampler.</p>
                                </div>
                                <div className="text-xs text-white/55">
                                  Model:{' '}
                                  <span className="text-white/80">{selectedCharacter?.generation?.model ? String(selectedCharacter.generation.model) : 'default'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 flex-1 min-h-0 overflow-y-auto">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="text-xs uppercase tracking-wider text-white/55">Resolution</div>
                                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[
                                      { w: 640, h: 1152, l: '640×1152' },
                                      { w: 768, h: 1344, l: '768×1344' },
                                      { w: 832, h: 1472, l: '832×1472' },
                                      { w: 1024, h: 576, l: '1024×576' },
                                      { w: 1152, h: 648, l: '1152×648' },
                                      { w: 1280, h: 720, l: '1280×720' },
                                    ].map((opt) => {
                                      const active = genWidth === opt.w && genHeight === opt.h;
                                      return (
                                        <button
                                          key={opt.l}
                                          type="button"
                                          onClick={() => {
                                            setGenWidth(opt.w);
                                            setGenHeight(opt.h);
                                          }}
                                          className={`px-3 py-2 rounded-2xl border text-sm transition ${active
                                            ? 'border-cyan-300/60 bg-cyan-500/10 text-white'
                                            : 'border-white/10 bg-black/20 text-white/70 hover:text-white'
                                            }`}
                                        >
                                          {opt.l}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="text-xs uppercase tracking-wider text-white/55">Sampler</div>
                                  <select
                                    value={genSampler}
                                    onChange={(e) => setGenSampler(e.target.value)}
                                    className="mt-2 w-full px-3 py-2 rounded-2xl border border-white/10 bg-black/30 text-white/90 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                                  >
                                    <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
                                    <option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
                                    <option value="Euler a">Euler a</option>
                                  </select>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs uppercase tracking-wider text-white/55">Steps</div>
                                    <div className="text-xs text-white/70">{genSteps}</div>
                                  </div>
                                  <input
                                    type="range"
                                    min={10}
                                    max={60}
                                    value={genSteps}
                                    onChange={(e) => setGenSteps(parseInt(e.target.value, 10) || 40)}
                                    className="mt-2 w-full accent-cyan-400"
                                  />
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs uppercase tracking-wider text-white/55">CFG</div>
                                    <div className="text-xs text-white/70">{genCfg}</div>
                                  </div>
                                  <input
                                    type="range"
                                    min={3}
                                    max={12}
                                    step={1}
                                    value={genCfg}
                                    onChange={(e) => setGenCfg(parseInt(e.target.value, 10) || 7)}
                                    className="mt-2 w-full accent-fuchsia-400"
                                  />
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs uppercase tracking-wider text-white/55">Hi-Res</div>
                                    <button
                                      type="button"
                                      onClick={() => setUseHires(!useHires)}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        useHires ? 'bg-fuchsia-500' : 'bg-white/20'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                          useHires ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <div className="text-xs text-white/40 mt-2">2x upscaling with detail preservation</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs uppercase tracking-wider text-white/55">Seed</div>
                                    <button
                                      type="button"
                                      onClick={() => setGenSeed(-1)}
                                      className="text-[11px] text-white/45 hover:text-white/70 transition"
                                    >
                                      Random
                                    </button>
                                  </div>
                                  <input
                                    value={String(genSeed)}
                                    onChange={(e) => setGenSeed(parseInt(e.target.value, 10) || 0)}
                                    className="mt-2 w-full px-3 py-2 rounded-2xl border border-white/10 bg-black/30 text-white/90 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                                  />
                                  <div className="mt-2 text-[11px] text-white/40">Use -1 for random seed.</div>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs uppercase tracking-wider text-white/55">Prompt preview</div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(composedAction || actionInput.trim() || '')}
                                        className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:text-white transition text-[11px]"
                                      >
                                        Copy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowFullPromptPreview((v) => !v)}
                                        className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:text-white transition text-[11px]"
                                      >
                                        {showFullPromptPreview ? 'Collapse' : 'Expand'}
                                      </button>
                                    </div>
                                  </div>
                                  <div className={`mt-2 text-xs text-white/70 break-words ${showFullPromptPreview ? '' : 'line-clamp-6'}`}>
                                    {composedAction || actionInput.trim() ? composedAction || actionInput.trim() : '—'}
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col justify-between">
                                  <div className="text-xs uppercase tracking-wider text-white/55">Generate</div>
                                  <PrimaryCTAButton
                                    label={isGenerating ? 'Generating...' : 'Generate Image'}
                                    onClick={generateFromAction}
                                    className="w-full mt-3"
                                    disabled={isGenerating || !selectedCharacter || (!composedAction && !actionInput.trim())}
                                  />
                                  <div className="mt-2 text-[11px] text-white/40">
                                    Saved to <span className="text-white/60">{selectedCharacter?.name || 'character'}</span> gallery.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}

                      {mainTab === 'results' && (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0, x: tabDirection === 'right' ? 40 : -40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: tabDirection === 'right' ? -40 : 40 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="absolute inset-0"
                          style={{ willChange: 'transform, opacity' }}
                        >
                          <motion.div 
                            className="rounded-t-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15, delay: 0.05 }}
                          >
                            <div className="p-3 border-b border-white/10">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <h2 className="text-white font-semibold">Results</h2>
                                  <p className="text-white/55 text-xs mt-1">Browse your renders.</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setResultsTab('character')}
                                    className={`px-3 py-2 rounded-2xl border text-sm transition ${resultsTab === 'character'
                                      ? 'border-fuchsia-300/60 bg-fuchsia-500/15 text-white'
                                      : 'border-white/10 bg-black/20 text-white/70 hover:text-white'
                                      }`}
                                  >
                                    This Character
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setResultsTab('feed')}
                                    className={`px-3 py-2 rounded-2xl border text-sm transition ${resultsTab === 'feed'
                                      ? 'border-cyan-300/60 bg-cyan-500/10 text-white'
                                      : 'border-white/10 bg-black/20 text-white/70 hover:text-white'
                                      }`}
                                  >
                                    Tentacles Feed
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 flex-1 min-h-0 overflow-y-auto">
                              {resultsTab === 'character' ? (
                                tentacleImages.length === 0 ? (
                                  <div className="text-center py-8">
                                    <div className="text-white/55">No tentacle images yet.</div>
                                    <div className="text-white/40 text-sm mt-2">Generate one from the Scene Builder above.</div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                                    <AnimatePresence>
                                      {tentacleImages.map((img, idx) => (
                                        <motion.div
                                          key={img.id}
                                          initial={{ opacity: 0, y: 8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: 8 }}
                                          transition={{ duration: 0.18 }}
                                          className="relative group"
                                        >
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteCharacterImageWithModal(img.id);
                                            }}
                                            disabled={deletingImageId === img.id}
                                            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                                            title="Delete image"
                                          >
                                            {deletingImageId === img.id ? (
                                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                            ) : (
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            )}
                                          </button>
                                          <div
                                            className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black/20 cursor-pointer"
                                            onClick={() => {
                                              setZoomedImageIndex(idx);
                                              setZoomedImageSource('character');
                                              setIsZoomed(true);
                                            }}
                                          >
                                            <img
                                              src={img.imageUrl}
                                              alt=""
                                              className={`w-full h-full object-cover transition ${blurNSFW ? 'blur-xl' : ''}`}
                                              loading="lazy"
                                              draggable={false}
                                            />
                                          </div>
                                        </motion.div>
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                )) : (
                                <div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm text-white/60">
                                        {showAllImages ? 'All images from your library.' : 'Tentacle images from your library.'}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAllImages((v) => !v);
                                          setGlobalTentaclePage(0);
                                        }}
                                        className={`px-2 py-1 rounded-lg text-xs border transition ${
                                          showAllImages
                                            ? 'border-cyan-300/60 bg-cyan-500/15 text-white'
                                            : 'border-white/10 bg-black/20 text-white/70 hover:text-white'
                                        }`}
                                      >
                                        {showAllImages ? 'Tentacles Only' : 'Show All'}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isLoadingGlobalTentacleImages || globalTentaclePage === 0}
                                        onClick={() => setGlobalTentaclePage((p) => Math.max(0, p - 1))}
                                        className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-white/75 hover:text-white disabled:opacity-40 disabled:hover:text-white/75 transition text-sm"
                                      >
                                        Prev
                                      </button>
                                      <div className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-white/60 text-sm">
                                        Page {globalTentaclePage + 1}
                                      </div>
                                      <button
                                        type="button"
                                        disabled={isLoadingGlobalTentacleImages || imageStoreRef.current.length === 0}
                                        onClick={() => setGlobalTentaclePage((p) => p + 1)}
                                        className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-white/75 hover:text-white disabled:opacity-40 disabled:hover:text-white/75 transition text-sm"
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>

                                  {isLoadingGlobalTentacleImages ? (
                                    <div className="text-center py-10 text-white/55">Loading…</div>
                                  ) : imageStoreRef.current.length === 0 ? (
                                    <div className="text-center py-10">
                                      <div className="text-white/55">
                                        {showAllImages ? 'No images found in your library.' : 'No tentacle images found.'}
                                      </div>
                                      <div className="text-white/40 text-sm mt-2">
                                        {showAllImages 
                                          ? 'Try generating some images first.' 
                                          : 'Try toggling "Show All" to see all images, or generate new tentacle renders.'}
                                      </div>
                                      {!showAllImages && (
                                        <div className="text-white/30 text-xs mt-4">
                                          Debug: Check browser console (F12) for fetched image count
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div key={globalTentaclePage} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
                                      <AnimatePresence>
                                        {imageStoreRef.current.map((img, idx) => (
                                          <motion.div
                                            key={img.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.18 }}
                                            className="relative group"
                                          >
                                            {/* Delete button - appears on hover */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTentacleImage(img.id);
                                              }}
                                              disabled={deletingImageId === img.id}
                                              className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                                              title="Delete image"
                                            >
                                              {deletingImageId === img.id ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                              ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                              )}
                                            </button>
                                            <div
                                              className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black/20 cursor-pointer"
                                              onClick={() => {
                                                setZoomedImageIndex(idx);
                                                setZoomedImageSource('global');
                                                setIsZoomed(true);
                                              }}
                                            >
                                              <img
                                                src={img.imageUrl}
                                                alt=""
                                                className={`w-full h-full object-cover transition ${blurNSFW ? 'blur-xl' : ''}`}
                                                loading="lazy"
                                                draggable={false}
                                              />
                                            </div>
                                          </motion.div>
                                        ))}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Static Navigation Bar - Blended with content */}
                  <div className="shrink-0 rounded-b-3xl border-x border-b border-white/10 bg-black/25 backdrop-blur-xl px-4 py-3 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (mainTab === 'build') return;
                          if (mainTab === 'generate') setMainTabWithDirection('build');
                          if (mainTab === 'results') setMainTabWithDirection('generate');
                        }}
                        disabled={mainTab === 'build'}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>
                          {mainTab === 'build' ? 'Build' : mainTab === 'generate' ? 'Build' : 'Generate'}
                        </span>
                      </button>

                      {/* Step Indicators */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMainTabWithDirection('build')}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            mainTab === 'build'
                              ? 'bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 shadow-lg shadow-fuchsia-500/20'
                              : 'bg-black/20 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                          </svg>
                        </button>
                        <div className="w-8 h-px bg-gradient-to-r from-fuchsia-500/30 to-cyan-500/30" />
                        <button
                          type="button"
                          onClick={() => setMainTabWithDirection('generate')}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            mainTab === 'generate'
                              ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20'
                              : 'bg-black/20 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                        <div className="w-8 h-px bg-gradient-to-r from-cyan-500/30 to-white/30" />
                        <button
                          type="button"
                          onClick={() => setMainTabWithDirection('results')}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            mainTab === 'results'
                              ? 'bg-white/20 border border-white/40 text-white shadow-lg shadow-white/10'
                              : 'bg-black/20 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (mainTab === 'results') return;
                          if (mainTab === 'build') setMainTabWithDirection('generate');
                          if (mainTab === 'generate') setMainTabWithDirection('results');
                        }}
                        disabled={mainTab === 'results'}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70 disabled:cursor-not-allowed"
                      >
                        <span>
                          {mainTab === 'build' ? 'Generate' : mainTab === 'generate' ? 'Results' : 'Results'}
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

            <div className="lg:col-span-3 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl overflow-visible flex flex-col lg:h-[calc(100vh-100px)]">
              <div className="p-3 pb-2 shrink-0">
                    <div className="relative" ref={pickerRef}>
                      <button
                        type="button"
                        onClick={() => setIsPickerOpen((v) => !v)}
                        disabled={loadingCharacters}
                        className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-left text-white/90 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 flex items-center justify-between hover:bg-black/50 transition-colors"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                            {selectedImage ? (
                              <img
                                src={selectedImage}
                                alt={selectedCharacter?.name || 'Character'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-white/60 text-sm font-bold">
                                {selectedCharacter?.name?.charAt(0) || '?'}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold truncate leading-tight">
                              {selectedCharacter?.name || (loadingCharacters ? 'Loading...' : 'Select a character')}
                            </span>
                            <span className="block text-xs text-white/50 truncate leading-tight">
                              {selectedCharacter?.personality?.archetype || selectedCharacter?.mainTag || '—'}
                            </span>
                          </span>
                        </span>
                        <svg
                          className={`w-5 h-5 text-white/60 transition-transform duration-200 ${isPickerOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {isPickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 w-full rounded-xl border border-white/10 bg-dark-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                          >
                            <div className="p-2 border-b border-white/10">
                              <input
                                autoFocus
                                value={characterQuery}
                                onChange={(e) => setCharacterQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setIsPickerOpen(false);
                                }}
                                placeholder="Search characters..."
                                className="w-full px-3 py-2 rounded-lg bg-black/35 border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 text-sm"
                              />
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                              {filteredCharacters.length === 0 ? (
                                <div className="p-3 text-sm text-white/60">No matches.</div>
                              ) : (
                                filteredCharacters.map((c: CharacterDraft) => {
                                  const img = c.generation?.generatedImage;
                                  const active = c.id === selectedId;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleSelectCharacter(c.id!)}
                                      className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition ${active
                                        ? 'bg-fuchsia-500/15 text-white'
                                        : 'hover:bg-white/5 text-white/90'
                                        }`}
                                    >
                                      <span className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 bg-black/20 shrink-0">
                                        {img ? (
                                          <img src={img} alt={c.name || 'Character'} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="w-full h-full flex items-center justify-center text-white/55 text-sm font-bold">
                                            {c.name?.charAt(0) || '?'}
                                          </span>
                                        )}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block font-semibold truncate text-sm">{c.name || c.id}</span>
                                        <span className="block text-xs text-white/55 truncate">
                                          {c.personality?.archetype || c.mainTag || '—'}
                                        </span>
                                      </span>
                                      {active && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 text-white/90">
                                          Active
                                        </span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="px-3 pb-3 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full rounded-2xl border border-white/10 bg-black/20 overflow-hidden flex items-center justify-center">
                      <div className="h-full w-full relative">
                        {selectedImage ? (
                          <img
                            src={selectedImage}
                            alt={selectedCharacter?.name || 'Character'}
                            className={`w-full h-full object-cover ${blurNSFW ? 'blur-xl' : ''}`}
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/45 text-sm">
                            {loadingCharacters ? 'Loading…' : 'Choose a character to preview'}
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent">
                          <div className="text-white font-semibold truncate">
                            {selectedCharacter?.name || 'No character selected'}
                          </div>
                          <div className="text-white/60 text-xs truncate mt-0.5">
                            {selectedCharacter?.personality?.archetype || selectedCharacter?.mainTag || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Root>
          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setIsZoomed(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={zoomImages[zoomedImageIndex]?.imageUrl}
                alt=""
                className={`max-w-full max-h-full object-contain rounded-2xl ${blurNSFW ? 'blur-xl' : ''}`}
                draggable={false}
              />
              
              {/* Navigation arrows */}
              {zoomImages.length > 1 && (
                <>
                  <div className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviousImage();
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/30 transition-colors"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
              
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 p-2 rounded-lg border border-white/10 bg-black/40 text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

