import { describe, it, expect } from "vite-plus/test";
import { replaceTokens } from "../streamlabs-tokens";

const defaults = {
  background_color: "#1a1a2e",
  font_size: "16px",
  text_color: "#ffffff",
  message_hide_delay: "30s",
};

describe("replaceTokens", () => {
  it("replaces {background_color} with the configured default", () => {
    const result = replaceTokens("body { background: {background_color}; }", defaults);
    expect(result).toContain("#1a1a2e");
    expect(result).not.toContain("{background_color}");
  });

  it("replaces {font_size} with the configured default", () => {
    const result = replaceTokens("body { font-size: {font_size}; }", defaults);
    expect(result).toContain("16px");
    expect(result).not.toContain("{font_size}");
  });

  it("replaces {text_color} with the configured default", () => {
    const result = replaceTokens("body { color: {text_color}; }", defaults);
    expect(result).toContain("#ffffff");
    expect(result).not.toContain("{text_color}");
  });

  it("replaces {message_hide_delay} with the configured default", () => {
    const result = replaceTokens(
      "#log>div { animation: fadeOut 0.5s ease {message_hide_delay} forwards; }",
      defaults,
    );
    expect(result).toContain("30s");
    expect(result).not.toContain("{message_hide_delay}");
  });

  it("replaces all four tokens in a combined input", () => {
    const input =
      "body { background: {background_color}; font-size: {font_size}; color: {text_color}; } #log>div { animation: fadeOut 0.5s ease {message_hide_delay} forwards; }";
    const result = replaceTokens(input, defaults);
    expect(result).toContain("#1a1a2e");
    expect(result).toContain("16px");
    expect(result).toContain("#ffffff");
    expect(result).toContain("30s");
    expect(result).not.toMatch(/\{\w+\}/);
  });
});
