import { defineAuth } from "void/auth";

export default defineAuth(({ defaults, env }) => ({
  ...defaults,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const allowedEmails = typeof env.ALLOWED_EMAILS === "string"
            ? env.ALLOWED_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
            : [];

          if (!allowedEmails.includes(user.email.trim().toLowerCase())) {
            return false;
          }
          return { data: user };
        },
      },
    },
  },
}));
