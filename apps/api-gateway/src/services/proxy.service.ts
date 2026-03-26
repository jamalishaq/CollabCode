import type { FastifyRequest } from 'fastify';
import { MAX_EXECUTION_TIMEOUT_MS } from '@collabcode/shared-config';

import { serviceMap } from '../config';
import { AppError } from '../utils/app-error';

export class ProxyService {
  static getTargetUrl(urlPath: string): string {
    if (urlPath.startsWith('/auth/')) {
      return `${serviceMap.auth}${urlPath}`;
    }

    if (urlPath.startsWith('/workspaces/')) {
      return `${serviceMap.workspaces}${urlPath}`;
    }

    if (urlPath.startsWith('/projects/')) {
      return `${serviceMap.projects}${urlPath}`;
    }

    if (urlPath === '/execute') {
      return `${serviceMap.execute}${urlPath}`;
    }

    throw new AppError(404, 'NOT_FOUND', 'Route not found');
  }

  static async forward(request: FastifyRequest, forwardedHeaders: Record<string, string>): Promise<Response> {
    const url = request.raw.url ?? request.url;
    const targetUrl = this.getTargetUrl(url.split('?')[0] ?? url);
    const queryIndex = url.indexOf('?');
    const urlWithQuery = queryIndex >= 0 ? `${targetUrl}${url.substring(queryIndex)}` : targetUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_EXECUTION_TIMEOUT_MS);

    const incomingHeaders = request.headers;
    const headers: Record<string, string> = { ...forwardedHeaders };

    for (const [header, value] of Object.entries(incomingHeaders)) {
      if (value === undefined) {
        continue;
      }

      if (['host', 'content-length'].includes(header.toLowerCase())) {
        continue;
      }

      headers[header] = Array.isArray(value) ? value.join(',') : value;
    }

    try {
      return await fetch(urlWithQuery, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : JSON.stringify(request.body),
        signal: controller.signal
      });
    } catch {
      throw new AppError(502, 'BAD_GATEWAY', 'Failed to reach downstream service');
    } finally {
      clearTimeout(timeout);
    }
  }
}
