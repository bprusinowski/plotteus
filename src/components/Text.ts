import { ResolvedDimensions } from "../dims";
import { Anchor, GenericInt, State, Stateful, TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";
import { Svg } from "./Svg";
import style from "./Text.module.scss";
import { getInts } from "./utils";

type G = {
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  opacity: number;
};

export type Getter = {
  key: string;
  g: (props: Stateful<G>) => G;
};

export const getter = ({
  text,
  textType,
  anchor,
  svg,
  dims: { fullWidth, margin },
}: {
  text: string;
  textType: TextType;
  anchor: Anchor;
  svg: Svg;
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
  getter,
  _getter,
  _ints,
}: {
  getter: Getter | undefined;
  _getter: Getter | undefined;
  _ints: Int[] | undefined;
}): Int[] => {
  const exitingGetter =
    _getter !== undefined && getter?.key !== _getter.key ? [_getter] : [];
  const getters =
    getter !== undefined ? [getter, ...exitingGetter] : exitingGetter;
  const ints: Int[] = getters.map(({ key, g }) => {
    const exiting = getter?.key !== key;
    const _int = _ints?.find((d) => d.key === key);
    const { state, i } = getInts({ _int, exiting, g });

    return {
      key,
      state,
      i,
    };
  });

  return ints;
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
