import { hexToHsv, hsvToHex } from "./colorUtilts";

describe("hexToHsv", () => {
  it("converts #ff0000 to HSV", () => {
    expect(hexToHsv("#ff0000")).toEqual([0, 1, 1]);
  });

  it("converts #00ff00 to HSV", () => {
    expect(hexToHsv("#00ff00")).toEqual([1 / 3, 1, 1]);
  });

  it("converts #0000ff to HSV", () => {
    expect(hexToHsv("#0000ff")).toEqual([2 / 3, 1, 1]);
  });

  it("converts #000000 (black) to HSV", () => {
    expect(hexToHsv("#000000")).toEqual([0, 0, 0]);
  });

  it("converts #ffffff (white) to HSV", () => {
    expect(hexToHsv("#ffffff")).toEqual([0, 0, 1]);
  });

  it("handles short hex format correctly", () => {
    expect(hexToHsv("#f00")).toEqual([0, 1, 1]);
  });
});

describe("hsvToHex", () => {
  it("converts HSV to #ff0000", () => {
    expect(hsvToHex(0, 1, 1)).toBe("#ff0000");
  });

  it("converts HSV to #00ff00", () => {
    expect(hsvToHex(1 / 3, 1, 1)).toBe("#00ff00");
  });

  it("converts HSV to #0000ff", () => {
    expect(hsvToHex(2 / 3, 1, 1)).toBe("#0000ff");
  });

  it("converts black HSV to #000000", () => {
    expect(hsvToHex(0, 0, 0)).toBe("#000000");
  });

  it("converts white HSV to #ffffff", () => {
    expect(hsvToHex(0, 0, 1)).toBe("#ffffff");
  });
});
