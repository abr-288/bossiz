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
      .from('subscription_faqs')
      .select('*')
      .eq('plan_id', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching subscription FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription FAQs' },
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
      question,
      answer,
      category,
      sort_order
    } = body;
    
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('subscription_faqs')
      .insert({
        plan_id: id,
        question,
        answer,
        category,
        sort_order: sort_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating subscription FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription FAQ' },
      { status: 500 }
    );
  }
}
