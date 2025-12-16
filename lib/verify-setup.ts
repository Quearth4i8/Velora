import { supabase } from './supabase';

export async function verifySupabaseConnection() {
  try {
    console.log('Verifying Supabase connection...');
    
    // Test connection by querying the characters table
    const { data, error } = await supabase
      .from('characters')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return {
        connected: false,
        error: error.message,
        message: 'Unable to connect to Supabase. Please check your credentials and ensure the characters table exists.',
      };
    }

    console.log('✓ Supabase connection successful');
    return {
      connected: true,
      message: 'Supabase connection verified. Characters table is accessible.',
    };
  } catch (error) {
    console.error('❌ Verification error:', error);
    return {
      connected: false,
      error: String(error),
      message: 'An error occurred while verifying the connection.',
    };
  }
}

export async function verifyCharacterCreation(testData: any) {
  try {
    console.log('Testing character creation...');

    const { data, error } = await supabase
      .from('characters')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Character creation failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create test character.',
      };
    }

    console.log('✓ Character creation successful:', data);
    
    // Clean up test data
    if (data && data[0]) {
      await supabase.from('characters').delete().eq('id', data[0].id);
    }

    return {
      success: true,
      data,
      message: 'Character creation test passed.',
    };
  } catch (error) {
    console.error('❌ Test error:', error);
    return {
      success: false,
      error: String(error),
      message: 'An error occurred during testing.',
    };
  }
}
