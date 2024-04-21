import { Interpolator, State, Stateful } from "../types";
import { getInts } from "./utils";

/**
 * Generic getter type, contains a `key` and a `g` function.
 *
 * First argument corresponds to the return type of the `g` function.
 * Second argument allows you to extend the getter with additional props.
 * */
export type Getter<G, Props = {}> = {
  key: string;
  g: (props: Stateful<G>) => G;
} & Props;

/**
 * Generic interpolator type, contains a `key`, a `state` and an `i` function.
 *
 * First argument corresponds to the return type of the `i` function.
 * Second argument allows you to extend the interpolator with additional props.
 * */
export type Int<G, Props = {}> = {
  key: string;
  state: State;
  i: Interpolator<G>;
} & Props;

export type IntsProps<G, TGetter extends Getter<G>, TInt extends Int<G>> = {
  /** List of getters for the current state. */
  getters: TGetter[] | undefined;
  /** List of getters for the previous state. */
  _getters: TGetter[] | undefined;
  /** List of interpolators for the previous state. */
  _ints: TInt[] | undefined;
  /** Use when you need to modify the generic interpolator. */
  modifyInt?: (props: {
    getter: TGetter;
    exiting: boolean;
    _updateInt: TInt | undefined;
    int: Int<G>;
  }) => TInt;
  getPreviousInt?: (props: { getter: TGetter }) => TInt | undefined;
};

/**
 * Generic ints function.
 *
 * It offers a way to modify the generic interpolator and the output of previous g.
 * */
export const ints =
  <G extends {}, TGetter extends Getter<G>, TInt extends Int<G>>() =>
  ({
    getters = [],
    _getters,
    _ints,
    modifyInt = ({ int }) => int as TInt,
    getPreviousInt,
  }: IntsProps<G, TGetter, TInt>): TInt[] => {
    const keys = getters.map((getter) => getter.key);
    const exitingGetters =
      _getters?.filter((_getter) => !keys.includes(_getter.key)) ?? [];
    const allGetters = getters.concat(exitingGetters);
    const ints: TInt[] = allGetters.map((getter) => {
      const exiting = !keys.includes(getter.key);
      const _int =
        getPreviousInt?.({ getter }) ??
        _ints?.find((_int) => _int.key === getter.key);
      const { state, i, _updateInt } = getInts({
        _int,
        exiting,
        g: getter.g,
      });
      const int: Int<G> = {
        key: getter.key,
        state,
        i,
      };

      return modifyInt({ getter, int, exiting, _updateInt });
    });

    return ints;
  };

/**
 * Generic resolved type, contains a `key` and an output of `g` function.
 *
 * First argument corresponds to the return type of the `g` function.
 * Second argument allows you to extend the resolved value with additional props.
 * */
export type Resolved<G, Props = {}> = {
  key: string;
} & G &
  Props;

/**
 * Generic resolve function.
 *
 * It offers a way to modify the generic resolved value.
 * */
export const resolve =
  <G, TResolved extends Resolved<G>, TInt extends Int<G>>() =>
  ({
    ints,
    t,
    modifyResolved = ({ resolved }) => resolved as TResolved,
  }: {
    ints: TInt[];
    t: number;
    modifyResolved?: (props: { int: TInt; resolved: Resolved<G> }) => TResolved;
  }): TResolved[] => {
    return ints.map((int) => {
      const resolved: Resolved<G> = { key: int.key, ...int.i(t) };

      return modifyResolved({ int, resolved });
    });
  };
