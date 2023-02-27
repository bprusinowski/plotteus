import { interpolate } from "d3-interpolate";
import { ChartType, GenericInt, GProps, State } from "../types";

export const prepareInts = <
  G extends object,
  I extends {
    state: State;
    i: GenericInt<G>;
  }
>({
  exiting,
  g,
  _int,
  _gAlter,
}: {
  exiting: boolean;
  g: (props: GProps<G>) => G;
  _int?: I;
  _gAlter?: (_g: G) => void;
}) => {
  // State.
  const updating = _int !== undefined && _int.state !== "exit";
  const state: State = exiting ? "exit" : updating ? "update" : "enter";

  const _updateInt = updating ? _int : undefined;

  const _g = _updateInt?.i(1);

  if (_gAlter && _g) {
    _gAlter(_g);
  }

  const from = _g ?? g({ s: (enter) => enter });
  const to = g({
    s: (enter, update, exit) => (exiting ? exit ?? enter : update ?? enter),
    _g,
  });
  const i = interpolate(from, to);

  return { state, i, _updateInt };
};

export const stateValue = <T>(
  state: State,
  [enter, update, exit]: [T, T?, T?]
): T => {
  switch (state) {
    case "enter":
      return enter;
    case "update":
      return update ?? enter;
    case "exit":
      return exit ?? enter;
  }
};

export const shouldShareDomain = (type: ChartType): boolean => {
  switch (type) {
    case "bar":
    case "pie":
      return true;
    case "bubble":
    case "treemap":
      return false;
  }
};
