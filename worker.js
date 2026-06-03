export default {
  async fetch(request) {
    const url = new URL(request.url);

    // For static assets, serve directly from Vercel with cache control
    const staticPaths = ["/icon.svg", "/opengraph-image", "/splash", "/favicon.ico"];
    const isStatic = staticPaths.some(p => url.pathname === p || url.pathname.startsWith(p));

    const targetUrl = "https://my-frame-app.vercel.app" + url.pathname + url.search;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    modifiedRequest.headers.set("Host", "my-frame-app.vercel.app");
    modifiedRequest.headers.delete("CF-Connecting-IP");
    modifiedRequest.headers.delete("CF-IPCountry");
    modifiedRequest.headers.delete("CF-RAY");
    modifiedRequest.headers.delete("CF-Visitor");

    // Bypass cache for all requests (always fetch fresh from Vercel)
    modifiedRequest.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    modifiedRequest.headers.set("Pragma", "no-cache");

    try {
      const response = await fetch(modifiedRequest);

      // Clone the response so we can modify headers
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Allow Warpcast to embed in iframe (critical!)
      modifiedResponse.headers.set("X-Frame-Options", "ALLOWALL");
      modifiedResponse.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com;");

      // CORS headers
      modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
      modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      modifiedResponse.headers.set("Access-Control-Allow-Headers", "*");

      // Cache control for static assets
      if (isStatic) {
        modifiedResponse.headers.set("Cache-Control", "public, max-age=86400, s-maxage=3600");
      } else {
        modifiedResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }

      return modifiedResponse;
    } catch (err) {
      return new Response(`Proxy Error: ${err.message}`, { status: 500 });
    }
  },
};
