'use strict'
const fp = require('fastify-plugin')
const { inferIPVersion, isIP, isIPv4, isIPv6 } = require('./lib/ip')

const plugin = fp(fastifyIp, {
  fastify: '4.x',
  name: 'fastify-ip'
})

function fastifyIp (
  instance,
  { order: inputOrder, strict, isAWS } = {
    order: null,
    strict: false,
    isAWS: false
  },
  done
) {
  /*! Based on request-ip#https://github.com/pbojinov/request-ip/blob/9501cdf6e73059cc70fc6890adb086348d7cca46/src/index.js.
  MIT License. 2022 Petar Bojinov - petarbojinov+github@gmail.com */
  // Default headers
  /** @type {string[]} */
  let headersOrder = [
    'x-client-ip', // Most common
    'x-forwarded-for', // Mostly used by proxies
    'cf-connecting-ip', // Cloudflare
    'Cf-Pseudo-IPv4', // Cloudflare
    'fastly-client-ip',
    'true-client-ip', // Akamai and Cloudflare
    'x-real-ip', // Nginx
    'x-cluser-client-ip', // Rackspace LB
    'forwarded-for',
    'x-forwarded',
    'forwarded',
    'x-appengine-user-ip' // GCP App Engine
  ]
  let error

  if (strict && inputOrder == null && !isAWS) {
    error = new Error('If strict provided, order or isAWS are mandatory')
  } else if (inputOrder != null) {
    if (Array.isArray(inputOrder) && inputOrder.length > 0) {
      headersOrder = strict
        ? [].concat(inputOrder)
        : [...new Set([].concat(inputOrder, headersOrder))]
    } else if (typeof inputOrder === 'string' && inputOrder.length > 0) {
      headersOrder = strict
        ? [inputOrder]
        : (headersOrder.unshift(inputOrder), headersOrder)
    } else {
      error = new Error('invalid order option')
    }
  }

  if (error != null) return done(error)

  // Utility methods
  instance.decorateRequest('isIP', isIP)
  instance.decorateRequest('isIPv4', isIPv4)
  instance.decorateRequest('isIPv6', isIPv6)
  instance.decorateRequest('inferIPVersion', inferIPVersion)
  instance.decorateRequest('_fastifyip', '')

  // Core method
  instance.decorateRequest('ip', {
    getter: function () {
      let ip = this._fastifyip
      if (ip !== '') return ip

      // If is AWS context or the rules are not strict
      // infer first from AWS monkey-patching
      if (isAWS || !strict) {
        this._fastifyip = inferFromAWSContext.apply(this)
        ip = this._fastifyip
      }

      // If is an AWS context, the rules are soft
      // or is not AWS context and the ip has not been
      // inferred yet, try using the request headers
      if (((isAWS && !strict) || !isAWS) && ip === '') {
        for (const headerKey of headersOrder) {
          const value = this.headers[headerKey]
          if (value != null && this.isIP(value)) {
            this._fastifyip = value
            ip = this._fastifyip
            break
          }
        }
      }

      return ip
    }
  })

  done()

  // AWS Api Gateway + Lambda
  function inferFromAWSContext () {
    const pseudoIP = this.raw.requestContext?.identity?.sourceIp
    return pseudoIP != null && this.isIP(pseudoIP) ? pseudoIP : ''
  }
}

module.exports = plugin
module.exports.default = plugin
module.exports.fastifyIp = plugin
