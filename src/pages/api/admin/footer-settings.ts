import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('footer_settings')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch footer settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    // Validation des données
    const {
      background_color,
      text_color,
      link_color,
      link_hover_color,
      border_color,
      company_name,
      description,
      social_links,
      contact_info,
      quick_links,
      legal_links,
      newsletter_text,
      copyright_text,
      is_active
    } = body;
    
    if (!background_color || !text_color || !link_color || !company_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Vérifier si un enregistrement existe déjà
    const { data: existingData } = await supabase
      .from('footer_settings')
      .select('id')
      .limit(1);
    
    let result;
    
    if (existingData && existingData.length > 0) {
      // Mettre à jour l'enregistrement existant
      const { data, error } = await supabase
        .from('footer_settings')
        .update({
          background_color,
          text_color,
          link_color,
          link_hover_color,
          border_color,
          company_name,
          description,
          social_links,
          contact_info,
          quick_links,
          legal_links,
          newsletter_text,
          copyright_text,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData[0].id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Créer un nouvel enregistrement
      const { data, error } = await supabase
        .from('footer_settings')
        .insert({
          background_color,
          text_color,
          link_color,
          link_hover_color,
          border_color,
          company_name,
          description,
          social_links,
          contact_info,
          quick_links,
          legal_links,
          newsletter_text,
          copyright_text,
          is_active
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving footer settings:', error);
    return NextResponse.json(
      { error: 'Failed to save footer settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('footer_settings')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating footer settings:', error);
    return NextResponse.json(
      { error: 'Failed to update footer settings' },
      { status: 500 }
    );
  }
}
