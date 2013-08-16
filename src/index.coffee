http = require('http')
https = require('https')
url = require('url')
_ = require('lodash')

class HttpClient
  constructor: ->
    @options = {}

  request: (method, path, options, callback) =>
    if _.isFunction(options)
      callback = options
      options = {}

    options = _.merge(headers: {}, @options, options)

    urlParts = url.parse(path)

    if urlParts.protocol
      _.merge(options, urlParts)
    else
      if /^\//.test(urlParts.path)
        urlParts.path = urlParts.path.substring(1)

      options.path = url.resolve(options.path, urlParts.path)

    client = switch options.protocol
      when 'http:' then http
      when 'https:' then https

    rejectUnauthorized = yes
    rejectUnauthorized = options.rejectUnauthorized if options.rejectUnauthorized?
    rejectUnauthorized = no if process.env.IGNORECERT

    reqOptions =
      host: options.hostname
      port: options.port
      method: method
      path: options.path
      headers: options.headers,
      rejectUnauthorized: options.rejectUnauthorized or yes

    if options.json?
      reqOptions.headers['content-type'] = 'application/json'

    req = client.request reqOptions, (res) ->
      buffers = []

      if options.pipeRes
        callback?(null, res)
      else
        res.on 'data', (buffer) ->
          buffers.push buffer

        res.on 'end', (err) ->
          res.body = buffers.join('')
          res.json = null

          contentType = res.headers['content-type']

          if contentType and res.body.length
            contentType = contentType.split(';')[0]

            if contentType is 'application/json'
              res.json = JSON.parse(res.body)

          callback?(err, res)

        res.on 'close', ->
          callback?(res)

    req.on 'error', (err) ->
      callback?(err)
      req.end()

    if options.pipeReq
      req
    else
      if options.json?
        req.write(JSON.stringify(options.json))

      req.end('')

    req

module.exports = HttpClient
