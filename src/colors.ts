export type PaletteName = "default" | "pastel" | "vivid" | "oranges";

const defaultPalette = ["#333333", "#FD7F6F", "#A48CF2", "#6BA6FF", "#FA667E"];

const pastelPalette = [
  "#b3cde3",
  "#fbb4ae",
  "#ccebc5",
  "#decbe4",
  "#fed9a6",
  "#ffffcc",
  "#e5d8bd",
  "#fddaec",
  "#f2f2f2",
];

const vividPalette = ["#79A0FB", "#FCBB7E", "#F5A3CF", "#BB89F0", "#BBE773"];

const orangesPalette = ["#ff9191", "#ffa984", "#ffc680", "#fce389", "#e9ffa1"];

export const getPalette = (d: PaletteName): string[] => {
  switch (d) {
    case "default":
      return defaultPalette;
    case "pastel":
      return pastelPalette;
    case "vivid":
      return vividPalette;
    case "oranges":
      return orangesPalette;
  }
};

export class ColorMap {
  private colorMap: Map<string, string>;

  constructor(domain: string[], paletteName: PaletteName) {
    const palette = getPalette(paletteName);
    this.colorMap = new Map(
      domain.map((d, i) => [d, palette[i % palette.length]])
    );
  }

  public get(datumKey: string, groupKey: string, shareDomain: boolean): string {
    return this.colorMap.get(shareDomain ? datumKey : groupKey) as string;
  }

  public [Symbol.iterator]() {
    return this.colorMap[Symbol.iterator]();
  }
}
