import { makeSvg } from "../src/components";
import { Dimensions } from "../src/dims";

export const setup = () => {
  const div = document.createElement("div");
  const svg = makeSvg(div);
  const dims = new Dimensions(800, 550);

  return { svg, dims };
};
