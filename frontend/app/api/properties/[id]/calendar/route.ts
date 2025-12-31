import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/properties/[id]/calendar - Get property availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      property_id: id,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const unavailableDates = await prisma.bookingCalendar.findMany({
      where,
      select: {
        date: true,
        status: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const formatted = unavailableDates
      .filter((d) => d.status !== 'available')
      .map((d) => ({
        date: d.date.toISOString(),
        reason: d.status === 'booked' ? 'booked' : 'blocked',
      }));

    return NextResponse.json({ unavailableDates: formatted });
  } catch (error) {
    console.error('Get calendar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
