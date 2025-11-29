// frontend/src/api/http.ts
import { IS_MOCK } from "@/api/config";

const isElectronMode =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_ELECTRON_MODE === "true";

export interface RequestOptions extends RequestInit {
  /**
   * If true, do not auto-attach any special headers (like ngrok skip warning)
   */
  skipNgrokHeader?: boolean;
}

/**
 * Thin wrapper around fetch:
 * - In Electron + real backend mode, automatically adds
 *   `ngrok-skip-browser-warning: 1` for ngrok URLs.
 */
export async function request(
  input: string | URL | Request,
  init: RequestOptions = {},
): Promise<Response> {
  const { headers, skipNgrokHeader, ...rest } = init;

  let finalHeaders: HeadersInit | undefined = headers;

  if (isElectronMode && !IS_MOCK && !skipNgrokHeader) {
    const targetUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (targetUrl.includes("ngrok-free.dev")) {
      const baseHeaders =
        headers instanceof Headers
          ? Object.fromEntries(headers.entries())
          : (headers as Record<string, string> | undefined) ?? {};

      finalHeaders = {
        ...baseHeaders,
        "ngrok-skip-browser-warning": "1",
      };
    }
  }

  return fetch(input as RequestInfo, {
    ...rest,
    headers: finalHeaders,
  } as RequestInit);
}

