#!/usr/bin/env node
/**
 * Undefined-JSX guard.
 *
 * tsc and the Vite build DO NOT catch a JSX identifier whose import was
 * removed — that exact gap once shipped a white screen to production
 * (AdminLayout lost its LayoutDashboard import during a refactor). This scan
 * flags any <Component> whose name is neither imported nor declared in the
 * same file.
 *
 * Heuristic on purpose: it looks for capitalized JSX tags and checks the file
 * for a matching import/const/function/class/interface/type declaration.
 * Known globals and TS builtins are whitelisted. Zero findings = pass.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

// Browser/TS names that legitimately appear inside <...> without an import
// (generics like useState<FormData>, DOM types in handlers, etc).
const WHITELIST = new Set([
  "Date", "Map", "Set", "Promise", "Record", "Array", "Error", "Event",
  "File", "FileReader", "FormData", "Response", "Request", "Blob", "URL",
  "URLSearchParams", "RegExp", "Intl", "JSON", "Number", "String", "Boolean",
  "Partial", "Required", "Readonly", "Pick", "Omit", "Exclude", "Extract",
  "ReturnType", "Parameters", "Awaited", "NonNullable", "Uint8Array",
  "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "HTMLDivElement",
  "HTMLButtonElement", "HTMLFormElement", "HTMLSelectElement", "HTMLImageElement",
  "HTMLAnchorElement", "HTMLCanvasElement", "HTMLSpanElement", "HTMLHeadingElement",
  "HTMLParagraphElement", "HTMLTableElement", "HTMLTableSectionElement",
  "HTMLTableRowElement", "HTMLTableCellElement", "HTMLTableCaptionElement",
  "HTMLUListElement", "HTMLLIElement", "HTMLLabelElement", "SVGSVGElement",
  "KeyboardEvent", "MouseEvent", "React", "Element", "Node", "T", "K", "V",
  // Generic type parameters used in shadcn form wrappers.
  "TFieldValues", "TName",
]);

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "node_modules") walk(full);
    } else if (full.endsWith(".tsx")) {
      files.push(full);
    }
  }
})(ROOT);

let problems = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const used = new Set([...src.matchAll(/<([A-Z][A-Za-z0-9_]*)[\s/>]/g)].map((m) => m[1]));
  if (used.size === 0) continue;
  const imports = [...src.matchAll(/import[^;]*?from\s*["'][^"']*["']/g)].map((m) => m[0]).join(" ");
  const missing = [...used].filter(
    (n) =>
      !WHITELIST.has(n) &&
      !imports.includes(n) &&
      !src.includes(`const ${n}`) &&
      !src.includes(`let ${n}`) &&
      !src.includes(`function ${n}`) &&
      !src.includes(`class ${n}`) &&
      !src.includes(`interface ${n}`) &&
      !src.includes(`type ${n}`) &&
      !src.includes(`enum ${n}`) &&
      // Destructure renames ({ icon: Icon }) and import aliases (as Icon).
      !src.includes(`: ${n}`) &&
      !src.includes(`as ${n}`),
  );
  if (missing.length) {
    console.error(`✗ ${file} — possibly undefined in JSX: ${missing.join(", ")}`);
    problems += missing.length;
  }
}

if (problems) {
  console.error(`\n${problems} possibly-undefined JSX identifier(s). If one is a false positive, declare it locally or add it to the WHITELIST in scripts/check-undefined-jsx.mjs with a comment.`);
  process.exit(1);
}
console.log(`✓ ${files.length} .tsx files — no undefined JSX identifiers`);
