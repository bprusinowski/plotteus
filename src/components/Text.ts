import { ResolvedDimensions } from "../dims";
import { Anchor, GenericInt, GProps, State, TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";
import { Svg } from "./Svg";
import style from "./Text.module.scss";
import { prepareInts } from "./utils";

type G = {
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  opacity: number;
};

export type Getter = {
  key: string;
  g: (props: GProps<G>) => G;
};

export const getter = ({
  svg,
  text,
  textType,
  anchor,
  dims: { fullWidth, margin },
}: {
  svg: Svg;
  text: string;
  textType: TextType;
  anchor: Anchor;
  dims: ResolvedDimensions;
}): Getter => {
  const { width: textWidth } = svg.measureText(text, textType);

  return {
    key: text,
    g: ({ s, _g }) => {
      let x: number;

      switch (anchor) {
        case "start":
          x = margin.left;
          break;
        case "middle":
          x = (fullWidth - textWidth) * 0.5;
          break;
        case "end":
          x = fullWidth - textWidth - margin.right;
          break;
      }

      return {
        x: s(x, null, _g?.x),
        y: s(margin.top, null, _g?.y),
        fontSize: FONT_SIZE[textType],
        fontWeight: FONT_WEIGHT[textType],
        opacity: s(0, 1),
      };
    },
  };
};

export type Int = {
  key: string;
  state: State;
  i: GenericInt<G>;
};

export const ints = ({
  text,
  _text,
  _textInts,
}: {
  text: Getter | undefined;
  _text: Getter | undefined;
  _textInts: Int[] | undefined;
}): Int[] => {
  const exitingText =
    _text !== undefined && _text.key !== text?.key ? [_text] : [];
  const texts = text !== undefined ? [text, ...exitingText] : exitingText;
  const textInts: Int[] = texts.map(({ key, g }) => {
    const exiting = text?.key !== key;
    const _int = _textInts?.find((d) => d.key === key);
    const { state, i } = prepareInts({ _int, exiting, g });
    const textInt: Int = { key, state, i };

    return textInt;
  });

  return textInts;
};

export type Resolved = {
  key: string;
} & G;

export const resolve = (ints: Int[], t: number): Resolved[] => {
  return ints.map(({ key, i }) => ({ key, ...i(t) }));
};

export const render = ({
  resolved,
  svg,
  key,
}: {
  resolved: Resolved[];
  svg: Svg;
  key: string;
}): void => {
  const className = `${style.node} ${key}`;

  svg.selection
    .selectAll<SVGTextElement, Resolved>(`.${style.node}.${key}`)
    .data(resolved, (d) => d.key)
    .join("text")
    .attr("class", className)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("font-size", (d) => d.fontSize)
    .style("font-weight", (d) => d.fontWeight)
    .style("opacity", (d) => d.opacity)
    .text((d) => d.key);
};
