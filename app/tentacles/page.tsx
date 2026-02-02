'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { characterAPI } from '@/lib/api';
import { automatic1111API } from '@/lib/automatic1111';
import { buildCharacterBasePrompts } from '@/lib/automatic1111';
import type { CharacterDraft, CharacterImage } from '@/lib/types';
import { buildTentaclesPrompts } from '@/lib/tentaclesPrompt';
import { PrimaryCTAButton } from '@/components/ui/PrimaryCTAButton';
import { useBlurNSFW } from '@/lib/useBlurNSFW';
import { Download, ZoomIn, Trash2, RefreshCw } from 'lucide-react';

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

const TENTACLES_PRESETS: Array<{ id: TentaclesPresetId; label: string; prompt: string; category: PresetCategoryId }> = [
  { id: 'wrap_arms', label: 'Wrap Arms', prompt: 'tentacles wrapping around arms, arms up, restrained', category: 'pose_restraint' },
  { id: 'wrap_legs', label: 'Wrap Legs', prompt: 'tentacles wrapping around legs, ankles bound, dynamic pose', category: 'pose_restraint' },
  { id: 'restraint', label: 'Restraint', prompt: 'restrained posture, wrists and ankles secured, controlled pose', category: 'pose_restraint' },
  { id: 'lift_pose', label: 'Lift Pose', prompt: 'lifted and suspended pose, toes pointed, dramatic composition', category: 'pose_restraint' },
  { id: 'kneeling_pose', label: 'Kneeling', prompt: 'kneeling pose, shoulders back, submissive posture', category: 'pose_restraint' },
  { id: 'arched_back', label: 'Arched Back', prompt: 'arched back, chest forward, tense silhouette', category: 'pose_restraint' },
  { id: 'chains', label: 'Chains', prompt: 'decorative chains, restrained aesthetic, metallic highlights', category: 'pose_restraint' },
  { id: 'shibari_rope', label: 'Rope', prompt: 'rope harness, intricate knots, restraint aesthetic', category: 'pose_restraint' },

  { id: 'teasing_touch', label: 'Teasing Touch', prompt: 'teasing touch, gentle caress, slow tension, seductive atmosphere', category: 'tentacle_behavior' },
  { id: 'surrounded', label: 'Surrounded', prompt: 'surrounded by tentacles, encircled, looming shapes', category: 'tentacle_behavior' },
  { id: 'multiple_tentacles', label: 'Many Tentacles', prompt: 'multiple tentacles, layered coils, complex shapes', category: 'tentacle_behavior' },
  { id: 'coiling', label: 'Coiling', prompt: 'tight coiling, spiral wraps, squeezing embrace', category: 'tentacle_behavior' },
  { id: 'pull_close', label: 'Pull Close', prompt: 'pulled close, pinned against rock, controlled movement', category: 'tentacle_behavior' },
  { id: 'face_covered', label: 'Face Covered', prompt: 'face partly covered by coils, obscured expression, dramatic mood', category: 'tentacle_behavior' },
  { id: 'tentacle_crown', label: 'Tentacle Crown', prompt: 'tentacle crown silhouette, framing the head, elegant menace', category: 'tentacle_behavior' },
  { id: 'hair_grab', label: 'Hair Grab', prompt: 'hair pulled back, tense posture, dominant framing', category: 'tentacle_behavior' },
  { id: 'dynamic_motion', label: 'Dynamic Motion', prompt: 'dynamic motion, motion blur, dramatic angle', category: 'tentacle_behavior' },

  { id: 'slime_tentacles', label: 'Slime Tentacles', prompt: 'slimy tentacles, glossy wet texture, wet shine', category: 'atmosphere' },
  { id: 'dripping_slime', label: 'Dripping Slime', prompt: 'dripping slime, viscous trails, glossy highlights', category: 'atmosphere' },
  { id: 'wet_gloss', label: 'Wet Gloss', prompt: 'wet gloss, specular highlights, moisture in the air', category: 'atmosphere' },
  { id: 'ink_mist', label: 'Ink Mist', prompt: 'inky mist, dark fog, floating particles', category: 'atmosphere' },
  { id: 'bioluminescent_glow', label: 'Bio Glow', prompt: 'bioluminescent glow, neon rim light, glowing spores', category: 'atmosphere' },
  { id: 'fog', label: 'Fog', prompt: 'thick fog, volumetric light, moody cave air', category: 'atmosphere' },
  { id: 'dramatic_lighting', label: 'Dramatic Light', prompt: 'dramatic lighting, high contrast, sharp shadows', category: 'atmosphere' },
  { id: 'backlit_silhouette', label: 'Backlit', prompt: 'backlit silhouette, rim light, strong outline', category: 'atmosphere' },

  { id: 'cinematic_angle', label: 'Cinematic', prompt: 'cinematic composition, rule of thirds, film still', category: 'cinematography' },
  { id: 'close_up', label: 'Close-Up', prompt: 'close-up framing, intimate crop, skin detail', category: 'cinematography' },
  { id: 'low_angle', label: 'Low Angle', prompt: 'low angle shot, looming perspective, powerful framing', category: 'cinematography' },
  { id: 'handheld_camera', label: 'Handheld', prompt: 'handheld camera feel, subtle shake, gritty realism', category: 'cinematography' },
  { id: 'depth_of_field', label: 'Depth of Field', prompt: 'shallow depth of field, bokeh, subject separation', category: 'cinematography' },

  { id: 'torn_fabric', label: 'Torn Fabric', prompt: 'torn fabric scraps, ruined cloth, dramatic texture', category: 'details' },
  { id: 'ripped_stockings', label: 'Ripped Stockings', prompt: 'ripped stockings, torn lace, distressed outfit remnants', category: 'details' },
  { id: 'scratch_marks', label: 'Scratch Marks', prompt: 'scratch marks on stone, torn marks, signs of struggle', category: 'details' },

  { id: 'nipple_insertion', label: 'Nipple Insertion', prompt: 'tentacles focused on nipples, nipple insertion, nipples teased', category: 'explicit' },
  { id: 'nipple_inflation', label: 'Nipple Inflation', prompt: 'nipple inflation, swollen nipples, tentacles inflating nipples', category: 'explicit' },
  { id: 'nipple_milking', label: 'Nipple Milking', prompt: 'nipple milking, milk leaking, lactation pressure, nipples milked by tentacles', category: 'explicit' },
  { id: 'lactation', label: 'Lactation', prompt: 'lactation, milky nipples, milk dripping, glossy milk', category: 'explicit' },
  { id: 'belly_bulge', label: 'Belly Bulge', prompt: 'belly bulge, inflated belly, tentacles pressing against belly', category: 'explicit' },
  { id: 'oviposition', label: 'Oviposition', prompt: 'oviposition, eggs inside belly, egg laying, egg-filled belly', category: 'explicit' },
  { id: 'egg_belly', label: 'Egg Belly', prompt: 'egg belly, eggs visible under skin, round egg bulges, swollen belly', category: 'explicit' },
  { id: 'egg_birth', label: 'Egg Birth', prompt: 'egg birth, laying eggs, eggs emerging, dripping fluids', category: 'explicit' },
  { id: 'monster_birth', label: 'Monster Birth', prompt: 'monster birth, birthing scene, creature emerging, wet birth fluids', category: 'explicit' },
  { id: 'mouth_play', label: 'Mouth Play', prompt: 'open mouth, tentacle near mouth, saliva strings', category: 'explicit' },
  { id: 'impregnation', label: 'Impregnation', prompt: 'impregnation, breeding, tentacles filling womb, swollen belly', category: 'explicit' },

  // New extreme tentacle presets
  { id: 'huge_tentacles', label: 'Huge Tentacles', prompt: 'huge tentacle, massive tentacles, giant tentacles, enormous tentacles', category: 'tentacle_behavior' },
  { id: 'veiny_tentacles', label: 'Veiny Tentacles', prompt: 'veins tentacle, veiny tentacles, throbbing veins, vascular tentacles', category: 'tentacle_behavior' },
  { id: 'glowing_tentacles', label: 'Glowing Tentacles', prompt: 'glowing tentacles, bioluminescent tentacles, radiant tentacles, ethereal glow', category: 'tentacle_behavior' },
  { id: 'knotty_tentacles', label: 'Knotty Tentacles', prompt: 'knotty tentacles, knotted tentacles, textured surface, bumpy tentacles', category: 'tentacle_behavior' },
  { id: 'extreme_restraint', label: 'Extreme Restraint', prompt: 'restrained by tentacles, arms restrained by tentacles, restrained_tentacles, tight bondage', category: 'pose_restraint' },
  { id: 'suspended_air', label: 'Suspended in Air', prompt: 'suspended in air, suspension, floating, levitating, hanging by tentacles', category: 'pose_restraint' },
  { id: 'spread_arms_legs', label: 'Spread Arms & Legs', prompt: 'spread arms, outstretched arms, spread legs, forced spread position', category: 'pose_restraint' },
  { id: 'arms_behind_back', label: 'Arms Behind Back', prompt: 'arms behind back, reverse prayer position, restrained arms', category: 'pose_restraint' },
  { id: 'tentacle_pit', label: 'Tentacle Pit', prompt: 'tentacle pit, pit full of tentacles, surrounded by tentacles, tentacle nest', category: 'atmosphere' },
  { id: 'magic_circle', label: 'Magic Circle', prompt: 'magic circle, ritual circle, glowing runes, summoning circle, mystical symbols', category: 'atmosphere' },
  { id: 'background_tentacles', label: 'Background Tentacles', prompt: 'background fill tentacle, tentacle background, surrounded by tentacles, tentacle environment', category: 'atmosphere' },
  { id: 'extreme_intensity', label: 'Extreme Intensity', prompt: 'extremely, extreme intensity, hardcore, brutal, intense', category: 'details' },
  { id: 'breast_manipulation', label: 'Breast Manipulation', prompt: 'grabbing breasts, squeezing breasts, bloated breasts, breast manipulation', category: 'explicit' },
  { id: 'breast_fluids', label: 'Breast Fluids', prompt: 'breasts dripping, nipples dripping, breast fluids, nipple fluids', category: 'explicit' },
  { id: 'extreme_nipple_play', label: 'Extreme Nipple Play', prompt: 'nipplepen, nipple penetration, nipple insertion, extreme nipple play', category: 'explicit' },
  { id: 'extreme_throat', label: 'Extreme Throat', prompt: 'extreme deep throat, mouth bulge, throat bulge, esophagus bulge', category: 'explicit' },
  { id: 'emotional_distress', label: 'Emotional Distress', prompt: 'look of fear, tears, runny nose, drool, crying, distressed expression', category: 'details' },
  { id: 'extreme_cumshot', label: 'Extreme Cumshot', prompt: 'bukkake, facial, excessive cum, cum in mouth, cum drip, cum over, cum in pussy', category: 'explicit' },
  { id: 'open_breasts', label: 'Open Breasts', prompt: 'open breasts, exposed breasts, breast exposure, chest exposure', category: 'explicit' },
  { id: 'tentacle_penetration', label: 'Tentacle Penetration', prompt: 'tentacle sex, vaginal penetration, double penetration, tentacle fuck, tentacle insertation', category: 'explicit' },
  { id: 'bdsm_tentacles', label: 'BDSM Tentacles', prompt: 'bdsm, tentacle bdsm, bondage, submission, domination, power play', category: 'explicit' },
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
  const [showImageDropdown, setShowImageDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Close dropdown on click outside or scroll
  useEffect(() => {
    const handleClickOutside = () => setShowImageDropdown(null);
    const handleScroll = () => setShowImageDropdown(null);
    
    if (showImageDropdown) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [showImageDropdown]);

  const [globalTentacleImages, setGlobalTentacleImages] = useState<CharacterImage[]>([]);
  const [isLoadingGlobalTentacleImages, setIsLoadingGlobalTentacleImages] = useState(false);
  const [globalTentaclePage, setGlobalTentaclePage] = useState(0);

  const [controlTab, setControlTab] = useState<'scene' | 'tools' | 'advanced'>('scene');
  const [resultsTab, setResultsTab] = useState<'character' | 'feed'>('character');

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

  const characterBasePrompt = useMemo(() => {
    if (!selectedCharacter) return '';
    try {
      const base = buildCharacterBasePrompts(selectedCharacter);
      return String(base?.prompt || '').trim();
    } catch {
      return '';
    }
  }, [selectedCharacter]);

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

  const loadGlobalTentacleImages = async (page: number) => {
    const safePage = Math.max(0, Number(page) || 0);
    setIsLoadingGlobalTentacleImages(true);
    try {
      // For page 0, fetch from beginning
      // For page > 0, we need to fetch from beginning to get all tentacle images
      const fetchOffset = safePage === 0 ? 0 : 0;
      const fetchLimit = safePage === 0 ? 240 : 1000; // Fetch more for later pages
      
      console.log(`Loading page ${safePage}, fetching offset ${fetchOffset}, limit ${fetchLimit}`);
      const res = await characterAPI.getAllCharacterImagesPagedGlobal({
        limit: fetchLimit,
        offset: fetchOffset,
      });

      if (!res.success || !Array.isArray(res.data)) {
        console.log('API call failed or returned invalid data');
        setGlobalTentacleImages([]);
        return;
      }

      console.log(`Fetched ${res.data.length} total images`);
      const tentacleOnly = res.data.filter((img) => {
        const prompt = String(img.generationPrompt || '').toLowerCase();
        return prompt.includes('tentacle') || prompt.includes('tentacles');
      });

      console.log(`Found ${tentacleOnly.length} total tentacle images`);

      // Show up to 10 tentacle images per page, properly paginated
      const startIndex = safePage * GLOBAL_TENTACLE_PAGE_SIZE;
      const endIndex = startIndex + GLOBAL_TENTACLE_PAGE_SIZE;
      const paginatedImages = tentacleOnly.slice(startIndex, endIndex);
      console.log(`Showing images ${startIndex} to ${endIndex - 1}, actual count: ${paginatedImages.length}`);
      
      setGlobalTentacleImages(paginatedImages);
    } catch (error) {
      console.error('Error loading tentacle images:', error);
      setGlobalTentacleImages([]);
    } finally {
      setIsLoadingGlobalTentacleImages(false);
    }
  };

  useEffect(() => {
    loadGlobalTentacleImages(globalTentaclePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalTentaclePage]);

  const tentacleImages = useMemo(() => {
    return characterImages.filter((img) => {
      const prompt = img.generationPrompt?.toLowerCase() || '';
      return prompt.includes('tentacle') || prompt.includes('tentacles');
    });
  }, [characterImages]);

  const zoomImages = useMemo(() => {
    return zoomedImageSource === 'global' ? globalTentacleImages : tentacleImages;
  }, [globalTentacleImages, tentacleImages, zoomedImageSource]);

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

  const deleteImage = async (imageId: string) => {
    try {
      await characterAPI.deleteCharacterImageFromGallery(imageId);
      setCharacterImages((prev) => prev.filter((img) => img.id !== imageId));
      setToast('Deleted');
    } catch {
      setToast('Delete failed');
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

        <div className="w-full px-4 sm:px-8 lg:px-12 py-10">
          <div className="w-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_14px_rgba(232,121,249,0.6)]" />
                    <span className="text-xs tracking-wider text-white/70">ROLEPLAY LAB</span>
                  </div>
                  <h1 className="mt-3 text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                    Tentacles
                    <span className="ml-3 bg-gradient-to-r from-fuchsia-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                      Tormenting Lab
                    </span>
                  </h1>
                  <p className="mt-3 text-white/65 max-w-2xl">
                    Pick a character, then use tools to generate themed images. All images are saved to the character gallery.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(exportSceneText() || '')}
                    className="px-4 py-2 rounded-2xl border border-white/10 bg-black/25 text-white/80 hover:text-white hover:bg-black/35 transition text-sm"
                  >
                    Copy All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = exportSceneText();
                      if (!text) {
                        setToast('Nothing to export');
                        return;
                      }
                      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `tentacles-scene-${Date.now()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setToast('Downloaded');
                    }}
                    className="px-4 py-2 rounded-2xl border border-white/10 bg-black/25 text-white/80 hover:text-white hover:bg-black/35 transition text-sm"
                  >
                    Export
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden mb-6">
              <div className="p-5 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-white font-semibold">Scene Builder</h2>
                    <p className="text-white/55 text-sm mt-1">Use presets to shape the scene, then refine with text.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative w-full sm:w-[320px]">
                      <input
                        value={presetQuery}
                        onChange={(e) => setPresetQuery(e.target.value)}
                        placeholder="Search presets..."
                        className="w-full px-4 py-2.5 rounded-2xl bg-black/35 border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60"
                      />
                    </div>
                    <span className="text-xs text-white/55">
                      Selected: <span className="text-white/80">{selectedPresets.length}</span>
                    </span>
                    {selectedPresets.length > 0 && (
                      <button
                        type="button"
                        onClick={clearPresets}
                        className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-white/75 hover:text-white transition text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5">
                {selectedPresets.length > 0 && (
                  <div
                    className="flex flex-wrap gap-2 mb-4 rounded-2xl border border-white/10 bg-black/15 p-3"
                  >
                    {(() => {
                      const maxVisible = 10;
                      const mapped = selectedPresets
                        .map((id) => presetMap.get(id))
                        .filter(Boolean);
                      const visible = showAllSelectedPresets ? mapped : mapped.slice(0, maxVisible);
                      const remaining = Math.max(0, mapped.length - visible.length);
                      return (
                        <>
                          {visible.map((p) => (
                            <button
                              key={p!.id}
                              type="button"
                              onClick={() => togglePreset(p!.id)}
                              className="px-3 py-1.5 rounded-full text-[11px] border border-fuchsia-300/30 bg-fuchsia-500/10 text-white/90 hover:bg-fuchsia-500/15 transition"
                              title="Remove"
                            >
                              {p!.label}
                            </button>
                          ))}
                          {selectedXRayParts.map((id) => {
                            const part = XRAY_PARTS.find((p) => p.id === id);
                            if (!part) return null;
                            return (
                              <button
                                key={`xray_${id}`}
                                type="button"
                                onClick={() => toggleXRayPart(id)}
                                className="px-3 py-1.5 rounded-full text-[11px] border border-cyan-300/20 bg-cyan-500/10 text-white/90 hover:text-white transition"
                                title="Remove"
                              >
                                X-ray: {part.label}
                              </button>
                            );
                          })}
                          {!showAllSelectedPresets && remaining > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowAllSelectedPresets(true)}
                              className="w-7 h-7 rounded-full text-[11px] border border-white/10 bg-black/25 text-white/85 hover:text-white transition inline-flex items-center justify-center"
                              title="Show remaining"
                            >
                              +{remaining}
                            </button>
                          )}
                          {showAllSelectedPresets && mapped.length > maxVisible && (
                            <button
                              type="button"
                              onClick={() => setShowAllSelectedPresets(false)}
                              className="w-7 h-7 rounded-full text-[11px] border border-white/10 bg-black/25 text-white/70 hover:text-white transition inline-flex items-center justify-center"
                              title="Collapse"
                            >
                              −
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                        {PRESET_CATEGORIES.map((cat) => {
                          const active = cat.id === activePresetCategory;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setActivePresetCategory(cat.id)}
                              className={`px-3 py-2 rounded-2xl text-sm border transition text-left ${active
                                ? 'border-fuchsia-300/60 bg-fuchsia-500/15 text-white'
                                : 'border-white/10 bg-black/20 text-white/65 hover:text-white'
                                }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowAllPresets((v) => !v)}
                        className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/20 text-white/75 hover:text-white transition text-sm"
                      >
                        {showAllPresets ? 'Hide extra presets' : 'Show all presets'}
                      </button>
                      {!showAllPresets && !presetQuery.trim() && (
                        <div className="mt-1 text-[11px] text-white/40">Tip: select a category or use Search.</div>
                      )}
                      {presetQuery.trim() && filteredPresetsByCategory.size === 0 && (
                        <div className="mt-1 text-[11px] text-white/40">No presets match.</div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {(activePresetCategory === 'xray'
                        ? XRAY_PARTS.map((part) => ({
                            id: part.id,
                            label: part.label,
                            active: selectedXRayParts.includes(part.id),
                            onClick: () => toggleXRayPart(part.id),
                            tone: 'xray' as const,
                          }))
                        : visiblePresets.map((p) => ({
                            id: p.id,
                            label: p.label,
                            active: selectedPresets.includes(p.id),
                            onClick: () => togglePreset(p.id),
                            tone: 'preset' as const,
                          })))
                        .map((item) => (
                          <button
                            key={String(item.id)}
                            type="button"
                            onClick={item.onClick}
                            className={`px-4 py-3 rounded-2xl text-sm border transition shadow-sm text-left leading-snug ${item.active
                              ? item.tone === 'xray'
                                ? 'border-cyan-300/60 bg-cyan-500/15 text-white'
                                : 'border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/10 text-white'
                              : item.tone === 'xray'
                                ? 'border-white/10 bg-black/20 text-white/75 hover:text-white hover:bg-black/35'
                                : 'border-white/10 bg-black/20 text-white/75 hover:text-white hover:bg-black/35'
                              }`}
                          >
                            <div className="font-semibold">{item.label}</div>
                          </button>
                        ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <textarea
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        placeholder="Optional extra text to add on top of presets..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/25 text-white/90 placeholder:text-white/35 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/10"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left controls (tabs) */}
              <div className="lg:col-span-5 xl:col-span-5">
                <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl overflow-visible">
                  <div className="p-5 border-b border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-white font-semibold">Studio</h2>
                        <p className="text-white/55 text-sm mt-1">Build the scene & apply tools.</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleBlurNSFW}
                        className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-white/75 hover:text-white transition text-sm"
                      >
                        {blurNSFW ? 'Unblur' : 'Blur'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider text-white/55">Character</label>
                        <span className="text-[11px] text-white/40">Pick from list</span>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                          {selectedImage ? (
                            <img
                              src={selectedImage}
                              alt={selectedCharacter?.name || 'Character'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/60 text-base font-bold">
                              {selectedCharacter?.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            {selectedCharacter?.name || (loadingCharacters ? 'Loading...' : 'Select a character')}
                          </div>
                          <div className="text-white/55 text-sm truncate">
                            {selectedCharacter?.personality?.archetype || selectedCharacter?.mainTag || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 relative" ref={pickerRef}>
                        <button
                          type="button"
                          onClick={() => setIsPickerOpen((v) => !v)}
                          disabled={loadingCharacters}
                          className="w-full px-4 py-3 rounded-2xl bg-black/35 border border-white/10 text-left text-white/90 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
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
                            className={`w-5 h-5 text-white/60 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`}
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
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 w-full rounded-2xl border border-white/10 bg-dark-950/90 backdrop-blur-xl shadow-2xl overflow-hidden"
                            >
                              <div className="p-3 border-b border-white/10">
                                <input
                                  autoFocus
                                  value={characterQuery}
                                  onChange={(e) => setCharacterQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setIsPickerOpen(false);
                                  }}
                                  placeholder="Search characters..."
                                  className="w-full px-4 py-2.5 rounded-xl bg-black/35 border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60"
                                />
                              </div>

                              <div className="max-h-80 overflow-y-auto">
                                {filteredCharacters.length === 0 ? (
                                  <div className="p-4 text-sm text-white/60">No matches.</div>
                                ) : (
                                  filteredCharacters.map((c: CharacterDraft) => {
                                    const img = c.generation?.generatedImage;
                                    const active = c.id === selectedId;
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelectCharacter(c.id!)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${active
                                          ? 'bg-fuchsia-500/15 text-white'
                                          : 'hover:bg-white/5 text-white/90'
                                          }`}
                                      >
                                        <span className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                                          {img ? (
                                            <img src={img} alt={c.name || 'Character'} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="w-full h-full flex items-center justify-center text-white/55 text-sm font-bold">
                                              {c.name?.charAt(0) || '?'}
                                            </span>
                                          )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                          <span className="block font-semibold truncate">{c.name || c.id}</span>
                                          <span className="block text-xs text-white/55 truncate">
                                            {c.personality?.archetype || c.mainTag || '—'}
                                          </span>
                                        </span>
                                        {active && (
                                          <span className="text-xs px-2 py-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 text-white/90">
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

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs uppercase tracking-wider text-white/55">Base prompt</label>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(characterBasePrompt || ''))}
                          className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-black/20 text-white/70 hover:text-white transition text-[11px]"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-white/70 break-words">
                        {characterBasePrompt ? characterBasePrompt : '—'}
                      </div>
                      {selectedCharacter?.generation?.model && (
                        <div className="mt-2 text-[11px] text-white/40">
                          Model: <span className="text-white/60">{String(selectedCharacter.generation.model)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right settings */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-6">
                <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-white font-semibold">Generation</h2>
                        <p className="text-white/55 text-sm mt-1">Quality + resolution + sampler.</p>
                      </div>
                      <div className="text-xs text-white/55">
                        Model:{' '}
                        <span className="text-white/80">{selectedCharacter?.generation?.model ? String(selectedCharacter.generation.model) : 'default'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  ? 'border-fuchsia-300/60 bg-fuchsia-500/15 text-white'
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
                          className="mt-2 w-full"
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
                          className="mt-2 w-full"
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

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div
                          className={`mt-2 text-xs text-white/70 break-words ${showFullPromptPreview ? '' : 'line-clamp-6'}`}
                        >
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
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden mt-6">
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-white font-semibold">Results</h2>
                    <p className="text-white/55 text-sm mt-1">Browse your renders.</p>
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

              <div className="p-5">
                {resultsTab === 'character' ? (
                  tentacleImages.length === 0 ? (
                    <div className="text-center py-14">
                      <div className="text-white/55">No tentacle images yet.</div>
                      <div className="text-white/40 text-sm mt-2">Generate one from the Scene Builder above.</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
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
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowImageDropdown(img.id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setDropdownPosition({ 
                                    top: rect.bottom + 8, 
                                    left: Math.max(12, rect.right - 200) // 200px dropdown width
                                  });
                                }}
                                className="p-2 rounded-xl border border-white/10 bg-black/50 text-white/80 hover:text-white"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                            {generatingIds.has(img.id) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                                <RefreshCw className="w-6 h-6 text-white animate-spin" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div className="text-sm text-white/60">Recent tentacle images from your full library.</div>
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
                          disabled={isLoadingGlobalTentacleImages || globalTentacleImages.length === 0}
                          onClick={() => setGlobalTentaclePage((p) => p + 1)}
                          className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20 text-white/75 hover:text-white disabled:opacity-40 disabled:hover:text-white/75 transition text-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    {isLoadingGlobalTentacleImages ? (
                      <div className="text-center py-14 text-white/55">Loading…</div>
                    ) : globalTentacleImages.length === 0 ? (
                      <div className="text-center py-14">
                        <div className="text-white/55">No tentacle images found in this page.</div>
                        <div className="text-white/40 text-sm mt-2">Try Next or generate some new tentacle renders.</div>
                      </div>
                    ) : (
                      <div key={globalTentaclePage} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                        <AnimatePresence>
                          {globalTentacleImages.map((img, idx) => (
                            <motion.div
                              key={img.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.18 }}
                              className="relative group"
                            >
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
            </div>
          </div>
        </div>
      </div>

      {/* Image dropdown */}
      <AnimatePresence>
        {showImageDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[60] rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  const img = characterImages.find((i) => i.id === showImageDropdown);
                  if (img) downloadImage(img.imageUrl, `${selectedCharacter?.name || 'image'}-${img.id}.jpg`);
                  setShowImageDropdown(null);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-left text-white/90 hover:bg-white/10 transition text-sm"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                type="button"
                onClick={() => {
                  regenerateImage(showImageDropdown);
                  setShowImageDropdown(null);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-left text-white/90 hover:bg-white/10 transition text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteImage(showImageDropdown);
                  setShowImageDropdown(null);
                }}
                className="w-full px-4 py-2 flex items-center gap-3 text-left text-red-400 hover:bg-red-500/10 transition text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

