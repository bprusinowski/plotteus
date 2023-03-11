import { hierarchy, pack } from "d3-hierarchy";
import { pie, PieArcDatum } from "d3-shape";
import { Datum, Group } from "../components";
import { BUBBLE, getPathData } from "../coords";
import { InputDatumValue, InputGroupValue } from "../types";
import { FONT_SIZE, getTextColor, radiansToDegrees } from "../utils";
import { HierarchyRoot } from "./types";
import { getGroupLabelStrokeWidth, PADDING, STROKE_WIDTH } from "./utils";

export const getPieGetters = ({
  groups,
  shareDomain,
  maxValue,
  showValues,
  showDatumLabels,
  dims: { width, height, size, margin },
  textDims,
  colorMap,
  cartoonize,
}: Group.GetterPropsValue): Group.Getter[] => {
  const root = getRoot({ groups, size: maxValue.k * size });
  const groupsGetters: Group.Getter[] = [];
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

    const groupGetters: Group.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = BUBBLE;
        const x = margin.left + group.x + maxValueShift + (width - size) * 0.5;
        const y = margin.top + group.y + maxValueShift + (height - size) * 0.5;
        const labelX = 0;
        const labelY = textDims.groupLabel.yShift;
        const labelFontSize =
          groups.length > 1 ? s(0, shareDomain ? FONT_SIZE.groupLabel : 0) : 0;
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

    const data = pie().value((d: any) => d.value)(
      group.children || ([] as any)
    ) as unknown as PieArcDatum<{ data: InputDatumValue }>[];

    data.map((datum, i) => {
      const { key, value, fill } = datum.data.data;
      // Angle extent can't be 0, as otherwise NaNs will be introduced
      // in the path, which will break label clipping.
      const angleExtent = datum.endAngle - datum.startAngle || 0.001;
      let rotate = (angleExtent - Math.PI) * 0.5;
      const _datum = data?.[i - 1];

      if (_datum) {
        data.slice(0, i).forEach((d) => {
          rotate += d.endAngle - d.startAngle;
        });
      }

      const datumX = Math.sin(rotate) * group.r * 0.5;
      const datumY = -Math.cos(rotate) * group.r * 0.5;
      const datumFill = fill ?? colorMap.get(key, group.data.key, shareDomain);

      const rotateDegrees = radiansToDegrees(rotate);
      const singlePie = data.length === 1;

      const datumGetters: Datum.Getter = {
        key,
        type: "value",
        teleportKey: `${group.data.key}:${key}`,
        teleportFrom: datum.data.data.teleportFrom,
        value,
        g: ({ s, _g }) => {
          const d = s(
            BUBBLE,
            singlePie
              ? getPathData({
                  type: "bubble",
                  r: group.r,
                  cartoonize,
                })
              : getPathData({
                  type: "pie",
                  startAngle: 0,
                  endAngle: angleExtent,
                  r: group.r,
                  cartoonize,
                })
          );
          const clipPath = d;
          const x = s(0, datumX - (singlePie ? group.r * 0.5 : 0));
          const y = s(0, datumY);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelX = s(
            x,
            -x + group.r * 0.5 * Math.sin(rotate + Math.PI * 0.5)
          );
          const labelY =
            s(
              y,
              -y -
                group.r * 0.5 * Math.cos(rotate + Math.PI * 0.5) +
                textDims.datumValue.yShift
            ) +
            textDims.datumLabel.yShift -
            // TODO: move by cos / sin.
            (showDatumLabelsAndValues ? textDims.datumLabel.height * 0.5 : 0);
          const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
          const labelFill = getTextColor(datumFill);
          const valueX = labelX;
          const valueY =
            labelY + (showDatumLabels ? textDims.datumLabel.height : 0);
          const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
          const valueFill = labelFill;
          const opacity = datum.data.data.opacity ?? 1;

          return {
            d,
            clipPath,
            x,
            y,
            rotate:
              rotateDegrees - (_g?.rotate ?? 0) >= 180
                ? rotateDegrees - 360
                : rotateDegrees,
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
    });

    groupsGetters.push(groupGetters);
  }

  return groupsGetters;
};

const getRoot = ({
  groups,
  size,
}: {
  groups: InputGroupValue[];
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
  pack().size([size, size]).padding(PADDING)(root as any);

  return root as any as HierarchyRoot;
};
