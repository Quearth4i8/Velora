import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('characters')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✓ Supabase connection successful');
    console.log('✓ Characters table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

export async function testCharacterInsert() {
  try {
    console.log('Testing character insert...');
    
    const testCharacter = {
      age_group: 'test',
      ethnicity: 'test',
      height: 'test',
      physique: 'test',
      chest_size: 'test',
      butt_size: 'test',
      hair_style: 'test',
      hair_color: '#000000',
      eye_color: 'test',
      personality_archetype: 'test',
      personality_traits: { test: 50 },
    };

    const { data, error } = await supabase
      .from('characters')
      .insert([testCharacter])
      .select();

    if (error) {
      console.error('❌ Insert failed:', error.message);
      return false;
    }

    console.log('✓ Character insert successful');
    
    if (data && data[0]) {
      await supabase.from('characters').delete().eq('id', data[0].id);
      console.log('✓ Test character cleaned up');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}
