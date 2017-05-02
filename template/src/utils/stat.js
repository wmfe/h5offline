/**
 * @see https://wiki.baidu.com/pages/viewpage.action?pageId=137571109
 */
import 'es6-promise/auto'
import objectAssign from 'object-assign'
import { ready, device, location, network, appPlat } from '../bridge'

// 用来判断是否ready的标志
let isReady = false
// ready之前进行缓存请求的数组
let quene = []

let DEFAULT = {
  da_src: 'default',
  da_act: 'ready',
  baiduid: document.cookie.replace(
        /(?:(?:^|.*;\s*)BAIDUID=\s*([^;]*).*$)|^.*$/,
        '$1'
    ),
  da_refer: '',
  da_trace: ''
}

function serialize (object) {
  let output = []
  if (object !== undefined && object !== null) {
    for (let key in object) {
      if (object.hasOwnProperty(key) && object[key] !== undefined) {
        output.push(
                    encodeURIComponent(key) +
                        '=' +
                        encodeURIComponent(object[key])
                )
      }
    }
  }
  return output.join('&')
}

Promise.all([ready(), device(), location(), network()]).then(([
    pageData,
    device,
    location,
    network
]) => {
    // NA 端
  objectAssign(DEFAULT, {
    cuid: device.cuid,
    from: device.from,
    app_plat: appPlat,
    channel: device.channel,
    sv: device.sv,
    os: device.os,
    model: device.model,
    screen: device.screen,
    city_id: location.cityId,
    aoi_id: location.aoiId,
    loc_lat: location.locLat,
    loc_lng: location.locLng,
    lat: location.lat,
    lng: location.lng,
    address: location.address,
    nettype: network.net_type
  })
  isReady = true
  quene.forEach(v => {
    v()
  })
}).catch((e) => {
    // H5
  objectAssign(DEFAULT, {
        // 其他方向需要H5参数在这里补充
  })
  isReady = true
  quene.forEach(v => {
    v()
  })
})

/**
 * sak 埋点
 * 参数传一个对象
 * {da_src: src, da_act: 'click/ready/collect等', da_ext: json里面的格式需要与DA同学确认}
 */
function send (stat) {
  let query = serialize(objectAssign({ da_time: Date.now() }, DEFAULT, stat))
  let image = new Image()
  image.onload = (image.onerror = function () {
    image = null
  })
  image.src = 'http://log.waimai.baidu.com/static/transparent.gif?' + query
}

function proxy (stat) {
  if (isReady) {
    send(stat)
  } else {
    quene.push(send.bind(null, stat))
  }
}

/**
 * trace 埋点 在bridge中也有实现(糯米中的trace变成了sak统计)
 * 参数传一个对象
 * {
 *     daSrc: daSrc,
 *     daAct: 'click',
 *     daTrace: {
 *         level: 1,
 *         position: '',
 *         content_type: '',
 *         content_id: ''
 *     }
 * }
 */
function humpToUnderline (params) {
  let result = {}
  Object.keys(params).forEach(k => {
    let newK = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[newK] = params[k]
  })
  return result
}

/**
 * 跳转到下一页时调用此接口
 */
function sendOnlineStat (params) {
  return ready().then(function () {
    if (window.WMApp) {
      window.WMApp.stat.sendOnlineStat(params)
    } else {
      // 比如在糯米环境
      return Promise.reject('window.WMApp is undefined')
    }
  }).catch((e) => {
      // h5降级为sak统计
    send(humpToUnderline(params))
  })
}

/**
 * 点击返回时调用此接口，退栈
 */
function removeOrderTraceItem (params) {
  return ready().then(function () {
    if (window.WMApp) {
      window.WMApp.stat.removeOrderTraceItem(params)
    } else {
      // 比如在糯米环境
      return Promise.reject('window.WMApp is undefined')
    }
  }).catch((e) => {
      // h5降级为sak统计
    send(humpToUnderline(params))
  })
}

/**
 * 眼球曝光 (sak)
 * 根据全局滚动事件进行判断是否要打点, 后续scroll事件会支持注册到某一dom上
 * 眼球曝光暴露两个接口 registerExposure 和 writeCacheData
 * registerExposure在进入页面后调用一次 进行事件的注册
 * writeCacheData 在做事件处理后的回调中调用，写入数据
 */

// 按照事件类型记录setTimeout的结果
let scrollTimer = {}
let statisticsScrollTimer = {}
// cache结构是按照事件类型区分的对象，每一个事件统计一种曝光数据
// 如 {shopexposure: {}, themeexposure: {}} 等
let cache = {}

/**
 * @param {*} src sak的da_src 参数
 * @param {*} eventName 自定义的事件名称
 */
function registerExposure (src, eventName) {
  cache[eventName] = []
  scrollTimer[eventName] = null
  statisticsScrollTimer[eventName] = null
  window.addEventListener('scroll', function isScrolling () {
    clearTimeout(scrollTimer[eventName])
    clearTimeout(statisticsScrollTimer[eventName])
    // 监听scroll事件200ms派发事件, 写缓存
    scrollTimer[eventName] = setTimeout(
      function dispatch () {
        let ev = document.createEvent('Event')
        ev.initEvent(eventName, true, true)
        window.dispatchEvent(ev)
      }, 200
    )
    // 400ms 进行打点减少请求次数
    statisticsScrollTimer[eventName] = setTimeout(
      function sendStatistics () {
        // 统计的时候需要按照事件名称进行统计
        if (!(cache[eventName])) {
          // 如果缓存是空就不进行请求发送
          return
        }
        proxy({
          da_src: src,
          da_act: 'collect',
          da_ext: JSON.stringify(cache[eventName])
        })
        cache[eventName] = null
      }, 400
    )
  })
}

// 向缓存中写入数据的时候需要按照事件名称区分开
// 打点的时候也按照事件进行打点
/**
 * @param {*} eventName 自定义的事件名称, 与registerExposure中的第2个参数保持一致
 * @param {*} format 基础数据结构
 * @param {*} path 写入数据的路径
 * @param {*} data 打点数据
 */
function writeCacheData (eventName, format, path, data) {
  if (!cache[eventName]) {
    cache[eventName] = format
  }
  let tempObj = cache[eventName]
  for (let i = 0; i < path.length; i++) {
    if (tempObj === undefined) {
      console.warn('writeCacheData path is not match the format structure, this may lead exposure statistics failed')
      return
    }
    tempObj = tempObj[path[i]]
  }
  if (!tempObj) {
    console.warn('writeCacheData path is not match the format structure, this may lead exposure statistics failed')
    return
  }
  tempObj.push(data)
}

/**
 * Demo
 * 
 * 比如要进行商户卡片眼球曝光的统计
 * 打点的数据格式是(这里的格式需要与DA同学事先确认好)
 * {
 *    common: {
 *      shop_info: [{
 *          shopId: '123',
 *          shopName: 'name'
 *      }, {
 *          shopId: '444',
 *          shopName: 'aaa'
 *      }]
 *    },
 *    parse_list: {
 *      data_info: [{
 *        text: '1'
 *      }, {
 *        text: '2'
 *      }]
 *    }
 * }
 * 1.页面入口调用 registerExposure('dessert.shopcard.exposure', 'shopcardevent')
 * 2.在ShopCard组件中做shopcardevent的事件监听处理 如
 * window.addEventListener('shopexposure', this.writeCache)
 * writeCache () {
      let rect = this.$el.getBoundingClientRect()
      if (!rect.width || !rect.height) {
        return
      }
      let height = window.innerHeight || document.documentElement.clientHeight
      let center = (rect.bottom + rect.top) / 2
      if (center <= height && center >= 0) {
        // dom在可视区域内
        exposure.writeCacheData('shopcardevent', {
          common: {
            shop_info: []
          },
          parse_list: {
            data_info: []
          }
        }, ['common', 'shop_info'], {shopId: '123', shopName: 'name'})
        exposure.writeCacheData('shopcardevent', {
          common: {
            shop_info: []
          },
          parse_list: {
            data_info: []
          }
        }, ['parse_list', 'data_info'], {text: '123'})
        // 这里可以进行商户去重，不需要去重去掉此行就行
        window.removeEventListener('shopexposure', this.writeCache)
      }
    }
 * 
 */

export default { send: proxy, sendOnlineStat, removeOrderTraceItem, registerExposure, writeCacheData }
