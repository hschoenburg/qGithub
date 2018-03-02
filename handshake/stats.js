'use strict'

let StatsdClient = require('statsd-client')

let namespaceCache = Object.create(null)
let environment = 'default'
let seperator = '_'

module.exports = Stats

function Stats (prefix) {
  let statsdHost = process.env.METRICS_HOSTNAME || ''

  this.statsd = new StatsdClient({
    // host and port are split from a 'hostname.com:1234' config format
    host: statsdHost.split(':')[0] || '127.0.0.1',
    port: parseInt(statsdHost.split(':')[1] || 8125, 10),
    debug: false
  })

  this.prefix = prefix || ''
}

Stats.prototype.increment = function (metric, tags) {
  let metricStr = this.buildMetricString(metric, tags)
  this.statsd.increment(metricStr)
}

Stats.prototype.timing = function (metric, tags, started) {
  let metricStr = this.buildMetricString(metric, tags)
  this.statsd.timing(metricStr, started)
}

Stats.prototype.timer = function (metric, tags) {
  let started = new Date()
  let endTimer = () => {
    this.timing(metric, tags, started)
  }

  return {
    metric: metric,
    tags: tags,
    end: endTimer
  }
}

Stats.prototype.buildMetricString = function (metric, tags) {
  let metricName = ''

  if (!metric) {
    return ''
  }

  if (environment) {
    metricName += environment + seperator
  }

  if (this.prefix) {
    metricName += this.prefix + seperator
  }

  metricName += metric.replace(/[^.a-z0-9_\-]/ig, '')

  let parts = [metricName]
  for (let prop in tags) {
    parts.push(`${prop}=${tags[prop]}`)
  }

  let str = parts.join(',')
  return str.toLowerCase()
}

Stats.namespace = function StatsNamespace (namespace) {
  let prefix = namespace
  let ns = namespaceCache[prefix] = namespaceCache[prefix] || new Stats(prefix)
  return ns
}

Stats.setEnvironment = function setEnvironment (env) {
  environment = env || ''
}

/*
Stats.setEnvironment('dev');

// Simple counter. Counts every time an event happens.
let s = Stats.namespace('requests.response');
s.increment('200');
s.increment('404');

// A timer. keep track on how long things are happening
let re = Stats.namespace('requests.time');
// Request comes in..
let requestStart = new Date();
setTimeout(() => {
  // Request finishes.
  re.timing('dashboard', requestStart);
}, 700);

// More counter examples
let statsAuth = Stats.namespace('auth');
statsAuth.increment('attempt');
statsAuth.increment('success');
statsAuth.increment('fail');
*/
