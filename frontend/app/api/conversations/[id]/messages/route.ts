import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/conversations/[id]/messages - Get messages in a conversation
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

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (
      conversation.participant_1_id !== payload.userId &&
      conversation.participant_2_id !== payload.userId
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: id },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversation_id: id,
        recipient_id: payload.userId,
        read_at: null,
      },
      data: {
        read_at: new Date(),
      },
    });

    // Transform to match frontend format
    const transformed = messages.map((message) => ({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : '',
      content: message.message_text,
      timestamp: message.created_at.toISOString(),
      read: !!message.read_at,
    }));

    return NextResponse.json({ messages: transformed });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
