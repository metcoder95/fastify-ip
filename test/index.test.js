'use strict'
const { faker } = require('@faker-js/faker')
const tap = require('tap')
const fastify = require('fastify')

const plugin = require('../')

tap.plan(2)

tap.test('Plugin#Decoration', scope => {
  scope.plan(5)

  scope.test('Should decorate the request', async t => {
    const app = fastify()

    app.register(plugin)

    app.get('/', (req, reply) => {
      t.type(req.isIP, 'function')
      t.type(req.isIPv4, 'function')
      t.type(req.isIPv6, 'function')
      t.type(req.inferIPVersion, 'function')
      t.type(req._fastifyip, 'string')

      reply.send('')
    })

    t.plan(5)

    await app.inject('/')
  })

  scope.test('#isIP - Should return boolean', async t => {
    const app = fastify()

    app.register(plugin)

    app.get('/', (req, reply) => {
      t.ok(req.isIP(faker.internet.ipv4()))
      t.ok(req.isIP(faker.internet.ipv6()))
      t.notOk(req.isIP('xyz'))

      reply.send('')
    })

    t.plan(3)

    await app.inject({
      path: '/'
    })
  })

  scope.test('#isIPv4 - Should return boolean', async t => {
    const app = fastify()

    app.register(plugin)

    app.get('/', (req, reply) => {
      t.ok(req.isIPv4(faker.internet.ipv4()))
      t.notOk(req.isIPv4(faker.internet.ipv6()))
      t.notOk(req.isIPv4('xyz'))

      reply.send('')
    })

    t.plan(3)

    await app.inject({
      path: '/'
    })
  })

  scope.test('#isIPv6 - Should return boolean IP', async t => {
    const app = fastify()

    app.register(plugin)

    app.get('/', (req, reply) => {
      t.ok(req.isIPv6(faker.internet.ipv6()))
      t.notOk(req.isIPv6(faker.internet.ipv4()))
      t.notOk(req.isIPv6('xyz'))

      reply.send('')
    })

    t.plan(3)

    await app.inject({
      path: '/'
    })
  })

  scope.test('#inferIPVersion - Should return boolean IP', async t => {
    const app = fastify()

    app.register(plugin)

    app.get('/', (req, reply) => {
      t.equal(req.inferIPVersion(faker.internet.ipv6()), 6)
      t.equal(req.inferIPVersion(faker.internet.ipv4()), 4)
      t.equal(req.inferIPVersion('zsdc'), 0)

      reply.send('')
    })

    t.plan(3)

    await app.inject({
      path: '/'
    })
  })
})

tap.test('Plugin#Request IP', scope => {
  scope.plan(6)

  scope.test('Should infer the header based on default priority', async t => {
    const app = fastify()
    const expectedIP = faker.internet.ip()
    const secondaryIP = faker.internet.ip()

    app.register(plugin)

    app.get('/', (req, reply) => {
      t.equal(req.ip, expectedIP)
      t.equal(req._fastifyip, expectedIP)

      reply.send('')
    })

    t.plan(2)

    await app.inject({
      path: '/',
      headers: {
        'x-client-ip': expectedIP,
        'cf-connecting-ip': secondaryIP
      }
    })
  })

  scope.test(
    'Should infer the header based on custom priority <Array>',
    async t => {
      const app = fastify()
      const expectedIP = faker.internet.ip()
      const fallbackIP = faker.internet.ipv6()

      app.register(plugin, { order: ['x-custom-remote-ip'] })

      app.get('/', (req, reply) => {
        t.equal(req.ip, expectedIP)
        t.equal(req._fastifyip, expectedIP)

        reply.send('')
      })

      app.get('/fallback', (req, reply) => {
        t.equal(req.ip, fallbackIP)
        t.equal(req._fastifyip, fallbackIP)

        reply.send('')
      })

      t.plan(4)

      await app.inject({
        path: '/',
        headers: {
          'cf-connecting-ip': fallbackIP,
          'x-client-ip': faker.internet.ipv6(),
          'x-custom-remote-ip': expectedIP
        }
      })

      await app.inject({
        path: '/fallback',
        headers: {
          'cf-connecting-ip': fallbackIP
        }
      })
    }
  )

  scope.test(
    'Should infer the header based on custom priority <Array> (strict)',
    async t => {
      const app = fastify()
      const expectedIP = faker.internet.ip()
      const fallbackIP = faker.internet.ipv6()

      app.register(plugin, { order: ['x-custom-remote-ip'], strict: true })

      app.get('/', (req, reply) => {
        t.equal(req.ip, expectedIP)
        t.equal(req._fastifyip, expectedIP)

        reply.send('')
      })

      app.get('/fallback', (req, reply) => {
        t.equal(req.ip, '')
        t.equal(req._fastifyip, '')

        reply.send('')
      })

      t.plan(4)

      await app.inject({
        path: '/',
        headers: {
          'cf-connecting-ip': fallbackIP,
          'x-client-ip': faker.internet.ipv6(),
          'x-custom-remote-ip': expectedIP
        }
      })

      await app.inject({
        path: '/fallback',
        headers: {
          'x-client-ip': faker.internet.ipv6(),
          'cf-connecting-ip': fallbackIP
        }
      })
    }
  )

  scope.test(
    'Should infer the header based on custom priority <String>',
    async t => {
      const app = fastify()
      const expectedIP = faker.internet.ip()
      const fallbackIP = faker.internet.ipv6()

      app.register(plugin, { order: 'x-custom-remote-ip' })

      app.get('/', (req, reply) => {
        t.equal(req.ip, expectedIP)
        t.equal(req._fastifyip, expectedIP)

        reply.send('')
      })

      app.get('/fallback', (req, reply) => {
        t.equal(req.ip, fallbackIP)
        t.equal(req._fastifyip, fallbackIP)

        reply.send('')
      })

      t.plan(4)

      await app.inject({
        path: '/',
        headers: {
          'cf-connecting-ip': fallbackIP,
          'x-client-ip': faker.internet.ipv6(),
          'x-custom-remote-ip': expectedIP
        }
      })

      await app.inject({
        path: '/fallback',
        headers: {
          'cf-connecting-ip': fallbackIP
        }
      })
    }
  )

  scope.test(
    'Should infer the header based on custom priority <String> (strict)',
    async t => {
      const app = fastify()
      const expectedIP = faker.internet.ip()
      const fallbackIP = faker.internet.ipv6()

      app.register(plugin, { order: 'x-custom-remote-ip', strict: true })

      app.get('/', (req, reply) => {
        t.equal(req.ip, expectedIP)
        t.equal(req._fastifyip, expectedIP)

        reply.send('')
      })

      app.get('/fallback', (req, reply) => {
        t.equal(req.ip, '')
        t.equal(req._fastifyip, '')

        reply.send('')
      })

      t.plan(4)

      await app.inject({
        path: '/',
        headers: {
          'cf-connecting-ip': fallbackIP,
          'x-client-ip': faker.internet.ipv6(),
          'x-custom-remote-ip': expectedIP
        }
      })

      await app.inject({
        path: '/fallback',
        headers: {
          'cf-connecting-ip': fallbackIP
        }
      })
    }
  )

  scope.test(
    'Should discard the IP if invalid format and fallback into the following in the order',
    async t => {
      const app = fastify()
      const expectedIP = faker.internet.ip()
      const fallbackIP = 'abc'

      app.register(plugin)

      app.get('/', (req, reply) => {
        t.equal(req.ip, expectedIP)
        t.equal(req._fastifyip, expectedIP)

        reply.send('')
      })

      t.plan(2)

      await app.inject({
        path: '/',
        headers: {
          'x-appengine-user-ip': expectedIP,
          'x-real-ip': fallbackIP
        }
      })
    }
  )
})
