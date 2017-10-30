import Axios from 'axios'

class Http {
  constructor({ conf = {}, format = { errno: 'errno', errmsg: 'errmsg', token: 'token', data: 'data' }, hosts = {} }) {
    const dfConf = {
      timeout: 30000,
      responseType: 'json',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }

    this.conf = Object.assign(dfConf, conf)
    this.hosts = hosts
    this.format = format
    this.dataDf = {}
    this.dataDf[format.errno] = ''
    this.dataDf[format.errmsg] = ''
    this.dataDf[format.data] = {}
    this.axios = Axios.create(this.conf)
  }

  stringParse(data) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        data = Object.assign({}, this.dataDf)
      }
    }
    return data
  }

  serialize(query, apart = '?') {
    let urlText = ''
    if (typeof query === 'object') {
      Object.keys(query).forEach((key) => {
        if (typeof query[key] !== 'undefined' && query[key] !== 'undefined' && query[key] !== '') {
          if (apart === '?') {
            urlText += `&${key}=${query[key]}`
          } else {
            urlText += `/${key}/${query[key]}`
          }
        }
      })
    }
    return urlText.replace(/^&/, '?')
  }

  processUrl(url, opt = {}, apart = '?') {
    const hostKeys = Object.keys(this.hosts)
    let newUrl = url
    for (let i = 0; i < hostKeys.length; i += 1) {
      const tmpKey = hostKeys[i]
      if (url.indexOf(`/${tmpKey}/`) === 0) {
        newUrl = url.replace(`/${tmpKey}`, this.hosts[tmpKey])
        newUrl = `${newUrl}${this.serialize(opt, apart)}`
        break
      }
    }

    return newUrl
  }

  errHandle(e) {
    const tmpData = {}
    tmpData[this.format.errno] = 600
    tmpData[this.format.errmsg] = e.message
    return Object.assign(this.dataDf, tmpData)
  }

  resultHandle(res) {
    const tokenKey = this.format.token
    const reqToken = (res.config && res.config.headers) ? res.config.headers[tokenKey] : ''
    const resToken = res.headers ? res.headers[tokenKey] : ''
    let token = ''
    if (resToken && resToken !== reqToken) {
      token = resToken
    }
    let tmpData = {}
    if (res.status !== 200) {
      tmpData[this.format.errno] = res.status
      tmpData[this.format.errmsg] = res.statusText
    } else {
      tmpData = this.stringParse(res.data)
    }
    if (token) {
      tmpData[tokenKey] = token
    }
    return Object.assign(this.dataDf, tmpData)
  }

  async get(url, opt = {}, conf = {}) {
    let res
    try {
      res = await this.axios.get(this.processUrl(url, opt), conf)
    } catch (e) {
      if (!e.response) {
        return this.errHandle(e)
      }
      res = e.response
    }
    return this.resultHandle(res)
  }

  async post(url, opt = {}, conf) {
    let res
    try {
      res = await this.axios.post(this.processUrl(url), opt, conf)
    } catch (e) {
      if (!e.response) {
        return this.errHandle(e)
      }
      res = e.response
    }
    return this.resultHandle(res)
  }

}

export default Http