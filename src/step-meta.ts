import { ColorMap } from "./colors";
import {
  BarChartLayout,
  BarChartSubtype,
  BarInputStep,
  BaseMax,
  ChartType,
  DefaultInputStep,
  InputDatumValue,
  InputDatumXY,
  InputGroupValue,
  InputGroupXY,
  InputStep,
  MaxValue,
  MaxXY,
  ScatterInputStep,
  TreemapInputStep,
  TreemapLayout,
} from "./types";
import { max, sum, unique } from "./utils";

type ChartMeta = {
  groupsKeys: string[];
  dataKeys: string[];
  shareDomain: boolean;
  showsGroupLabelsOnBottom: boolean;
  showsDatumValuesOnTop: boolean;
} & (
  | {
      groups: InputGroupValue[];
      groupsType: "value";
      type: "bar";
      subtype: BarChartSubtype | undefined;
      layout: BarChartLayout | undefined;
      max: MaxValue;
    }
  | {
      groups: InputGroupValue[];
      groupsType: "value";
      type: "treemap";
      subtype: undefined;
      layout: TreemapLayout | undefined;
      max: MaxValue;
    }
  | {
      groups: InputGroupValue[];
      groupsType: "value";
      type: Exclude<ChartType, "bar" | "treemap" | "scatter">;
      subtype: undefined;
      layout: undefined;
      max: MaxValue;
    }
  | {
      groups: InputGroupXY[];
      groupsType: "xy";
      type: "scatter";
      subtype: undefined;
      layout: undefined;
      max: MaxXY;
    }
);

type LegendMeta = {
  show: boolean;
};

type AxisMeta = {
  show: boolean;
  title: string;
  tickFormat: (d: number) => string;
  maxValue: number;
};

const defaultTickFormat = (d: number) => d.toString();

export class StepMeta {
  public chart: ChartMeta;
  public legend: LegendMeta;
  public horizontalAxis?: AxisMeta;
  public verticalAxis?: AxisMeta;

  constructor(step: InputStep, colorMap: ColorMap) {
    this.chart = this.getChartMeta(step);
    this.legend = this.getLegendMeta(step, colorMap);
    this.horizontalAxis = this.getHorizontalAxis(step);
    this.verticalAxis = this.getVerticalAxis(step);
  }

  private getChartMeta(step: InputStep): ChartMeta {
    const common = {
      shareDomain: step.shareDomain ?? shouldShareDomain(step.chartType),
      groupsKeys: this.getGroupsKeys(step),
      dataKeys: this.getDataKeys(step),
    };

    switch (step.chartType) {
      case "bar":
        return {
          showsGroupLabelsOnBottom: true,
          showsDatumValuesOnTop: true,
          groups: step.groups,
          groupsType: "value",
          type: "bar",
          subtype: step.chartSubtype,
          layout: step.layout,
          max: this.getMaxValueBar(step),
          ...common,
        };
      case "scatter":
        return {
          showsGroupLabelsOnBottom: false,
          showsDatumValuesOnTop: false,
          groups: step.groups,
          groupsType: "xy",
          type: "scatter",
          subtype: undefined,
          layout: undefined,
          max: this.getMaxXY(step),
          ...common,
        };
      case "treemap":
        return {
          showsGroupLabelsOnBottom: true,
          showsDatumValuesOnTop: true,
          groups: step.groups,
          groupsType: "value",
          type: "treemap",
          subtype: undefined,
          layout: step.layout,
          max: this.getMaxValueDefault(step),
          ...common,
        };
      default:
        return {
          showsGroupLabelsOnBottom: false,
          showsDatumValuesOnTop: false,
          groups: step.groups,
          groupsType: "value",
          type: step.chartType,
          subtype: undefined,
          layout: undefined,
          max: this.getMaxValueDefault(step),
          ...common,
        };
    }
  }

  private getLegendMeta(step: InputStep, colorMap: ColorMap): LegendMeta {
    const { chart } = this;
    const keys = chart.shareDomain ? chart.dataKeys : chart.groupsKeys;
    const show = step.showLegend ?? keys.length > 1;

    if (step.palette && step.palette !== colorMap.palette) {
      colorMap.setPalette(step.palette);
    }

    const customDataColors = this.getCustomDataColors(step);
    colorMap.addKeys(keys, customDataColors);

    return { show };
  }

  private getMaxValueBar(step: BarInputStep): MaxValue {
    let valueMax = 0;

    switch (step.chartSubtype) {
      case "stacked":
        // Sum values by group for stacked bar chart.
        step.groups.forEach((d) => {
          const groupSum = sum(d.data.map((d) => d.value));

          if (groupSum > valueMax) {
            valueMax = groupSum;
          }
        });
        break;
      default:
        const values = step.groups.flatMap((d) => d.data.map((d) => d.value));
        valueMax = max(values) ?? 0;
        break;
    }

    return {
      type: "value",
      value: getBaseMax(step.valueScale?.maxValue, valueMax),
    };
  }

  private getMaxValueDefault(
    step: DefaultInputStep | TreemapInputStep
  ): MaxValue {
    const values = step.groups.flatMap((d) =>
      d.data.reduce((acc, d) => acc + d.value, 0)
    );
    const valueMax = max(values) ?? 0;

    return {
      type: "value",
      value: getBaseMax(step.valueScale?.maxValue, valueMax),
    };
  }

  private getMaxXY(step: ScatterInputStep): MaxXY {
    const xValues = step.groups.flatMap((d) => d.data.map((d) => d.x));
    const xMax = max(xValues) ?? 0;
    const yValues = step.groups.flatMap((d) => d.data.map((d) => d.y));
    const yMax = max(yValues) ?? 0;

    return {
      type: "xy",
      x: getBaseMax(step.xScale?.maxValue, xMax),
      y: getBaseMax(step.yScale?.maxValue, yMax),
    };
  }

  private getGroupsKeys(step: InputStep): string[] {
    return step.groups.map((d) => d.key);
  }

  private getDataKeys(step: InputStep): string[] {
    return unique(step.groups.flatMap((d) => d.data.map((d) => d.key)));
  }

  private getCustomDataColors(step: InputStep): Map<string, string> {
    const customDataColorsMap = new Map<string, string>();
    step.groups.flatMap((d) =>
      (d.data as (InputDatumValue | InputDatumXY)[])
        .filter((d) => d.fill)
        .forEach((d) => {
          customDataColorsMap.set(d.key, d.fill as string);
        })
    );

    return customDataColorsMap;
  }

  private getHorizontalAxis(step: InputStep): AxisMeta | undefined {
    switch (step.chartType) {
      case "bar":
        if (step.layout === "horizontal") {
          return {
            show: step.horizontalAxis?.show ?? step.groups.length > 0,
            title: step.horizontalAxis?.title ?? "",
            tickFormat: step.horizontalAxis?.tickFormat ?? defaultTickFormat,
            maxValue: this.getMaxValueBar(step).value.actual,
          };
        }

        break;
      case "scatter":
        return {
          show: step.horizontalAxis?.show ?? true,
          title: step.horizontalAxis?.title ?? "",
          tickFormat: step.horizontalAxis?.tickFormat ?? defaultTickFormat,
          maxValue: this.getMaxXY(step).x.actual,
        };
    }
  }

  private getVerticalAxis(step: InputStep): AxisMeta | undefined {
    switch (step.chartType) {
      case "bar":
        if (step.layout === "vertical" || step.layout === undefined) {
          return {
            show: step.verticalAxis?.show ?? step.groups.length > 0,
            title: step.verticalAxis?.title ?? "",
            tickFormat: step.verticalAxis?.tickFormat ?? defaultTickFormat,
            maxValue: this.getMaxValueBar(step).value.actual,
          };
        }

        break;
      case "scatter":
        return {
          show: step.verticalAxis?.show ?? true,
          title: step.verticalAxis?.title ?? "",
          tickFormat: step.verticalAxis?.tickFormat ?? defaultTickFormat,
          maxValue: this.getMaxXY(step).y.actual,
        };
    }
  }
}

const shouldShareDomain = (type: ChartType): boolean => {
  switch (type) {
    case "bar":
    case "pie":
      return true;
    case "bubble":
    case "scatter":
    case "treemap":
      return false;
  }
};

const getBaseMax = (inputMax: number | undefined, dataMax: number): BaseMax => {
  const k = inputMax ? dataMax / inputMax : 1;

  return {
    data: dataMax,
    scale: inputMax,
    actual: inputMax ?? dataMax,
    k,
    kc: 1 - k,
  };
};
