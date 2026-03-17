// Proxies Timely time entry requests server-side to avoid CORS.
// Handles pagination to fetch all events.
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const accountId = event.queryStringParameters && event.queryStringParameters.account_id;
  const token = event.headers['authorization'];

  if (!accountId || !token) {
    return { statusCode: 400, body: 'Missing account_id or Authorization header' };
  }

  try {
    const allEvents = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const url = `https://api.timelyapp.com/1.1/${accountId}/events?per_page=${perPage}&page=${page}`;
      const res = await fetch(url, {
        headers: { Authorization: token, Accept: 'application/json' },
      });

      if (!res.ok) {
        return {
          statusCode: res.status,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Timely API error: ${res.status} ${res.statusText}` }),
        };
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      allEvents.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allEvents),
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
    };
  }
};
