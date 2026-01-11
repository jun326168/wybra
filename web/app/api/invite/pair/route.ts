import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/postgres';

type ErrorType = 'NotFound' | 'NotOneMaleOneFemale';

interface Invite {
  id: string;
  code: string;
  invited_user_id: string;
  used_by_user_id: string | null;
  status: string;
  created_at: string;
}

interface UserWithGender {
  id: string;
  personal_info: {
    gender?: string;
  };
}

interface UserAccess {
  id: string;
  user_id: string;
  is_vip: boolean;
  reputation_score: number;
  xray_charges: number;
  charges_refill_date: string | null;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 400 }
      );
    }

    // Get the invite with the code
    const invite = await queryOne<Invite>(
      'SELECT id, code, invited_user_id, used_by_user_id, status, created_at FROM invites WHERE code = $1',
      [code.toUpperCase()]
    );

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      );
    }

    // Check if invite is still active
    if (invite.status !== 'active') {
      return NextResponse.json(
        { error: 'Invite code is no longer active' },
        { status: 400 }
      );
    }

    // Check if invite has already been used
    if (invite.used_by_user_id) {
      return NextResponse.json(
        { error: 'Invite code has already been used' },
        { status: 400 }
      );
    }

    // Prevent user from using their own invite code
    if (invite.invited_user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot use your own invite code' },
        { status: 400 }
      );
    }

    // Get both users with their gender information
    const [pairUser, invitedUser] = await Promise.all([
      queryOne<UserWithGender>(
        'SELECT id, personal_info FROM users WHERE id = $1',
        [user.id]
      ),
      queryOne<UserWithGender>(
        'SELECT id, personal_info FROM users WHERE id = $1',
        [invite.invited_user_id]
      ),
    ]);

    if (!pairUser || !invitedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Extract genders
    const pairUserGender = pairUser.personal_info?.gender?.toLowerCase();
    const invitedUserGender = invitedUser.personal_info?.gender?.toLowerCase();

    // Check if both users have gender set
    if (!pairUserGender || !invitedUserGender) {
      return NextResponse.json(
        { error: 'Both users must have gender set' },
        { status: 400 }
      );
    }

    // Check if genders are the same (must be one male and one female)
    if (pairUserGender === invitedUserGender) {
      return NextResponse.json(
        { error: 'Users must have different genders to pair', type: 'NotOneMaleOneFemale' },
        { status: 400 }
      );
    }

    // Check if one is male and one is female
    const genders = [pairUserGender, invitedUserGender];
    const hasMale = genders.includes('male');
    const hasFemale = genders.includes('female');

    if (!hasMale || !hasFemale) {
      return NextResponse.json(
        { error: 'Users must be one male and one female to pair', type: 'NotOneMaleOneFemale' },
        { status: 400 }
      );
    }

    // Update invite status and used_by_user_id
    await query(
      `UPDATE invites 
       SET status = 'used', used_by_user_id = $1 
       WHERE id = $2`,
      [user.id, invite.id]
    );

    // Get today's date
    const todayDate = getTodayDate();

    // Update or create user_access for both users
    // For pair user (the one using the code)
    const pairUserAccess = await queryOne<UserAccess>(
      'SELECT id FROM user_access WHERE user_id = $1',
      [user.id]
    );

    if (pairUserAccess) {
      await query(
        `UPDATE user_access 
         SET is_vip = true, charges_refill_date = $1 
         WHERE user_id = $2`,
        [todayDate, user.id]
      );
    } else {
      await query(
        `INSERT INTO user_access (user_id, is_vip, reputation_score, xray_charges, charges_refill_date)
         VALUES ($1, true, 100, 1, $2)`,
        [user.id, todayDate]
      );
    }

    // For invited user (the one who created the code)
    const invitedUserAccess = await queryOne<UserAccess>(
      'SELECT id FROM user_access WHERE user_id = $1',
      [invite.invited_user_id]
    );

    if (invitedUserAccess) {
      await query(
        `UPDATE user_access 
         SET is_vip = true, charges_refill_date = $1 
         WHERE user_id = $2`,
        [todayDate, invite.invited_user_id]
      );
    } else {
      await query(
        `INSERT INTO user_access (user_id, is_vip, reputation_score, xray_charges, charges_refill_date)
         VALUES ($1, true, 100, 1, $2)`,
        [invite.invited_user_id, todayDate]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully paired',
    });
  } catch (error: unknown) {
    console.error('Pair invite error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
