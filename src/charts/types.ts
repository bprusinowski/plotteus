import { InputDatumValue, InputGroupValue } from "../types";

type Root<T> = {
  r: number;
  x: number;
  y: number;
  value: number;
  data: T;
};

export type HierarchyRoot = {
  children?: (Root<InputGroupValue> & {
    children?: Root<InputDatumValue>[];
  })[];
};

type TreemapRoot<T> = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  value: number;
  data: T;
};

export type TreemapHierarchyRoot = {
  children?: (TreemapRoot<InputGroupValue> & {
    children?: TreemapRoot<InputDatumValue>[];
  })[];
};
