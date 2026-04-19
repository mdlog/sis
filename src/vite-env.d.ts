/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIS_CHAIN_ID?: string;
  readonly VITE_SIS_CHAIN_NAME?: string;
  readonly VITE_SIS_BECH32_PREFIX?: string;
  readonly VITE_SIS_GAS_DENOM?: string;
  readonly VITE_SIS_REST_URL?: string;
  readonly VITE_SIS_RPC_URL?: string;
  readonly VITE_SIS_INDEXER_URL?: string;
  readonly VITE_SIS_MODULE_ADDRESS?: string;
  readonly VITE_SIS_MODULE_NAME?: string;
  readonly VITE_INITIA_L1_REST_URL?: string;
  readonly VITE_INITIA_L1_INDEXER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
