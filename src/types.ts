import { PaletteName } from "./colors";

// External.
type BaseInputStep = {
  key: string;

  /** Labels. */
  title?: string;
  titleAnchor?: Anchor;
  subtitle?: string;
  subtitleAnchor?: Anchor;

  /** Legend. */
  shareDomain?: boolean;
  showLegend?: boolean;
  legendTitle?: string;
  legendAnchor?: Anchor;

  /** Values & data labels. */
  showValues?: boolean;
  showDatumLabels?: boolean;

  /** Appearance. */
  palette?: PaletteName;
  cartoonize?: boolean;
};

export type BarInputStep = BaseInputStep & {
  chartType: "bar";
  chartSubtype?: BarChartSubtype;
  valueScale?: InputScale;
  groups: InputGroupValue[];
} & (
    | {
        layout?: "vertical";
        verticalAxis?: InputAxis;
      }
    | {
        layout: "horizontal";
        horizontalAxis?: InputAxis;
      }
  );

export type BubbleInputStep = BaseInputStep & {
  chartType: "bubble";
  valueScale?: InputScale;
  groups: InputGroupValue[];
};

export type PieInputStep = BaseInputStep & {
  chartType: "pie";
  valueScale?: InputScale;
  groups: InputGroupValue[];
};

export type ScatterInputStep = BaseInputStep & {
  chartType: "scatter";
  xScale?: InputScale;
  yScale?: InputScale;
  horizontalAxis?: InputAxis;
  verticalAxis?: InputAxis;
  groups: InputGroupXY[];
};

export type TreemapInputStep = BaseInputStep & {
  chartType: "treemap";
  layout?: TreemapLayout;
  valueScale?: InputScale;
  groups: InputGroupValue[];
};

export type InputStep =
  | BarInputStep
  | BubbleInputStep
  | PieInputStep
  | ScatterInputStep
  | TreemapInputStep;

export type InputScale = {
  maxValue?: number;
};

export type InputAxis = {
  show?: boolean;
  title?: string;
  tickFormat?: (d: number) => string;
};

type BaseInputGroup = {
  key: string;
  opacity?: number;
};

export type InputGroupType = "value" | "xy";

export type InputGroupValue = BaseInputGroup & {
  data: InputDatumValue[];
};

export type InputGroupXY = BaseInputGroup & {
  data: InputDatumXY[];
};

type BaseInputDatum = BaseInputGroup & {
  // Used to teleport datum between groups. Formatted as "groupKey:datumKey".
  teleportFrom?: string;
  fill?: string;
};

export type InputDatum = InputDatumValue | InputDatumXY;

export type InputDatumValue = BaseInputDatum & {
  value: number;
};

export type InputDatumXY = BaseInputDatum & {
  x: number;
  y: number;
};

export type Anchor = "start" | "middle" | "end";

// Charts.
export type ChartType = "bar" | "bubble" | "pie" | "scatter" | "treemap";

export type BarChartSubtype = "grouped" | "stacked";

export type BarChartLayout = "vertical" | "horizontal";

export type TreemapLayout =
  | "binary"
  | "dice"
  | "slice"
  | "slice-dice"
  | "squarify"
  | "resquarify";

export type AxisType = "vertical" | "horizontal";

export type TextType =
  | "title"
  | "subtitle"
  | "legendTitle"
  | "legendItem"
  | "axisTitle"
  | "axisTick"
  | "groupLabel"
  | "datumLabel"
  | "datumValue";

export type TextDims = {
  [type in TextType]: {
    height: number;
    yShift: number;
  };
};

export type DataMaxValue = {
  type: "value";
  value: number;
};

export type DataMaxXY = {
  type: "xy";
  x: number;
  y: number;
};

export type BaseMax = {
  data: number;
  scale: number | undefined;
  actual: number;
  // scale / data if defined
  k: number;
  // complement of k, 1 - k
  kc: number;
};

export type MaxValue = {
  value: BaseMax;
};

export type MaxXY = {
  x: BaseMax;
  y: BaseMax;
};

export type Max = MaxValue | MaxXY;

/**
 * Provides access to a stateful function and previous G.
 */
export type Stateful<G> = {
  /**
   * Stateful function.
   *
   * Returns an `enter`, `update` or `exit` value,
   * depending on the current state.
   */
  s: <T>(enter: T, update?: T | null, exit?: T | null) => T;
  /**
   * Previous G.
   */
  _g?: G;
};

export type State = "enter" | "update" | "exit";

export type Interpolator<T> = (t: number) => T;
