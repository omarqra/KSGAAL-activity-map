import type * as React from "react";

/**
 * A utility that composes multiple refs into a single ref callback.
 * This is useful when you need to pass a ref to a component that already has a ref.
 */
export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T>).current = node;
      }
    });
  };
}
