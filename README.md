# fastify-ip
![NPM](https://img.shields.io/npm/l/fastify-ip)
[![npm](https://badge.fury.io/js/fastify-ip.svg)](https://badge.fury.io/js/fastify-ip)
[![CI](https://github.com/metcoder95/fastify-ip/actions/workflows/ci.yml/badge.svg)](https://github.com/metcoder95/fastify-ip/actions/workflows/ci.yml)

---

`fastify-ip` is a plugin which allows to infer the incoming request's IP based on a custom subset of well known headers used by different providers or technologies that possible sits in-front of your fastify application.

## How it works?

The plugin will make a best-effort to infer the request's IP based on a subset of well-known headers, which looks as follows:
```
'x-client-ip' // Most common
'x-forwarded-for' // Mostly used by proxies
'cf-connecting-ip' // Cloudflare
'Cf-Pseudo-IPv4' // Cloudflare
'fastly-client-ip'
'true-client-ip' // Akamai and Cloudflare
'x-real-ip' // Nginx
'x-cluser-client-ip' // Rackspace LB
'forwarded-for'
'x-forwarded'
'forwarded'
'x-appengine-user-ip' // GCP App Engine
```

The plugin will use a FIFO strategy to infer the right IP. This can be customised by passing a custom  order  property that includes your custom headers.

>Note: It is important to remark that this does not alters the `Request#ips` behaviour for inferring IPs when setting the `FastifyOptions#trustProxy` to `true`. It rather allows you to infer the IP of a given request by headers out of the common spec or standard.

## Setup

Install by running `npm install fastify-ip`.

Then register the plugin to your fastify instance:

```js
const fastify = require('fastify')({
  logger: true
})

fastify.register(require('fastify-ip'), {
    order: ['x-my-ip-header'],
    strict: false,
    isAWS: false,
})
```

### Options

- `order` - `string[] | string` - **optional**: Array of custom headers or single custom header to be appended to the prior list of well-known headers. The headers passed will be prepend to the default headers list. It can also be used to alter the order of the list as deduplication of header names is made while loading the plugin.

- `strict` - `boolean` - **optional**: Indicates whether to override the default list of well-known headers and replace it with the header(s) passed through the `order` option. If set to `true` without `order` or `isAWS` properties provided, it will lead to throwing an exception. Default `false`.

- `isAWS` - `boolean` - **optional**: Indicates wether the plugin should explicitly try to infer the IP from the decorations made at the native Node.js HTTP Request object included in the Fastify Request. If set to `true` the plugin will treat this approach as a first option. Otherwise it will use it just as a fallback. Default `false`.


### API

The plugin will decorate the Request object with a set of utils that can be handy for managing IPs.

- `isIP(pseudo: string): boolean` - It will return `true` if a given string is a valid IPv4 or IPv6, or `false` otherwise.
- `isIPv4(pseudo: string): boolean` - Similar to `isIP` but will validate of the given string is a valid `IPv4`.
- `isIPv6(pseudo: string): boolean` - Similar to `isIP` but will validate of the given string is a valid `IPv6`.
- `inferIPVersion(pseudo: string): 0 | 4 | 6` - It will try to infer the IPv of a given IP, returning `4` for `IPv4` and `6` for `IPv6`, will return `0` if the given string does not match any of the IPv.

## How to use it?

**JavaScript**

```js
app.get('/', (req, reply) => {
    req.log.info({ ip: req.ip }, 'my ip!')
    req.log.info({ isValid: req.isIP('hello!') } /* false */)
    req.log.info({ isIPv4: req.isIPv4('127.0.0.1') })
    req.log.info({ isIPv6: req.isIPv6('::1') })
    req.log.info({ version: req.inferIPVersion('127.0.0.1') /* 4 */ })
    req.log.info({ version: req.inferIPVersion('::1') /* 6 */ })
    req.log.info({ version: req.inferIPVersion('asd') /* 0 */ })

    reply.send(req.ip)
})
```

**TypeScript**

```ts
app.post('/', (request: FastifyRequest, reply: FastifyReply) => {
    req.log.info({ ip: req.ip }, 'my ip!')
    req.log.info({ isValid: req.isIP('hello!') } /* false */)
    req.log.info({ isIPv4: req.isIPv4('127.0.0.1') })
    req.log.info({ isIPv6: req.isIPv6('::1') })
    req.log.info({ version: req.inferIPVersion('127.0.0.1') /* 4 */ })
    req.log.info({ version: req.inferIPVersion('::1') /* 6 */ })
    req.log.info({ version: req.inferIPVersion('asd') /* 0 */ })

    reply.send(req.ip)
});
```

## Type Definitions

```ts
export interface FastifyIPOptions {
  order?: string[] | string;
  strict?: boolean;
  isAWS?: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    isIP(pseudo: string): boolean;
    isIPv4(pseudo: string): boolean;
    isIPv6(pseudo: string): boolean;
    inferIPVersion(pseudo: string): 0 | 4 | 6;
  }
}
```


> See [test](test/index.test.js) for more examples.