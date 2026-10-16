import { SPL_API_BASE, SPL_VAPI_BASE } from "@/lib/shared/config/splApiConfig";
import { createSplReads } from "@/lib/shared/spl/splReads";
import type { SplGet } from "@/lib/shared/spl/splTransport";
import axios, { AxiosInstance } from "axios";
import * as rax from "retry-axios";
import { splRetryConfig } from "./spl-retry";

function createSplClient(baseURL: string, logPrefix: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "User-Agent": "SPL-Data/1.0",
    },
  });
  rax.attach(client);
  client.defaults.raxConfig = splRetryConfig(logPrefix);
  return client;
}

/** api.splinterlands.com (or the mavs-sl test stack). */
export const splBaseClient = createSplClient(SPL_API_BASE, "[spl-api] ");
/** vapi.splinterlands.com (or the mavs-sl test stack). */
export const splLandClient = createSplClient(SPL_VAPI_BASE, "[spl-vapi] ");

const serverGet: SplGet = async (host, path, request = {}) => {
  const client = host === "api" ? splBaseClient : splLandClient;
  const res = await client.get(path, {
    params: request.params,
    headers: request.token
      ? { Authorization: `Bearer ${request.token}` }
      : undefined,
    signal: request.signal,
  });
  return res.data;
};

/**
 * The shared SPL reads bound to the server clients (long retry back-off).
 * Use only where the server itself must know the answer — on-behalf
 * validation, verify-on-throw, the worker, server-rendered shared data. Per
 * visitor reads belong in the browser (see CLAUDE.md).
 */
export const splServerReads = createSplReads(serverGet);
