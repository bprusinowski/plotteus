import { hierarchy, pack } from "d3-hierarchy";
import { Datum, Group } from "../components";
import { BUBBLE, getPathData } from "../coords";
import { InputGroup } from "../types";
import { FONT_SIZE, getTextColor } from "../utils";
import { HierarchyRoot } from "./types";
import {
  getGroupLabelStrokeWidth,
  getRotate,
  PADDING,
  STROKE_WIDTH,
} from "./utils";

export const getBubbleGetters = ({
  groups,
  shareDomain,
  maxValue,
  showValues,
  showDatumLabels,
  dims: { width, height, size, margin },
  textDims,
  colorMap,
  cartoonize,
}: Group.GetterProps): Group.Getter[] => {
  const root = getRoot({ groups, size: maxValue.k * size });
  const groupsGetters: Group.Getter[] = [];
  // If a custom maxValue was provided, we need to shift the bubbles to the center.
  const maxValueShift = maxValue.kc * size * 0.5;
  const showDatumLabelsAndValues = showDatumLabels && showValues;

  for (const group of root.children || []) {
    const { key } = group.data;

    // Skip groups with no data.
    if (
      isNaN(group.r) ||
      group.children?.reduce((acc, d) => (acc += d.r), 0) === 0
    ) {
      continue;
    }

    const singleDatum = group.children?.length === 1;
    const groupGetters: Group.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = s(
          BUBBLE,
          getPathData({
            type: "bubble",
            r: group.r,
            cartoonize,
          })
        );
        const x = margin.left + group.x + maxValueShift + (width - size) * 0.5;
        const y = margin.top + group.y + maxValueShift + (height - size) * 0.5;
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
      const datumFill = fill ?? colorMap.get(key, group.data.key, shareDomain);
      const datumGetters: Datum.Getter = {
        key,
        teleportKey: `${group.data.key}:${key}`,
        teleportFrom: datum.data.teleportFrom,
        value,
        g: ({ s, _g }) => {
          const d = s(
            BUBBLE,
            getPathData({
              type: "bubble",
              r: datum.r,
              cartoonize,
            })
          );
          const clipPath = d;
          const x = s(0, group.x - datum.x);
          const y = s(0, group.y - datum.y);
          const rotate = getRotate(_g?.rotate, cartoonize);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelX = 0;
          const labelY =
            textDims.datumLabel.yShift -
            (showDatumLabelsAndValues ? textDims.datumLabel.height * 0.5 : 0);
          const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
          const labelFill = getTextColor(datumFill);
          const valueX = 0;
          const valueY = s(
            0,
            (singleDatum && key
              ? datum.r * 0.5 + textDims.datumValue.yShift
              : textDims.datumValue.yShift) +
              (showDatumLabels ? textDims.datumLabel.height : 0) -
              (showDatumLabelsAndValues ? textDims.datumLabel.height * 0.5 : 0)
          );
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
  size,
}: {
  groups: InputGroup[];
  size: number;
}): HierarchyRoot => {
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
  pack().size([size, size]).padding(PADDING)(root);

  return root as any as HierarchyRoot;
};
