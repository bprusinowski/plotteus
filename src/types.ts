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

export type InputStep = BaseInputStep &
  (
    | {
        chartType: "bar";
        chartSubtype?: BarChartSubtype;
        valueScale?: {
          maxValue?: number;
        };
        verticalAxis?: {
          show?: boolean;
          title?: string;
        };
        groups: InputGroupValue[];
      }
    | {
        chartType: "scatter";
        xScale?: {
          maxValue?: number;
        };
        yScale?: {
          maxValue?: number;
        };
        horizontalAxis?: {
          show?: boolean;
          title?: string;
        };
        verticalAxis?: {
          show?: boolean;
          title?: string;
        };
        groups: InputGroupXY[];
      }
    | {
        chartType: Exclude<ChartType, "bar" | "scatter">;
        valueScale?: {
          maxValue?: number;
        };
        groups: InputGroupValue[];
      }
  );

export type InputGroupValue = {
  key: string;
  opacity?: number;
  data: InputDatumValue[];
};

export type InputGroupXY = {
  key: string;
  opacity?: number;
  data: InputDatumXY[];
};

type BaseInputDatum = {
  key: string;
  // Used to teleport datum between groups. Formatted as "groupKey:datumKey".
  teleportFrom?: string;
  fill?: string;
  opacity?: number;
};

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

export type Max = {
  data: number;
  scale: number | undefined;
  actual: number;
  // scale / data if defined
  k: number;
  // complement of k, 1 - k
  kc: number;
};

export type MaxValue = {
  type: "value";
  value: Max;
};

export type MaxXY = {
  type: "xy";
  x: Max;
  y: Max;
};

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
