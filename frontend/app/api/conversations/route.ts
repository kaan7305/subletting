import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/conversations - List user's conversations
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

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant_1_id: payload.userId },
          { participant_2_id: payload.userId },
        ],
      },
      include: {
        participant_1: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
        participant_2: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            photos: {
              orderBy: { display_order: 'asc' },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { last_message_at: 'desc' },
    });

    // Transform to match frontend format
    const transformed = conversations.map((conv) => {
      const isParticipant1 = conv.participant_1_id === payload.userId;
      const otherParticipant = isParticipant1 ? conv.participant_2 : conv.participant_1;
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        participant1Id: conv.participant_1_id,
        participant2Id: conv.participant_2_id,
        participant1Name: conv.participant_1 ? `${conv.participant_1.first_name} ${conv.participant_1.last_name}` : '',
        participant2Name: conv.participant_2 ? `${conv.participant_2.first_name} ${conv.participant_2.last_name}` : '',
        participant1Initials: conv.participant_1 ? `${conv.participant_1.first_name[0]}${conv.participant_1.last_name[0]}` : '',
        participant2Initials: conv.participant_2 ? `${conv.participant_2.first_name[0]}${conv.participant_2.last_name[0]}` : '',
        participant1Image: conv.participant_1?.profile_photo_url,
        participant2Image: conv.participant_2?.profile_photo_url,
        propertyId: conv.property_id,
        propertyTitle: conv.property?.title,
        propertyImage: conv.property?.photos[0]?.photo_url,
        lastMessage: lastMessage?.message_text,
        lastMessageTime: lastMessage?.created_at.toISOString(),
        unread: isParticipant1
          ? conv.messages.filter((m) => m.recipient_id === payload.userId && !m.read_at).length
          : conv.messages.filter((m) => m.recipient_id === payload.userId && !m.read_at).length,
      };
    });

    return NextResponse.json({ conversations: transformed });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
