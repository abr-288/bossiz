import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id } = params;
    
    const {
      plan_id,
      name,
      description,
      subtitle,
      price,
      currency,
      billing_cycle,
      trial_days,
      features,
      icon_name,
      color_scheme,
      is_popular,
      is_active,
      sort_order,
      metadata
    } = body;
    
    if (!plan_id || !name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('subscription_plans_admin')
      .update({
        plan_id,
        name,
        description,
        subtitle,
        price,
        currency: currency || 'XOF',
        billing_cycle: billing_cycle || 'monthly',
        trial_days: trial_days || 0,
        features: features || [],
        icon_name: icon_name || 'Crown',
        color_scheme: color_scheme || 'from-yellow-400 to-yellow-600',
        is_popular: is_popular || false,
        is_active: is_active !== false,
        sort_order: sort_order || 0,
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    const { error } = await supabase
      .from('subscription_plans_admin')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    );
  }
}
