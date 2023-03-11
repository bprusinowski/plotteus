import { hierarchy, treemap, treemapResquarify } from "d3-hierarchy";
import { Datum, Group } from "../components";
import { BAR, getPathData } from "../coords";
import { InputGroupValue } from "../types";
import { FONT_SIZE, getTextColor } from "../utils";
import { TreemapHierarchyRoot } from "./types";
import {
  getGroupLabelStrokeWidth,
  getRotate,
  STROKE_WIDTH,
  TEXT_MARGIN,
} from "./utils";

const PADDING = 2;

export const getTreemapGetters = ({
  groups,
  shareDomain,
  maxValue,
  showValues,
  showDatumLabels,
  svg,
  dims: { width, height, margin },
  textDims,
  colorMap,
  cartoonize,
}: Group.GetterPropsValue): Group.Getter[] => {
  const root = getRoot({
    groups,
    width: maxValue.k * width,
    height: maxValue.k * height,
  });
  const groupsGetters: Group.Getter[] = [];

  for (const group of root.children || []) {
    const { key } = group.data;

    // Skip groups with no data.
    if (
      group.value === 0 ||
      group.children?.reduce((acc, d) => (acc += d.value), 0) === 0
    ) {
      continue;
    }

    const groupWidth = group.x1 - group.x0;
    const groupHeight = group.y1 - group.y0;

    const groupGetters: Group.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = BAR;
        const x =
          margin.left + group.x0 + (maxValue.kc * width + groupWidth) * 0.5;
        const y =
          margin.top + group.y0 + (maxValue.kc * height + groupHeight) * 0.5;
        const labelX = 0;
        const labelY = textDims.groupLabel.yShift;
        const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
        const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
        const opacity = group.data.opacity ?? 1;

        return {
          d,
          x: s(x, null, _g?.x),
          y: s(y, null, _g?.y),
          labelX,
          labelY,
          labelFontSize,
          labelStrokeWidth,
          opacity,
        };
      },
      data: [],
    };

    for (const datum of group.children || []) {
      const { key, value, fill } = datum.data;
      const dWidth = datum.x1 - datum.x0;
      const dHeight = datum.y1 - datum.y0;
      const datumFill = fill ?? colorMap.get(key, group.data.key, shareDomain);

      const datumGetters: Datum.Getter = {
        key,
        type: "value",
        teleportKey: `${group.data.key}:${key}`,
        teleportFrom: datum.data.teleportFrom,
        value,
        g: ({ s, _g }) => {
          const d = s(
            BAR,
            getPathData({
              type: "bar",
              width: dWidth,
              height: dHeight,
              cartoonize,
            })
          );
          const clipPath = d;
          const x = s(0, datum.x0 - group.x0 - (groupWidth - dWidth) * 0.5);
          const y = s(0, datum.y0 - group.y0 - (groupHeight - dHeight) * 0.5);
          const rotate = getRotate(_g?.rotate);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelWidth = svg.measureText(key, "datumLabel").width;
          const labelX = s(0, (labelWidth - dWidth) * 0.5 + TEXT_MARGIN);
          const labelY = s(0, -(dHeight * 0.5 + textDims.datumLabel.yShift));
          const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
          const labelFill = getTextColor(datumFill);
          const valueWidth = svg.measureText(value, "datumValue").width;
          const valueX = s(0, (valueWidth - dWidth) * 0.5 + TEXT_MARGIN);
          const valueY =
            labelY + (showDatumLabels ? textDims.datumValue.height : 0);
          const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
          const valueFill = labelFill;
          const opacity = datum.data.opacity ?? 1;

          return {
            d,
            clipPath,
            x,
            y,
            rotate,
            fill: datumFill,
            strokeWidth,
            labelX,
            labelY,
            labelFontSize,
            labelFill,
            valueX,
            valueY,
            valueFontSize,
            valueFill,
            opacity,
          };
        },
      };

      groupGetters.data.push(datumGetters);
    }

    groupsGetters.push(groupGetters);
  }

  return groupsGetters;
};

const getRoot = ({
  groups,
  width,
  height,
}: {
  groups: InputGroupValue[];
  width: number;
  height: number;
}): TreemapHierarchyRoot => {
  const root = hierarchy({
    children: groups.map((d) => ({
      key: d.key,
      opacity: d.opacity,
      children: d.data,
    })),
  }).sum((d) => Math.max(0, (d as any).value));
  const descendants = root.descendants();
  const leaves = descendants.filter((d) => !d.children);
  leaves.forEach((d: any, i) => (d.index = i));
  root.sort((a: any, b: any) => a.index - b.index);
  treemap()
    .tile(treemapResquarify)
    .size([width, height])
    .paddingInner(PADDING)
    .paddingOuter(PADDING)(root as any);

  return root as any as TreemapHierarchyRoot;
};
