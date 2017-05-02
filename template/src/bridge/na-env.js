import ajax from './ajax'

// TEST
let isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

window.WMApp = {}

let logOutput = []
let length = 1000
while (length--) {
  logOutput.push('color: #1f74e6')
  logOutput.push('color: #ccc')
}

function log (...arg) {
  let str = '%c' + JSON.stringify(arg, null, '%c|%c   ')
  console.log(str, ...logOutput.slice(0, str.match(/%c/g).length))
}
window.WMApp.nui = {
  toast: log,
  loading: log,
  dialog (params, callback) {
    let data = {
      status: confirm(params.title + '' + params.content)
    }
    callback(data)
  }
}

window.WMApp.page = {
  changePage: log,
  setTitleBar: log,
  closePage: log.bind(window.WMApp, 'closePage'),
  openPageRefresh: log,
  closePageRefresh: log,
  hidePageRefresh: log,
  changePageForResult ({ openUrl }, callback) {
    let pageData = (function () {
      let search = openUrl.replace(/^[^?]*\?/, '')
      let params = {}
      if (search) {
        search.split('&').forEach(v => {
          let param = v.split('=')
          params[param[0]] = param[1] || ''
        })
      }
      return params
    })()
    let path = pageData.pageName
            ? pageData.pageName + '.html'
            : 'index.html'
    if (pageData.pageData) {
      path += '?'
      let data = JSON.parse(decodeURIComponent(pageData.pageData))
      for (let key in data) {
        if (data.hasOwnProperty(key)) {
          path += key + '=' + data[key] + '&'
        }
      }
      path = path.slice(0, -1)
    }

        // console.log(path)
        // path = path ? path + '.html' : 'index.html';
    window.open(path)
        // window.location.href = path;
  },
  setPageForResult: function () {
    window.history.back()
  }
}

window.WMApp.entry = {
  setPageAction: log
}

window.WMApp.console = {
  debug: log,
  log: log
}

const beijing = {
  cityId: '131',
  address: '彩虹大厦',
  addressId: '57421251',
  locLng: '12948233.408314',
  locLat: '4844694.74816',
  lng: '1.2948232959996E7',
  lat: '4844695.33793'
}

// const nanjing = {
//     cityId: '315',
//     address: '解放路40号3-5楼（近明故宫）',
//     locLng: '12948233.408314',
//     locLat: '4844694.74816',
//     lng: '13226738.75',
//     lat: '3745920.25'
// };

window.WMApp.location = {
  getAsyncLocation: function (callback) {
    callback(beijing)
  },
  getSyncLocation: function () {
    return beijing
  }
}

window.WMApp.stat = {
  sendOnlineStat: function () {
    return 'sendOnlineStat'
  },
  removeOrderTraceItem: function () {
    return 'removeOrderTraceItem'
  }
}

// document.cookie = 'cuid=2AD442BA33F809FD94289E05FCEBACC4|36515060005553; expires=Thu, 01 Jan 2970 00:00:00 GMT';

let cuid = document.cookie.replace(
    /(?:(?:^|.*;\s*)cuid=\s*([^;]*).*$)|^.*$/,
    '$1'
)
if (!cuid) {
    // cuid = Math.random().toString(16).slice(2) + '|' + Math.random().toString(10).slice(2);
  cuid = '2AD442BA33F809FD94289E05FCEBACC4|36515060005553'
  document.cookie = 'cuid=' +
        cuid +
        '; expires=Thu, 01 Jan 2970 00:00:00 GMT'
}

window.WMApp.device = {
  getDevice: function () {
    return {
      cuid: cuid,
      sv: '4.1.1',
      channel: 'com.yingyongbao',
      screen: '1440*2392',
      from: 'na-android',
      os: '6.0.1',
      model: 'XT1570',
      payPlats: '0,1,2,3,4,6',
      refer: 'waimai.homepg'
    }
  }
}

window.WMApp.network = {
  getRequest (params, callback) {
    let url = params.url.slice(params.url.indexOf('/', 8))
    if (isIOS) {
      for (let key in params.data) {
        if (params.data.hasOwnProperty(key)) {
          params.data[key] = decodeURIComponent(params.data[key])
        }
      }
    }
    ajax().get(url, params.data).then(res => {
      callback({
        status: 1,
        result: {
          statusCode: 200,
          responseBody: JSON.stringify(res)
        }
      })
    })
  },
  postRawRequest (params, callback) {
    let url = params.url.slice(params.url.indexOf('/', 8))
    ajax().post(url, params.data).then(res => {
      callback({
        status: 1,
        result: {
          statusCode: 200,
          responseBody: JSON.stringify(res)
        }
      })
    })
  },
  getNetwork (callback) {
    callback({
      status: 1,
      result: {
        network: 'wifi'
      }
    })
  }
}

window.WMApp.share = {
  share: log,
  universalShare: log
}

window.WMApp.account = {
  login: cb => {
    cb({
      status: 1
    })
    if (window.confirm('去登陆？')) {
      location.href = 'http://wappass.baidu.com/passport/?login&tpl=wimn&u=' +
                encodeURIComponent(location.href)
    }
  },
  getUserInfo: cb => {
    cb({
      status: 1
    })
  }
}
setTimeout(
    function () {
      window.WMAppReady = true
      let event = new CustomEvent('WMAppReady')
      document.dispatchEvent(event)
    },
    600
)
