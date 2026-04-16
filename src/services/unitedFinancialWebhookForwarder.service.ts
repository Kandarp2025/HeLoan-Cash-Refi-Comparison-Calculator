import axios, { AxiosError } from "axios";

export interface WebhookForwardingResult {
  callbackUrl: string;
  status: number;
  statusText: string;
}

interface WebhookForwarderErrorOptions {
  statusCode: number;
  callbackUrl: string;
  details?: string;
}

export class WebhookForwarderError extends Error {
  public readonly statusCode: number;
  public readonly callbackUrl: string;
  public readonly details?: string;

  constructor(message: string, options: WebhookForwarderErrorOptions) {
    super(message);
    this.name = "WebhookForwarderError";
    this.statusCode = options.statusCode;
    this.callbackUrl = options.callbackUrl;
    this.details = options.details;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

export const forwardUnitedFinancialWebhookResult = async (
  callbackUrl: string,
  payload: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<WebhookForwardingResult> => {
  try {
    const response = await axios.post(callbackUrl, payload, {
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/json"
      }
    });

    return {
      callbackUrl,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    const axiosError = error as AxiosError | undefined;

    if (axiosError?.code === "ECONNABORTED") {
      throw new WebhookForwarderError("Callback forwarding timed out", {
        statusCode: 502,
        callbackUrl
      });
    }

    const status = axiosError?.response?.status;
    const statusText = axiosError?.response?.statusText;
    if (typeof status === "number") {
      throw new WebhookForwarderError("Callback URL rejected the payload", {
        statusCode: 502,
        callbackUrl,
        details: statusText ? `HTTP ${status} ${statusText}` : `HTTP ${status}`
      });
    }

    throw new WebhookForwarderError("Unable to forward webhook result to callback URL", {
      statusCode: 502,
      callbackUrl
    });
  }
};

