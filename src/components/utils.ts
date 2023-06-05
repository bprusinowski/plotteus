import { interpolate } from "d3-interpolate";
import { Interpolator, State, Stateful } from "../types";

export const getInts = <
  G extends object,
  I extends {
    state: State;
    i: Interpolator<G>;
  }
>({
  exiting,
  g,
  _int,
}: {
  exiting: boolean;
  g: (props: Stateful<G>) => G;
  _int?: I;
}) => {
  // State.
  const updating = _int !== undefined && _int.state !== "exit";
  const state: State = exiting ? "exit" : updating ? "update" : "enter";

  const _updateInt = updating ? _int : undefined;

  const _g = _updateInt?.i(1);

  const from = _g ?? g({ s: (enter) => enter });
  const to = g({
    s: (enter, update, exit) => (exiting ? exit ?? enter : update ?? enter),
    _g,
  });
  const i = interpolate(from, to);

  return { state, i, _updateInt };
};
