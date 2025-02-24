import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/goals - List goals
export async function GET(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const isActive = searchParams.get('is_active') === 'true';
    
    let query = supabase
      .from('goals')
      .select(`
        *,
        category:categories(id, name, color),
        _count:linked_wins(count)
      `)
      .eq('user_id', user.id);

    // Filter by active status if specified
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/goals - Create goal
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, timeframe_type, start_date, end_date, category_id, is_private } = await request.json();
    
    // Validate required fields
    if (!title || !timeframe_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: user.id,
        title,
        description,
        timeframe_type,
        start_date,
        end_date,
        category_id,
        is_private: is_private ?? false,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Check for the active goals limit constraint violation
    if (error.code === '23514' && error.message.includes('active_goals_limit')) {
      return NextResponse.json(
        { error: 'You can have at most 10 active goals' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
