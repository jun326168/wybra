import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateGoogleUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username } = body;
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Get or create Google user
    const user = await getOrCreateGoogleUser(email, username);
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });
    
    return NextResponse.json({
      user,
      token,
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Handle account restricted error
    if (error instanceof Error && error.message === 'Account restricted') {
      return NextResponse.json(
        { error: 'Account restricted' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

