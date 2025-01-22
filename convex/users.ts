import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
const validator = require("validator");

// Utility function to validate email format
const validateEmail = (email: string | undefined) => {
  if (email && !validator.isEmail(email)) {
    throw new Error("Invalid email format");
  }
};

// Utility function to prepare profileDetails object with only defined fields
const prepareProfileDetails = (profileDetails: any) => {
  const details: Partial<{
    email: string;
    picture: string;
    height: number;
    weight: number;
  }> = {};

  if (profileDetails.email !== undefined) {
    validateEmail(profileDetails.email);
    details.email = profileDetails.email;
  }
  if (profileDetails.picture !== undefined) {
    details.picture = profileDetails.picture;
  }
  if (profileDetails.height !== undefined) {
    details.height = profileDetails.height;
  }
  if (profileDetails.weight !== undefined) {
    details.weight = profileDetails.weight;
  }

  return details;
};

// Create a new user
export const createUser = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
    name: v.string(),
    profileDetails: v.optional(
      v.object({
        email: v.optional(v.string()),
        picture: v.optional(v.string()),
        height: v.optional(v.number()),
        weight: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      // Validate email
      if (args.profileDetails?.email) {
        validateEmail(args.profileDetails.email);
      }

      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      if (existingUser) {
        return existingUser;
      }

      // Insert new user
      const newUser = await ctx.db.insert("users", {
        userId: args.userId,
        role: args.role,
        createdAt: args.createdAt,
        name: args.name,
        profileDetails: args.profileDetails,
      });

      return newUser;
    } catch (error) {
      throw new Error(`User creation failed: ${(error as Error).message}`);
    }
  },
});

// Read user information by userId
export const readUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const userInfo = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (!userInfo) {
        throw new Error("User not found");
      }

      return userInfo;
    } catch (error) {
      throw new Error(`Reading user failed: ${(error as Error).message}`);
    }
  },
});

// Search users by name or email
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm) return [];

    const searchTermLower = args.searchTerm.toLowerCase();

    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("userId"), args.userId))
      .collect();

    return users
      .filter((user: any) => {
        const nameMatch = user?.name?.toLowerCase().includes(searchTermLower);
        const emailMatch = user?.profileDetails?.email?.toLowerCase().includes(searchTermLower);
        return nameMatch || emailMatch;
      })
      .slice(0, 10);
  },
});

// Update user profile details
export const updateProfileDetails = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()), // Make name optional
    profileDetails: v.optional(
      v.object({
        email: v.optional(v.string()),
        picture: v.optional(v.string()),
        height: v.optional(v.number()),
        weight: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (!user) {
        throw new Error("User not found");
      }

      const updateData: Partial<{ name: string; profileDetails: any }> = {};
      if (args.name) {
        updateData.name = args.name;
      }
      if (args.profileDetails) {
        updateData.profileDetails = prepareProfileDetails(args.profileDetails);
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No update data provided");
      }

      const updatedUser = await ctx.db.patch(user._id, updateData);

      return updatedUser;
    } catch (error) {
      throw new Error(`Update failed: ${(error as Error).message}`);
    }
  },
});

// Add user and associate with a chat
export const addUserWithChat = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    chatId: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if user already exists
      let user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (!user) {
        const newUserId = await ctx.db.insert("users", {
          userId: args.userId,
          name: args.name,
          role: args.role,
          createdAt: args.createdAt,
        });
        user = await ctx.db.get(newUserId);
        if (!user) throw new Error("Failed to create user");
      }

      // Find the chat
      const chat = await ctx.db
        .query("chats")
        .filter((q) => q.eq(q.field("chatId"), args.chatId))
        .first();

      if (!chat) {
        throw new Error("Chat not found");
      }

      const participants = chat.participants || [];
      if (!participants.some((participantId) => participantId === user._id)) {
        await ctx.db.patch(chat._id, {
          participants: [...participants, user._id],
        });
      }

      return { success: true, userId: args.userId, chatId: args.chatId };
    } catch (error) {
      throw new Error(`Failed to add user to chat: ${(error as Error).message}`);
    }
  },
});
