import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import validator from "validator";
import { v4 as uuidv4 } from "uuid";

// Utility function to fetch a user by `userId`
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

// Utility function to fetch a chat by `chatId`
const getChatById = async (ctx: any, chatId: string) => {
  const chat = await ctx.db
    .query("chats")
    .filter((q: any) => q.eq(q.field("chatId"), chatId))
    .first();

  if (!chat) {
    throw new Error(`Chat with ID ${chatId} not found`);
  }
  return chat;
};

// Send a message
export const sendMessage = mutation({
  args: {
    chatId: v.string(),
    senderId: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("file")
    ),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sender = await getUserById(ctx, args.senderId);
    const chat = await getChatById(ctx, args.chatId);

    // Validate media URL if provided
    if (args.mediaUrl && !validator.isURL(args.mediaUrl)) {
      throw new Error("Invalid media URL");
    }

    // Insert the new message
    const messageId = await ctx.db.insert("messages", {
      messageId: uuidv4(),
      chatId: chat._id,
      senderId: sender._id,
      content: args.content,
      type: args.type,
      mediaUrl: args.mediaUrl || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update chat's last message ID and updatedAt timestamp
    await ctx.db.patch(chat._id, {
      lastMessageId: messageId,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Get messages for a chat
export const getMessages = query({
  args: {
    chatId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chat = await getChatById(ctx, args.chatId);

    const limit = args.limit || 50; // Default to 50 messages
    const offset = args.offset || 0;

    // Fetch and sort messages for the chat with pagination
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("chatId"), chat._id))
      .collect();

    const sortedMessages = messages
      .sort((a, b) => b.createdAt - a.createdAt) // Sort by `createdAt` descending
      .slice(offset, offset + limit); // Apply pagination

    return sortedMessages.map((message: any) => ({
      ...message,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      mediaUrl: message.mediaUrl,
      createdAt: message.createdAt,
    }));
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("messageId"), args.messageId))
      .first();

    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await getChatById(ctx, args.chatId);

    // Delete the message
    await ctx.db.delete(message._id);

    // Update the chat's lastMessageId if the deleted message was the last one
    if (chat.lastMessageId === message._id) {
      const recentMessage = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("chatId"), chat._id))
        .collect()
        .then((msgs) => msgs.sort((a, b) => b.createdAt - a.createdAt)[0]); // Get the most recent message

      await ctx.db.patch(chat._id, {
        lastMessageId: recentMessage ? recentMessage._id : undefined,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get recent messages for all chats of a user
export const getRecentMessagesByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId);

    // Fetch chats the user is part of
    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("participants"), user._id))
      .collect();

    // Fetch the last message for each chat
    const results = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = chat.lastMessageId
          ? await ctx.db.get(chat.lastMessageId)
          : null;

        return {
          chatId: chat.chatId,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
              }
            : null,
        };
      })
    );

    return results;
  },
});
