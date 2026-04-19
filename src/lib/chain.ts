import { RESTClient } from "@initia/initia.js";
import { SIS_CHAIN_ID, SIS_MODULE_ADDRESS, SIS_MODULE_NAME, SIS_REST_URL } from "./config";

export const rest = new RESTClient(SIS_REST_URL, { chainId: SIS_CHAIN_ID });

/** Fully-qualified `0xADDR::module::function` identifier. */
export function moduleFn(name: string): string {
  return `${SIS_MODULE_ADDRESS}::${SIS_MODULE_NAME}::${name}`;
}

/** Call a `#[view]` function via the REST endpoint and return the decoded JSON. */
export async function callView<T = unknown>(
  functionName: string,
  args: string[] = [],
  typeArgs: string[] = []
): Promise<T> {
  const url = `${SIS_REST_URL}/initia/move/v1/view`;
  const body = {
    address: SIS_MODULE_ADDRESS,
    module_name: SIS_MODULE_NAME,
    function_name: functionName,
    type_args: typeArgs,
    args,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`view ${functionName} failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  // Move view responses come back as { data: "<json-string>" }
  return typeof json.data === "string" ? JSON.parse(json.data) : json.data;
}

/** Encode a u64 argument for a Move view call (BCS-hex-string format). */
export function encodeU64(n: number | bigint): string {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, BigInt(n), true);
  return (
    "0x" +
    Array.from(buf)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Encode a string argument (length-prefixed BCS). */
export function encodeString(s: string): string {
  const bytes = new TextEncoder().encode(s);
  // BCS: ULEB128 length prefix. For typical short strings one byte suffices.
  const parts: number[] = [];
  let len = bytes.length;
  while (len >= 0x80) {
    parts.push((len & 0x7f) | 0x80);
    len >>>= 7;
  }
  parts.push(len);
  const out = new Uint8Array(parts.length + bytes.length);
  out.set(parts, 0);
  out.set(bytes, parts.length);
  return (
    "0x" +
    Array.from(out)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
