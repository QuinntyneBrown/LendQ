import { lazy } from "react";
import type { ComponentType } from "react";

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/;

type LazyModule<T extends ComponentType<unknown>> = { default: T };

export async function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<LazyModule<T>>,
): Promise<LazyModule<T>> {
  try {
    return await factory();
  } catch (err) {
    const isChunkError =
      err instanceof Error &&
      (CHUNK_ERROR_PATTERN.test(err.message) || err.name === "ChunkLoadError");

    if (isChunkError) {
      window.location.reload();
      return new Promise<LazyModule<T>>(() => {});
    }

    throw err;
  }
}

export function lazyRoute<T extends ComponentType<unknown>>(
  factory: () => Promise<LazyModule<T>>,
) {
  return lazy(() => lazyWithReload(factory));
}
