import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/bookings - List user's bookings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'guest' or 'host'

    const where: any = {};

    if (type === 'guest') {
      where.guest_id = payload.userId;
    } else if (type === 'host') {
      where.host_id = payload.userId;
    } else {
      // Get both guest and host bookings
      where.OR = [
        { guest_id: payload.userId },
        { host_id: payload.userId },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          include: {
            photos: {
              orderBy: { display_order: 'asc' },
              take: 1,
            },
          },
        },
        guest: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
        host: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform to match frontend format
    const transformed = bookings.map((booking) => ({
      id: booking.id,
      propertyId: booking.property_id,
      propertyTitle: booking.property?.title,
      propertyImage: booking.property?.photos[0]?.photo_url,
      propertyLocation: booking.property ? `${booking.property.city}, ${booking.property.state_province}` : '',
      checkIn: booking.check_in_date.toISOString(),
      checkOut: booking.check_out_date.toISOString(),
      guests: booking.guest_count,
      totalPrice: booking.total_cents / 100,
      status: booking.booking_status,
      paymentStatus: booking.payment_status,
      createdAt: booking.created_at.toISOString(),
      guest: booking.guest ? {
        id: booking.guest.id,
        name: `${booking.guest.first_name} ${booking.guest.last_name}`,
        image: booking.guest.profile_photo_url,
      } : null,
      host: booking.host ? {
        id: booking.host.id,
        name: `${booking.host.first_name} ${booking.host.last_name}`,
        image: booking.host.profile_photo_url,
      } : null,
    }));

    return NextResponse.json({ bookings: transformed });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, checkIn, checkOut, guests } = body;

    // Validate required fields
    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Calculate nights and pricing
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const monthlyRate = property.monthly_price_cents;
    const dailyRate = Math.round(monthlyRate / 30);
    const subtotal = dailyRate * nights;
    const serviceFee = Math.round(subtotal * 0.12); // 12% service fee
    const cleaningFee = property.cleaning_fee_cents;
    const total = subtotal + serviceFee + cleaningFee;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        property_id: propertyId,
        guest_id: payload.userId,
        host_id: property.host_id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        nights,
        guest_count: guests || 1,
        subtotal_cents: subtotal,
        service_fee_cents: serviceFee,
        cleaning_fee_cents: cleaningFee,
        security_deposit_cents: property.security_deposit_cents,
        total_cents: total,
        booking_status: 'pending',
        payment_status: 'pending',
      },
    });

    // Create calendar entries
    const dates = [];
    for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    await prisma.bookingCalendar.createMany({
      data: dates.map((date) => ({
        property_id: propertyId,
        date,
        status: 'booked',
        booking_id: booking.id,
      })),
    });

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          propertyId: booking.property_id,
          checkIn: booking.check_in_date.toISOString(),
          checkOut: booking.check_out_date.toISOString(),
          guests: booking.guest_count,
          totalPrice: booking.total_cents / 100,
          status: booking.booking_status,
          paymentStatus: booking.payment_status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
