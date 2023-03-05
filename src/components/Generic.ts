import { GenericInt, State, Stateful } from "../types";
import { getInts } from "./utils";

export type Getter<G> = {
  key: string;
  g: (props: Stateful<G>) => G;
};

export type Int<G> = {
  key: string;
  state: State;
  i: GenericInt<G>;
};

export const ints = <G extends {}>({
  getters = [],
  _getters,
  _ints,
}: {
  getters: Getter<G>[] | undefined;
  _getters: Getter<G>[] | undefined;
  _ints: Int<G>[] | undefined;
}): Int<G>[] => {
  const keys = getters.map((d) => d.key);
  const exitingGetters = _getters?.filter((d) => !keys.includes(d.key)) ?? [];
  const ints: Int<G>[] = getters.concat(exitingGetters).map(({ key, g }) => {
    const exiting = !keys.includes(key);
    const _int = _ints?.find((d) => d.key === key);
    const { state, i } = getInts({ _int, exiting, g });

    return {
      key,
      state,
      i,
    };
  });

  return ints;
};

export type Resolved<G> = {
  key: string;
} & G;

export const resolve = <G>(ints: Int<G>[], t: number): Resolved<G>[] => {
  return ints.map(({ key, i }) => ({ key, ...i(t) }));
};
