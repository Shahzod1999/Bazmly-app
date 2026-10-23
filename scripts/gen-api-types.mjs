#!/usr/bin/env node
/**
 * src/api/types.ts ni backend'ning OpenAPI sxemasidan generatsiya qiladi.
 *
 *   npm run api:types                         # api/openapi.json dan (repo'dagi nusxa)
 *   npm run api:types -- <url yoki fayl>      # masalan http://localhost:8000/api/openapi.json
 *
 * Manba URL yoki fayl berilsa, u api/openapi.json ga ham saqlanadi — shunda
 * backend o'zgarishlari git diff'da ko'rinadi.
 *
 * Backend: https://github.com/Patriotic20/bazmly-backend (FastAPI). Lokal ishga tushirmasdan
 * sxemani olish: `uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))"`
 *
 * Tiplar backend'dagi nomlar bilan eksport qilinadi (UserRead, VenueListItem, ...).
 * Qo'lda yozilgan qism faqat oxirida: Page<T>, ApiErrorResponse va qisqa nomli aliaslar.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = resolve(ROOT, "api/openapi.json");
const OUT = resolve(ROOT, "src/api/types.ts");

const source = process.argv[2];
let spec;
if (!source) {
  spec = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
} else if (/^https?:\/\//.test(source)) {
  const res = await fetch(source);
  if (!res.ok) throw new Error(`${source} → HTTP ${res.status}`);
  spec = await res.json();
} else {
  spec = JSON.parse(readFileSync(resolve(source), "utf8"));
}
if (source) {
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  writeFileSync(SNAPSHOT, JSON.stringify(spec, null, 1) + "\n");
}

const schemas = spec.components?.schemas ?? {};

/** Backend nomini TS nomiga: Page_X_ → o'tkazib yuboriladi, Body_venue_menu_create_item → BodyVenueMenuCreateItem */
function tsName(name) {
  if (/^Body_/.test(name)) return name.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}
const SKIP = (n) => /^Page_/.test(n) || n === "HTTPValidationError" || n === "ValidationError";

function refName(ref) {
  const n = ref.split("/").pop();
  const page = /^Page_(.+)_$/.exec(n);
  return page ? `Page<${tsName(page[1])}>` : tsName(n);
}

function typeOf(s, indent) {
  if (!s || Object.keys(s).length === 0) return "unknown";
  if (s.$ref) return refName(s.$ref);
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  const union = s.anyOf ?? s.oneOf;
  if (union) {
    const parts = [...new Set(union.map((x) => typeOf(x, indent)))];
    // null oxirida — o'qish oson
    parts.sort((a, b) => (a === "null") - (b === "null"));
    return parts.map((p) => (p.includes("=>") ? `(${p})` : p)).join(" | ");
  }
  if (s.allOf && s.allOf.length === 1) return typeOf(s.allOf[0], indent);
  const t = Array.isArray(s.type) ? s.type : [s.type];
  const out = t.map((ty) => {
    switch (ty) {
      case "integer":
      case "number":
        return "number";
      case "string":
        return "string";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      case "array": {
        const inner = typeOf(s.items, indent);
        return /[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`;
      }
      case "object":
        if (s.properties) return objectBody(s, indent);
        if (s.additionalProperties && typeof s.additionalProperties === "object")
          return `Record<string, ${typeOf(s.additionalProperties, indent)}>`;
        return "Record<string, unknown>";
      default:
        return "unknown";
    }
  });
  return [...new Set(out)].join(" | ");
}

function doc(text, indent) {
  if (!text) return "";
  const clean = text.replace(/\*\//g, "*\\/").trim();
  if (!clean.includes("\n") && clean.length < 100) return `${indent}/** ${clean} */\n`;
  return `${indent}/**\n${clean.split("\n").map((l) => `${indent} * ${l}`.trimEnd()).join("\n")}\n${indent} */\n`;
}

function objectBody(s, indent) {
  const req = new Set(s.required ?? []);
  const inner = indent + "  ";
  const lines = Object.entries(s.properties ?? {}).map(([k, v]) => {
    const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
    return `${doc(v.description, inner)}${inner}${key}${req.has(k) ? "" : "?"}: ${typeOf(v, inner)};`;
  });
  return `{\n${lines.join("\n")}\n${indent}}`;
}

let out = `// AVTOMATIK GENERATSIYA QILINGAN — qo'lda tahrirlamang.
// Manba: backend OpenAPI (api/openapi.json) — ${spec.info?.title ?? ""} ${spec.info?.version ?? ""}
// Yangilash: npm run api:types [-- <openapi url yoki fayl>]

`;

const names = Object.keys(schemas).filter((n) => !SKIP(n)).sort();
for (const n of names) {
  const s = schemas[n];
  const name = tsName(n);
  out += doc(s.description, "");
  if (s.type === "object" || s.properties) out += `export interface ${name} ${objectBody(s, "")}\n\n`;
  else out += `export type ${name} = ${typeOf(s, "")};\n\n`;
}

out += `// ---------- Qo'lda: umumiy tiplar ----------

/** Sahifalangan javob (backend: Page[T]) */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Backend xato konverti: { code, message, details, request_id } — ilova \`code\` bo'yicha shart tuzadi */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
  request_id?: string;
}
`;

writeFileSync(OUT, out);
console.log(`${names.length} ta tip → ${OUT.replace(ROOT + "/", "")}`);
