let config = window.wmlogConfig
let wmlog = window.wmlog
const baseStat = [
  'dns',
  'ct',
  'st',
  'tt',
  'dct',
  'olt',
  'ht',
  'fs',
  'drt',
  'lt'
]
const allStat = baseStat.concat(config && config.speed && config.speed.ext)

function send () {
  let image = new Image()
  image.onload = (image.onerror = function () {
    image = null
  })

  let { product, page } = config
  let query = [
    `product_id=${product}`,
    `page_id=${page}`,
    `type=performance&time=${Date.now()}`,
    `screen=${screen.width + '*' + screen.height}`,
    `dpr=${devicePixelRatio}`
  ]
  allStat.forEach(v => {
    let stat = window.wmlog.stat
    query.push(`${v}=${stat[v] - stat.dns}`)
  })
  image.src = 'http://waimai.baidu.com/upcshopui/main/feperformance?' +
  query.join('&')
}

let hasSend = false
function check () {
  let stat = window.wmlog.stat
  if (!hasSend && allStat.every(v => stat[v])) {
    hasSend = true
    send()
  }
}
window.wmlog = function (point, time) {
  if (!config) {
    return
  }
  window.wmlog.stat[point] = time || Date.now()
  check()
}
window.wmlog.stat = (wmlog && wmlog.stat) || {}
const timingMap = {
  dns: 'domainLookupEnd',
  ct: 'connectEnd',
  st: 'responseStart',
  tt: 'responseEnd',
  dct: 'domComplete',
  olt: 'loadEventEnd'
}

function afterLoad () {
  if (!window.performance) {
    return
  }
  let t = performance.timing
  allStat.forEach(k => {
    if (timingMap[k]) {
      window.wmlog(k, t[timingMap[k]])
    }
  })
}
window.addEventListener('load', afterLoad)
window.loaded && afterLoad()
