import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/postgres';
import { uploadUserAvatar, deleteUserAvatar } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get existing user to check for old avatar
    const existingUser = await query<{ personal_info: Record<string, unknown> }>(
      'SELECT personal_info FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const personalInfo = existingUser[0].personal_info || {};
    
    // Delete old avatar if exists
    if (personalInfo.avatar_url && typeof personalInfo.avatar_url === 'string') {
      try {
        await deleteUserAvatar(personalInfo.avatar_url);
      } catch (error) {
        // Continue even if deletion fails
        console.error('Failed to delete old avatar:', error);
      }
    }

    // Upload new avatar
    const avatarUrl = await uploadUserAvatar(userId, file);

    // Update user record with avatar_url in personal_info
    const updatedPersonalInfo = {
      ...personalInfo,
      avatar_url: avatarUrl
    };

    const rows = await query(
      'UPDATE users SET personal_info = $1 WHERE id = $2 RETURNING *',
      [updatedPersonalInfo, userId]
    );

    return NextResponse.json({ 
      user: rows[0],
      avatarUrl 
    });

  } catch (error: unknown) {
    console.error('Upload photo error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get user's current avatar
    const existingUser = await query<{ personal_info: Record<string, unknown> }>(
      'SELECT personal_info FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const personalInfo = existingUser[0].personal_info || {};

    if (personalInfo.avatar_url && typeof personalInfo.avatar_url === 'string') {
      try {
        await deleteUserAvatar(personalInfo.avatar_url);
      } catch (error) {
        console.error('Failed to delete avatar:', error);
      }
    }

    // Update user record to remove avatar from personal_info
    const updatedPersonalInfo = {
      ...personalInfo,
      avatar_url: undefined
    };

    const rows = await query(
      'UPDATE users SET personal_info = $1 WHERE id = $2 RETURNING *',
      [updatedPersonalInfo, userId]
    );

    return NextResponse.json({ user: rows[0] });

  } catch (error: unknown) {
    console.error('Delete photo error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

  