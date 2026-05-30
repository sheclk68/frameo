export default {
  async fetch(request) {
    const url = new URL(request.url);
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

    try {
      const response = await fetch(modifiedRequest);

      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Allow Warpcast to embed in iframe (critical!)
      modifiedResponse.headers.set("X-Frame-Options", "ALLOWALL");
      modifiedResponse.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com;");

      // CORS
      modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
      modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      modifiedResponse.headers.set("Access-Control-Allow-Headers", "*");

      return modifiedResponse;
    } catch (err) {
      return new Response(`Proxy Error: ${err.message}`, { status: 500 });
    }
  },
};
