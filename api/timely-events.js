// Proxies Timely time entry requests server-side to avoid CORS.
// Handles pagination to fetch all events.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const accountId = req.query.account_id;
  const token = req.headers['authorization'];

  if (!accountId || !token) {
    return res.status(400).json({ error: 'Missing account_id or Authorization header' });
  }

  try {
    const allEvents = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const url = `https://api.timelyapp.com/1.1/${accountId}/events?per_page=${perPage}&page=${page}`;
      const apiRes = await fetch(url, {
        headers: { Authorization: token, Accept: 'application/json' },
      });

      if (!apiRes.ok) {
        return res.status(apiRes.status).json({ error: `Timely API error: ${apiRes.status} ${apiRes.statusText}` });
      }

      const data = await apiRes.json();
      if (!Array.isArray(data) || data.length === 0) break;

      allEvents.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return res.status(200).json(allEvents);
  } catch (e) {
    return res.status(502).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
