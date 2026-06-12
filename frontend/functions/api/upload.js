// This Cloudflare Pages Function proxies the request from the HTTPS frontend to the HTTP backend,
// completely bypassing the browser's Mixed Content security blocks.

export async function onRequestPost(context) {
  const { request } = context;

  // The AWS EC2 Backend IP
  const BACKEND_URL = 'http://13.212.76.234:5000/api/upload';

  try {
    // Forward the POST request to the EC2 server
    const backendResponse = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: request.headers,
      body: request.body,
    });

    // Read the response from the backend
    const responseBody = await backendResponse.arrayBuffer();

    // Pass the response exactly as-is back to the frontend
    return new Response(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Cloudflare Proxy Error: Could not connect to AWS EC2 backend.' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
