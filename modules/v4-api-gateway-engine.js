// V4 API Gateway Engine v1
// Deterministic entry point between the dashboard and intelligence modules.

export class V4ApiGatewayEngine {
  constructor() {
    this.routes = {};
    this.logs = [];
  }

  registerRoute(name, handler) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('Route name must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError(`Handler for route "${name}" must be a function`);
    }

    this.routes[name] = handler;
    return { status: 'registered', route: name };
  }

  async execute(route, payload = {}) {
    if (!this.routes[route]) {
      this.logs.push({ route, status: 'not_found', timestamp: new Date().toISOString() });
      return { error: 'Route not found' };
    }

    try {
      const result = await this.routes[route](payload);
      this.logs.push({ route, status: 'success', timestamp: new Date().toISOString() });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logs.push({ route, status: 'error', message, timestamp: new Date().toISOString() });
      return { error: message };
    }
  }

  listRoutes() {
    return Object.keys(this.routes);
  }

  getLogs() {
    return [...this.logs];
  }
}

export default V4ApiGatewayEngine;
