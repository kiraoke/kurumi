// @ts-nocheck

import db from "./db.ts";

export interface User {
  user_id: string;
  email: string;
  username: string;
  pfp: string;
  createdAt: Date;
}

export async function getUserById(userId: string): Promise<User | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db<User[]>`
      SELECT * FROM users WHERE user_id = ${userId};
      `;

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} failed to get user by ID:`,
        (error as Error).message,
      );

      // Optional: Add a delay before retrying-50ms
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  throw new Error("Failed to get user by ID after multiple attempts");
}

export async function createUser({
  email,
  username,
  pfp,
  userId,
}: {
  email: string;
  username: string;
  pfp: string;
  userId: string;
}): Promise<User> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Check if user already exists
      const existingUser = await getUserById(userId);
      if (existingUser) {
        console.warn(
          `User with ID ${userId} already exists. Returning existing user.`,
        );
        return existingUser;
      }

      const result = await db<User[]>`
      INSERT INTO users (user_id, email, username, pfp)
      VALUES (${userId}, ${email}, ${username}, ${pfp})
      RETURNING *;`;

      return result[0];
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} failed to create user:`,
        (error as Error).message,
      );

      // Optional: Add a delay before retrying-50ms
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  throw new Error("Failed to access database", {
    cause: 500,
  });
}

