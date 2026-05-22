/**
 * Cloudflare Pages Function — reverse-proxies all /api/* requests to the
 * Hono Workers backend.
 *
 * Set the environment variable API_WORKER_URL in the Pages dashboard to the
 * deployed Worker URL (e.g. https://hisobkit-api.<account>.workers.dev).
 */

interface Env {
  API_WORKER_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.API_WORKER_URL) {
    return new Response(
      JSON.stringify({ success: false, error: "API_WORKER_URL is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${env.API_WORKER_URL.replace(/\/$/, "")}${incomingUrl.pathname}${incomingUrl.search}`;

  // Forward the request, stripping the Host header so the Worker sees its own.
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete("host");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: forwardedHeaders,
    body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
    redirect: "manual",
  });

  // Preserve response headers, adding CORS passthrough.
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("X-Proxied-By", "hisobkit-pages");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
