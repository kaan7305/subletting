import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// POST /api/messages - Send a message
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
    const { conversationId, receiverId, propertyId, content } = body;

    // Validate required fields
    if (!content || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let conversation;

    if (conversationId) {
      // Use existing conversation
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Verify user is part of conversation
      if (
        conversation.participant_1_id !== payload.userId &&
        conversation.participant_2_id !== payload.userId
      ) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else {
      // Create or find conversation
      const participants = [payload.userId, receiverId].sort();

      conversation = await prisma.conversation.findFirst({
        where: {
          participant_1_id: participants[0],
          participant_2_id: participants[1],
          property_id: propertyId || null,
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participant_1_id: participants[0],
            participant_2_id: participants[1],
            property_id: propertyId || null,
          },
        });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: payload.userId,
        recipient_id: receiverId,
        message_text: content,
      },
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        last_message_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          content: message.message_text,
          timestamp: message.created_at.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
