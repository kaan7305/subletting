import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/properties/[id] - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { display_order: 'asc' },
        },
        host: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
            bio: true,
            created_at: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                first_name: true,
                last_name: true,
                profile_photo_url: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Calculate average rating from reviews
    const avgRating =
      property.reviews.length > 0
        ? property.reviews.reduce((sum, r) => sum + parseFloat(r.overall_rating.toString()), 0) /
          property.reviews.length
        : 0;

    // Transform to match frontend format
    const transformed = {
      id: property.id,
      title: property.title,
      description: property.description,
      location: `${property.city}, ${property.state_province}`,
      address: property.address_line1,
      city: property.city,
      state: property.state_province,
      zipCode: property.postal_code,
      price: property.monthly_price_cents / 100,
      securityDeposit: property.security_deposit_cents ? property.security_deposit_cents / 100 : 0,
      images: property.photos.map((p) => p.photo_url),
      bedrooms: property.bedrooms,
      bathrooms: parseFloat(property.bathrooms.toString()),
      squareFeet: property.square_meters ? Math.round(property.square_meters * 10.764) : null,
      propertyType: property.property_type,
      amenities: property.amenities.map((a) => a.amenity.name),
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: property.reviews.length,
      reviews: property.reviews.map((r) => ({
        id: r.id,
        rating: parseFloat(r.overall_rating.toString()),
        comment: r.review_text,
        author: `${r.reviewer?.first_name} ${r.reviewer?.last_name}`,
        authorImage: r.reviewer?.profile_photo_url,
        date: r.created_at.toISOString(),
        cleanliness: r.cleanliness_rating ? parseFloat(r.cleanliness_rating.toString()) : null,
        accuracy: r.accuracy_rating ? parseFloat(r.accuracy_rating.toString()) : null,
        location: r.location_rating ? parseFloat(r.location_rating.toString()) : null,
        communication: r.communication_rating ? parseFloat(r.communication_rating.toString()) : null,
        value: r.value_rating ? parseFloat(r.value_rating.toString()) : null,
      })),
      host: {
        id: property.host.id,
        name: `${property.host.first_name} ${property.host.last_name}`,
        image: property.host.profile_photo_url,
        bio: property.host.bio,
        memberSince: property.host.created_at.toISOString(),
      },
      instantBook: property.instant_book,
      cancellationPolicy: property.cancellation_policy,
      minimumStay: property.minimum_stay_weeks,
      maximumStay: property.maximum_stay_months,
    };

    return NextResponse.json({ property: transformed });
  } catch (error) {
    console.error('Get property error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id] - Update property
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

    // Check if property exists and user is the host
    const existing = await prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (existing.host_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Map frontend fields to database fields
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.price) updateData.monthly_price_cents = Math.round(body.price * 100);
    if (body.bedrooms) updateData.bedrooms = body.bedrooms;
    if (body.bathrooms) updateData.bathrooms = body.bathrooms;

    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ property: updated });
  } catch (error) {
    console.error('Update property error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete property
export async function DELETE(
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

    // Check if property exists and user is the host
    const existing = await prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (existing.host_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
