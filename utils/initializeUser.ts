import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";

export const useInitializeUser = () => {
  const createUser = useMutation(api.users.createUser);

  const initializeUser = async (user: {
    userId: string;
    name: string;
    email?: string;
    picture?: string;
  }) => {
    try {
      await createUser({
        userId: user.userId,
        name: user.name,
        role: "user",
        createdAt: Date.now(),
        profileDetails: {
          email: user.email,
          picture: user.picture,
        },
      });
    } catch (error) {
      console.error("User initialization failed:", error);
    }
  };

  return { initializeUser };
};
