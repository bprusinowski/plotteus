export type PaletteName =
  | "default"
  | "pastel"
  | "vivid"
  | "oranges"
  | "tableau";

const defaultPalette = [
  "#FFD270",
  "#A48CF2",
  "#FD7F6F",
  "#6BA6FF",
  "#FA667E",
  "#68CA8E",
];

const pastelPalette = [
  "#B3CDE3",
  "#FBB4AE",
  "#CCEBC5",
  "#DECBE4",
  "#FED9A6",
  "#FFFFCC",
  "#E5D8bD",
  "#FDDAEC",
  "#F2F2F2",
];

const vividPalette = ["#79A0FB", "#FCBB7E", "#F5A3CF", "#BB89F0", "#BBE773"];

const orangesPalette = ["#FF9191", "#FFA984", "#FFC680", "#FCE389", "#E9FFA1"];

const tableauPalette = [
  "#4E79A7",
  "#F28E2B",
  "#E15759",
  "#76B7B2",
  "#59A14F",
  "#EDC948",
  "#B07AA1",
  "#FF9DA7",
  "#9C755F",
  "#BAB0AC",
];

export const getPalette = (paletteName: PaletteName): string[] => {
  switch (paletteName) {
    case "default":
      return defaultPalette;
    case "pastel":
      return pastelPalette;
    case "vivid":
      return vividPalette;
    case "oranges":
      return orangesPalette;
    case "tableau":
      return tableauPalette;
  }
};

export class ColorMap {
  private colorMap: Map<string, string> = new Map();
  public palette: PaletteName = "default";
  private lastUsedPaletteColorIndex = 0;

  constructor() {}

  public addKeys(keys: string[], customColorsMap: Map<string, string>): void {
    const palette = getPalette(this.palette);
    const colorMap = new Map<string, string>();
    let i = this.lastUsedPaletteColorIndex;
    keys.forEach((key) => {
      if (customColorsMap.has(key)) {
        colorMap.set(key, customColorsMap.get(key) as string);
      } else if (this.colorMap.has(key)) {
        colorMap.set(key, this.colorMap.get(key) as string);
      } else {
        colorMap.set(key, palette[i % palette.length]);
        i++;
      }
    });
    this.colorMap = colorMap;
    this.lastUsedPaletteColorIndex = i;
  }

  public setPalette(paletteName: PaletteName): void {
    this.palette = paletteName;
    const colors = getPalette(paletteName);
    let i = 0;
    this.colorMap.forEach((_, k) => {
      this.colorMap.set(k, colors[i % colors.length]);
      i++;
    });
    this.lastUsedPaletteColorIndex = i;
  }

  public get(datumKey: string, groupKey: string, shareDomain: boolean): string {
    return this.colorMap.get(shareDomain ? datumKey : groupKey) as string;
  }

  public [Symbol.iterator]() {
    return this.colorMap[Symbol.iterator]();
  }
}
