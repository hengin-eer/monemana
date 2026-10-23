import { defineEnv, string } from "void/env";

export default defineEnv({
  ALLOWED_EMAILS: string(),
});
