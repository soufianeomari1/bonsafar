// Lets `node --test` import extensionless TypeScript the way Next does.
import { existsSync } from "node:fs";
import { isBuiltin } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = dirname(fileURLToPath(new URL("../src/lib/visa/policy.ts", import.meta.url)));
const srcRoot = join(src, "..", "..");

export async function resolve(specifier, context, nextResolve) {
  if (isBuiltin(specifier) || specifier.startsWith("node:")) return nextResolve(specifier, context);
  if (specifier.startsWith("@/")) {
    const base = join(srcRoot, specifier.slice(2));
    const file = existsSync(`${base}.ts`)
      ? `${base}.ts`
      : existsSync(join(base, "index.ts"))
        ? join(base, "index.ts")
        : `${base}.ts`;
    return nextResolve(pathToFileURL(file).href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[a-z]+$/i.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
