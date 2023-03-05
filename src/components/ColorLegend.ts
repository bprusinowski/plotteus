import { ColorMap } from "../colors";
import { ResolvedDimensions } from "../dims";
import { Anchor } from "../types";
import { FONT_SIZE, FONT_WEIGHT, max } from "../utils";
import * as Generic from "./Generic";
import { Svg, SVGSelection } from "./Svg";

const R = FONT_SIZE.legendItem / 3;

type G = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  fill: string;
  opacity: number;
};

export type Getter = Generic.Getter<G, { rowIndex: number }>;

export const getters = ({
  colorMap,
  anchor,
  itemHeight,
  svg,
  dims: { width, height, margin, BASE_MARGIN },
}: {
  colorMap: ColorMap;
  anchor: Anchor;
  itemHeight: number;
  svg: Svg;
  dims: ResolvedDimensions;
}): Getter[] => {
  const getters: Getter[] = [];
  const colorsWithCoords: {
    key: string;
    rowIndex: number;
    color: string;
    x: number;
    y: number;
  }[] = [];
  const itemMargin = BASE_MARGIN + R;

  let rowIndex = 0;
  let rowWidth = 0;

  let x: number;
  switch (anchor) {
    case "start":
      x = 0;
      break;
    case "middle":
      x = width * 0.5;
      break;
    case "end":
      x = width;
      break;
  }

  let y = -itemHeight * 0.5;

  for (const [key, color] of colorMap) {
    const { width: itemWidth } = svg.measureText(key, "legendItem");

    // Move to a next row.
    if (rowWidth + itemWidth + itemMargin > width) {
      rowWidth = 0;

      switch (anchor) {
        case "start":
          x = 0;
          break;
        case "middle":
          x = width * 0.5;
          break;
        case "end":
          x = width;
          break;
      }

      // Move items up.
      colorsWithCoords
        .filter((d) => d.rowIndex <= rowIndex)
        .forEach((d) => {
          d.y -= itemHeight;
        });

      rowIndex++;
    }

    let itemX: number;
    switch (anchor) {
      case "start":
        itemX = x;
        break;
      case "middle":
        itemX = x - itemWidth * 0.5;

        // Move row's items to the left.
        colorsWithCoords
          .filter((d) => d.rowIndex === rowIndex)
          .forEach((d) => {
            d.x -= (itemWidth + itemMargin) * 0.5;
          });

        break;
      case "end":
        itemX = x - itemWidth;

        // Move row's items to the left.
        colorsWithCoords
          .filter((d) => d.rowIndex === rowIndex)
          .forEach((d) => {
            d.x -= itemWidth + itemMargin;
          });

        break;
    }

    colorsWithCoords.push({
      key,
      rowIndex,
      color,
      x: itemX,
      y,
    });

    switch (anchor) {
      case "start":
        x += itemWidth + itemMargin;
        break;
      case "middle":
        x += (itemWidth + itemMargin) * 0.5;
        break;
      case "end":
        break;
    }

    rowWidth += itemWidth + itemMargin;
  }

  for (const { key, x, y, color } of colorsWithCoords) {
    getters.push({
      key,
      rowIndex,
      g: ({ s, _g }) => {
        return {
          x: s(margin.left + x, null, _g?.x),
          y: s(height + margin.top + y, null, _g?.y),
          labelX: R * 2,
          labelY: (-itemHeight + R) * 0.5,
          labelFontSize: FONT_SIZE.legendItem,
          fill: color,
          opacity: s(0, 1),
        };
      },
    });
  }

  return getters;
};

export type Int = Generic.Int<G>;

export const ints = Generic.ints<G, Getter, Int>();

export type Resolved = Generic.Resolved<G>;

export const resolve = Generic.resolve<G, Resolved, Int>();

export const render = ({
  resolved,
  selection,
}: {
  resolved: Resolved[];
  selection: SVGSelection;
}): void => {
  selection
    .selectAll<SVGGElement, undefined>(".color-legend")
    .data([null])
    .join("g")
    .attr("class", "color-legend")
    .selectAll<SVGGElement, Resolved>(".item")
    .data(resolved, (d) => d.key)
    .join("g")
    .attr("class", "item")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity)
    .call((g) =>
      g
        .selectAll("circle")
        .data((d) => [d])
        .join("circle")
        .attr("r", R)
        .style("fill", (d) => d.fill)
    )
    .call((g) =>
      g
        .selectAll(".label")
        .data((d) => [d])
        .join("text")
        .attr("class", "label")
        .attr("x", (d) => d.labelX)
        .attr("y", (d) => d.labelY)
        .style("font-size", (d) => d.labelFontSize)
        .style("font-weight", FONT_WEIGHT.legendItem)
        .style("dominant-baseline", "hanging")
        .text((d) => d.key)
    );
};

// --- UTILS

export const getHeight = (getters: Getter[], itemHeight: number): number => {
  return ((max(getters.map((d) => d.rowIndex)) ?? -1) + 1) * itemHeight;
};
