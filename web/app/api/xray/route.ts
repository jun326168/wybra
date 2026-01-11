import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/postgres';

interface UserAccess {
  id: string;
  user_id: string;
  is_vip: boolean;
  reputation_score: number;
  xray_charges: number;
  xray_target: string | null;
  charges_refill_date: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { target_user_id } = body;

    if (!target_user_id || typeof target_user_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid target_user_id' },
        { status: 400 }
      );
    }

    // Get user access
    const userAccess = await queryOne<UserAccess>(
      'SELECT id, user_id, is_vip, reputation_score, xray_charges, xray_target, charges_refill_date FROM user_access WHERE user_id = $1',
      [user.id]
    );

    if (!userAccess) {
      return NextResponse.json(
        { error: 'User access not found' },
        { status: 404 }
      );
    }

    // Check if user is VIP
    if (!userAccess.is_vip) {
      return NextResponse.json(
        { error: 'User is not VIP' },
        { status: 403 }
      );
    }

    // Check if user has charges
    if (userAccess.xray_charges <= 0) {
      return NextResponse.json(
        { error: 'No charges remaining' },
        { status: 400 }
      );
    }

    // Check if already used on this target
    if (userAccess.xray_target === target_user_id) {
      return NextResponse.json({
        success: true,
        message: 'Already used on this target',
      });
    }

    // Update xray_target and decrement charges
    await query(
      `UPDATE user_access 
       SET xray_target = $1, xray_charges = xray_charges - 1 
       WHERE user_id = $2`,
      [target_user_id, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Used successfully',
    });
  } catch (error: unknown) {
    console.error('Ghost perception error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
