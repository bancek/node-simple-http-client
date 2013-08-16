(function() {
  var HttpClient, http, https, url, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  http = require('http');

  https = require('https');

  url = require('url');

  _ = require('lodash');

  HttpClient = (function() {

    function HttpClient() {
      this.request = __bind(this.request, this);      this.options = {};
    }

    HttpClient.prototype.request = function(method, path, options, callback) {
      var client, rejectUnauthorized, req, reqOptions, urlParts;
      if (_.isFunction(options)) {
        callback = options;
        options = {};
      }
      options = _.merge({
        headers: {}
      }, this.options, options);
      urlParts = url.parse(path);
      if (urlParts.protocol) {
        _.merge(options, urlParts);
      } else {
        if (/^\//.test(urlParts.path)) urlParts.path = urlParts.path.substring(1);
        options.path = url.resolve(options.path, urlParts.path);
      }
      client = (function() {
        switch (options.protocol) {
          case 'http:':
            return http;
          case 'https:':
            return https;
        }
      })();
      rejectUnauthorized = true;
      if (options.rejectUnauthorized != null) {
        rejectUnauthorized = options.rejectUnauthorized;
      }
      if (process.env.IGNORECERT) rejectUnauthorized = false;
      reqOptions = {
        host: options.hostname,
        port: options.port,
        method: method,
        path: options.path,
        headers: options.headers,
        rejectUnauthorized: options.rejectUnauthorized || true
      };
      if (options.json != null) {
        reqOptions.headers['content-type'] = 'application/json';
      }
      req = client.request(reqOptions, function(res) {
        var buffers;
        buffers = [];
        if (options.pipeRes) {
          return typeof callback === "function" ? callback(null, res) : void 0;
        } else {
          res.on('data', function(buffer) {
            return buffers.push(buffer);
          });
          res.on('end', function(err) {
            var contentType;
            res.body = buffers.join('');
            res.json = null;
            contentType = res.headers['content-type'];
            if (contentType && res.body.length) {
              contentType = contentType.split(';')[0];
              if (contentType === 'application/json') {
                res.json = JSON.parse(res.body);
              }
            }
            return typeof callback === "function" ? callback(err, res) : void 0;
          });
          return res.on('close', function() {
            return typeof callback === "function" ? callback(res) : void 0;
          });
        }
      });
      req.on('error', function(err) {
        if (typeof callback === "function") callback(err);
        return req.end();
      });
      if (options.pipeReq) {
        req;
      } else {
        if (options.json != null) req.write(JSON.stringify(options.json));
        req.end('');
      }
      return req;
    };

    return HttpClient;

  })();

  module.exports = HttpClient;

}).call(this);
