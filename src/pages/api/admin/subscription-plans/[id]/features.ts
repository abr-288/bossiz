import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    const { data, error } = await supabase
      .from('subscription_features')
      .select('*')
      .eq('plan_id', id)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching subscription features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription features' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id } = params;
    
    const {
      feature_name,
      feature_description,
      icon_name,
      is_included,
      sort_order
    } = body;
    
    if (!feature_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('subscription_features')
      .insert({
        plan_id: id,
        feature_name,
        feature_description,
        icon_name,
        is_included: is_included !== false,
        sort_order: sort_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating subscription feature:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription feature' },
      { status: 500 }
    );
  }
}
