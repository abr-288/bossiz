export async function getEdgeFunctionErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue lors du traitement de la demande.",
): Promise<string> {
  const functionError = error as { message?: unknown; context?: unknown } | null;
  const context = functionError?.context as { clone?: () => { json?: () => Promise<unknown> }; json?: () => Promise<unknown> } | undefined;

  try {
    const response = typeof context?.clone === "function" ? context.clone() : context;
    if (typeof response?.json === "function") {
      const body = await response.json() as { error?: unknown; message?: unknown } | null;
      if (typeof body?.error === "string" && body.error.trim()) return body.error;
      if (typeof body?.message === "string" && body.message.trim()) return body.message;
    }
  } catch {
    // Fall through to the SDK message when the response body is not JSON.
  }

  return typeof functionError?.message === "string" && functionError.message.trim()
    ? functionError.message
    : fallback;
}
