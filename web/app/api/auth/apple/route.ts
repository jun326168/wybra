import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateAppleUser, generateToken } from '@/lib/auth';
import verifyIdToken from 'verify-apple-id-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityToken, username } = body;
    
    // Validate input
    if (!identityToken) {
      return NextResponse.json(
        { error: 'Identity token is required' },
        { status: 400 }
      );
    }
    
    // Verify Apple identity token
    let jwtClaims;
    try {
      jwtClaims = await verifyIdToken({
        idToken: identityToken,
        clientId: process.env.EXPO_PUBLIC_BUNDLE_ID || 'com.jun326168.wybra',
      });
    } catch (error) {
      console.error('Apple token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Apple identity token' },
        { status: 401 }
      );
    }
    
    // Extract email from verified token
    const email = jwtClaims.email;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }
    
    // Get or create Apple user
    const user = await getOrCreateAppleUser(email, username || 'User');
    
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
    console.error('Apple auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
