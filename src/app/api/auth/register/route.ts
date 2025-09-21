import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createBusinessOwner, getBusinessOwnerByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      ownerName, 
      businessName, 
      confirmPassword 
    } = await request.json();

    // Validation
    if (!email || !password || !ownerName || !businessName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingOwner = await getBusinessOwnerByEmail(email);
    if (existingOwner) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create business owner
    const ownerId = uuidv4();
    const owner = await createBusinessOwner({
      ownerId,
      email: email.toLowerCase().trim(),
      passwordHash,
      businessName: businessName.trim(),
      ownerName: ownerName.trim()
    });

    // Return success (without password hash)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      owner: {
        ownerId: owner.ownerId,
        email: owner.email,
        ownerName: owner.ownerName,
        businessName: owner.businessName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}