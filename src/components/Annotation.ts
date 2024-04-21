import { ScaleLinear, scaleLinear } from "d3-scale";
import { Selection } from "d3-selection";
import { getPathData } from "../coords";
import { Dimensions } from "../dims";
import { InputAnnotation } from "../types";
import { TextDims, deriveSubtlerColor, getTextColor, hexToRgb } from "../utils";
import * as Generic from "./Generic";
import { Svg } from "./Svg";
import * as Text from "./Text";

export type Info = {
  getX: ScaleLinear<number, number> | undefined;
  getY: ScaleLinear<number, number> | undefined;
};

export const info = (
  xExtent: [number, number] | undefined,
  yExtent: [number, number] | undefined,
  dims: Dimensions
): Info => {
  const getX = xExtent
    ? scaleLinear().domain(xExtent).range([0, dims.width])
    : undefined;
  const getY = yExtent
    ? scaleLinear().domain(yExtent).range([dims.height, 0])
    : undefined;

  return {
    getX,
    getY,
  };
};

export type G = {
  d: string;
  x: number;
  y: number;
  width: number;
  fill: string;
  color: string;
};

export type Getter = Generic.Getter<G, { label: Text.Getter | undefined }>;

export const getters = ({
  info,
  annotations,
  annotationDims,
  dims,
  svg,
  svgBackgroundColor,
}: {
  info: Info;
  annotations: InputAnnotation[];
  annotationDims: TextDims;
  dims: Dimensions;
  svg: Svg;
  svgBackgroundColor: string;
}): Getter[] => {
  const { getX, getY } = info;

  return annotations
    .filter((annotation) => {
      return (
        (annotation.layout === "horizontal" && getY) ||
        (annotation.layout === "vertical" && getX)
      );
    })
    .map((annotation) => {
      const {
        key,
        text,
        layout,
        textAnchor: inputTextAnchor = "end",
        fill: inputFill,
        size = 3,
      } = annotation;
      const isHorizontal = layout === "horizontal";
      const textAnchor = !isHorizontal
        ? inputTextAnchor === "end"
          ? "start"
          : inputTextAnchor === "start"
            ? "end"
            : "middle"
        : inputTextAnchor;
      const textDims = annotationDims[key];
      const { width, height, fullWidth, left, top, right, BASE_MARGIN } = dims;
      const x = isHorizontal ? left + width * 0.5 : left + getX!(annotation.x);
      const y = isHorizontal
        ? top + getY!(annotation.y)
        : top + height * 0.5 - textDims.height * 0.5 - BASE_MARGIN;
      const fill =
        inputFill ??
        deriveSubtlerColor(
          getTextColor(svgBackgroundColor) === "black" ? "#000000" : "#FFFFFF"
        );
      const color = getTextColor(fill) === "black" ? "#000000" : "#FFFFFF";

      const labelGetter = text
        ? Text.getter({
            type: "annotationLabel",
            text,
            anchor: isHorizontal ? "end" : textAnchor,
            svg,
            svgBackgroundColor: fill,
            dims: {
              ...dims,
              fullWidth:
                textAnchor === "middle" && !isHorizontal
                  ? fullWidth + (x - fullWidth * 0.5) * 2
                  : fullWidth,
              margin: {
                ...dims.margin,
                top:
                  y -
                  (isHorizontal
                    ? textAnchor === "middle"
                      ? textDims.height * 0.5
                      : textAnchor === "start"
                        ? textDims.height
                        : 0
                    : textDims.height +
                      height * 0.5 -
                      textDims.height * 0.5 +
                      BASE_MARGIN),
                left: x,
                right:
                  textAnchor === "end" && !isHorizontal ? fullWidth - x : right,
              },
            } as Dimensions,
            textDims,
          })
        : undefined;

      return {
        key,
        g: ({ s }) => {
          const g: G = {
            d:
              layout === "horizontal"
                ? getPathData({
                    type: "bar",
                    width,
                    height: size,
                    cartoonize: false,
                  })
                : getPathData({
                    type: "bar",
                    width: size,
                    height: height + textDims.height + BASE_MARGIN * 2,
                    cartoonize: false,
                  }),
            x,
            y,
            width: dims.width,
            fill: s(`rgba(${hexToRgb(fill)}, 0)`, fill),
            color: s(`rgba(${hexToRgb(color)}, 0)`, color),
          };

          return g;
        },
        label: labelGetter,
      };
    });
};

export type Int = Generic.Int<G, { labels: Text.Int[] }>;

export const ints = ({
  getters,
  _getters,
  _ints,
}: Generic.IntsProps<G, Getter, Int>) => {
  return Generic.ints<G, Getter, Int>()({
    getters,
    _getters,
    _ints,
    modifyInt: ({ getter, int, _updateInt }) => {
      const _getter = _getters?.find((_getter) => _getter.key === getter.key);
      const _labelGetter = _getter?.label;

      return {
        ...int,
        labels: Text.ints({
          getters: getter.label ? [getter.label] : [],
          _getters: _labelGetter ? [_labelGetter] : [],
          _ints: _updateInt?.labels,
        }),
      };
    },
  });
};

export type Resolved = Generic.Resolved<G, { labels: Text.Resolved[] }>;

export const resolve = ({
  ints,
  t,
}: {
  ints: Int[];
  t: number;
}): Resolved[] => {
  return Generic.resolve<G, Resolved, Int>()({
    ints,
    t,
    modifyResolved: ({ int, resolved }) => {
      return {
        ...resolved,
        labels: Text.resolve({ ints: int.labels, t }).map((d) => {
          return {
            ...d,
            color: resolved.color,
          };
        }),
      };
    },
  });
};

export const render = ({
  selection,
  resolved,
}: {
  selection: Selection<any, any, Element, unknown>;
  resolved: Resolved[];
}): void => {
  selection
    .selectAll<SVGGElement, Resolved>(".plotteus-annotation")
    .data(resolved, (d) => d.key)
    .join("g")
    .attr("class", "plotteus-annotation")
    .call((g) =>
      g
        .selectAll("path")
        .data((d) => [d])
        .join("path")
        .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
        .attr("d", (d) => d.d)
        .attr("fill", (d) => d.fill)
    )
    .call((g) =>
      g
        .selectAll<SVGForeignObjectElement, Text.Resolved>("foreignObject")
        .data(
          (d) => d.labels,
          (d) => d.key
        )
        .join("foreignObject")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height)
        .selectAll("div")
        .data((d) => [d])
        .join("xhtml:div")
        .style("color", (d) => d.color)
        .style("line-height", 1.5)
        .style("font-size", (d) => `${d.fontSize}px`)
        .style("font-weight", (d) => d.fontWeight)
        .text((d) => d.key)
    )
    .call((g) =>
      g
        .selectAll("div")
        .data((d) => [d])
        .style("background", (d) => d.fill)
        // TODO: share this on a higher level
        .style("padding-left", "4px")
        .style("padding-top", "2px")
        .style("padding-right", "4px")
        .style("padding-bottom", "2px")
    );
};
