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
      .from('subscription_testimonials')
      .select('*')
      .eq('plan_id', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching subscription testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription testimonials' },
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
      customer_name,
      customer_title,
      customer_avatar,
      rating,
      testimonial_text,
      is_verified,
      sort_order
    } = body;
    
    if (!customer_name || !testimonial_text || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('subscription_testimonials')
      .insert({
        plan_id: id,
        customer_name,
        customer_title,
        customer_avatar,
        rating,
        testimonial_text,
        is_verified: is_verified || false,
        sort_order: sort_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating subscription testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription testimonial' },
      { status: 500 }
    );
  }
}
