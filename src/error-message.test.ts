import { describe, expect, it } from "vite-plus/test";
import { errorMessage } from "./error-message.ts";

describe("errorMessage", () => {
  it("text/plain の本文（HTTPException の 409 など）をそのまま使う", () => {
    const error = Object.assign(new Error("Action failed with 409 Conflict"), {
      body: "「食費」は2件の支出で使われているため削除できません。",
    });
    expect(errorMessage(error)).toBe("「食費」は2件の支出で使われているため削除できません。");
  });

  it("検証エラーは最初の項目の文言", () => {
    expect(errorMessage({ body: { errors: { amount: "金額は1以上の整数で入力してください" } } })).toBe(
      "金額は1以上の整数で入力してください",
    );
  });

  it("{ message } 形式", () => {
    expect(errorMessage({ body: { message: "見つかりません" } })).toBe("見つかりません");
  });

  it("本文が無ければ Error の message、それも無ければ汎用の文言", () => {
    expect(errorMessage(new Error("通信に失敗"))).toBe("通信に失敗");
    expect(errorMessage(null)).toBe("もう一度お試しください。");
    expect(errorMessage({ body: "  " })).toBe("もう一度お試しください。");
  });

  it("長すぎる本文は切り詰める", () => {
    expect(errorMessage({ body: "あ".repeat(500) })).toHaveLength(300);
  });
});
