import { makeSvg } from "../src/components";
import { Dimensions } from "../src/dims";
import { DEFAULT_FONT_FAMILY } from "../src/utils";

export const setup = () => {
  const div = document.createElement("div");
  const svg = makeSvg(div, {
    svgBackgroundColor: "#FFFFFF",
    fontFamily: DEFAULT_FONT_FAMILY,
  });
  const dims = new Dimensions(800, 550);

  return { svg, dims };
};
