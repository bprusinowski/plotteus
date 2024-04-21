import { PieArcDatum, pie } from "d3-shape";
import { Datum } from ".";
import * as Story from "..";
import { BUBBLE, getPathData } from "../coords";
import { Dimensions } from "../dims";
import {
  ChartType,
  ExtremeValue,
  InputDatumValue,
  InputGroupValue,
  PieInputStep,
} from "../types";
import {
  FONT_SIZE,
  deriveSubtlerColor,
  getTextColor,
  radiansToDegrees,
} from "../utils";
import * as Chart from "./Chart";
import {
  HALF_FONT_K,
  STROKE_WIDTH,
  getGroupLabelStrokeWidth,
  getHierarchyRoot,
  getMaxValue,
} from "./utils";

export type Info = Story.Info &
  Chart.BaseInfo & {
    type: "pie";
    groups: InputGroupValue[];
    maxValue: ExtremeValue;
  };

export const info = (
  storyInfo: Story.Info,
  svgBackgroundColor: string,
  inputStep: PieInputStep
): Info => {
  const { groups, shareDomain = true } = inputStep;
  const type: ChartType = "pie";

  return {
    ...storyInfo,
    ...Chart.baseInfo(svgBackgroundColor, inputStep, shareDomain),
    type,
    groups,
    maxValue: getMaxValue(inputStep),
  };
};

export const xExtent = (): Chart.Extent => {
  return;
};

export const yExtent = (): Chart.Extent => {
  return;
};

export const updateDims = (dims: Dimensions) => {
  const { BASE_MARGIN } = dims;
  dims.addBottom(BASE_MARGIN);
};

export const getters = (
  info: Info,
  props: Chart.GetterProps
): Chart.Getter[] => {
  const { groups, maxValue, shareDomain, showValues, svgBackgroundColor } =
    info;
  const { showDatumLabels, dims, textTypeDims, colorMap, cartoonize } = props;
  const { width, height, size, margin } = dims;
  const root = getHierarchyRoot({ groups, size: maxValue.k * size });
  const maxValueShift = maxValue.kc * size * 0.5;
  const showDatumLabelsAndValues = showDatumLabels && showValues;
  const groupFill = deriveSubtlerColor(svgBackgroundColor);
  const groupLabelFill = getTextColor(svgBackgroundColor);
  const groupLabelStroke = svgBackgroundColor;
  const datumStroke = svgBackgroundColor;

  return (root.children ?? [])
    .filter((group) => {
      // Skip groups with no data.
      return !(
        isNaN(group.r) ||
        !group.children ||
        group.children.reduce((acc, d) => (acc += d.r), 0) === 0
      );
    })
    .map((group) => {
      const { key } = group.data;
      const groupX =
        margin.left + group.x + maxValueShift + (width - size) * 0.5;
      const groupY =
        margin.top + group.y + maxValueShift + (height - size) * 0.5;
      const groupGetters: Chart.Getter = {
        key,
        g: ({ s, _g }) => {
          const d = BUBBLE;
          const labelX = groupX;
          const labelY = groupY - textTypeDims.groupLabel.yShift * HALF_FONT_K;
          const labelFontSize =
            groups.length > 1
              ? s(0, shareDomain ? FONT_SIZE.groupLabel : 0)
              : 0;
          const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
          const opacity = group.data.opacity ?? 1;

          const g: Chart.G = {
            d,
            x: s(groupX, null, _g?.x),
            y: s(groupY, null, _g?.y),
            labelX,
            labelY,
            labelFontSize,
            labelStroke: groupLabelStroke,
            labelStrokeWidth,
            labelFill: groupLabelFill,
            labelRotate: 0,
            fill: groupFill,
            opacity,
          };

          return g;
        },
        data: [],
      };

      const data = pie().value((d: any) => d.value)(
        group.children ?? ([] as any)
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
        const datumFill =
          fill ?? colorMap.get(key, group.data.key, shareDomain);

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
            const x = s(
              groupX,
              groupX + datumX - (singlePie ? group.r * 0.5 : 0)
            );
            const y = s(groupY, groupY + datumY);
            const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
            const labelX = s(
              x - groupX,
              groupX + -x + group.r * 0.5 * Math.sin(rotate + Math.PI * 0.5)
            );
            const labelY =
              s(
                y - groupY,
                groupY +
                  -y -
                  group.r * 0.5 * Math.cos(rotate + Math.PI * 0.5) -
                  textTypeDims.datumValue.yShift * 0.5
              ) +
              textTypeDims.datumLabel.yShift -
              // TODO: move by cos / sin.
              (showDatumLabelsAndValues
                ? textTypeDims.datumLabel.height * 0.5
                : 0);
            const labelFontSize = s(
              0,
              showDatumLabels ? FONT_SIZE.datumLabel : 0
            );
            const labelFill = getTextColor(datumFill);
            const labelStroke = datumFill;
            const valueX = labelX;
            const valueY =
              labelY + (showDatumLabels ? textTypeDims.datumLabel.height : 0);
            const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
            const valueFill = labelFill;
            const opacity = datum.data.data.opacity ?? 1;

            const g: Datum.G = {
              d,
              clipPath,
              x,
              y,
              rotate:
                rotateDegrees - (_g?.rotate ?? 0) >= 180
                  ? rotateDegrees - 360
                  : rotateDegrees,
              fill: datumFill,
              stroke: datumStroke,
              strokeWidth,
              labelX,
              labelY,
              labelFontSize,
              labelStroke,
              labelFill,
              valueX,
              valueY,
              valueFontSize,
              valueFill,
              opacity,
            };

            return g;
          },
        };

        groupGetters.data.push(datumGetters);
      });

      return groupGetters;
    });
};
