// This file is intentionally left blank.
// The seeding logic is now handled client-side for the local demo.
// A server-side implementation would be needed for a production database.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ message: 'La siembra de datos está deshabilitada en el modo de demostración local.' }, { status: 403 });
}
