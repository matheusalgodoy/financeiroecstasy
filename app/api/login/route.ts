import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.APP_PASSWORD;

    if (password === correctPassword) {
      // Create response
      const response = NextResponse.json({ success: true });
      
      // Set cookie
      response.cookies.set('auth_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Senha incorreta' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
