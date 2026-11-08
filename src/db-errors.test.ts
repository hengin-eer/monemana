import { describe, expect, it } from "vite-plus/test";
import { isForeignKeyViolation, isUniqueViolation } from "./db-errors.ts";

describe("制約違反の判定", () => {
  it("そのままのメッセージを判定する", () => {
    expect(isUniqueViolation(new Error("UNIQUE constraint failed: categories.user_id, categories.name"))).toBe(true);
    expect(isForeignKeyViolation(new Error("FOREIGN KEY constraint failed"))).toBe(true);
  });

  it("drizzle が包んだ例外（メッセージは cause に入る）も判定する", () => {
    const inner = new Error("D1_ERROR: UNIQUE constraint failed: categories.user_id, categories.name: SQLITE_CONSTRAINT");
    const wrapped = new Error("Failed query: insert into categories ...", { cause: inner });
    expect(isUniqueViolation(wrapped)).toBe(true);
    expect(isForeignKeyViolation(wrapped)).toBe(false);
    const fk = new Error("Failed query: delete from categories ...", { cause: new Error("FOREIGN KEY constraint failed") });
    expect(isForeignKeyViolation(fk)).toBe(true);
  });

  it("無関係な例外・null は false", () => {
    expect(isUniqueViolation(new Error("network"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isForeignKeyViolation(undefined)).toBe(false);
  });
});
