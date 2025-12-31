import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/properties - List properties with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const propertyType = searchParams.get('propertyType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      status: 'active',
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.monthly_price_cents = {};
      if (minPrice) where.monthly_price_cents.gte = parseInt(minPrice) * 100;
      if (maxPrice) where.monthly_price_cents.lte = parseInt(maxPrice) * 100;
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms);
    }

    if (propertyType) {
      where.property_type = propertyType;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          photos: {
            orderBy: { display_order: 'asc' },
            take: 1,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    // Transform to match frontend format
    const transformed = properties.map((property) => ({
      id: property.id,
      title: property.title,
      location: `${property.city}, ${property.state_province}`,
      city: property.city,
      state: property.state_province,
      price: property.monthly_price_cents / 100,
      image: property.photos[0]?.photo_url || '/placeholder.jpg',
      bedrooms: property.bedrooms,
      bathrooms: parseFloat(property.bathrooms.toString()),
      propertyType: property.property_type,
      rating: 0, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count reviews
      host: {
        id: property.host.id,
        name: `${property.host.first_name} ${property.host.last_name}`,
        image: property.host.profile_photo_url,
      },
      instantBook: property.instant_book,
    }));

    return NextResponse.json({
      properties: transformed,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get properties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create new property
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
    const {
      title,
      description,
      propertyType,
      address,
      city,
      state,
      zipCode,
      country,
      bedrooms,
      bathrooms,
      price,
      images,
      amenities,
    } = body;

    // Validate required fields
    if (!title || !description || !city || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        host_id: payload.userId,
        title,
        description,
        property_type: propertyType || 'entire_place',
        address_line1: address || '',
        city,
        state_province: state || '',
        postal_code: zipCode || '',
        country: country || 'USA',
        bedrooms: bedrooms || 1,
        bathrooms: bathrooms || 1.0,
        monthly_price_cents: Math.round(price * 100),
        status: 'draft', // Will be activated after review
      },
    });

    // Add photos if provided
    if (images && Array.isArray(images) && images.length > 0) {
      await prisma.propertyPhoto.createMany({
        data: images.map((url: string, index: number) => ({
          property_id: property.id,
          photo_url: url,
          display_order: index,
        })),
      });
    }

    return NextResponse.json(
      { property },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create property error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
