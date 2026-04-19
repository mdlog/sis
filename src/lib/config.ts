/**
 * Centralized runtime config read from Vite env.
 * Values default to the `weave init` locals so `npm run dev` "just works"
 * against a locally-running SIS Minitia.
 */

const env = import.meta.env;

export const SIS_CHAIN_ID = (env.VITE_SIS_CHAIN_ID as string) ?? "sis-testnet-1";
export const SIS_CHAIN_NAME = (env.VITE_SIS_CHAIN_NAME as string) ?? "SIS Minitia";
export const SIS_BECH32_PREFIX = (env.VITE_SIS_BECH32_PREFIX as string) ?? "init";
export const SIS_GAS_DENOM = (env.VITE_SIS_GAS_DENOM as string) ?? "uinit";
export const SIS_REST_URL =
  (env.VITE_SIS_REST_URL as string) ?? "http://localhost:1317";
export const SIS_RPC_URL =
  (env.VITE_SIS_RPC_URL as string) ?? "http://localhost:26657";
export const SIS_INDEXER_URL =
  (env.VITE_SIS_INDEXER_URL as string) ?? "http://localhost:8080";

export const SIS_MODULE_ADDRESS =
  (env.VITE_SIS_MODULE_ADDRESS as string) ??
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const SIS_MODULE_NAME =
  (env.VITE_SIS_MODULE_NAME as string) ?? "intent_registry";

export const INITIA_L1_REST_URL =
  (env.VITE_INITIA_L1_REST_URL as string) ?? "https://rest.testnet.initia.xyz";
export const INITIA_L1_INDEXER_URL =
  (env.VITE_INITIA_L1_INDEXER_URL as string) ?? "https://indexer.initia.xyz";

/** True when the module address has been replaced from the zero default. */
export const IS_MODULE_DEPLOYED = !/^0x0+$/.test(SIS_MODULE_ADDRESS);

/** Shape expected by InterwovenKitProvider's `customChain` prop. */
export const SIS_CUSTOM_CHAIN = {
  chain_id: SIS_CHAIN_ID,
  chain_name: SIS_CHAIN_NAME,
  bech32_prefix: SIS_BECH32_PREFIX,
  rest: SIS_REST_URL,
  rpc: SIS_RPC_URL,
  fees: {
    fee_tokens: [
      {
        denom: SIS_GAS_DENOM,
        fixed_min_gas_price: 0.015,
      },
    ],
  },
};
