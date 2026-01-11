import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/postgres';

interface UserToken {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
}

// POST - Store a token for the authenticated user
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
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if token already exists for this user
    const existingToken = await queryOne<UserToken>(
      'SELECT id FROM user_tokens WHERE user_id = $1 AND token = $2',
      [user.id, token]
    );

    if (existingToken) {
      return NextResponse.json(
        { warning: 'Token already exists for this user' },
        { status: 200 }
      );
    }

    // Insert the new token
    const newToken = await queryOne<UserToken>(
      `INSERT INTO user_tokens (user_id, token)
       VALUES ($1, $2)
       RETURNING id, user_id, token, created_at`,
      [user.id, token]
    );

    if (!newToken) {
      return NextResponse.json(
        { error: 'Failed to store token' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Token stored successfully',
        token: {
          id: newToken.id,
          token: newToken.token,
          created_at: newToken.created_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Store token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Read all tokens for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tokens = await query<UserToken>(
      'SELECT id, user_id, token, created_at FROM user_tokens WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    return NextResponse.json({
      tokens: tokens.map(t => ({
        id: t.id,
        token: t.token,
        created_at: t.created_at
      }))
    });

  } catch (error) {
    console.error('Read tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a token for the authenticated user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');
    const token = searchParams.get('token');

    // If neither tokenId nor token is provided, delete all tokens for the user
    if (!tokenId && !token) {
      const deletedTokens = await query<UserToken>(
        `DELETE FROM user_tokens 
         WHERE user_id = $1
         RETURNING id, user_id, token, created_at`,
        [user.id]
      );

      return NextResponse.json({
        message: 'All tokens deleted successfully',
        deleted_count: deletedTokens.length,
        deleted_tokens: deletedTokens.map(t => ({
          id: t.id,
          token: t.token
        }))
      });
    }

    let deletedToken: UserToken | null = null;

    if (tokenId) {
      // Delete by token ID
      deletedToken = await queryOne<UserToken>(
        `DELETE FROM user_tokens 
         WHERE id = $1 AND user_id = $2
         RETURNING id, user_id, token, created_at`,
        [tokenId, user.id]
      );
    } else if (token) {
      // Delete by token value
      deletedToken = await queryOne<UserToken>(
        `DELETE FROM user_tokens 
         WHERE token = $1 AND user_id = $2
         RETURNING id, user_id, token, created_at`,
        [token, user.id]
      );
    }

    if (!deletedToken) {
      return NextResponse.json(
        { error: 'Token not found or does not belong to user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Token deleted successfully',
      deleted: {
        id: deletedToken.id,
        token: deletedToken.token
      }
    });

  } catch (error) {
    console.error('Delete token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
