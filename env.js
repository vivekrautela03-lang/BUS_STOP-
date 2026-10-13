// Runtime Environment & Resilient API Client for BUS STOP Web Client
(function() {
  function computeApiBase() {
    if (typeof window === 'undefined') return '';
    // If running on backend port 3000, relative requests work directly
    if (window.location.port === '3000') return '';
    // If running on Live Server (5500), Vite (5173), or file://, route to backend port 3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
      return 'http://localhost:3000';
    }
    return '';
  }

  window.__ENV__ = {
    SUPABASE_URL: 'https://tmacsdrjzkgykfkkrhgm.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYWNzZHJqemtneWtma2tyaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTk4ODUsImV4cCI6MjEwNjgzNTg4NX0.yv0sJe2lQyAzSxDcy4TPkVjqdyrWD7wxvF9DA4ays-U',
    API_BASE_URL: computeApiBase()
  };

  window.getApiUrl = function(endpoint) {
    if (!endpoint) return '';
    if (typeof endpoint !== 'string') return endpoint;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
    const base = (window.__ENV__ && window.__ENV__.API_BASE_URL) || '';
    return `${base}${endpoint}`;
  };

  // Safe fetch interceptor: rewrites /api/ routes to backend port 3000 when needed
  // and prevents "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" crashes
  const originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = async function(resource, init) {
      let targetResource = resource;
      if (typeof resource === 'string' && resource.startsWith('/api/')) {
        targetResource = window.getApiUrl(resource);
      } else if (resource && typeof resource.url === 'string' && resource.url.startsWith('/api/')) {
        targetResource = new Request(window.getApiUrl(resource.url), resource);
      }

      try {
        const response = await originalFetch.call(this, targetResource, init);
        
        // Wrap res.json() to prevent syntax errors when non-JSON / HTML 404 is returned
        const originalJson = response.json.bind(response);
        response.json = async function() {
          const contentType = (response.headers && response.headers.get('content-type')) || '';
          if (contentType.includes('application/json')) {
            try {
              return await originalJson();
            } catch (jsonErr) {
              // If body isn't pure JSON despite content-type, fall through to text parsing
            }
          }
          const text = await response.text();
          if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
            return {
              success: false,
              error: `API server at ${typeof targetResource === 'string' ? targetResource : 'backend'} returned HTML (${response.status}). Make sure \`node server.js\` is running on port 3000.`
            };
          }
          try {
            return JSON.parse(text);
          } catch (parseErr) {
            return { success: false, error: text || `HTTP ${response.status}` };
          }
        };

        return response;
      } catch (fetchErr) {
        // If network failed completely (e.g. backend server is not running)
        const errMsg = fetchErr.message || 'Network request failed';
        console.warn('[Transit API] Network connection note:', targetResource, errMsg);
        throw fetchErr;
      }
    };
  }
})();
