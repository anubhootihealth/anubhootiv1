import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Utility function to get a user's Convex ID
const getUserById = async (ctx: any, userId: string) => {
  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first();

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return user;
};

// Get chats for a specific user
export const getChats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId);

    // Get chats where the user is a participant
    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("participants"), user._id))
      .collect();

    // Enrich chats with participant details and last message
    return Promise.all(
      chats.map(async (chat) => {
        const participants = await Promise.all(
          chat.participants.map(async (participantId: Id<"users">) => {
            const user = await ctx.db.get(participantId);
            if (!user) return null;
            return {
              _id: user._id,
              userId: user.userId,
              ...(user.name && { name: user.name }),
            };
          })
        ).then((parts) => parts.filter(Boolean)); // Remove null participants

        const lastMessage = chat.lastMessageId
          ? await ctx.db.get(chat.lastMessageId)
          : null;

        return {
          ...chat,
          participants,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
        };
      })
    );
  },
});

// Create a new chat
export const createChat = mutation({
  args: {
    senderId: v.string(),
    participantIds: v.array(v.string()),
    type: v.union(v.literal("private"), v.literal("group")),
  },
  handler: async (ctx, args) => {
    const sender = await getUserById(ctx, args.senderId);

    // Validate participant IDs and fetch their Convex IDs
    const participants = await Promise.all(
      args.participantIds.map(async (id) => {
        const user = await getUserById(ctx, id);
        return user._id;
      })
    );

    // Add sender to participants if not already included
    const allParticipants = [...new Set([...participants, sender._id])];

    // Validate private chat constraints
    if (args.type === "private" && allParticipants.length !== 2) {
      throw new Error("Private chats must have exactly 2 participants");
    }

    // Check for an existing private chat with the same participants
    if (args.type === "private") {
      const existingChat = await ctx.db
        .query("chats")
        .filter((q) => q.eq(q.field("type"), "private"))
        .filter((q) => q.eq(q.field("participants"), allParticipants))
        .first();

      if (existingChat) {
        return existingChat._id; // Return existing chat if found
      }
    }

    // Create a new chat
    const chatId = await ctx.db.insert("chats", {
      senderId: sender._id,
      chatId: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      participants: allParticipants,
      type: args.type,
    });

    return chatId;
  },
});

// Get or create a chat
export const getOrCreateChat = mutation({
  args: {
    senderId: v.string(),
    participantIds: v.array(v.string()),
    type: v.union(v.literal("private"), v.literal("group")),
  },
  handler: async (ctx, args) => {
    const sender = await getUserById(ctx, args.senderId);

    // Fetch participant Convex IDs
    const participants = await Promise.all(
      args.participantIds.map(async (id) => {
        const user = await getUserById(ctx, id);
        return user._id;
      })
    );

    // Include sender in participants
    const allParticipants = [...new Set([...participants, sender._id])];

    // Check for existing chat with the same participants
    const existingChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("type"), args.type))
      .collect();

    const existingChat = existingChats.find((chat) => {
      if (chat.participants.length !== allParticipants.length) return false;
      return allParticipants.every((participantId) =>
        chat.participants.includes(participantId)
      );
    });

    if (existingChat) {
      return existingChat._id; // Return existing chat if found
    }

    // Create a new chat if no existing one matches
    return await createChat(ctx, args);
  },
});

// Delete a chat and associated data
export const deleteChat = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    // Fetch and delete associated messages
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("chatId"), chat._id))
      .collect();

    await Promise.all(
      messages.map(async (message) => {
        if (message.type !== "text" && message.mediaUrl) {
          const mediaDoc = await ctx.db
            .query("media")
            .filter((q) => q.eq(q.field("messageId"), message._id))
            .first();
          if (mediaDoc) {
            await ctx.db.delete(mediaDoc._id);
          }
        }
        await ctx.db.delete(message._id); // Delete message
      })
    );

    // Delete the chat
    await ctx.db.delete(chat._id);

    return { success: true, message: "Chat and associated data deleted successfully" };
  },
});
