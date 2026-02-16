import { supabase } from './supabase';
import { clampBondPoints, computeBondDecayFromInactivityDays, computeBondPointsDeltaFromUserText } from '@/lib/bond';

export interface CharacterRelationship {
  id: string;
  user_id: string;
  character_id: string;
  bond_points: number;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
}

const daysBetween = (a: Date, b: Date): number => {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60 * 24);
};

export const bondService = {
  async getOrCreate(characterId: string): Promise<CharacterRelationship | null> {
    // Check authentication via local API
    const authRes = await fetch('/api/auth/session');
    const authData = await authRes.json();
    if (!authData.user) return null;

    const userId = authData.user.id;

    const existing = await supabase
      .from('character_relationships')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .maybeSingle();

    if (existing.data) {
      return existing.data as any;
    }

    const created = await (supabase
      .from('character_relationships')
      .insert({
        user_id: userId,
        character_id: characterId,
        bond_points: 0,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as any)
      .select()
      .single();

    if (created.error) {
      console.error('Failed to create character relationship:', created.error);
      return null;
    }

    return created.data as any;
  },

  async applyInactivityDecay(characterId: string): Promise<CharacterRelationship | null> {
    const rel = await this.getOrCreate(characterId);
    if (!rel) return null;

    const last = new Date(rel.last_interaction_at);
    const now = new Date();
    const days = daysBetween(now, last);
    const decay = computeBondDecayFromInactivityDays(days);

    if (decay <= 0) return rel;

    const nextPoints = clampBondPoints(rel.bond_points - decay);

    const updated = await (supabase
      .from('character_relationships')
      .update({
        bond_points: nextPoints,
        updated_at: new Date().toISOString(),
      }) as any)
      .eq('id', rel.id)
      .select()
      .single();

    if (updated.error) {
      console.error('Failed to apply bond decay:', updated.error);
      return rel;
    }

    return updated.data as any;
  },

  async addBondPoints(characterId: string, pointsDelta: number): Promise<CharacterRelationship | null> {
    const rel = await this.applyInactivityDecay(characterId);
    if (!rel) return null;

    const delta = Number(pointsDelta);
    const nextPoints = clampBondPoints(rel.bond_points + (Number.isFinite(delta) ? delta : 0));

    const updated = await (supabase
      .from('character_relationships')
      .update({
        bond_points: nextPoints,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as any)
      .eq('id', rel.id)
      .select()
      .single();

    if (updated.error) {
      console.error('Failed to add bond points:', updated.error);
      return rel;
    }

    return updated.data as any;
  },

  async registerInteraction(characterId: string, userText?: string): Promise<CharacterRelationship | null> {
    const rel = await this.applyInactivityDecay(characterId);
    if (!rel) return null;

    const delta = computeBondPointsDeltaFromUserText(String(userText || ''));
    const nextPoints = clampBondPoints(rel.bond_points + delta);

    const updated = await (supabase
      .from('character_relationships')
      .update({
        bond_points: nextPoints,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as any)
      .eq('id', rel.id)
      .select()
      .single();

    if (updated.error) {
      console.error('Failed to update bond points:', updated.error);
      return rel;
    }

    return updated.data as any;
  },
};
