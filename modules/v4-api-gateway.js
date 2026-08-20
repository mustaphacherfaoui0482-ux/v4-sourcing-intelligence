/**
 * V4 Sourcing Intelligence — API Gateway Foundation v1
 * Central routing layer between UI, engines and external connectors.
 */

const routes = new Map();

export function registerRoute(name, handler) {
  if (!name || typeof handler !== 'function') {
    throw new Error('Invalid route definition');
  }

  routes.set(name, handler);
  return { name, status: 'registered' };
}

export async function executeRoute(name, payload = {}) {
  const handler = routes.get(name);

  if (!handler) {
    return {
      success: false,
      error: 'route_not_found',
      route: name,
    };
  }

  try {
    const result = await handler(payload);

    return {
      success: true,
      route: name,
      result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      route: name,
      error: error.message,
    };
  }
}

export function listRoutes() {
  return Array.from(routes.keys());
}
