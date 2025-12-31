import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/bookings/[id] - Get single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            photos: {
              orderBy: { display_order: 'asc' },
            },
          },
        },
        guest: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            profile_photo_url: true,
          },
        },
        host: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            profile_photo_url: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (booking.guest_id !== payload.userId && booking.host_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        propertyId: booking.property_id,
        propertyTitle: booking.property?.title,
        propertyImage: booking.property?.photos[0]?.photo_url,
        checkIn: booking.check_in_date.toISOString(),
        checkOut: booking.check_out_date.toISOString(),
        guests: booking.guest_count,
        subtotal: booking.subtotal_cents / 100,
        serviceFee: booking.service_fee_cents / 100,
        cleaningFee: booking.cleaning_fee_cents / 100,
        totalPrice: booking.total_cents / 100,
        status: booking.booking_status,
        paymentStatus: booking.payment_status,
        guest: booking.guest ? {
          id: booking.guest.id,
          name: `${booking.guest.first_name} ${booking.guest.last_name}`,
          email: booking.guest.email,
          phone: booking.guest.phone,
          image: booking.guest.profile_photo_url,
        } : null,
        host: booking.host ? {
          id: booking.host.id,
          name: `${booking.host.first_name} ${booking.host.last_name}`,
          email: booking.host.email,
          phone: booking.host.phone,
          image: booking.host.profile_photo_url,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update booking (e.g., cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (booking.guest_id !== payload.userId && booking.host_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    if (action === 'cancel') {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          booking_status: 'cancelled',
          cancelled_by: payload.userId,
          cancelled_at: new Date(),
          cancellation_reason: reason || null,
        },
      });

      // Update calendar to free dates
      await prisma.bookingCalendar.updateMany({
        where: {
          booking_id: id,
        },
        data: {
          status: 'available',
          booking_id: null,
        },
      });

      return NextResponse.json({
        booking: {
          id: updated.id,
          status: updated.booking_status,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
