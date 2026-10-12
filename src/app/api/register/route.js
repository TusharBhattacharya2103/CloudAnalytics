import { NextResponse } from 'next/server';

// Accounts and roles must be created by an authenticated administrator.
export async function POST() {
  return NextResponse.json(
    { message: 'Public registration is disabled. Ask your CRM administrator to create an account.' },
    { status: 403 },
  );
}
