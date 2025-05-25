import React from 'react';
import ReactDOM from 'react-dom';

/* ----------------------------------------------------------- *
 * 1 ▸ helper types                                             *
 * ----------------------------------------------------------- */

// local utility for "is a function"
type Fn = (...args: any[]) => any;

/** Map an object T ➜ only its `use*` keys that are functions. */
type ExtractHooks<T> = {
  [K in keyof T as K extends `use${string}`
    ? T[K] extends Fn
      ? K
      : never
    : never]: T[K] extends Fn ? T[K] : never;
};

/* ----------------------------------------------------------- *
 * 2 ▸ runtime collector that preserves static types            *
 * ----------------------------------------------------------- */
function collectHooks<T>(src: T): ExtractHooks<T> {
  const out = {} as ExtractHooks<T>;

  for (const key in src) {
    if (key.startsWith('use')) {
      const fn = (src as Record<string, unknown>)[key];
      if (typeof fn === 'function') {
        (out as Record<string, Fn>)[key] = fn as Fn;
      }
    }
  }
  return out;
}

/* ----------------------------------------------------------- *
 * 3 ▸ core helpers = hooks found in the *installed* libs       *
 * ----------------------------------------------------------- */
const coreHelpers = {
  ...collectHooks(React),
  ...collectHooks(ReactDOM),
};

type CoreHelpers = typeof coreHelpers;

/* ----------------------------------------------------------- *
 * 4 ▸ default component                                       *
 * ----------------------------------------------------------- */
type HooksMap = Record<string, any> & {
  length?: never; // This prevents arrays
};

type RenderHooksProps<TValue extends HooksMap> = {
  /**
   * Optionally pass in a map of hooks to use.
   * 
   * @example
   * 
   * ```tsx
   * <RenderHooks hooks={{
   *   useSomething: () => 'something',
   * }}>
   *   {({ useSomething }) => {
   *     const something = useSomething();
   *     return (
   *       <>
   *         <div>{something}</div>
   *       </>
   *     );
   *   }}
   * </RenderHooks>
   * ```
   */
  hooks?: TValue;
  children: (helpers: CoreHelpers & TValue) => React.ReactNode;
}

export default function RenderHooks<TValue extends HooksMap>({
  children,
  hooks = {} as TValue,
}: RenderHooksProps<TValue>): React.ReactElement {
  const helpers = React.useMemo(
    () => ({ ...coreHelpers, ...(hooks ?? {}) }),
    [hooks],
  ) as CoreHelpers & TValue;

  return <>{children(helpers)}</>;
}

