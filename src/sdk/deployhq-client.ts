/**
 * DeployHQ Client SDK — Error Ingestion & Health Telemetry
 * Production-ready SDK for capturing uncaught exceptions, unhandled rejections,
 * custom error reports, and application health metrics.
 */

export interface DeployHQInitOptions {
  workspaceId: string;
  projectId: string;
  projectName?: string;
  environment?: 'production' | 'staging' | 'preview' | 'development';
  release?: string;
  endpoint?: string;
  autoCaptureUnhandled?: boolean;
}

export interface ErrorReportPayload {
  workspaceId: string;
  projectId: string;
  projectName?: string;
  environment: string;
  type: string;
  message: string;
  stackTrace: string;
  requestUrl?: string;
  browser?: string;
  release?: string;
}

class DeployHQSDK {
  private config: DeployHQInitOptions | null = null;
  private isInitialized = false;

  public init(options: DeployHQInitOptions): void {
    this.config = {
      endpoint: '/api/ingest/errors',
      environment: 'production',
      autoCaptureUnhandled: true,
      ...options,
    };
    this.isInitialized = true;

    if (this.config.autoCaptureUnhandled) {
      this.attachGlobalListeners();
    }
  }

  private attachGlobalListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event: ErrorEvent) => {
        this.captureException(event.error || new Error(event.message), {
          requestUrl: window.location.href,
        });
      });

      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason || 'Unhandled Promise Rejection'));
        this.captureException(error, {
          requestUrl: window.location.href,
          type: 'UnhandledPromiseRejection',
        });
      });
    } else if (typeof process !== 'undefined') {
      process.on('uncaughtException', (err: Error) => {
        this.captureException(err, { type: 'UncaughtException' });
      });
      process.on('unhandledRejection', (reason: any) => {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        this.captureException(err, { type: 'UnhandledPromiseRejection' });
      });
    }
  }

  public async captureException(
    error: Error | any,
    extraContext?: { requestUrl?: string; type?: string; release?: string }
  ): Promise<{ status: string; fingerprint?: string; errorId?: string } | null> {
    if (!this.config) {
      console.warn('[DeployHQ] SDK called before init(). Call init() first.');
      return null;
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));
    const payload: ErrorReportPayload = {
      workspaceId: this.config.workspaceId,
      projectId: this.config.projectId,
      projectName: this.config.projectName || this.config.projectId,
      environment: this.config.environment || 'production',
      type: extraContext?.type || errorObj.name || 'Error',
      message: errorObj.message || 'Unknown error occurred',
      stackTrace: errorObj.stack || `${errorObj.name}: ${errorObj.message}`,
      requestUrl:
        extraContext?.requestUrl ||
        (typeof window !== 'undefined' ? window.location.href : '/server-request'),
      browser:
        typeof navigator !== 'undefined'
          ? navigator.userAgent.slice(0, 100)
          : `Node.js ${process.version}`,
      release: extraContext?.release || this.config.release || 'HEAD',
    };

    try {
      const endpoint = this.config.endpoint || '/api/ingest/errors';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DeployHQ-Workspace': this.config.workspaceId,
          'X-DeployHQ-Project': this.config.projectId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ingest error event: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (ingestErr) {
      // Prevent recursive failures
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DeployHQ] Ingestion error:', ingestErr);
      }
      return null;
    }
  }

  public async captureMessage(
    message: string,
    level: 'error' | 'warning' | 'info' = 'error',
    extraContext?: { requestUrl?: string }
  ): Promise<{ status: string; fingerprint?: string; errorId?: string } | null> {
    return this.captureException(
      new Error(message),
      { ...extraContext, type: `Custom${level.toUpperCase()}` }
    );
  }
}

export const deployHQ = new DeployHQSDK();
