const https = require('https');
 
function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path' });
 
  const feishuUrl = 'https://open.feishu.cn/' + decodeURIComponent(path);
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
 
  const body = req.method !== 'GET' && req.body ? JSON.stringify(req.body) : null;
  if (body) headers['Content-Length'] = Buffer.byteLength(body);
 
  try {
    const result = await httpsRequest(feishuUrl, { method: req.method, headers }, body);
    return res.status(result.status).json(result.body);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
 
