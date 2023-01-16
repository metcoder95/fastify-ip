/// <reference types="node" />
import { FastifyPluginCallback } from 'fastify';

export interface FastifyIPOptions {
  order?: string[] | string;
  strict?: boolean;
  isAWS?: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    isIP(pseudo: string): boolean;
    isIPv4(pseudo: string): boolean;
    isIPv6(pseudo: string): boolean;
    inferIPVersion(pseudo: string): 0 | 4 | 6;
  }
}

declare const FastifyIP: FastifyPluginCallback<FastifyIPOptions>;

export default FastifyIP;
export { FastifyIPOptions, FastifyIP };
