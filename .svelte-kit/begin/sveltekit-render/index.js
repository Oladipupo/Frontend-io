var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require3() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url2, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url2, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url2}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, dataUriToBuffer$1, Readable, wm, Blob, fetchBlob, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    Blob$1 = fetchBlob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url2, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url2).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@architect/sveltekit-adapter/files/shims.js
var init_shims = __esm({
  "node_modules/@architect/sveltekit-adapter/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/@architect/functions/src/http/session/providers/_get-idx.js
var require_get_idx = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/_get-idx.js"(exports, module2) {
    init_shims();
    module2.exports = function getIdx(cookie = "") {
      let cookies = cookie.split(";").map((c) => c.trim()).filter(Boolean);
      let session = cookies.reverse().find((c) => c.startsWith("_idx="));
      return session || "";
    };
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/node-webtokens/lib/ecdsa.js
var require_ecdsa = __commonJS({
  "node_modules/node-webtokens/lib/ecdsa.js"(exports) {
    init_shims();
    var ERR_MSG = "Could not extract parameters from DER signature";
    exports.derToConcat = (signature, size) => {
      let offset = 0;
      if (signature[offset++] !== 48)
        throw new Error(ERR_MSG);
      let seqLength = signature[offset++];
      if (seqLength === 129)
        seqLength = signature[offset++];
      if (seqLength > signature.length - offset || signature[offset++] !== 2) {
        throw new Error(ERR_MSG);
      }
      let rLength = signature[offset++];
      if (rLength > signature.length - offset - 2 || rLength > size + 1) {
        throw new Error(ERR_MSG);
      }
      let rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== 2)
        throw new Error(ERR_MSG);
      let sLength = signature[offset++];
      if (sLength !== signature.length - offset || sLength > size + 1) {
        throw new Error(ERR_MSG);
      }
      let sOffset = offset;
      offset += sLength;
      if (offset !== signature.length)
        throw new Error(ERR_MSG);
      let rPadding = size - rLength;
      let sPadding = size - sLength;
      let dst = Buffer.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; offset++)
        dst[offset] = 0;
      let rPad = Math.max(-rPadding, 0);
      signature.copy(dst, offset, rOffset + rPad, rOffset + rLength);
      offset = size;
      for (let o = offset; offset < o + sPadding; offset++)
        dst[offset] = 0;
      let sPad = Math.max(-sPadding, 0);
      signature.copy(dst, offset, sOffset + sPad, sOffset + sLength);
      return dst;
    };
    exports.concatToDer = (signature, size) => {
      let rPadding = countPadding(signature, 0, size);
      let sPadding = countPadding(signature, size, signature.length);
      let rLength = size - rPadding;
      let sLength = size - sPadding;
      let rsBytes = rLength + sLength + 4;
      let shortLength = rsBytes < 128;
      let dst = Buffer.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      let offset = 0;
      dst[offset++] = 48;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = 129;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = 2;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, size);
      } else {
        offset += signature.copy(dst, offset, rPadding, size);
      }
      dst[offset++] = 2;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, size);
      } else {
        signature.copy(dst, offset, size + sPadding);
      }
      return dst;
    };
    function countPadding(buf, start, stop) {
      let padding = 0;
      while (start + padding < stop && buf[start + padding] === 0)
        padding++;
      let needsSign = buf[start + padding] >= 128;
      return needsSign ? --padding : padding;
    }
  }
});

// node_modules/node-webtokens/lib/common.js
var require_common = __commonJS({
  "node_modules/node-webtokens/lib/common.js"(exports) {
    init_shims();
    exports.buf2b64url = (data) => {
      return data.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    };
    function responder(error3, result, callback) {
      if (callback) {
        callback(error3, result);
      } else if (error3) {
        throw error3;
      } else {
        return result;
      }
    }
    exports.responder = responder;
    exports.payloadVerifications = (parsed, cb) => {
      if (parsed.audList) {
        if (parsed.payload.aud === void 0) {
          parsed.error = { message: "Missing aud claim in payload" };
          return responder(null, parsed, cb);
        } else if (!parsed.audList.includes(parsed.payload.aud)) {
          parsed.error = { message: "Mismatching aud claim in payload" };
          return responder(null, parsed, cb);
        }
      }
      if (parsed.issList) {
        if (parsed.payload.iss === void 0) {
          parsed.error = { message: "Missing iss claim in payload" };
          return responder(null, parsed, cb);
        } else if (!parsed.issList.includes(parsed.payload.iss)) {
          parsed.error = { message: "Mismatching iss claim in payload" };
          return responder(null, parsed, cb);
        }
      }
      let iat = Number(parsed.payload.iat);
      if (!iat) {
        parsed.error = { message: "Missing or invalid iat claim in payload" };
        return responder(null, parsed, cb);
      }
      let expiration = Number(parsed.payload.exp);
      if (parsed.lifetime) {
        let iatExp = iat + parsed.lifetime;
        if (!expiration || iatExp < expiration)
          expiration = iatExp;
      }
      if (expiration && Date.now() > expiration * 1e3) {
        parsed.expired = expiration;
        return responder(null, parsed, cb);
      }
      parsed.valid = true;
      return responder(null, parsed, cb);
    };
  }
});

// node_modules/node-webtokens/lib/jws.js
var require_jws = __commonJS({
  "node_modules/node-webtokens/lib/jws.js"(exports) {
    init_shims();
    var crypto = require("crypto");
    var ecdsa = require_ecdsa();
    var { responder, buf2b64url, payloadVerifications } = require_common();
    var ALG_RE = /^(HS|RS|ES)(256|384|512)$/;
    exports.generate = (alg, payload, ...rest) => {
      let key;
      let cb;
      let header = { alg };
      if (rest[0].constructor !== Object) {
        key = rest[0];
        cb = typeof rest[1] === "function" ? rest[1] : void 0;
      } else {
        header.kid = rest[1];
        key = rest[0][rest[1]];
        cb = typeof rest[2] === "function" ? rest[2] : void 0;
        if (!key) {
          return responder(new TypeError("Invalid key identifier"), null, cb);
        }
      }
      let match = typeof alg === "string" ? alg.match(ALG_RE) : null;
      if (!match) {
        return responder(new TypeError("Unrecognized algorithm"), null, cb);
      }
      let generateJws;
      if (match[1] === "HS") {
        generateJws = generateHsJws;
      } else if (match[1] === "RS") {
        generateJws = generateRsJws;
      } else {
        generateJws = generateEsJws;
      }
      payload.iat = Math.floor(Date.now() / 1e3);
      let h = buf2b64url(Buffer.from(JSON.stringify(header)));
      let p = buf2b64url(Buffer.from(JSON.stringify(payload)));
      let token;
      try {
        token = generateJws(`${h}.${p}`, +match[2], key);
      } catch (error3) {
        return responder(error3, null, cb);
      }
      return responder(null, token, cb);
    };
    exports.verify = (parsed, key, cb) => {
      if (parsed.error)
        return responder(null, parsed, cb);
      if (typeof parsed.header.alg !== "string") {
        parsed.error = { message: "Missing or invalid alg claim in header" };
        return responder(null, parsed, cb);
      }
      let match = parsed.header.alg.match(ALG_RE);
      if (!match) {
        parsed.error = { message: `Unrecognized algorithm ${parsed.header.alg}` };
        return responder(null, parsed, cb);
      }
      if (parsed.algList && !parsed.algList.includes(parsed.header.alg)) {
        parsed.error = { message: `Unwanted algorithm ${parsed.header.alg}` };
        return responder(null, parsed, cb);
      }
      let protect = `${parsed.parts[0]}.${parsed.parts[1]}`;
      let verifyJws;
      if (match[1] === "HS") {
        verifyJws = verifyHsJws;
      } else if (match[1] === "RS") {
        verifyJws = verifyRsJws;
      } else {
        verifyJws = verifyEsJws;
      }
      let integrity;
      try {
        integrity = verifyJws(protect, parsed.parts[2], +match[2], key);
      } catch (error3) {
        parsed.error = { message: `Could not verify integrity. ${error3.message}` };
        return responder(null, parsed, cb);
      }
      if (!integrity) {
        parsed.error = { message: "Integrity check failed" };
        return responder(null, parsed, cb);
      }
      return payloadVerifications(parsed, cb);
    };
    function generateHsJws(protect, bits, key) {
      if (typeof key === "string") {
        key = Buffer.from(key, "base64");
      } else if (!(key instanceof Buffer)) {
        throw new TypeError("Key must be a buffer or a base64 string");
      }
      let bytes = bits >> 3;
      if (key.length < bytes) {
        throw new TypeError(`Key length must be at least ${bytes} bytes`);
      }
      let hmac = crypto.createHmac(`SHA${bits}`, key);
      let mac = buf2b64url(hmac.update(protect).digest());
      return `${protect}.${mac}`;
    }
    function verifyHsJws(protect, mac, bits, key) {
      if (typeof key === "string") {
        key = Buffer.from(key, "base64");
      } else if (!(key instanceof Buffer)) {
        throw new TypeError("Key must be a buffer or a base64 string");
      }
      let bytes = bits >> 3;
      if (key.length < bytes) {
        throw new TypeError(`Key length must be at least ${bytes} bytes`);
      }
      let hmac = crypto.createHmac(`SHA${bits}`, key);
      hmac.update(protect);
      return crypto.timingSafeEqual(hmac.digest(), Buffer.from(mac, "base64"));
    }
    function generateRsJws(protect, bits, key) {
      if (key instanceof Buffer) {
        key = key.toString();
      } else if (typeof key !== "string") {
        throw new TypeError("Key must be a buffer or a UTF-8 string");
      }
      if (!key.includes("-----BEGIN") || !key.includes("KEY-----")) {
        throw new TypeError("Key must be a PEM formatted RSA private key");
      }
      let signer = crypto.createSign(`SHA${bits}`);
      let signature = buf2b64url(signer.update(protect).sign(key));
      return `${protect}.${signature}`;
    }
    function verifyRsJws(protect, signature, bits, key) {
      if (key instanceof Buffer) {
        key = key.toString();
      } else if (typeof key !== "string") {
        throw new TypeError("Key must be a buffer or a UTF-8 string");
      }
      if (!key.includes("-----BEGIN") || !(key.includes("KEY-----") || key.includes("CERTIFICATE-----"))) {
        throw new TypeError("Key must be a PEM formatted RSA public key");
      }
      let verifier = crypto.createVerify(`SHA${bits}`);
      verifier.update(protect);
      return verifier.verify(key, signature, "base64");
    }
    function generateEsJws(protect, bits, key) {
      if (key instanceof Buffer) {
        key = key.toString();
      } else if (typeof key !== "string") {
        throw new TypeError("Key must be a buffer or a UTF-8 string");
      }
      if (!key.includes("-----BEGIN") || !key.includes("KEY-----")) {
        throw new TypeError("Key must be a PEM formatted EC private key");
      }
      let signer = crypto.createSign(`SHA${bits}`);
      signer.update(protect);
      let size = 32;
      if (bits === 384) {
        size = 48;
      } else if (bits === 512) {
        size = 66;
      }
      let signature = buf2b64url(ecdsa.derToConcat(signer.sign(key), size));
      return `${protect}.${signature}`;
    }
    function verifyEsJws(protect, signature, bits, key) {
      if (key instanceof Buffer) {
        key = key.toString();
      } else if (typeof key !== "string") {
        throw new TypeError("Key must be a buffer or a UTF-8 string");
      }
      if (!key.includes("-----BEGIN") || !(key.includes("KEY-----") || key.includes("CERTIFICATE-----"))) {
        throw new TypeError("Key must be a PEM formatted EC public key");
      }
      signature = Buffer.from(signature, "base64");
      let size = 32;
      if (bits === 384) {
        size = 48;
      } else if (bits === 512) {
        size = 66;
      }
      if (signature.length !== size << 1) {
        return false;
      }
      let verifier = crypto.createVerify(`SHA${bits}`);
      verifier.update(protect);
      return verifier.verify(key, ecdsa.concatToDer(signature, size));
    }
  }
});

// node_modules/node-webtokens/lib/jwe.js
var require_jwe = __commonJS({
  "node_modules/node-webtokens/lib/jwe.js"(exports) {
    init_shims();
    var crypto = require("crypto");
    var { responder, buf2b64url, payloadVerifications } = require_common();
    var ALG_RE = /^(PBES2-HS(256|384|512)\053)?(RSA-OAEP|dir|A(128|192|256)KW)$/;
    var ENC_RE = /^A(128|192|256)(GCM|CBC-HS(256|384|512))$/;
    exports.generate = (alg, enc, payload, ...rest) => {
      let key;
      let cb;
      let header = { alg, enc };
      if (rest[0].constructor !== Object) {
        key = rest[0];
        cb = typeof rest[1] === "function" ? rest[1] : void 0;
      } else {
        header.kid = rest[1];
        key = rest[0][rest[1]];
        cb = typeof rest[2] === "function" ? rest[2] : void 0;
        if (!key) {
          return responder(new TypeError("Invalid key identifier"), null, cb);
        }
      }
      let aMatch = typeof alg === "string" ? alg.match(ALG_RE) : null;
      if (!aMatch || aMatch[2] && +aMatch[2] !== aMatch[4] * 2) {
        let error3 = new TypeError("Unrecognized key management algorithm");
        return responder(error3, null, cb);
      }
      let eMatch = typeof enc === "string" ? enc.match(ENC_RE) : null;
      if (!eMatch || eMatch[3] && +eMatch[3] !== eMatch[1] * 2) {
        let error3 = new TypeError("Unrecognized content encryption algorithm");
        return responder(error3, null, cb);
      }
      let salt;
      if (aMatch[2]) {
        let p2s = crypto.randomBytes(16);
        header.p2c = 1024;
        header.p2s = buf2b64url(p2s);
        salt = Buffer.concat([Buffer.from(alg), Buffer.from([0]), p2s]);
        if (!cb) {
          let bits2 = Number(aMatch[2]);
          key = crypto.pbkdf2Sync(key, salt, header.p2c, bits2 >> 4, `sha${bits2}`);
        }
      }
      let aad = buf2b64url(Buffer.from(JSON.stringify(header)));
      if (!aMatch[2] || !cb) {
        return generateJwe(aMatch, eMatch, aad, payload, key, cb);
      }
      let bits = Number(aMatch[2]);
      crypto.pbkdf2(key, salt, header.p2c, bits >> 4, `sha${bits}`, (err, key2) => {
        if (err)
          return cb(err);
        generateJwe(aMatch, eMatch, aad, payload, key2, cb);
      });
    };
    function generateJwe(aMatch, eMatch, aad, payload, key, cb) {
      let cekLen = eMatch[3] ? +eMatch[1] >> 2 : +eMatch[1] >> 3;
      let contEncr = eMatch[3] ? contentEncryptCbc : contentEncryptGcm;
      let cek;
      let cekEnc;
      if (aMatch[0] !== "dir") {
        cek = crypto.randomBytes(cekLen);
        let keyEncr = aMatch[4] ? aesKeyWrap : rsaOaepEncrypt;
        try {
          cekEnc = keyEncr(cek, key, +aMatch[4]);
        } catch (error3) {
          return responder(error3, null, cb);
        }
      } else {
        if (typeof key === "string") {
          key = Buffer.from(key, "base64");
        } else if (!(key instanceof Buffer)) {
          let error3 = new TypeError("Key must be a buffer or a base64 string");
          return responder(error3, null, cb);
        }
        if (key.length < cekLen) {
          let error3 = new TypeError(`Key must be at least ${cekLen} bytes`);
          return responder(error3, null, cb);
        }
        cek = key.slice(0, cekLen);
        cekEnc = "";
      }
      payload.iat = Math.floor(Date.now() / 1e3);
      let token = contEncr(aad, cek, cekEnc, JSON.stringify(payload), +eMatch[1]);
      return responder(null, token, cb);
    }
    exports.verify = (parsed, key, cb) => {
      if (parsed.error)
        return responder(null, parsed, cb);
      if (typeof parsed.header.alg !== "string") {
        parsed.error = { message: "Missing or invalid alg claim in header" };
        return responder(null, parsed, cb);
      }
      if (typeof parsed.header.enc !== "string") {
        parsed.error = { message: "Missing or invalid enc claim in header" };
        return responder(null, parsed, cb);
      }
      let aMatch = parsed.header.alg.match(ALG_RE);
      if (!aMatch || aMatch[2] && +aMatch[2] !== aMatch[4] * 2) {
        parsed.error = {
          message: `Unrecognized key management algorithm ${parsed.header.alg}`
        };
        return responder(null, parsed, cb);
      }
      if (parsed.algList && !parsed.algList.includes(parsed.header.alg)) {
        parsed.error = {
          message: `Unwanted key management algorithm ${parsed.header.alg}`
        };
        return responder(null, parsed, cb);
      }
      let eMatch = parsed.header.enc.match(ENC_RE);
      if (!eMatch || eMatch[3] && +eMatch[3] !== eMatch[1] * 2) {
        parsed.error = {
          message: `Unrecognized content encryption algorithm ${parsed.header.enc}`
        };
        return responder(null, parsed, cb);
      }
      if (parsed.encList && !parsed.encList.includes(parsed.header.enc)) {
        parsed.error = {
          message: `Unwanted content encryption algorithm ${parsed.header.enc}`
        };
        return responder(null, parsed, cb);
      }
      let salt;
      let iter;
      if (aMatch[2]) {
        iter = parsed.header.p2c;
        if (!Number.isInteger(iter) || iter < 1 || iter > 16384) {
          parsed.error = { message: "Missing or invalid p2c claim in header" };
          return responder(null, parsed, cb);
        } else if (!cb && iter > 1024) {
          parsed.error = { message: "p2c value too large for synchronous mode" };
          return responder(null, parsed, cb);
        }
        if (typeof parsed.header.p2s !== "string") {
          parsed.error = { message: "Missing or invalid p2s claim in header" };
          return responder(null, parsed, cb);
        }
        let p2s = Buffer.from(parsed.header.p2s, "base64");
        let alg = parsed.header.alg;
        salt = Buffer.concat([Buffer.from(alg), Buffer.from([0]), p2s]);
        if (!cb) {
          let bits2 = Number(aMatch[2]);
          key = crypto.pbkdf2Sync(key, salt, iter, bits2 >> 4, `sha${bits2}`);
        }
      }
      if (!aMatch[2] || !cb) {
        return decryptJwe(parsed, aMatch, eMatch, key, cb);
      }
      let bits = Number(aMatch[2]);
      crypto.pbkdf2(key, salt, iter, bits >> 4, `sha${bits}`, (error3, key2) => {
        if (error3)
          return cb(error3);
        decryptJwe(parsed, aMatch, eMatch, key2, cb);
      });
    };
    function decryptJwe(parsed, aMatch, eMatch, key, cb) {
      let aad = Buffer.from(parsed.parts[0]);
      let cekEnc = Buffer.from(parsed.parts[1], "base64");
      let iv = Buffer.from(parsed.parts[2], "base64");
      let content = Buffer.from(parsed.parts[3], "base64");
      let tag = Buffer.from(parsed.parts[4], "base64");
      let cekLen = eMatch[3] ? +eMatch[1] >> 2 : +eMatch[1] >> 3;
      let contDecr = eMatch[3] ? contentDecryptCbc : contentDecryptGcm;
      let cek;
      if (aMatch[0] !== "dir") {
        let keyDecr = aMatch[4] ? aesKeyUnwrap : rsaOaepDecrypt;
        try {
          cek = keyDecr(cekEnc, key, +aMatch[4]);
        } catch (error3) {
          parsed.error = { message: `Could not decrypt token. ${error3.message}` };
          return responder(null, parsed, cb);
        }
      } else {
        if (typeof key === "string") {
          key = Buffer.from(key, "base64");
        } else if (!(key instanceof Buffer)) {
          parsed.error = { message: "Invalid key" };
          return responder(null, parsed, cb);
        }
        if (key.length < cekLen) {
          parsed.error = {
            message: `Invalid key length. Must be at least ${cekLen} bytes`
          };
          return responder(null, parsed, cb);
        }
        cek = key.slice(0, cekLen);
      }
      let plain;
      try {
        plain = contDecr(content, aad, tag, cek, iv, +eMatch[1]);
      } catch (error3) {
        parsed.error = { message: `Could not decrypt token. ${error3.message}` };
        return responder(null, parsed, cb);
      }
      try {
        parsed.payload = JSON.parse(plain);
      } catch (error3) {
        parsed.error = { message: `Non parsable payload. ${error3.message}` };
        return responder(null, parsed, cb);
      }
      return payloadVerifications(parsed, cb);
    }
    function contentEncryptGcm(aad, cek, cekEnc, plain, bits) {
      let iv = crypto.randomBytes(12);
      let cipher = crypto.createCipheriv(`id-aes${bits}-GCM`, cek, iv);
      cipher.setAutoPadding(false);
      cipher.setAAD(Buffer.from(aad));
      let enc = buf2b64url(Buffer.concat([cipher.update(plain), cipher.final()]));
      let tag = buf2b64url(cipher.getAuthTag());
      return `${aad}.${cekEnc}.${buf2b64url(iv)}.${enc}.${tag}`;
    }
    function contentDecryptGcm(content, aad, tag, cek, iv, bits) {
      let decipher = crypto.createDecipheriv(`id-aes${bits}-GCM`, cek, iv);
      decipher.setAutoPadding(false);
      decipher.setAAD(aad);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(content), decipher.final()]);
    }
    function contentEncryptCbc(aad, cek, cekEnc, plain, bits) {
      let iv = crypto.randomBytes(16);
      let bytes = bits >> 3;
      let cipher = crypto.createCipheriv(`AES-${bits}-CBC`, cek.slice(bytes), iv);
      let enc = Buffer.concat([cipher.update(plain), cipher.final()]);
      let len = aad.length << 3;
      let al = Buffer.from(`000000000000000${len.toString(16)}`.slice(-16), "hex");
      let hmac = crypto.createHmac(`SHA${bits << 1}`, cek.slice(0, bytes));
      hmac.update(Buffer.from(aad)).update(iv).update(enc).update(al);
      let tag = buf2b64url(hmac.digest().slice(0, bytes));
      return `${aad}.${cekEnc}.${buf2b64url(iv)}.${buf2b64url(enc)}.${tag}`;
    }
    function contentDecryptCbc(content, aad, tag, cek, iv, bits) {
      let bytes = bits >> 3;
      let len = aad.length << 3;
      let al = Buffer.from(`000000000000000${len.toString(16)}`.slice(-16), "hex");
      let hmac = crypto.createHmac(`SHA${bits << 1}`, cek.slice(0, bytes));
      hmac.update(aad).update(iv).update(content).update(al);
      if (!crypto.timingSafeEqual(hmac.digest().slice(0, bytes), tag)) {
        throw new Error("Authentication of encrypted data failed");
      }
      let encKey = cek.slice(bytes);
      let decipher = crypto.createDecipheriv(`AES-${bits}-CBC`, encKey, iv);
      return Buffer.concat([decipher.update(content), decipher.final()]);
    }
    function rsaOaepEncrypt(cek, key) {
      if (key instanceof Buffer) {
        key = key.toString();
      } else if (typeof key !== "string") {
        throw new TypeError("Key must be a buffer or a string");
      }
      if (!key.includes("-----BEGIN") || !(key.includes("KEY-----") || key.includes("CERTIFICATE-----"))) {
        throw new TypeError("Key must be a PEM formatted RSA public key");
      }
      let options2 = { key, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING };
      return buf2b64url(crypto.publicEncrypt(options2, cek));
    }
    function rsaOaepDecrypt(cekEnc, key) {
      if (key instanceof Buffer) {
        key = key.toString();
      }
      if (typeof key !== "string" || !key.includes("-----BEGIN") || !key.includes("KEY-----")) {
        throw new TypeError("Key must be a PEM formatted RSA private key");
      }
      let options2 = { key, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING };
      return crypto.privateDecrypt(options2, cekEnc);
    }
    function aesKeyWrap(cek, key, bits) {
      let bytes = bits >> 3;
      if (typeof key === "string") {
        key = Buffer.from(key, "base64");
      } else if (!(key instanceof Buffer)) {
        throw new TypeError("Key must be a buffer or a base64-encoded string");
      }
      if (key.length < bytes) {
        throw new TypeError(`Key length must be at least ${bytes} bytes`);
      }
      key = key.slice(0, bytes);
      let r = [];
      for (let i = 0; i < cek.length; i += 8) {
        r.push(cek.slice(i, i + 8));
      }
      let iv = Buffer.alloc(16);
      let a = Buffer.from("A6A6A6A6A6A6A6A6", "hex");
      let count = 1;
      for (let j = 0; j < 6; j++) {
        for (let i = 0; i < r.length; i++) {
          let cipher = crypto.createCipheriv(`AES${bits}`, key, iv);
          let c = `000000000000000${count.toString(16)}`.slice(-16);
          let b = cipher.update(Buffer.concat([a, r[i]]));
          a = Buffer.from(c, "hex");
          for (let n = 0; n < 8; n++) {
            a[n] ^= b[n];
          }
          r[i] = b.slice(8, 16);
          count++;
        }
      }
      return buf2b64url(Buffer.concat([a].concat(r)));
    }
    function aesKeyUnwrap(cekEnc, key, bits) {
      let bytes = bits >> 3;
      if (typeof key === "string") {
        key = Buffer.from(key, "base64");
      } else if (!(key instanceof Buffer)) {
        throw new TypeError("Key must be a buffer or a base64 string");
      }
      if (key.length < bytes) {
        throw new TypeError(`Key must be at least ${bytes} bytes`);
      }
      key = key.slice(0, bytes);
      let a = cekEnc.slice(0, 8);
      let r = [];
      for (let i = 8; i < cekEnc.length; i += 8) {
        r.push(cekEnc.slice(i, i + 8));
      }
      let z = Buffer.alloc(16);
      let count = 6 * r.length;
      for (let j = 5; j >= 0; j--) {
        for (let i = r.length - 1; i >= 0; i--) {
          let c = `000000000000000${count.toString(16)}`.slice(-16);
          c = Buffer.from(c, "hex");
          for (let n = 0; n < 8; n++) {
            a[n] ^= c[n];
          }
          let decipher = crypto.createDecipheriv(`AES${bits}`, key, z);
          let b = decipher.update(Buffer.concat([a, r[i], z]));
          a = b.slice(0, 8);
          r[i] = b.slice(8, 16);
          count--;
        }
      }
      if (!a.equals(Buffer.from("A6A6A6A6A6A6A6A6", "hex"))) {
        throw new Error("Key unwrapping failed");
      }
      return Buffer.concat(r);
    }
  }
});

// node_modules/node-webtokens/index.js
var require_node_webtokens = __commonJS({
  "node_modules/node-webtokens/index.js"(exports) {
    init_shims();
    var jws = require_jws();
    var jwe = require_jwe();
    var { responder } = require_common();
    exports.generate = (alg, ...rest) => {
      if (rest[0].constructor === Object)
        return jws.generate(alg, ...rest);
      if (rest[1].constructor === Object)
        return jwe.generate(alg, ...rest);
      let idx = rest.length - 1;
      if (idx > 1 && idx < 5 && typeof rest[idx] === "function") {
        rest[idx](error);
      } else {
        throw error;
      }
    };
    exports.parse = (token) => new ParsedToken(token);
    function ParsedToken(token) {
      this.parts = typeof token === "string" ? token.split(".") : [];
      if (this.parts.length === 3) {
        this.type = "JWS";
      } else if (this.parts.length === 5) {
        this.type = "JWE";
      } else {
        this.error = { message: "Invalid token" };
        return;
      }
      try {
        this.header = JSON.parse(Buffer.from(this.parts[0], "base64"));
      } catch (error3) {
        this.error = { message: `Non parsable header. ${error3.message}` };
        return;
      }
      if (this.type === "JWS") {
        try {
          this.payload = JSON.parse(Buffer.from(this.parts[1], "base64"));
        } catch (error3) {
          this.error = { message: `Non parsable payload. ${error3.message}` };
        }
      }
    }
    ParsedToken.prototype.setAlgorithmList = function(algList, encList) {
      if (typeof algList === "string") {
        this.algList = [algList];
      } else if (Array.isArray(algList)) {
        this.algList = algList;
      }
      if (typeof encList === "string") {
        this.encList = [encList];
      } else if (Array.isArray(encList)) {
        this.encList = encList;
      }
      return this;
    };
    ParsedToken.prototype.setTokenLifetime = function(lifetime) {
      if (Number.isInteger(lifetime) && lifetime > 0)
        this.lifetime = lifetime;
      return this;
    };
    ParsedToken.prototype.setAudience = function(audList) {
      if (typeof audList === "string") {
        this.audList = [audList];
      } else if (Array.isArray(audList)) {
        this.audList = audList;
      }
      return this;
    };
    ParsedToken.prototype.setIssuer = function(issList) {
      if (typeof issList === "string") {
        this.issList = [issList];
      } else if (Array.isArray(issList)) {
        this.issList = issList;
      }
      return this;
    };
    ParsedToken.prototype.verify = function(p0, cb) {
      cb = typeof cb === "function" ? cb : void 0;
      if (this.error)
        return responder(null, this, cb);
      let key;
      if (p0.constructor !== Object) {
        key = p0;
      } else if (this.header.kid === void 0) {
        this.error = { message: "Missing kid claim in header" };
        return responder(null, this, cb);
      } else if (p0[this.header.kid] === void 0) {
        this.error = { message: "Key with id not found", kid: this.header.kid };
        return responder(null, this, cb);
      } else {
        key = p0[this.header.kid];
      }
      let verify = this.type === "JWS" ? jws.verify : jwe.verify;
      return verify(this, key, cb);
    };
  }
});

// node_modules/@architect/functions/src/http/session/providers/jwe.js
var require_jwe2 = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/jwe.js"(exports, module2) {
    init_shims();
    var getIdx = require_get_idx();
    var cookie = require_cookie();
    var jwt = require_node_webtokens();
    var alg = "dir";
    var enc = "A128GCM";
    var fallback = Buffer.from("1234567890123456").toString("base64");
    var key = process.env.ARC_APP_SECRET || fallback;
    var jwe = {
      create(payload) {
        return jwt.generate(alg, enc, payload, key);
      },
      parse(token) {
        const WEEK = 604800;
        return jwt.parse(token).setTokenLifetime(WEEK).verify(key);
      }
    };
    function read2(req, callback) {
      let promise;
      if (!callback) {
        promise = new Promise(function argh(res, rej) {
          callback = function errback(err, result) {
            err ? rej(err) : res(result);
          };
        });
      }
      let rawCookie = req.headers && (req.headers.cookie || req.headers.Cookie);
      if (!rawCookie && req.cookies) {
        rawCookie = req.cookies.join(";");
      }
      let idx = getIdx(rawCookie);
      let sesh = cookie.parse(idx)._idx;
      let token = jwe.parse(sesh);
      callback(null, token.valid ? token.payload : {});
      return promise;
    }
    function write(payload, callback) {
      let promise;
      if (!callback) {
        promise = new Promise(function ugh(res, rej) {
          callback = function errback(err, result) {
            err ? rej(err) : res(result);
          };
        });
      }
      let key2 = "_idx";
      let val = jwe.create(payload);
      let maxAge = process.env.SESSION_TTL || 7884e5;
      let sameSite = process.env.ARC_SESSION_SAME_SITE || "lax";
      let options2 = {
        maxAge,
        expires: new Date(Date.now() + maxAge * 1e3),
        secure: true,
        httpOnly: true,
        path: "/",
        sameSite
      };
      if (process.env.SESSION_DOMAIN) {
        options2.domain = process.env.SESSION_DOMAIN;
      }
      if (process.env.NODE_ENV === "testing") {
        delete options2.secure;
      }
      callback(null, cookie.serialize(key2, val, options2));
      return promise;
    }
    module2.exports = { read: read2, write };
  }
});

// node_modules/cookie-signature/index.js
var require_cookie_signature = __commonJS({
  "node_modules/cookie-signature/index.js"(exports) {
    init_shims();
    var crypto = require("crypto");
    exports.sign = function(val, secret) {
      if (typeof val != "string")
        throw new TypeError("Cookie value must be provided as a string.");
      if (typeof secret != "string")
        throw new TypeError("Secret string must be provided.");
      return val + "." + crypto.createHmac("sha256", secret).update(val).digest("base64").replace(/\=+$/, "");
    };
    exports.unsign = function(val, secret) {
      if (typeof val != "string")
        throw new TypeError("Signed cookie string must be provided.");
      if (typeof secret != "string")
        throw new TypeError("Secret string must be provided.");
      var str = val.slice(0, val.lastIndexOf(".")), mac = exports.sign(str, secret), macBuffer = Buffer.from(mac), valBuffer = Buffer.alloc(macBuffer.length);
      valBuffer.write(val);
      return crypto.timingSafeEqual(macBuffer, valBuffer) ? str : false;
    };
  }
});

// node_modules/@architect/functions/src/tables/dynamo.js
var require_dynamo = __commonJS({
  "node_modules/@architect/functions/src/tables/dynamo.js"(exports, module2) {
    init_shims();
    var aws = require("aws-sdk");
    var https2 = require("https");
    function getDynamo(type, callback) {
      if (!type)
        throw ReferenceError("Must supply Dynamo service interface type");
      let testing = process.env.NODE_ENV === "testing";
      let arcLocal = process.env.ARC_LOCAL;
      let port = process.env.ARC_TABLES_PORT || 5e3;
      let local = {
        endpoint: new aws.Endpoint(`http://localhost:${port}`),
        region: process.env.AWS_REGION || "us-west-2"
      };
      let DB = aws.DynamoDB;
      let Doc = aws.DynamoDB.DocumentClient;
      let dynamo;
      if (!testing && !arcLocal) {
        let agent = new https2.Agent({
          keepAlive: true,
          maxSockets: 50,
          rejectUnauthorized: true
        });
        aws.config.update({
          httpOptions: { agent }
        });
      }
      if (type === "db") {
        dynamo = testing ? new DB(local) : new DB();
      }
      if (type === "doc") {
        dynamo = testing ? new Doc(local) : new Doc();
      }
      if (type === "session") {
        let passthru = !process.env.SESSION_TABLE_NAME;
        let mock = {
          get(params, callback2) {
            callback2();
          },
          put(params, callback2) {
            callback2();
          }
        };
        dynamo = testing ? new Doc(local) : passthru ? mock : new Doc();
      }
      if (!callback)
        return dynamo;
      else
        callback(null, dynamo);
    }
    module2.exports = {
      db: getDynamo.bind({}, "db"),
      doc: getDynamo.bind({}, "doc"),
      session: getDynamo.bind({}, "session"),
      direct: {
        db: getDynamo("db"),
        doc: getDynamo("doc")
      }
    };
  }
});

// node_modules/random-bytes/index.js
var require_random_bytes = __commonJS({
  "node_modules/random-bytes/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var crypto = require("crypto");
    var generateAttempts = crypto.randomBytes === crypto.pseudoRandomBytes ? 1 : 3;
    module2.exports = randomBytes2;
    module2.exports.sync = randomBytesSync;
    function randomBytes2(size, callback) {
      if (callback !== void 0 && typeof callback !== "function") {
        throw new TypeError("argument callback must be a function");
      }
      if (!callback && !global.Promise) {
        throw new TypeError("argument callback is required");
      }
      if (callback) {
        return generateRandomBytes(size, generateAttempts, callback);
      }
      return new Promise(function executor(resolve2, reject) {
        generateRandomBytes(size, generateAttempts, function onRandomBytes(err, str) {
          if (err)
            return reject(err);
          resolve2(str);
        });
      });
    }
    function randomBytesSync(size) {
      var err = null;
      for (var i = 0; i < generateAttempts; i++) {
        try {
          return crypto.randomBytes(size);
        } catch (e) {
          err = e;
        }
      }
      throw err;
    }
    function generateRandomBytes(size, attempts, callback) {
      crypto.randomBytes(size, function onRandomBytes(err, buf) {
        if (!err)
          return callback(null, buf);
        if (!--attempts)
          return callback(err);
        setTimeout(generateRandomBytes.bind(null, size, attempts, callback), 10);
      });
    }
  }
});

// node_modules/uid-safe/index.js
var require_uid_safe = __commonJS({
  "node_modules/uid-safe/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var randomBytes2 = require_random_bytes();
    var EQUAL_END_REGEXP = /=+$/;
    var PLUS_GLOBAL_REGEXP = /\+/g;
    var SLASH_GLOBAL_REGEXP = /\//g;
    module2.exports = uid;
    module2.exports.sync = uidSync;
    function uid(length, callback) {
      if (callback !== void 0 && typeof callback !== "function") {
        throw new TypeError("argument callback must be a function");
      }
      if (!callback && !global.Promise) {
        throw new TypeError("argument callback is required");
      }
      if (callback) {
        return generateUid(length, callback);
      }
      return new Promise(function executor(resolve2, reject) {
        generateUid(length, function onUid(err, str) {
          if (err)
            return reject(err);
          resolve2(str);
        });
      });
    }
    function uidSync(length) {
      return toString(randomBytes2.sync(length));
    }
    function generateUid(length, callback) {
      randomBytes2(length, function(err, buf) {
        if (err)
          return callback(err);
        callback(null, toString(buf));
      });
    }
    function toString(buf) {
      return buf.toString("base64").replace(EQUAL_END_REGEXP, "").replace(PLUS_GLOBAL_REGEXP, "-").replace(SLASH_GLOBAL_REGEXP, "_");
    }
  }
});

// node_modules/@architect/functions/src/http/session/providers/ddb/_week-from-now.js
var require_week_from_now = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/ddb/_week-from-now.js"(exports, module2) {
    init_shims();
    module2.exports = function _weekFromNow() {
      return Date.now() / 1e3 + 604800;
    };
  }
});

// node_modules/rndm/index.js
var require_rndm = __commonJS({
  "node_modules/rndm/index.js"(exports, module2) {
    init_shims();
    var assert = require("assert");
    var base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var base36 = "abcdefghijklmnopqrstuvwxyz0123456789";
    var base10 = "0123456789";
    exports = module2.exports = create(base62);
    exports.base62 = exports;
    exports.base36 = create(base36);
    exports.base10 = create(base10);
    exports.create = create;
    function create(chars2) {
      assert(typeof chars2 === "string", "the list of characters must be a string!");
      var length = Buffer.byteLength(chars2);
      return function rndm(len) {
        len = len || 10;
        assert(typeof len === "number" && len >= 0, "the length of the random string must be a number!");
        var salt = "";
        for (var i = 0; i < len; i++)
          salt += chars2[Math.floor(length * Math.random())];
        return salt;
      };
    }
  }
});

// node_modules/tsscmp/lib/index.js
var require_lib = __commonJS({
  "node_modules/tsscmp/lib/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var crypto = require("crypto");
    function bufferEqual(a, b) {
      if (a.length !== b.length) {
        return false;
      }
      if (crypto.timingSafeEqual) {
        return crypto.timingSafeEqual(a, b);
      }
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }
    function timeSafeCompare(a, b) {
      var sa = String(a);
      var sb = String(b);
      var key = crypto.pseudoRandomBytes(32);
      var ah = crypto.createHmac("sha256", key).update(sa).digest();
      var bh = crypto.createHmac("sha256", key).update(sb).digest();
      return bufferEqual(ah, bh) && a === b;
    }
    module2.exports = timeSafeCompare;
  }
});

// node_modules/csrf/index.js
var require_csrf = __commonJS({
  "node_modules/csrf/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var rndm = require_rndm();
    var uid = require_uid_safe();
    var compare = require_lib();
    var crypto = require("crypto");
    var EQUAL_GLOBAL_REGEXP = /=/g;
    var PLUS_GLOBAL_REGEXP = /\+/g;
    var SLASH_GLOBAL_REGEXP = /\//g;
    module2.exports = Tokens;
    function Tokens(options2) {
      if (!(this instanceof Tokens)) {
        return new Tokens(options2);
      }
      var opts = options2 || {};
      var saltLength = opts.saltLength !== void 0 ? opts.saltLength : 8;
      if (typeof saltLength !== "number" || !isFinite(saltLength) || saltLength < 1) {
        throw new TypeError("option saltLength must be finite number > 1");
      }
      var secretLength = opts.secretLength !== void 0 ? opts.secretLength : 18;
      if (typeof secretLength !== "number" || !isFinite(secretLength) || secretLength < 1) {
        throw new TypeError("option secretLength must be finite number > 1");
      }
      this.saltLength = saltLength;
      this.secretLength = secretLength;
    }
    Tokens.prototype.create = function create(secret) {
      if (!secret || typeof secret !== "string") {
        throw new TypeError("argument secret is required");
      }
      return this._tokenize(secret, rndm(this.saltLength));
    };
    Tokens.prototype.secret = function secret(callback) {
      return uid(this.secretLength, callback);
    };
    Tokens.prototype.secretSync = function secretSync() {
      return uid.sync(this.secretLength);
    };
    Tokens.prototype._tokenize = function tokenize(secret, salt) {
      return salt + "-" + hash2(salt + "-" + secret);
    };
    Tokens.prototype.verify = function verify(secret, token) {
      if (!secret || typeof secret !== "string") {
        return false;
      }
      if (!token || typeof token !== "string") {
        return false;
      }
      var index2 = token.indexOf("-");
      if (index2 === -1) {
        return false;
      }
      var salt = token.substr(0, index2);
      var expected = this._tokenize(secret, salt);
      return compare(token, expected);
    };
    function hash2(str) {
      return crypto.createHash("sha1").update(str, "ascii").digest("base64").replace(PLUS_GLOBAL_REGEXP, "-").replace(SLASH_GLOBAL_REGEXP, "_").replace(EQUAL_GLOBAL_REGEXP, "");
    }
  }
});

// node_modules/queue-microtask/index.js
var require_queue_microtask = __commonJS({
  "node_modules/queue-microtask/index.js"(exports, module2) {
    init_shims();
    var promise;
    module2.exports = typeof queueMicrotask === "function" ? queueMicrotask.bind(typeof window !== "undefined" ? window : global) : (cb) => (promise || (promise = Promise.resolve())).then(cb).catch((err) => setTimeout(() => {
      throw err;
    }, 0));
  }
});

// node_modules/run-parallel/index.js
var require_run_parallel = __commonJS({
  "node_modules/run-parallel/index.js"(exports, module2) {
    init_shims();
    module2.exports = runParallel;
    var queueMicrotask2 = require_queue_microtask();
    function runParallel(tasks, cb) {
      let results, pending, keys;
      let isSync = true;
      if (Array.isArray(tasks)) {
        results = [];
        pending = tasks.length;
      } else {
        keys = Object.keys(tasks);
        results = {};
        pending = keys.length;
      }
      function done(err) {
        function end() {
          if (cb)
            cb(err, results);
          cb = null;
        }
        if (isSync)
          queueMicrotask2(end);
        else
          end();
      }
      function each2(i, err, result) {
        results[i] = result;
        if (--pending === 0 || err) {
          done(err);
        }
      }
      if (!pending) {
        done(null);
      } else if (keys) {
        keys.forEach(function(key) {
          tasks[key](function(err, result) {
            each2(key, err, result);
          });
        });
      } else {
        tasks.forEach(function(task, i) {
          task(function(err, result) {
            each2(i, err, result);
          });
        });
      }
      isSync = false;
    }
  }
});

// node_modules/@architect/functions/src/http/session/providers/ddb/create.js
var require_create = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/ddb/create.js"(exports, module2) {
    init_shims();
    var uid = require_uid_safe();
    var week = require_week_from_now();
    var dynamo = require_dynamo().session;
    var crsf = require_csrf();
    var parallel = require_run_parallel();
    module2.exports = function _create(name, payload, callback) {
      parallel([
        function _key(callback2) {
          uid(18, function _uid(err, val) {
            if (err)
              callback2(err);
            else
              callback2(null, { _idx: val });
          });
        },
        function _secret(callback2) {
          new crsf().secret(function _uid(err, val) {
            if (err)
              callback2(err);
            else
              callback2(null, { _secret: val });
          });
        }
      ], function _put(err, results) {
        if (err)
          throw err;
        results.push({ _ttl: week() });
        let keys = results.reduce((a, b) => Object.assign(a, b));
        let session = Object.assign(payload, keys);
        dynamo(function _gotDB(err2, db) {
          if (err2)
            callback(err2);
          else {
            db.put({
              TableName: name,
              Item: session
            }, function _create2(err3) {
              if (err3)
                callback(err3);
              else
                callback(null, session);
            });
          }
        });
      });
    };
  }
});

// node_modules/@architect/functions/src/http/session/providers/ddb/find.js
var require_find = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/ddb/find.js"(exports, module2) {
    init_shims();
    var dynamo = require_dynamo().session;
    var create = require_create();
    module2.exports = function _find(name, _idx, callback) {
      dynamo(function _gotDB(err, db) {
        if (err)
          callback(err);
        else {
          db.get({
            TableName: name,
            ConsistentRead: true,
            Key: { _idx }
          }, function _get(err2, data) {
            if (err2)
              callback(err2);
            else {
              let result = typeof data === "undefined" ? false : data.Item;
              if (result && result._secret) {
                callback(null, result);
              } else {
                create(name, {}, callback);
              }
            }
          });
        }
      });
    };
  }
});

// node_modules/@architect/functions/src/http/session/providers/ddb/update.js
var require_update = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/ddb/update.js"(exports, module2) {
    init_shims();
    var dynamo = require_dynamo().session;
    var week = require_week_from_now();
    module2.exports = function _update(name, payload, callback) {
      let _ttl = week();
      let session = Object.assign(payload, { _ttl });
      dynamo(function _gotDB(err, db) {
        if (err)
          callback(err);
        else {
          db.put({
            TableName: name,
            Item: session
          }, function _create(err2) {
            if (err2)
              callback(err2);
            else
              callback(null, session);
          });
        }
      });
    };
  }
});

// node_modules/@architect/functions/src/http/session/providers/ddb/index.js
var require_ddb = __commonJS({
  "node_modules/@architect/functions/src/http/session/providers/ddb/index.js"(exports, module2) {
    init_shims();
    var cookie = require_cookie();
    var getIdx = require_get_idx();
    var { unsign, sign } = require_cookie_signature();
    var find = require_find();
    var create = require_create();
    var update = require_update();
    module2.exports = { read: read2, write };
    function read2(request, callback) {
      let promise;
      if (!callback) {
        promise = new Promise(function(res, rej) {
          callback = function(err, result) {
            err ? rej(err) : res(result);
          };
        });
      }
      let name = process.env.SESSION_TABLE_NAME || tableLogicalId("arc-sessions");
      let secret = process.env.ARC_APP_SECRET || process.env.ARC_APP_NAME || "fallback";
      let rawCookie = request.headers && (request.headers.Cookie || request.headers.cookie);
      if (!rawCookie && request.cookies) {
        rawCookie = request.cookies.join(";");
      }
      let idx = getIdx(rawCookie);
      let sesh = cookie.parse(idx)._idx;
      let valid = unsign(sesh || "", secret);
      let exec = sesh && valid ? find.bind({}, name) : create.bind({}, name);
      let params = sesh && valid ? valid : {};
      exec(params, callback);
      return promise;
    }
    function write(params, callback) {
      let promise;
      if (!callback) {
        promise = new Promise(function(res, rej) {
          callback = function(err, result) {
            err ? rej(err) : res(result);
          };
        });
      }
      let name = process.env.SESSION_TABLE_NAME || tableLogicalId("arc-sessions");
      let secret = process.env.ARC_APP_SECRET || process.env.ARC_APP_NAME || "fallback";
      update(name, params, function _update(err) {
        if (err) {
          callback(err);
        } else {
          let maxAge = process.env.SESSION_TTL || 7884e5;
          let options2 = {
            maxAge,
            expires: new Date(Date.now() + maxAge * 1e3),
            secure: true,
            httpOnly: true,
            path: "/",
            sameSite: "lax"
          };
          if (process.env.SESSION_DOMAIN) {
            options2.domain = process.env.SESSION_DOMAIN;
          }
          if (process.env.NODE_ENV === "testing")
            delete options2.secure;
          let result = cookie.serialize("_idx", sign(params._idx, secret), options2);
          callback(null, result);
        }
      });
      return promise;
    }
    function tableLogicalId(name) {
      let env = process.env.NODE_ENV === "production" ? "production" : "staging";
      return `${process.env.ARC_APP_NAME}-${env}-${name}`;
    }
  }
});

// node_modules/@architect/functions/src/http/session/read.js
var require_read = __commonJS({
  "node_modules/@architect/functions/src/http/session/read.js"(exports, module2) {
    init_shims();
    var jwe = require_jwe2();
    var ddb = require_ddb();
    module2.exports = function read2(request, callback) {
      if (process.env.SESSION_TABLE_NAME === "jwe")
        return jwe.read(request, callback);
      return ddb.read(request, callback);
    };
  }
});

// node_modules/@architect/functions/src/http/session/write.js
var require_write = __commonJS({
  "node_modules/@architect/functions/src/http/session/write.js"(exports, module2) {
    init_shims();
    var jwe = require_jwe2();
    var ddb = require_ddb();
    module2.exports = function write(params, callback) {
      if (process.env.SESSION_TABLE_NAME === "jwe")
        return jwe.write(params, callback);
      return ddb.write(params, callback);
    };
  }
});

// node_modules/@architect/functions/src/http/helpers/body-parser.js
var require_body_parser = __commonJS({
  "node_modules/@architect/functions/src/http/helpers/body-parser.js"(exports, module2) {
    init_shims();
    var qs = require("querystring");
    module2.exports = function parseBody(req) {
      let ctype = req.headers["Content-Type"] || req.headers["content-type"];
      let passthru = !req.body || !req.headers || !ctype || !Object.getOwnPropertyNames(req.body).length;
      if (passthru) {
        return req.body;
      } else {
        let request = JSON.parse(JSON.stringify(req));
        let headers = request.headers;
        let contentType = (type) => headers && headers["Content-Type"] && headers["Content-Type"].includes(type) || headers && headers["content-type"] && headers["content-type"].includes(type);
        let isString = typeof request.body === "string";
        let isBase64 = request.isBase64Encoded;
        let isParsing = isString && isBase64;
        let isJSON = (contentType("application/json") || contentType("application/vnd.api+json")) && isString;
        let isFormURLEncoded = contentType("application/x-www-form-urlencoded") && isParsing;
        let isMultiPartFormData = contentType("multipart/form-data") && isParsing;
        let isOctetStream = contentType("application/octet-stream") && isParsing;
        if (isJSON) {
          try {
            let data = isBase64 ? Buffer.from(request.body, "base64").toString() : request.body;
            request.body = JSON.parse(data) || {};
          } catch (e) {
            throw Error("Invalid request body encoding or invalid JSON");
          }
        }
        if (isFormURLEncoded) {
          let data = new Buffer.from(request.body, "base64").toString();
          request.body = qs.parse(data);
        }
        if (isMultiPartFormData || isOctetStream) {
          request.body = request.body.base64 ? request.body : { base64: request.body };
        }
        return request.body;
      }
    };
  }
});

// node_modules/@architect/functions/src/http/helpers/params.js
var require_params = __commonJS({
  "node_modules/@architect/functions/src/http/helpers/params.js"(exports, module2) {
    init_shims();
    module2.exports = function interpolateParams(req) {
      if (req.version && req.version === "2.0") {
        let { requestContext: context } = req;
        if (context && context.http && context.http.method) {
          req.httpMethod = context.http.method;
        }
        let unUndefined = ["body", "pathParameters", "queryStringParameters"];
        unUndefined.forEach((i) => {
          if (req[i] === void 0)
            req[i] = {};
        });
        req.resource = req.routeKey.split(" ")[1] || req.routeKey;
        req.path = req.rawPath;
      }
      let unNulled = ["body", "pathParameters", "queryStringParameters", "multiValueQueryStringParameters"];
      unNulled.forEach((i) => {
        if (req[i] === null)
          req[i] = {};
      });
      if (!req.method)
        req.method = req.httpMethod;
      if (!req.params)
        req.params = req.pathParameters;
      if (!req.query)
        req.query = req.queryStringParameters;
      let params = /\{\w+\}/g;
      if (params.test(req.path)) {
        let matches = req.path.match(params);
        let vars = matches.map((a) => a.replace(/\{|\}/g, ""));
        let idx = 0;
        matches.forEach((m) => {
          req.path = req.path.replace(m, req.params[vars[idx]]);
          idx += 1;
        });
      }
      return req;
    };
  }
});

// node_modules/@architect/functions/src/http/errors/index.js
var require_errors = __commonJS({
  "node_modules/@architect/functions/src/http/errors/index.js"(exports, module2) {
    init_shims();
    module2.exports = {
      httpError,
      proxyConfig: proxyConfig()
    };
    function proxyConfig() {
      let title = "Index not found";
      let message = `No static asset bucket or <code>get /</code> function found in your project. Possible solutions:<br?
<ul>
  <li>Add <code>@static</code> to your project manifest</li>
  <li>Add <code>get /</code> to the <code>@http</code> pragma of your project manifest</li>
  <li>Manually specify an S3 bucket (containing an <code>index.html</code> file) with the <code>ARC_STATIC_BUCKET</code> env var</li>
  <li>If using <code>arc.http.proxy</code>, pass in a valid config object</li>
</ul>
<a href="https://arc.codes/primitives/static" target="_blank">Learn more</a>`;
      return httpError({ title, message });
    }
    function httpError({ statusCode = 502, title = "Unknown error", message = "" }) {
      title = title === "Error" ? `${statusCode} error` : `${statusCode} error: ${title}`;
      return {
        statusCode,
        headers: {
          "Content-Type": "text/html; charset=utf8;",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
        },
        body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    code {
      font-size: 1.25rem;
      color: #00c26e;
    }
    .max-width-320 {
      max-width: 20rem;
    }
    .margin-left-8 {
      margin-left: 0.5rem;
    }
    .margin-bottom-16 {
      margin-bottom: 1rem;
    }
    .margin-bottom-8 {
      margin-bottom: 0.5rem;
    }
    .padding-32 {
      padding: 2rem;
    }
    .padding-top-16 {
      padding-top: 1rem;
    }
    a, a:hover {
      color: #333;
    }
    p, li {
      padding-bottom: 0.5rem;
    }
  </style>
</head>
<body class="padding-32">
  <div>
    <div class="margin-left-8">
      <div class="margin-bottom-16">
        <h1 class="margin-bottom-16">
          ${title}
        </h1>
        <p>
          ${message}
        </p>
      </div>
      <div class="padding-top-16">
        <p>
          View Architect documentation at:
        </p>
        <a href="https://arc.codes">https://arc.codes</a>
      </div>
    </div>
  </div>
</body>
</html>
`
      };
    }
  }
});

// node_modules/@architect/functions/src/http/helpers/binary-types.js
var require_binary_types = __commonJS({
  "node_modules/@architect/functions/src/http/helpers/binary-types.js"(exports, module2) {
    init_shims();
    module2.exports = [
      "application/octet-stream",
      "application/epub+zip",
      "application/msword",
      "application/pdf",
      "application/rtf",
      "application/vnd.amazon.ebook",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "font/otf",
      "font/woff",
      "font/woff2",
      "image/bmp",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/vnd.microsoft.icon",
      "image/webp",
      "audio/3gpp",
      "audio/aac",
      "audio/basic",
      "audio/mpeg",
      "audio/ogg",
      "audio/wavaudio/webm",
      "audio/x-aiff",
      "audio/x-midi",
      "audio/x-wav",
      "video/3gpp",
      "video/mp2t",
      "video/mpeg",
      "video/ogg",
      "video/quicktime",
      "video/webm",
      "video/x-msvideo",
      "application/java-archive",
      "application/vnd.apple.installer+xml",
      "application/x-7z-compressed",
      "application/x-apple-diskimage",
      "application/x-bzip",
      "application/x-bzip2",
      "application/x-gzip",
      "application/x-java-archive",
      "application/x-rar-compressed",
      "application/x-tar",
      "application/x-zip",
      "application/zip"
    ];
  }
});

// node_modules/@architect/functions/src/http/_res-fmt.js
var require_res_fmt = __commonJS({
  "node_modules/@architect/functions/src/http/_res-fmt.js"(exports, module2) {
    init_shims();
    var { httpError } = require_errors();
    var binaryTypes = require_binary_types();
    module2.exports = function responseFormatter(req, params) {
      if (req.version && req.version === "2.0") {
        let knownParams = ["statusCode", "body", "headers", "isBase64Encoded", "cookies"];
        let hasKnownParams = (p) => knownParams.some((k) => k === p);
        let tidyParams = ["code", "cookie", "cors", "location", "session", "status"];
        let hasTidyParams = (p) => tidyParams.some((k) => k === p);
        let staticallyBound = ["html", "css", "js", "text", "json", "xml"];
        let isStaticallyBound = (p) => staticallyBound.some((k) => k === p);
        let is = (t) => typeof params === t;
        if (is("object") && params !== null && !Array.isArray(params) && Object.keys.length === 1 && (Object.keys(params).some(hasKnownParams) || Object.keys(params).some(hasTidyParams) || Object.keys(params).some(isStaticallyBound))) {
          params;
        } else if (is("number") || is("object") && params !== null || is("string") && params || Array.isArray(params) || params instanceof Buffer) {
          params = { body: JSON.stringify(params) };
        } else if (!params)
          params = {};
      }
      let isError = params instanceof Error;
      let buffer;
      let bodyIsBuffer = params.body && params.body instanceof Buffer;
      if (bodyIsBuffer)
        buffer = params.body;
      if (!isError)
        params = JSON.parse(JSON.stringify(params));
      if (bodyIsBuffer)
        params.body = buffer;
      let body = params.body || "";
      let cacheControl = params.cacheControl || params.headers && params.headers["Cache-Control"] || params.headers && params.headers["cache-control"] || "";
      if (params.headers && params.headers["cache-control"]) {
        delete params.headers["cache-control"];
      }
      let type = params.type || params.headers && params.headers["Content-Type"] || params.headers && params.headers["content-type"] || "application/json; charset=utf8";
      if (params.headers && params.headers["content-type"]) {
        delete params.headers["content-type"];
      }
      let cors = params.cors;
      if (params.html) {
        type = "text/html; charset=utf8";
        body = params.html;
      } else if (params.css) {
        type = "text/css; charset=utf8";
        body = params.css;
      } else if (params.js) {
        type = "text/javascript; charset=utf8";
        body = params.js;
      } else if (params.text) {
        type = "text/plain; charset=utf8";
        body = params.text;
      } else if (params.json) {
        type = "application/json; charset=utf8";
        body = JSON.stringify(params.json);
      } else if (params.xml) {
        type = "application/xml; charset=utf8";
        body = params.xml;
      }
      let providedStatus = params.status || params.code || params.statusCode;
      let statusCode = providedStatus || 200;
      let res = {
        headers: Object.assign({}, { "Content-Type": type }, params.headers || {}),
        statusCode,
        body
      };
      if (params.multiValueHeaders) {
        res.multiValueHeaders = params.multiValueHeaders;
      }
      if (params.cookies) {
        res.cookies = params.cookies;
      }
      if (isError) {
        let statusCode2 = providedStatus || 500;
        let title = params.name;
        let message = `
      ${params.message}<br>
      <pre>${params.stack}<pre>
    `;
        res = httpError({ statusCode: statusCode2, title, message });
      }
      let notArcSix = !process.env.ARC_CLOUDFORMATION;
      let notArcProxy = !process.env.ARC_HTTP || process.env.ARC_HTTP === "aws";
      let isArcFive = notArcSix && notArcProxy;
      let notProxyReq = !req.resource || req.resource && req.resource !== "/{proxy+}";
      if (isArcFive && notProxyReq) {
        res.type = type;
      }
      let headers = res.headers;
      if (cacheControl)
        headers["Cache-Control"] = cacheControl;
      let antiCache = type.includes("text/html") || type.includes("application/json") || type.includes("application/vnd.api+json");
      if (headers && !headers["Cache-Control"] && antiCache) {
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0";
      } else if (headers && !headers["Cache-Control"]) {
        headers["Cache-Control"] = "max-age=86400";
      }
      if (cors)
        headers["Access-Control-Allow-Origin"] = "*";
      if (params.isBase64Encoded)
        res.isBase64Encoded = true;
      if (params.location) {
        res.statusCode = providedStatus || 302;
        res.headers.Location = params.location;
      }
      let isBinary = binaryTypes.some((t) => res.headers["Content-Type"].includes(t));
      let bodyIsString = typeof res.body === "string";
      let b64enc = (i) => new Buffer.from(i).toString("base64");
      if (bodyIsBuffer) {
        res.body = b64enc(res.body);
        res.isBase64Encoded = true;
      }
      if (bodyIsString && isBinary)
        res.isBase64Encoded = true;
      return res;
    };
  }
});

// node_modules/@architect/functions/src/http/http.js
var require_http = __commonJS({
  "node_modules/@architect/functions/src/http/http.js"(exports, module2) {
    init_shims();
    var read2 = require_read();
    var write = require_write();
    var bodyParser = require_body_parser();
    var interpolate = require_params();
    var responseFormatter = require_res_fmt();
    module2.exports = function http2(...fns) {
      fns.forEach((f) => {
        if (typeof f != "function")
          throw TypeError(f + " not a function");
      });
      return function lambda(request, context, callback) {
        if (!request.headers)
          request.headers = {};
        let cache = fns.slice();
        read2(request, function _read(err, session) {
          if (err)
            throw err;
          let req = interpolate(Object.assign({}, request, { session }));
          req.body = bodyParser(req);
          let res = response.bind({}, req, callback);
          (function iterator(fun) {
            function fail() {
              throw Error("next() called from last function");
            }
            let next = iterator.bind({}, cache.shift() || fail);
            fun.call({}, req, res, next);
          })(cache.shift());
        });
      };
    };
    function response(req, callback, params) {
      let res = responseFormatter(req, params);
      if (params && params.cookie) {
        res.headers["Set-Cookie"] = params.cookie;
      }
      if (params && params.session) {
        let { _idx, _secret, _ttl } = req.session;
        let session = { _idx, _secret, _ttl, ...params.session };
        write(session, function _write(err, cookie) {
          if (err)
            callback(err);
          else {
            res.headers["Set-Cookie"] = cookie;
            callback(null, res);
          }
        });
      } else {
        callback(null, res);
      }
    }
  }
});

// node_modules/@architect/functions/src/static/index.js
var require_static = __commonJS({
  "node_modules/@architect/functions/src/static/index.js"(exports, module2) {
    init_shims();
    var { readFileSync, existsSync } = require("fs");
    var { join } = require("path");
    module2.exports = function _static(asset, options2 = {}) {
      let key = asset[0] === "/" ? asset.substring(1) : asset;
      let isIndex = asset === "/";
      let manifest2 = join(process.cwd(), "node_modules", "@architect", "shared", "static.json");
      let exists = existsSync(manifest2);
      let local = process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL;
      let stagePath = options2.stagePath && !local ? "/" + process.env.NODE_ENV : "";
      let path = `${stagePath}/_static`;
      if (!local && exists && !isIndex) {
        let read2 = (p) => readFileSync(p).toString();
        let pkg = JSON.parse(read2(manifest2));
        let asset2 = pkg[key];
        if (!asset2)
          throw ReferenceError(`Could not find asset in static.json (asset fingerprint manifest): ${key}`);
        return `${path}/${asset2}`;
      }
      return `${path}/${isIndex ? "" : key}`;
    };
  }
});

// node_modules/@architect/functions/src/http/helpers/url.js
var require_url = __commonJS({
  "node_modules/@architect/functions/src/http/helpers/url.js"(exports, module2) {
    init_shims();
    module2.exports = function url2(url2) {
      let staging = process.env.NODE_ENV === "staging";
      let production = process.env.NODE_ENV === "production";
      if (!process.env.ARC_LOCAL && (staging || production))
        return `/${process.env.NODE_ENV}${url2}`;
      return url2;
    };
  }
});

// node_modules/@architect/functions/src/http/async/index.js
var require_async = __commonJS({
  "node_modules/@architect/functions/src/http/async/index.js"(exports, module2) {
    init_shims();
    var read2 = require_read();
    var write = require_write();
    var bodyParser = require_body_parser();
    var interpolate = require_params();
    var responseFormatter = require_res_fmt();
    module2.exports = function httpAsync(...fns) {
      fns.forEach((f) => {
        if (typeof f != "function")
          throw TypeError(f + " not a function");
      });
      async function combined(request, context) {
        let params;
        let first = true;
        for (let fn of fns) {
          if (first) {
            first = false;
            let session = await read2(request);
            let req = interpolate(Object.assign({}, request, { session }));
            req.body = bodyParser(req);
            request = req;
          }
          let result = await fn(request, context);
          let isRequest2 = result && result.httpMethod;
          if (isRequest2) {
            request = result;
          } else {
            if (result) {
              params = result;
              break;
            }
          }
        }
        let isHTTPv2 = request.version && request.version === "2.0";
        if (!params && !isHTTPv2) {
          throw new Error(`Finished all functions without returning a response.`);
        }
        return response(request, params);
      }
      return combined;
    };
    async function response(req, params) {
      let res = responseFormatter(req, params);
      if (params && params.cookie) {
        res.headers["Set-Cookie"] = params.cookie;
      }
      if (params && params.session) {
        let { _idx, _secret, _ttl } = req.session;
        let session = { _idx, _secret, _ttl, ...params.session };
        let cookie = await write(session);
        res.headers["Set-Cookie"] = cookie;
      }
      return res;
    }
  }
});

// node_modules/binary-case/index.js
var require_binary_case = __commonJS({
  "node_modules/binary-case/index.js"(exports, module2) {
    init_shims();
    "use strict";
    module2.exports = binaryCase;
    function binaryCase(string, number, options2) {
      if (!options2 || typeof options2 !== "object")
        options2 = {};
      if (!options2.hasOwnProperty("allowOverflow"))
        options2.allowOverflow = true;
      if (number > binaryCase.maxNumber(string) && !options2.allowOverflow)
        return false;
      return getBinaryCase(string, number);
    }
    binaryCase.iterator = function(string, options2) {
      const max = binaryCase.maxNumber(string);
      if (!options2 || typeof options2 !== "object")
        options2 = {};
      if (!options2.hasOwnProperty("startIndex"))
        options2.startIndex = 0;
      if (typeof options2.startIndex !== "number" || !Number.isInteger(options2.startIndex) || options2.startIndex < 0)
        throw Error("Option startIndex must be a non-negative integer.");
      let index2 = options2.startIndex;
      return {
        next: function() {
          return index2 > max ? { done: true } : { done: false, value: getBinaryCase(string, index2++) };
        }
      };
    };
    binaryCase.maxNumber = function(string) {
      const pow = string.match(/[a-z]/ig).length;
      return Math.pow(2, pow) - 1;
    };
    binaryCase.variations = function(string) {
      const results = [];
      const max = binaryCase.maxNumber(string);
      for (let i = 0; i <= max; i++) {
        results.push(binaryCase(string, i));
      }
      return results;
    };
    function getBinaryCase(str, val) {
      let res = "";
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code >= 65 && code <= 90) {
          res += val & 1 ? String.fromCharCode(code + 32) : String.fromCharCode(code);
          val >>>= 1;
        } else if (code >= 97 && code <= 122) {
          res += val & 1 ? String.fromCharCode(code - 32) : String.fromCharCode(code);
          val >>>= 1;
        } else {
          res += String.fromCharCode(code);
        }
        if (val === 0) {
          return res + str.substr(i + 1);
        }
      }
      return res;
    }
  }
});

// node_modules/media-typer/index.js
var require_media_typer = __commonJS({
  "node_modules/media-typer/index.js"(exports) {
    init_shims();
    var paramRegExp = /; *([!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) *= *("(?:[ !\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u0020-\u007e])*"|[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) */g;
    var textRegExp = /^[\u0020-\u007e\u0080-\u00ff]+$/;
    var tokenRegExp = /^[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+$/;
    var qescRegExp = /\\([\u0000-\u007f])/g;
    var quoteRegExp = /([\\"])/g;
    var subtypeNameRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/;
    var typeNameRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/;
    var typeRegExp = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
    exports.format = format2;
    exports.parse = parse;
    function format2(obj) {
      if (!obj || typeof obj !== "object") {
        throw new TypeError("argument obj is required");
      }
      var parameters = obj.parameters;
      var subtype = obj.subtype;
      var suffix = obj.suffix;
      var type = obj.type;
      if (!type || !typeNameRegExp.test(type)) {
        throw new TypeError("invalid type");
      }
      if (!subtype || !subtypeNameRegExp.test(subtype)) {
        throw new TypeError("invalid subtype");
      }
      var string = type + "/" + subtype;
      if (suffix) {
        if (!typeNameRegExp.test(suffix)) {
          throw new TypeError("invalid suffix");
        }
        string += "+" + suffix;
      }
      if (parameters && typeof parameters === "object") {
        var param;
        var params = Object.keys(parameters).sort();
        for (var i = 0; i < params.length; i++) {
          param = params[i];
          if (!tokenRegExp.test(param)) {
            throw new TypeError("invalid parameter name");
          }
          string += "; " + param + "=" + qstring(parameters[param]);
        }
      }
      return string;
    }
    function parse(string) {
      if (!string) {
        throw new TypeError("argument string is required");
      }
      if (typeof string === "object") {
        string = getcontenttype(string);
      }
      if (typeof string !== "string") {
        throw new TypeError("argument string is required to be a string");
      }
      var index2 = string.indexOf(";");
      var type = index2 !== -1 ? string.substr(0, index2) : string;
      var key;
      var match;
      var obj = splitType(type);
      var params = {};
      var value;
      paramRegExp.lastIndex = index2;
      while (match = paramRegExp.exec(string)) {
        if (match.index !== index2) {
          throw new TypeError("invalid parameter format");
        }
        index2 += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value[0] === '"') {
          value = value.substr(1, value.length - 2).replace(qescRegExp, "$1");
        }
        params[key] = value;
      }
      if (index2 !== -1 && index2 !== string.length) {
        throw new TypeError("invalid parameter format");
      }
      obj.parameters = params;
      return obj;
    }
    function getcontenttype(obj) {
      if (typeof obj.getHeader === "function") {
        return obj.getHeader("content-type");
      }
      if (typeof obj.headers === "object") {
        return obj.headers && obj.headers["content-type"];
      }
    }
    function qstring(val) {
      var str = String(val);
      if (tokenRegExp.test(str)) {
        return str;
      }
      if (str.length > 0 && !textRegExp.test(str)) {
        throw new TypeError("invalid parameter value");
      }
      return '"' + str.replace(quoteRegExp, "\\$1") + '"';
    }
    function splitType(string) {
      var match = typeRegExp.exec(string.toLowerCase());
      if (!match) {
        throw new TypeError("invalid media type");
      }
      var type = match[1];
      var subtype = match[2];
      var suffix;
      var index2 = subtype.lastIndexOf("+");
      if (index2 !== -1) {
        suffix = subtype.substr(index2 + 1);
        subtype = subtype.substr(0, index2);
      }
      var obj = {
        type,
        subtype,
        suffix
      };
      return obj;
    }
  }
});

// node_modules/mime-db/db.json
var require_db = __commonJS({
  "node_modules/mime-db/db.json"(exports, module2) {
    module2.exports = {
      "application/1d-interleaved-parityfec": {
        source: "iana"
      },
      "application/3gpdash-qoe-report+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/3gpp-ims+xml": {
        source: "iana",
        compressible: true
      },
      "application/3gpphal+json": {
        source: "iana",
        compressible: true
      },
      "application/3gpphalforms+json": {
        source: "iana",
        compressible: true
      },
      "application/a2l": {
        source: "iana"
      },
      "application/ace+cbor": {
        source: "iana"
      },
      "application/activemessage": {
        source: "iana"
      },
      "application/activity+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-directory+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcost+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcostparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointprop+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointpropparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-error+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamcontrol+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamparams+json": {
        source: "iana",
        compressible: true
      },
      "application/aml": {
        source: "iana"
      },
      "application/andrew-inset": {
        source: "iana",
        extensions: ["ez"]
      },
      "application/applefile": {
        source: "iana"
      },
      "application/applixware": {
        source: "apache",
        extensions: ["aw"]
      },
      "application/at+jwt": {
        source: "iana"
      },
      "application/atf": {
        source: "iana"
      },
      "application/atfx": {
        source: "iana"
      },
      "application/atom+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atom"]
      },
      "application/atomcat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomcat"]
      },
      "application/atomdeleted+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomdeleted"]
      },
      "application/atomicmail": {
        source: "iana"
      },
      "application/atomsvc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomsvc"]
      },
      "application/atsc-dwd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dwd"]
      },
      "application/atsc-dynamic-event-message": {
        source: "iana"
      },
      "application/atsc-held+xml": {
        source: "iana",
        compressible: true,
        extensions: ["held"]
      },
      "application/atsc-rdt+json": {
        source: "iana",
        compressible: true
      },
      "application/atsc-rsat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsat"]
      },
      "application/atxml": {
        source: "iana"
      },
      "application/auth-policy+xml": {
        source: "iana",
        compressible: true
      },
      "application/bacnet-xdd+zip": {
        source: "iana",
        compressible: false
      },
      "application/batch-smtp": {
        source: "iana"
      },
      "application/bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/beep+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/calendar+json": {
        source: "iana",
        compressible: true
      },
      "application/calendar+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xcs"]
      },
      "application/call-completion": {
        source: "iana"
      },
      "application/cals-1840": {
        source: "iana"
      },
      "application/captive+json": {
        source: "iana",
        compressible: true
      },
      "application/cbor": {
        source: "iana"
      },
      "application/cbor-seq": {
        source: "iana"
      },
      "application/cccex": {
        source: "iana"
      },
      "application/ccmp+xml": {
        source: "iana",
        compressible: true
      },
      "application/ccxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ccxml"]
      },
      "application/cdfx+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdfx"]
      },
      "application/cdmi-capability": {
        source: "iana",
        extensions: ["cdmia"]
      },
      "application/cdmi-container": {
        source: "iana",
        extensions: ["cdmic"]
      },
      "application/cdmi-domain": {
        source: "iana",
        extensions: ["cdmid"]
      },
      "application/cdmi-object": {
        source: "iana",
        extensions: ["cdmio"]
      },
      "application/cdmi-queue": {
        source: "iana",
        extensions: ["cdmiq"]
      },
      "application/cdni": {
        source: "iana"
      },
      "application/cea": {
        source: "iana"
      },
      "application/cea-2018+xml": {
        source: "iana",
        compressible: true
      },
      "application/cellml+xml": {
        source: "iana",
        compressible: true
      },
      "application/cfw": {
        source: "iana"
      },
      "application/clr": {
        source: "iana"
      },
      "application/clue+xml": {
        source: "iana",
        compressible: true
      },
      "application/clue_info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cms": {
        source: "iana"
      },
      "application/cnrp+xml": {
        source: "iana",
        compressible: true
      },
      "application/coap-group+json": {
        source: "iana",
        compressible: true
      },
      "application/coap-payload": {
        source: "iana"
      },
      "application/commonground": {
        source: "iana"
      },
      "application/conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cose": {
        source: "iana"
      },
      "application/cose-key": {
        source: "iana"
      },
      "application/cose-key-set": {
        source: "iana"
      },
      "application/cpl+xml": {
        source: "iana",
        compressible: true
      },
      "application/csrattrs": {
        source: "iana"
      },
      "application/csta+xml": {
        source: "iana",
        compressible: true
      },
      "application/cstadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/csvm+json": {
        source: "iana",
        compressible: true
      },
      "application/cu-seeme": {
        source: "apache",
        extensions: ["cu"]
      },
      "application/cwt": {
        source: "iana"
      },
      "application/cybercash": {
        source: "iana"
      },
      "application/dart": {
        compressible: true
      },
      "application/dash+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpd"]
      },
      "application/dashdelta": {
        source: "iana"
      },
      "application/davmount+xml": {
        source: "iana",
        compressible: true,
        extensions: ["davmount"]
      },
      "application/dca-rft": {
        source: "iana"
      },
      "application/dcd": {
        source: "iana"
      },
      "application/dec-dx": {
        source: "iana"
      },
      "application/dialog-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/dicom": {
        source: "iana"
      },
      "application/dicom+json": {
        source: "iana",
        compressible: true
      },
      "application/dicom+xml": {
        source: "iana",
        compressible: true
      },
      "application/dii": {
        source: "iana"
      },
      "application/dit": {
        source: "iana"
      },
      "application/dns": {
        source: "iana"
      },
      "application/dns+json": {
        source: "iana",
        compressible: true
      },
      "application/dns-message": {
        source: "iana"
      },
      "application/docbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dbk"]
      },
      "application/dots+cbor": {
        source: "iana"
      },
      "application/dskpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/dssc+der": {
        source: "iana",
        extensions: ["dssc"]
      },
      "application/dssc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdssc"]
      },
      "application/dvcs": {
        source: "iana"
      },
      "application/ecmascript": {
        source: "iana",
        compressible: true,
        extensions: ["es", "ecma"]
      },
      "application/edi-consent": {
        source: "iana"
      },
      "application/edi-x12": {
        source: "iana",
        compressible: false
      },
      "application/edifact": {
        source: "iana",
        compressible: false
      },
      "application/efi": {
        source: "iana"
      },
      "application/elm+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/elm+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.cap+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/emergencycalldata.comment+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.control+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.deviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.ecall.msd": {
        source: "iana"
      },
      "application/emergencycalldata.providerinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.serviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.subscriberinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.veds+xml": {
        source: "iana",
        compressible: true
      },
      "application/emma+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emma"]
      },
      "application/emotionml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emotionml"]
      },
      "application/encaprtp": {
        source: "iana"
      },
      "application/epp+xml": {
        source: "iana",
        compressible: true
      },
      "application/epub+zip": {
        source: "iana",
        compressible: false,
        extensions: ["epub"]
      },
      "application/eshop": {
        source: "iana"
      },
      "application/exi": {
        source: "iana",
        extensions: ["exi"]
      },
      "application/expect-ct-report+json": {
        source: "iana",
        compressible: true
      },
      "application/express": {
        source: "iana",
        extensions: ["exp"]
      },
      "application/fastinfoset": {
        source: "iana"
      },
      "application/fastsoap": {
        source: "iana"
      },
      "application/fdt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fdt"]
      },
      "application/fhir+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fhir+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fido.trusted-apps+json": {
        compressible: true
      },
      "application/fits": {
        source: "iana"
      },
      "application/flexfec": {
        source: "iana"
      },
      "application/font-sfnt": {
        source: "iana"
      },
      "application/font-tdpfr": {
        source: "iana",
        extensions: ["pfr"]
      },
      "application/font-woff": {
        source: "iana",
        compressible: false
      },
      "application/framework-attributes+xml": {
        source: "iana",
        compressible: true
      },
      "application/geo+json": {
        source: "iana",
        compressible: true,
        extensions: ["geojson"]
      },
      "application/geo+json-seq": {
        source: "iana"
      },
      "application/geopackage+sqlite3": {
        source: "iana"
      },
      "application/geoxacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/gltf-buffer": {
        source: "iana"
      },
      "application/gml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["gml"]
      },
      "application/gpx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["gpx"]
      },
      "application/gxf": {
        source: "apache",
        extensions: ["gxf"]
      },
      "application/gzip": {
        source: "iana",
        compressible: false,
        extensions: ["gz"]
      },
      "application/h224": {
        source: "iana"
      },
      "application/held+xml": {
        source: "iana",
        compressible: true
      },
      "application/hjson": {
        extensions: ["hjson"]
      },
      "application/http": {
        source: "iana"
      },
      "application/hyperstudio": {
        source: "iana",
        extensions: ["stk"]
      },
      "application/ibe-key-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pkg-reply+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pp-data": {
        source: "iana"
      },
      "application/iges": {
        source: "iana"
      },
      "application/im-iscomposing+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/index": {
        source: "iana"
      },
      "application/index.cmd": {
        source: "iana"
      },
      "application/index.obj": {
        source: "iana"
      },
      "application/index.response": {
        source: "iana"
      },
      "application/index.vnd": {
        source: "iana"
      },
      "application/inkml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ink", "inkml"]
      },
      "application/iotp": {
        source: "iana"
      },
      "application/ipfix": {
        source: "iana",
        extensions: ["ipfix"]
      },
      "application/ipp": {
        source: "iana"
      },
      "application/isup": {
        source: "iana"
      },
      "application/its+xml": {
        source: "iana",
        compressible: true,
        extensions: ["its"]
      },
      "application/java-archive": {
        source: "apache",
        compressible: false,
        extensions: ["jar", "war", "ear"]
      },
      "application/java-serialized-object": {
        source: "apache",
        compressible: false,
        extensions: ["ser"]
      },
      "application/java-vm": {
        source: "apache",
        compressible: false,
        extensions: ["class"]
      },
      "application/javascript": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js", "mjs"]
      },
      "application/jf2feed+json": {
        source: "iana",
        compressible: true
      },
      "application/jose": {
        source: "iana"
      },
      "application/jose+json": {
        source: "iana",
        compressible: true
      },
      "application/jrd+json": {
        source: "iana",
        compressible: true
      },
      "application/jscalendar+json": {
        source: "iana",
        compressible: true
      },
      "application/json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["json", "map"]
      },
      "application/json-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/json-seq": {
        source: "iana"
      },
      "application/json5": {
        extensions: ["json5"]
      },
      "application/jsonml+json": {
        source: "apache",
        compressible: true,
        extensions: ["jsonml"]
      },
      "application/jwk+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+json": {
        source: "iana",
        compressible: true
      },
      "application/jwt": {
        source: "iana"
      },
      "application/kpml-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/kpml-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/ld+json": {
        source: "iana",
        compressible: true,
        extensions: ["jsonld"]
      },
      "application/lgr+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lgr"]
      },
      "application/link-format": {
        source: "iana"
      },
      "application/load-control+xml": {
        source: "iana",
        compressible: true
      },
      "application/lost+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lostxml"]
      },
      "application/lostsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/lpf+zip": {
        source: "iana",
        compressible: false
      },
      "application/lxf": {
        source: "iana"
      },
      "application/mac-binhex40": {
        source: "iana",
        extensions: ["hqx"]
      },
      "application/mac-compactpro": {
        source: "apache",
        extensions: ["cpt"]
      },
      "application/macwriteii": {
        source: "iana"
      },
      "application/mads+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mads"]
      },
      "application/manifest+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["webmanifest"]
      },
      "application/marc": {
        source: "iana",
        extensions: ["mrc"]
      },
      "application/marcxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mrcx"]
      },
      "application/mathematica": {
        source: "iana",
        extensions: ["ma", "nb", "mb"]
      },
      "application/mathml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mathml"]
      },
      "application/mathml-content+xml": {
        source: "iana",
        compressible: true
      },
      "application/mathml-presentation+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-associated-procedure-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-deregister+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-envelope+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-protection-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-reception-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-user-service-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbox": {
        source: "iana",
        extensions: ["mbox"]
      },
      "application/media-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/media_control+xml": {
        source: "iana",
        compressible: true
      },
      "application/mediaservercontrol+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mscml"]
      },
      "application/merge-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/metalink+xml": {
        source: "apache",
        compressible: true,
        extensions: ["metalink"]
      },
      "application/metalink4+xml": {
        source: "iana",
        compressible: true,
        extensions: ["meta4"]
      },
      "application/mets+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mets"]
      },
      "application/mf4": {
        source: "iana"
      },
      "application/mikey": {
        source: "iana"
      },
      "application/mipc": {
        source: "iana"
      },
      "application/missing-blocks+cbor-seq": {
        source: "iana"
      },
      "application/mmt-aei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["maei"]
      },
      "application/mmt-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musd"]
      },
      "application/mods+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mods"]
      },
      "application/moss-keys": {
        source: "iana"
      },
      "application/moss-signature": {
        source: "iana"
      },
      "application/mosskey-data": {
        source: "iana"
      },
      "application/mosskey-request": {
        source: "iana"
      },
      "application/mp21": {
        source: "iana",
        extensions: ["m21", "mp21"]
      },
      "application/mp4": {
        source: "iana",
        extensions: ["mp4s", "m4p"]
      },
      "application/mpeg4-generic": {
        source: "iana"
      },
      "application/mpeg4-iod": {
        source: "iana"
      },
      "application/mpeg4-iod-xmt": {
        source: "iana"
      },
      "application/mrb-consumer+xml": {
        source: "iana",
        compressible: true
      },
      "application/mrb-publish+xml": {
        source: "iana",
        compressible: true
      },
      "application/msc-ivr+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msc-mixer+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msword": {
        source: "iana",
        compressible: false,
        extensions: ["doc", "dot"]
      },
      "application/mud+json": {
        source: "iana",
        compressible: true
      },
      "application/multipart-core": {
        source: "iana"
      },
      "application/mxf": {
        source: "iana",
        extensions: ["mxf"]
      },
      "application/n-quads": {
        source: "iana",
        extensions: ["nq"]
      },
      "application/n-triples": {
        source: "iana",
        extensions: ["nt"]
      },
      "application/nasdata": {
        source: "iana"
      },
      "application/news-checkgroups": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-groupinfo": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-transmission": {
        source: "iana"
      },
      "application/nlsml+xml": {
        source: "iana",
        compressible: true
      },
      "application/node": {
        source: "iana",
        extensions: ["cjs"]
      },
      "application/nss": {
        source: "iana"
      },
      "application/oauth-authz-req+jwt": {
        source: "iana"
      },
      "application/ocsp-request": {
        source: "iana"
      },
      "application/ocsp-response": {
        source: "iana"
      },
      "application/octet-stream": {
        source: "iana",
        compressible: false,
        extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
      },
      "application/oda": {
        source: "iana",
        extensions: ["oda"]
      },
      "application/odm+xml": {
        source: "iana",
        compressible: true
      },
      "application/odx": {
        source: "iana"
      },
      "application/oebps-package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["opf"]
      },
      "application/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogx"]
      },
      "application/omdoc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["omdoc"]
      },
      "application/onenote": {
        source: "apache",
        extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
      },
      "application/opc-nodeset+xml": {
        source: "iana",
        compressible: true
      },
      "application/oscore": {
        source: "iana"
      },
      "application/oxps": {
        source: "iana",
        extensions: ["oxps"]
      },
      "application/p21": {
        source: "iana"
      },
      "application/p21+zip": {
        source: "iana",
        compressible: false
      },
      "application/p2p-overlay+xml": {
        source: "iana",
        compressible: true,
        extensions: ["relo"]
      },
      "application/parityfec": {
        source: "iana"
      },
      "application/passport": {
        source: "iana"
      },
      "application/patch-ops-error+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xer"]
      },
      "application/pdf": {
        source: "iana",
        compressible: false,
        extensions: ["pdf"]
      },
      "application/pdx": {
        source: "iana"
      },
      "application/pem-certificate-chain": {
        source: "iana"
      },
      "application/pgp-encrypted": {
        source: "iana",
        compressible: false,
        extensions: ["pgp"]
      },
      "application/pgp-keys": {
        source: "iana"
      },
      "application/pgp-signature": {
        source: "iana",
        extensions: ["asc", "sig"]
      },
      "application/pics-rules": {
        source: "apache",
        extensions: ["prf"]
      },
      "application/pidf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pidf-diff+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pkcs10": {
        source: "iana",
        extensions: ["p10"]
      },
      "application/pkcs12": {
        source: "iana"
      },
      "application/pkcs7-mime": {
        source: "iana",
        extensions: ["p7m", "p7c"]
      },
      "application/pkcs7-signature": {
        source: "iana",
        extensions: ["p7s"]
      },
      "application/pkcs8": {
        source: "iana",
        extensions: ["p8"]
      },
      "application/pkcs8-encrypted": {
        source: "iana"
      },
      "application/pkix-attr-cert": {
        source: "iana",
        extensions: ["ac"]
      },
      "application/pkix-cert": {
        source: "iana",
        extensions: ["cer"]
      },
      "application/pkix-crl": {
        source: "iana",
        extensions: ["crl"]
      },
      "application/pkix-pkipath": {
        source: "iana",
        extensions: ["pkipath"]
      },
      "application/pkixcmp": {
        source: "iana",
        extensions: ["pki"]
      },
      "application/pls+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pls"]
      },
      "application/poc-settings+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/postscript": {
        source: "iana",
        compressible: true,
        extensions: ["ai", "eps", "ps"]
      },
      "application/ppsp-tracker+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+xml": {
        source: "iana",
        compressible: true
      },
      "application/provenance+xml": {
        source: "iana",
        compressible: true,
        extensions: ["provx"]
      },
      "application/prs.alvestrand.titrax-sheet": {
        source: "iana"
      },
      "application/prs.cww": {
        source: "iana",
        extensions: ["cww"]
      },
      "application/prs.cyn": {
        source: "iana",
        charset: "7-BIT"
      },
      "application/prs.hpub+zip": {
        source: "iana",
        compressible: false
      },
      "application/prs.nprend": {
        source: "iana"
      },
      "application/prs.plucker": {
        source: "iana"
      },
      "application/prs.rdf-xml-crypt": {
        source: "iana"
      },
      "application/prs.xsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/pskc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pskcxml"]
      },
      "application/pvd+json": {
        source: "iana",
        compressible: true
      },
      "application/qsig": {
        source: "iana"
      },
      "application/raml+yaml": {
        compressible: true,
        extensions: ["raml"]
      },
      "application/raptorfec": {
        source: "iana"
      },
      "application/rdap+json": {
        source: "iana",
        compressible: true
      },
      "application/rdf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rdf", "owl"]
      },
      "application/reginfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rif"]
      },
      "application/relax-ng-compact-syntax": {
        source: "iana",
        extensions: ["rnc"]
      },
      "application/remote-printing": {
        source: "iana"
      },
      "application/reputon+json": {
        source: "iana",
        compressible: true
      },
      "application/resource-lists+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rl"]
      },
      "application/resource-lists-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rld"]
      },
      "application/rfc+xml": {
        source: "iana",
        compressible: true
      },
      "application/riscos": {
        source: "iana"
      },
      "application/rlmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/rls-services+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rs"]
      },
      "application/route-apd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rapd"]
      },
      "application/route-s-tsid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sls"]
      },
      "application/route-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rusd"]
      },
      "application/rpki-ghostbusters": {
        source: "iana",
        extensions: ["gbr"]
      },
      "application/rpki-manifest": {
        source: "iana",
        extensions: ["mft"]
      },
      "application/rpki-publication": {
        source: "iana"
      },
      "application/rpki-roa": {
        source: "iana",
        extensions: ["roa"]
      },
      "application/rpki-updown": {
        source: "iana"
      },
      "application/rsd+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rsd"]
      },
      "application/rss+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rss"]
      },
      "application/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "application/rtploopback": {
        source: "iana"
      },
      "application/rtx": {
        source: "iana"
      },
      "application/samlassertion+xml": {
        source: "iana",
        compressible: true
      },
      "application/samlmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/sarif+json": {
        source: "iana",
        compressible: true
      },
      "application/sarif-external-properties+json": {
        source: "iana",
        compressible: true
      },
      "application/sbe": {
        source: "iana"
      },
      "application/sbml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sbml"]
      },
      "application/scaip+xml": {
        source: "iana",
        compressible: true
      },
      "application/scim+json": {
        source: "iana",
        compressible: true
      },
      "application/scvp-cv-request": {
        source: "iana",
        extensions: ["scq"]
      },
      "application/scvp-cv-response": {
        source: "iana",
        extensions: ["scs"]
      },
      "application/scvp-vp-request": {
        source: "iana",
        extensions: ["spq"]
      },
      "application/scvp-vp-response": {
        source: "iana",
        extensions: ["spp"]
      },
      "application/sdp": {
        source: "iana",
        extensions: ["sdp"]
      },
      "application/secevent+jwt": {
        source: "iana"
      },
      "application/senml+cbor": {
        source: "iana"
      },
      "application/senml+json": {
        source: "iana",
        compressible: true
      },
      "application/senml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["senmlx"]
      },
      "application/senml-etch+cbor": {
        source: "iana"
      },
      "application/senml-etch+json": {
        source: "iana",
        compressible: true
      },
      "application/senml-exi": {
        source: "iana"
      },
      "application/sensml+cbor": {
        source: "iana"
      },
      "application/sensml+json": {
        source: "iana",
        compressible: true
      },
      "application/sensml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sensmlx"]
      },
      "application/sensml-exi": {
        source: "iana"
      },
      "application/sep+xml": {
        source: "iana",
        compressible: true
      },
      "application/sep-exi": {
        source: "iana"
      },
      "application/session-info": {
        source: "iana"
      },
      "application/set-payment": {
        source: "iana"
      },
      "application/set-payment-initiation": {
        source: "iana",
        extensions: ["setpay"]
      },
      "application/set-registration": {
        source: "iana"
      },
      "application/set-registration-initiation": {
        source: "iana",
        extensions: ["setreg"]
      },
      "application/sgml": {
        source: "iana"
      },
      "application/sgml-open-catalog": {
        source: "iana"
      },
      "application/shf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["shf"]
      },
      "application/sieve": {
        source: "iana",
        extensions: ["siv", "sieve"]
      },
      "application/simple-filter+xml": {
        source: "iana",
        compressible: true
      },
      "application/simple-message-summary": {
        source: "iana"
      },
      "application/simplesymbolcontainer": {
        source: "iana"
      },
      "application/sipc": {
        source: "iana"
      },
      "application/slate": {
        source: "iana"
      },
      "application/smil": {
        source: "iana"
      },
      "application/smil+xml": {
        source: "iana",
        compressible: true,
        extensions: ["smi", "smil"]
      },
      "application/smpte336m": {
        source: "iana"
      },
      "application/soap+fastinfoset": {
        source: "iana"
      },
      "application/soap+xml": {
        source: "iana",
        compressible: true
      },
      "application/sparql-query": {
        source: "iana",
        extensions: ["rq"]
      },
      "application/sparql-results+xml": {
        source: "iana",
        compressible: true,
        extensions: ["srx"]
      },
      "application/spirits-event+xml": {
        source: "iana",
        compressible: true
      },
      "application/sql": {
        source: "iana"
      },
      "application/srgs": {
        source: "iana",
        extensions: ["gram"]
      },
      "application/srgs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["grxml"]
      },
      "application/sru+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sru"]
      },
      "application/ssdl+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ssdl"]
      },
      "application/ssml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ssml"]
      },
      "application/stix+json": {
        source: "iana",
        compressible: true
      },
      "application/swid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["swidtag"]
      },
      "application/tamp-apex-update": {
        source: "iana"
      },
      "application/tamp-apex-update-confirm": {
        source: "iana"
      },
      "application/tamp-community-update": {
        source: "iana"
      },
      "application/tamp-community-update-confirm": {
        source: "iana"
      },
      "application/tamp-error": {
        source: "iana"
      },
      "application/tamp-sequence-adjust": {
        source: "iana"
      },
      "application/tamp-sequence-adjust-confirm": {
        source: "iana"
      },
      "application/tamp-status-query": {
        source: "iana"
      },
      "application/tamp-status-response": {
        source: "iana"
      },
      "application/tamp-update": {
        source: "iana"
      },
      "application/tamp-update-confirm": {
        source: "iana"
      },
      "application/tar": {
        compressible: true
      },
      "application/taxii+json": {
        source: "iana",
        compressible: true
      },
      "application/td+json": {
        source: "iana",
        compressible: true
      },
      "application/tei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tei", "teicorpus"]
      },
      "application/tetra_isi": {
        source: "iana"
      },
      "application/thraud+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tfi"]
      },
      "application/timestamp-query": {
        source: "iana"
      },
      "application/timestamp-reply": {
        source: "iana"
      },
      "application/timestamped-data": {
        source: "iana",
        extensions: ["tsd"]
      },
      "application/tlsrpt+gzip": {
        source: "iana"
      },
      "application/tlsrpt+json": {
        source: "iana",
        compressible: true
      },
      "application/tnauthlist": {
        source: "iana"
      },
      "application/token-introspection+jwt": {
        source: "iana"
      },
      "application/toml": {
        compressible: true,
        extensions: ["toml"]
      },
      "application/trickle-ice-sdpfrag": {
        source: "iana"
      },
      "application/trig": {
        source: "iana",
        extensions: ["trig"]
      },
      "application/ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ttml"]
      },
      "application/tve-trigger": {
        source: "iana"
      },
      "application/tzif": {
        source: "iana"
      },
      "application/tzif-leap": {
        source: "iana"
      },
      "application/ubjson": {
        compressible: false,
        extensions: ["ubj"]
      },
      "application/ulpfec": {
        source: "iana"
      },
      "application/urc-grpsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/urc-ressheet+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsheet"]
      },
      "application/urc-targetdesc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["td"]
      },
      "application/urc-uisocketdesc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vcard+json": {
        source: "iana",
        compressible: true
      },
      "application/vcard+xml": {
        source: "iana",
        compressible: true
      },
      "application/vemmi": {
        source: "iana"
      },
      "application/vividence.scriptfile": {
        source: "apache"
      },
      "application/vnd.1000minds.decision-model+xml": {
        source: "iana",
        compressible: true,
        extensions: ["1km"]
      },
      "application/vnd.3gpp-prose+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ch+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-v2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gnas": {
        source: "iana"
      },
      "application/vnd.3gpp.access-transfer-events+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.bsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gmop+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gtpc": {
        source: "iana"
      },
      "application/vnd.3gpp.interworking-data": {
        source: "iana"
      },
      "application/vnd.3gpp.lpp": {
        source: "iana"
      },
      "application/vnd.3gpp.mc-signalling-ear": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-payload": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-signalling": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-floor-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-signed+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mid-call+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ngap": {
        source: "iana"
      },
      "application/vnd.3gpp.pfcp": {
        source: "iana"
      },
      "application/vnd.3gpp.pic-bw-large": {
        source: "iana",
        extensions: ["plb"]
      },
      "application/vnd.3gpp.pic-bw-small": {
        source: "iana",
        extensions: ["psb"]
      },
      "application/vnd.3gpp.pic-bw-var": {
        source: "iana",
        extensions: ["pvb"]
      },
      "application/vnd.3gpp.s1ap": {
        source: "iana"
      },
      "application/vnd.3gpp.sms": {
        source: "iana"
      },
      "application/vnd.3gpp.sms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-ext+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.state-and-event-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ussd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.bcmcsinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.sms": {
        source: "iana"
      },
      "application/vnd.3gpp2.tcap": {
        source: "iana",
        extensions: ["tcap"]
      },
      "application/vnd.3lightssoftware.imagescal": {
        source: "iana"
      },
      "application/vnd.3m.post-it-notes": {
        source: "iana",
        extensions: ["pwn"]
      },
      "application/vnd.accpac.simply.aso": {
        source: "iana",
        extensions: ["aso"]
      },
      "application/vnd.accpac.simply.imp": {
        source: "iana",
        extensions: ["imp"]
      },
      "application/vnd.acucobol": {
        source: "iana",
        extensions: ["acu"]
      },
      "application/vnd.acucorp": {
        source: "iana",
        extensions: ["atc", "acutc"]
      },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: "apache",
        compressible: false,
        extensions: ["air"]
      },
      "application/vnd.adobe.flash.movie": {
        source: "iana"
      },
      "application/vnd.adobe.formscentral.fcdt": {
        source: "iana",
        extensions: ["fcdt"]
      },
      "application/vnd.adobe.fxp": {
        source: "iana",
        extensions: ["fxp", "fxpl"]
      },
      "application/vnd.adobe.partial-upload": {
        source: "iana"
      },
      "application/vnd.adobe.xdp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdp"]
      },
      "application/vnd.adobe.xfdf": {
        source: "iana",
        extensions: ["xfdf"]
      },
      "application/vnd.aether.imp": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata-pagedef": {
        source: "iana"
      },
      "application/vnd.afpc.cmoca-cmresource": {
        source: "iana"
      },
      "application/vnd.afpc.foca-charset": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codedfont": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codepage": {
        source: "iana"
      },
      "application/vnd.afpc.modca": {
        source: "iana"
      },
      "application/vnd.afpc.modca-cmtable": {
        source: "iana"
      },
      "application/vnd.afpc.modca-formdef": {
        source: "iana"
      },
      "application/vnd.afpc.modca-mediummap": {
        source: "iana"
      },
      "application/vnd.afpc.modca-objectcontainer": {
        source: "iana"
      },
      "application/vnd.afpc.modca-overlay": {
        source: "iana"
      },
      "application/vnd.afpc.modca-pagesegment": {
        source: "iana"
      },
      "application/vnd.ah-barcode": {
        source: "iana"
      },
      "application/vnd.ahead.space": {
        source: "iana",
        extensions: ["ahead"]
      },
      "application/vnd.airzip.filesecure.azf": {
        source: "iana",
        extensions: ["azf"]
      },
      "application/vnd.airzip.filesecure.azs": {
        source: "iana",
        extensions: ["azs"]
      },
      "application/vnd.amadeus+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.amazon.ebook": {
        source: "apache",
        extensions: ["azw"]
      },
      "application/vnd.amazon.mobi8-ebook": {
        source: "iana"
      },
      "application/vnd.americandynamics.acc": {
        source: "iana",
        extensions: ["acc"]
      },
      "application/vnd.amiga.ami": {
        source: "iana",
        extensions: ["ami"]
      },
      "application/vnd.amundsen.maze+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.android.ota": {
        source: "iana"
      },
      "application/vnd.android.package-archive": {
        source: "apache",
        compressible: false,
        extensions: ["apk"]
      },
      "application/vnd.anki": {
        source: "iana"
      },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: "iana",
        extensions: ["cii"]
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: "apache",
        extensions: ["fti"]
      },
      "application/vnd.antix.game-component": {
        source: "iana",
        extensions: ["atx"]
      },
      "application/vnd.apache.arrow.file": {
        source: "iana"
      },
      "application/vnd.apache.arrow.stream": {
        source: "iana"
      },
      "application/vnd.apache.thrift.binary": {
        source: "iana"
      },
      "application/vnd.apache.thrift.compact": {
        source: "iana"
      },
      "application/vnd.apache.thrift.json": {
        source: "iana"
      },
      "application/vnd.api+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.aplextor.warrp+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apothekende.reservation+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apple.installer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpkg"]
      },
      "application/vnd.apple.keynote": {
        source: "iana",
        extensions: ["key"]
      },
      "application/vnd.apple.mpegurl": {
        source: "iana",
        extensions: ["m3u8"]
      },
      "application/vnd.apple.numbers": {
        source: "iana",
        extensions: ["numbers"]
      },
      "application/vnd.apple.pages": {
        source: "iana",
        extensions: ["pages"]
      },
      "application/vnd.apple.pkpass": {
        compressible: false,
        extensions: ["pkpass"]
      },
      "application/vnd.arastra.swi": {
        source: "iana"
      },
      "application/vnd.aristanetworks.swi": {
        source: "iana",
        extensions: ["swi"]
      },
      "application/vnd.artisan+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.artsquare": {
        source: "iana"
      },
      "application/vnd.astraea-software.iota": {
        source: "iana",
        extensions: ["iota"]
      },
      "application/vnd.audiograph": {
        source: "iana",
        extensions: ["aep"]
      },
      "application/vnd.autopackage": {
        source: "iana"
      },
      "application/vnd.avalon+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.avistar+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.balsamiq.bmml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bmml"]
      },
      "application/vnd.balsamiq.bmpr": {
        source: "iana"
      },
      "application/vnd.banana-accounting": {
        source: "iana"
      },
      "application/vnd.bbf.usp.error": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bekitzur-stech+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bint.med-content": {
        source: "iana"
      },
      "application/vnd.biopax.rdf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.blink-idb-value-wrapper": {
        source: "iana"
      },
      "application/vnd.blueice.multipass": {
        source: "iana",
        extensions: ["mpm"]
      },
      "application/vnd.bluetooth.ep.oob": {
        source: "iana"
      },
      "application/vnd.bluetooth.le.oob": {
        source: "iana"
      },
      "application/vnd.bmi": {
        source: "iana",
        extensions: ["bmi"]
      },
      "application/vnd.bpf": {
        source: "iana"
      },
      "application/vnd.bpf3": {
        source: "iana"
      },
      "application/vnd.businessobjects": {
        source: "iana",
        extensions: ["rep"]
      },
      "application/vnd.byu.uapi+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cab-jscript": {
        source: "iana"
      },
      "application/vnd.canon-cpdl": {
        source: "iana"
      },
      "application/vnd.canon-lips": {
        source: "iana"
      },
      "application/vnd.capasystems-pg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cendio.thinlinc.clientconf": {
        source: "iana"
      },
      "application/vnd.century-systems.tcp_stream": {
        source: "iana"
      },
      "application/vnd.chemdraw+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdxml"]
      },
      "application/vnd.chess-pgn": {
        source: "iana"
      },
      "application/vnd.chipnuts.karaoke-mmd": {
        source: "iana",
        extensions: ["mmd"]
      },
      "application/vnd.ciedi": {
        source: "iana"
      },
      "application/vnd.cinderella": {
        source: "iana",
        extensions: ["cdy"]
      },
      "application/vnd.cirpack.isdn-ext": {
        source: "iana"
      },
      "application/vnd.citationstyles.style+xml": {
        source: "iana",
        compressible: true,
        extensions: ["csl"]
      },
      "application/vnd.claymore": {
        source: "iana",
        extensions: ["cla"]
      },
      "application/vnd.cloanto.rp9": {
        source: "iana",
        extensions: ["rp9"]
      },
      "application/vnd.clonk.c4group": {
        source: "iana",
        extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
      },
      "application/vnd.cluetrust.cartomobile-config": {
        source: "iana",
        extensions: ["c11amc"]
      },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: "iana",
        extensions: ["c11amz"]
      },
      "application/vnd.coffeescript": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet-template": {
        source: "iana"
      },
      "application/vnd.collection+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.doc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.next+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.comicbook+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.comicbook-rar": {
        source: "iana"
      },
      "application/vnd.commerce-battelle": {
        source: "iana"
      },
      "application/vnd.commonspace": {
        source: "iana",
        extensions: ["csp"]
      },
      "application/vnd.contact.cmsg": {
        source: "iana",
        extensions: ["cdbcmsg"]
      },
      "application/vnd.coreos.ignition+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cosmocaller": {
        source: "iana",
        extensions: ["cmc"]
      },
      "application/vnd.crick.clicker": {
        source: "iana",
        extensions: ["clkx"]
      },
      "application/vnd.crick.clicker.keyboard": {
        source: "iana",
        extensions: ["clkk"]
      },
      "application/vnd.crick.clicker.palette": {
        source: "iana",
        extensions: ["clkp"]
      },
      "application/vnd.crick.clicker.template": {
        source: "iana",
        extensions: ["clkt"]
      },
      "application/vnd.crick.clicker.wordbank": {
        source: "iana",
        extensions: ["clkw"]
      },
      "application/vnd.criticaltools.wbs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wbs"]
      },
      "application/vnd.cryptii.pipe+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.crypto-shade-file": {
        source: "iana"
      },
      "application/vnd.cryptomator.encrypted": {
        source: "iana"
      },
      "application/vnd.cryptomator.vault": {
        source: "iana"
      },
      "application/vnd.ctc-posml": {
        source: "iana",
        extensions: ["pml"]
      },
      "application/vnd.ctct.ws+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cups-pdf": {
        source: "iana"
      },
      "application/vnd.cups-postscript": {
        source: "iana"
      },
      "application/vnd.cups-ppd": {
        source: "iana",
        extensions: ["ppd"]
      },
      "application/vnd.cups-raster": {
        source: "iana"
      },
      "application/vnd.cups-raw": {
        source: "iana"
      },
      "application/vnd.curl": {
        source: "iana"
      },
      "application/vnd.curl.car": {
        source: "apache",
        extensions: ["car"]
      },
      "application/vnd.curl.pcurl": {
        source: "apache",
        extensions: ["pcurl"]
      },
      "application/vnd.cyan.dean.root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cybank": {
        source: "iana"
      },
      "application/vnd.cyclonedx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cyclonedx+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.d2l.coursepackage1p0+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.d3m-dataset": {
        source: "iana"
      },
      "application/vnd.d3m-problem": {
        source: "iana"
      },
      "application/vnd.dart": {
        source: "iana",
        compressible: true,
        extensions: ["dart"]
      },
      "application/vnd.data-vision.rdz": {
        source: "iana",
        extensions: ["rdz"]
      },
      "application/vnd.datapackage+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dataresource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dbf": {
        source: "iana",
        extensions: ["dbf"]
      },
      "application/vnd.debian.binary-package": {
        source: "iana"
      },
      "application/vnd.dece.data": {
        source: "iana",
        extensions: ["uvf", "uvvf", "uvd", "uvvd"]
      },
      "application/vnd.dece.ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uvt", "uvvt"]
      },
      "application/vnd.dece.unspecified": {
        source: "iana",
        extensions: ["uvx", "uvvx"]
      },
      "application/vnd.dece.zip": {
        source: "iana",
        extensions: ["uvz", "uvvz"]
      },
      "application/vnd.denovo.fcselayout-link": {
        source: "iana",
        extensions: ["fe_launch"]
      },
      "application/vnd.desmume.movie": {
        source: "iana"
      },
      "application/vnd.dir-bi.plate-dl-nosuffix": {
        source: "iana"
      },
      "application/vnd.dm.delegation+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dna": {
        source: "iana",
        extensions: ["dna"]
      },
      "application/vnd.document+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dolby.mlp": {
        source: "apache",
        extensions: ["mlp"]
      },
      "application/vnd.dolby.mobile.1": {
        source: "iana"
      },
      "application/vnd.dolby.mobile.2": {
        source: "iana"
      },
      "application/vnd.doremir.scorecloud-binary-document": {
        source: "iana"
      },
      "application/vnd.dpgraph": {
        source: "iana",
        extensions: ["dpg"]
      },
      "application/vnd.dreamfactory": {
        source: "iana",
        extensions: ["dfac"]
      },
      "application/vnd.drive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ds-keypoint": {
        source: "apache",
        extensions: ["kpxx"]
      },
      "application/vnd.dtg.local": {
        source: "iana"
      },
      "application/vnd.dtg.local.flash": {
        source: "iana"
      },
      "application/vnd.dtg.local.html": {
        source: "iana"
      },
      "application/vnd.dvb.ait": {
        source: "iana",
        extensions: ["ait"]
      },
      "application/vnd.dvb.dvbisl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.dvbj": {
        source: "iana"
      },
      "application/vnd.dvb.esgcontainer": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcdftnotifaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess2": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgpdd": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcroaming": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-base": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-enhancement": {
        source: "iana"
      },
      "application/vnd.dvb.notif-aggregate-root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-container+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-generic+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-msglist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-init+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.pfr": {
        source: "iana"
      },
      "application/vnd.dvb.service": {
        source: "iana",
        extensions: ["svc"]
      },
      "application/vnd.dxr": {
        source: "iana"
      },
      "application/vnd.dynageo": {
        source: "iana",
        extensions: ["geo"]
      },
      "application/vnd.dzr": {
        source: "iana"
      },
      "application/vnd.easykaraoke.cdgdownload": {
        source: "iana"
      },
      "application/vnd.ecdis-update": {
        source: "iana"
      },
      "application/vnd.ecip.rlp": {
        source: "iana"
      },
      "application/vnd.ecowin.chart": {
        source: "iana",
        extensions: ["mag"]
      },
      "application/vnd.ecowin.filerequest": {
        source: "iana"
      },
      "application/vnd.ecowin.fileupdate": {
        source: "iana"
      },
      "application/vnd.ecowin.series": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesrequest": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesupdate": {
        source: "iana"
      },
      "application/vnd.efi.img": {
        source: "iana"
      },
      "application/vnd.efi.iso": {
        source: "iana"
      },
      "application/vnd.emclient.accessrequest+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.enliven": {
        source: "iana",
        extensions: ["nml"]
      },
      "application/vnd.enphase.envoy": {
        source: "iana"
      },
      "application/vnd.eprints.data+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.epson.esf": {
        source: "iana",
        extensions: ["esf"]
      },
      "application/vnd.epson.msf": {
        source: "iana",
        extensions: ["msf"]
      },
      "application/vnd.epson.quickanime": {
        source: "iana",
        extensions: ["qam"]
      },
      "application/vnd.epson.salt": {
        source: "iana",
        extensions: ["slt"]
      },
      "application/vnd.epson.ssf": {
        source: "iana",
        extensions: ["ssf"]
      },
      "application/vnd.ericsson.quickcall": {
        source: "iana"
      },
      "application/vnd.espass-espass+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.eszigno3+xml": {
        source: "iana",
        compressible: true,
        extensions: ["es3", "et3"]
      },
      "application/vnd.etsi.aoc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.asic-e+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.asic-s+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.cug+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvcommand+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-bc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-cod+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-npvr+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvservice+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mcid+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mheg5": {
        source: "iana"
      },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.pstn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.sci+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.simservs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.timestamp-token": {
        source: "iana"
      },
      "application/vnd.etsi.tsl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.tsl.der": {
        source: "iana"
      },
      "application/vnd.eudora.data": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.profile": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.settings": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.theme": {
        source: "iana"
      },
      "application/vnd.exstream-empower+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.exstream-package": {
        source: "iana"
      },
      "application/vnd.ezpix-album": {
        source: "iana",
        extensions: ["ez2"]
      },
      "application/vnd.ezpix-package": {
        source: "iana",
        extensions: ["ez3"]
      },
      "application/vnd.f-secure.mobile": {
        source: "iana"
      },
      "application/vnd.fastcopy-disk-image": {
        source: "iana"
      },
      "application/vnd.fdf": {
        source: "iana",
        extensions: ["fdf"]
      },
      "application/vnd.fdsn.mseed": {
        source: "iana",
        extensions: ["mseed"]
      },
      "application/vnd.fdsn.seed": {
        source: "iana",
        extensions: ["seed", "dataless"]
      },
      "application/vnd.ffsns": {
        source: "iana"
      },
      "application/vnd.ficlab.flb+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.filmit.zfc": {
        source: "iana"
      },
      "application/vnd.fints": {
        source: "iana"
      },
      "application/vnd.firemonkeys.cloudcell": {
        source: "iana"
      },
      "application/vnd.flographit": {
        source: "iana",
        extensions: ["gph"]
      },
      "application/vnd.fluxtime.clip": {
        source: "iana",
        extensions: ["ftc"]
      },
      "application/vnd.font-fontforge-sfd": {
        source: "iana"
      },
      "application/vnd.framemaker": {
        source: "iana",
        extensions: ["fm", "frame", "maker", "book"]
      },
      "application/vnd.frogans.fnc": {
        source: "iana",
        extensions: ["fnc"]
      },
      "application/vnd.frogans.ltf": {
        source: "iana",
        extensions: ["ltf"]
      },
      "application/vnd.fsc.weblaunch": {
        source: "iana",
        extensions: ["fsc"]
      },
      "application/vnd.fujifilm.fb.docuworks": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.binder": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.jfi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fujitsu.oasys": {
        source: "iana",
        extensions: ["oas"]
      },
      "application/vnd.fujitsu.oasys2": {
        source: "iana",
        extensions: ["oa2"]
      },
      "application/vnd.fujitsu.oasys3": {
        source: "iana",
        extensions: ["oa3"]
      },
      "application/vnd.fujitsu.oasysgp": {
        source: "iana",
        extensions: ["fg5"]
      },
      "application/vnd.fujitsu.oasysprs": {
        source: "iana",
        extensions: ["bh2"]
      },
      "application/vnd.fujixerox.art-ex": {
        source: "iana"
      },
      "application/vnd.fujixerox.art4": {
        source: "iana"
      },
      "application/vnd.fujixerox.ddd": {
        source: "iana",
        extensions: ["ddd"]
      },
      "application/vnd.fujixerox.docuworks": {
        source: "iana",
        extensions: ["xdw"]
      },
      "application/vnd.fujixerox.docuworks.binder": {
        source: "iana",
        extensions: ["xbd"]
      },
      "application/vnd.fujixerox.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujixerox.hbpl": {
        source: "iana"
      },
      "application/vnd.fut-misnet": {
        source: "iana"
      },
      "application/vnd.futoin+cbor": {
        source: "iana"
      },
      "application/vnd.futoin+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fuzzysheet": {
        source: "iana",
        extensions: ["fzs"]
      },
      "application/vnd.genomatix.tuxedo": {
        source: "iana",
        extensions: ["txd"]
      },
      "application/vnd.gentics.grd+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geo+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geocube+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geogebra.file": {
        source: "iana",
        extensions: ["ggb"]
      },
      "application/vnd.geogebra.slides": {
        source: "iana"
      },
      "application/vnd.geogebra.tool": {
        source: "iana",
        extensions: ["ggt"]
      },
      "application/vnd.geometry-explorer": {
        source: "iana",
        extensions: ["gex", "gre"]
      },
      "application/vnd.geonext": {
        source: "iana",
        extensions: ["gxt"]
      },
      "application/vnd.geoplan": {
        source: "iana",
        extensions: ["g2w"]
      },
      "application/vnd.geospace": {
        source: "iana",
        extensions: ["g3w"]
      },
      "application/vnd.gerber": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt-response": {
        source: "iana"
      },
      "application/vnd.gmx": {
        source: "iana",
        extensions: ["gmx"]
      },
      "application/vnd.google-apps.document": {
        compressible: false,
        extensions: ["gdoc"]
      },
      "application/vnd.google-apps.presentation": {
        compressible: false,
        extensions: ["gslides"]
      },
      "application/vnd.google-apps.spreadsheet": {
        compressible: false,
        extensions: ["gsheet"]
      },
      "application/vnd.google-earth.kml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["kml"]
      },
      "application/vnd.google-earth.kmz": {
        source: "iana",
        compressible: false,
        extensions: ["kmz"]
      },
      "application/vnd.gov.sk.e-form+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gov.sk.e-form+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.gov.sk.xmldatacontainer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.grafeq": {
        source: "iana",
        extensions: ["gqf", "gqs"]
      },
      "application/vnd.gridmp": {
        source: "iana"
      },
      "application/vnd.groove-account": {
        source: "iana",
        extensions: ["gac"]
      },
      "application/vnd.groove-help": {
        source: "iana",
        extensions: ["ghf"]
      },
      "application/vnd.groove-identity-message": {
        source: "iana",
        extensions: ["gim"]
      },
      "application/vnd.groove-injector": {
        source: "iana",
        extensions: ["grv"]
      },
      "application/vnd.groove-tool-message": {
        source: "iana",
        extensions: ["gtm"]
      },
      "application/vnd.groove-tool-template": {
        source: "iana",
        extensions: ["tpl"]
      },
      "application/vnd.groove-vcard": {
        source: "iana",
        extensions: ["vcg"]
      },
      "application/vnd.hal+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hal+xml": {
        source: "iana",
        compressible: true,
        extensions: ["hal"]
      },
      "application/vnd.handheld-entertainment+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zmm"]
      },
      "application/vnd.hbci": {
        source: "iana",
        extensions: ["hbci"]
      },
      "application/vnd.hc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hcl-bireports": {
        source: "iana"
      },
      "application/vnd.hdt": {
        source: "iana"
      },
      "application/vnd.heroku+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hhe.lesson-player": {
        source: "iana",
        extensions: ["les"]
      },
      "application/vnd.hp-hpgl": {
        source: "iana",
        extensions: ["hpgl"]
      },
      "application/vnd.hp-hpid": {
        source: "iana",
        extensions: ["hpid"]
      },
      "application/vnd.hp-hps": {
        source: "iana",
        extensions: ["hps"]
      },
      "application/vnd.hp-jlyt": {
        source: "iana",
        extensions: ["jlt"]
      },
      "application/vnd.hp-pcl": {
        source: "iana",
        extensions: ["pcl"]
      },
      "application/vnd.hp-pclxl": {
        source: "iana",
        extensions: ["pclxl"]
      },
      "application/vnd.httphone": {
        source: "iana"
      },
      "application/vnd.hydrostatix.sof-data": {
        source: "iana",
        extensions: ["sfd-hdstx"]
      },
      "application/vnd.hyper+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyper-item+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyperdrive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hzn-3d-crossword": {
        source: "iana"
      },
      "application/vnd.ibm.afplinedata": {
        source: "iana"
      },
      "application/vnd.ibm.electronic-media": {
        source: "iana"
      },
      "application/vnd.ibm.minipay": {
        source: "iana",
        extensions: ["mpy"]
      },
      "application/vnd.ibm.modcap": {
        source: "iana",
        extensions: ["afp", "listafp", "list3820"]
      },
      "application/vnd.ibm.rights-management": {
        source: "iana",
        extensions: ["irm"]
      },
      "application/vnd.ibm.secure-container": {
        source: "iana",
        extensions: ["sc"]
      },
      "application/vnd.iccprofile": {
        source: "iana",
        extensions: ["icc", "icm"]
      },
      "application/vnd.ieee.1905": {
        source: "iana"
      },
      "application/vnd.igloader": {
        source: "iana",
        extensions: ["igl"]
      },
      "application/vnd.imagemeter.folder+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.imagemeter.image+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.immervision-ivp": {
        source: "iana",
        extensions: ["ivp"]
      },
      "application/vnd.immervision-ivu": {
        source: "iana",
        extensions: ["ivu"]
      },
      "application/vnd.ims.imsccv1p1": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p2": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p3": {
        source: "iana"
      },
      "application/vnd.ims.lis.v2.result+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy.id+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informedcontrol.rms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informix-visionary": {
        source: "iana"
      },
      "application/vnd.infotech.project": {
        source: "iana"
      },
      "application/vnd.infotech.project+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.innopath.wamp.notification": {
        source: "iana"
      },
      "application/vnd.insors.igm": {
        source: "iana",
        extensions: ["igm"]
      },
      "application/vnd.intercon.formnet": {
        source: "iana",
        extensions: ["xpw", "xpx"]
      },
      "application/vnd.intergeo": {
        source: "iana",
        extensions: ["i2g"]
      },
      "application/vnd.intertrust.digibox": {
        source: "iana"
      },
      "application/vnd.intertrust.nncp": {
        source: "iana"
      },
      "application/vnd.intu.qbo": {
        source: "iana",
        extensions: ["qbo"]
      },
      "application/vnd.intu.qfx": {
        source: "iana",
        extensions: ["qfx"]
      },
      "application/vnd.iptc.g2.catalogitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.conceptitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.knowledgeitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.packageitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.planningitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ipunplugged.rcprofile": {
        source: "iana",
        extensions: ["rcprofile"]
      },
      "application/vnd.irepository.package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["irp"]
      },
      "application/vnd.is-xpr": {
        source: "iana",
        extensions: ["xpr"]
      },
      "application/vnd.isac.fcs": {
        source: "iana",
        extensions: ["fcs"]
      },
      "application/vnd.iso11783-10+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.jam": {
        source: "iana",
        extensions: ["jam"]
      },
      "application/vnd.japannet-directory-service": {
        source: "iana"
      },
      "application/vnd.japannet-jpnstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-payment-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-registration": {
        source: "iana"
      },
      "application/vnd.japannet-registration-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-setstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-verification": {
        source: "iana"
      },
      "application/vnd.japannet-verification-wakeup": {
        source: "iana"
      },
      "application/vnd.jcp.javame.midlet-rms": {
        source: "iana",
        extensions: ["rms"]
      },
      "application/vnd.jisp": {
        source: "iana",
        extensions: ["jisp"]
      },
      "application/vnd.joost.joda-archive": {
        source: "iana",
        extensions: ["joda"]
      },
      "application/vnd.jsk.isdn-ngn": {
        source: "iana"
      },
      "application/vnd.kahootz": {
        source: "iana",
        extensions: ["ktz", "ktr"]
      },
      "application/vnd.kde.karbon": {
        source: "iana",
        extensions: ["karbon"]
      },
      "application/vnd.kde.kchart": {
        source: "iana",
        extensions: ["chrt"]
      },
      "application/vnd.kde.kformula": {
        source: "iana",
        extensions: ["kfo"]
      },
      "application/vnd.kde.kivio": {
        source: "iana",
        extensions: ["flw"]
      },
      "application/vnd.kde.kontour": {
        source: "iana",
        extensions: ["kon"]
      },
      "application/vnd.kde.kpresenter": {
        source: "iana",
        extensions: ["kpr", "kpt"]
      },
      "application/vnd.kde.kspread": {
        source: "iana",
        extensions: ["ksp"]
      },
      "application/vnd.kde.kword": {
        source: "iana",
        extensions: ["kwd", "kwt"]
      },
      "application/vnd.kenameaapp": {
        source: "iana",
        extensions: ["htke"]
      },
      "application/vnd.kidspiration": {
        source: "iana",
        extensions: ["kia"]
      },
      "application/vnd.kinar": {
        source: "iana",
        extensions: ["kne", "knp"]
      },
      "application/vnd.koan": {
        source: "iana",
        extensions: ["skp", "skd", "skt", "skm"]
      },
      "application/vnd.kodak-descriptor": {
        source: "iana",
        extensions: ["sse"]
      },
      "application/vnd.las": {
        source: "iana"
      },
      "application/vnd.las.las+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.las.las+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lasxml"]
      },
      "application/vnd.laszip": {
        source: "iana"
      },
      "application/vnd.leap+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.liberty-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.llamagraphics.life-balance.desktop": {
        source: "iana",
        extensions: ["lbd"]
      },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lbe"]
      },
      "application/vnd.logipipe.circuit+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.loom": {
        source: "iana"
      },
      "application/vnd.lotus-1-2-3": {
        source: "iana",
        extensions: ["123"]
      },
      "application/vnd.lotus-approach": {
        source: "iana",
        extensions: ["apr"]
      },
      "application/vnd.lotus-freelance": {
        source: "iana",
        extensions: ["pre"]
      },
      "application/vnd.lotus-notes": {
        source: "iana",
        extensions: ["nsf"]
      },
      "application/vnd.lotus-organizer": {
        source: "iana",
        extensions: ["org"]
      },
      "application/vnd.lotus-screencam": {
        source: "iana",
        extensions: ["scm"]
      },
      "application/vnd.lotus-wordpro": {
        source: "iana",
        extensions: ["lwp"]
      },
      "application/vnd.macports.portpkg": {
        source: "iana",
        extensions: ["portpkg"]
      },
      "application/vnd.mapbox-vector-tile": {
        source: "iana",
        extensions: ["mvt"]
      },
      "application/vnd.marlin.drm.actiontoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.conftoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.license+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.mdcf": {
        source: "iana"
      },
      "application/vnd.mason+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.maxmind.maxmind-db": {
        source: "iana"
      },
      "application/vnd.mcd": {
        source: "iana",
        extensions: ["mcd"]
      },
      "application/vnd.medcalcdata": {
        source: "iana",
        extensions: ["mc1"]
      },
      "application/vnd.mediastation.cdkey": {
        source: "iana",
        extensions: ["cdkey"]
      },
      "application/vnd.meridian-slingshot": {
        source: "iana"
      },
      "application/vnd.mfer": {
        source: "iana",
        extensions: ["mwf"]
      },
      "application/vnd.mfmp": {
        source: "iana",
        extensions: ["mfm"]
      },
      "application/vnd.micro+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.micrografx.flo": {
        source: "iana",
        extensions: ["flo"]
      },
      "application/vnd.micrografx.igx": {
        source: "iana",
        extensions: ["igx"]
      },
      "application/vnd.microsoft.portable-executable": {
        source: "iana"
      },
      "application/vnd.microsoft.windows.thumbnail-cache": {
        source: "iana"
      },
      "application/vnd.miele+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.mif": {
        source: "iana",
        extensions: ["mif"]
      },
      "application/vnd.minisoft-hp3000-save": {
        source: "iana"
      },
      "application/vnd.mitsubishi.misty-guard.trustweb": {
        source: "iana"
      },
      "application/vnd.mobius.daf": {
        source: "iana",
        extensions: ["daf"]
      },
      "application/vnd.mobius.dis": {
        source: "iana",
        extensions: ["dis"]
      },
      "application/vnd.mobius.mbk": {
        source: "iana",
        extensions: ["mbk"]
      },
      "application/vnd.mobius.mqy": {
        source: "iana",
        extensions: ["mqy"]
      },
      "application/vnd.mobius.msl": {
        source: "iana",
        extensions: ["msl"]
      },
      "application/vnd.mobius.plc": {
        source: "iana",
        extensions: ["plc"]
      },
      "application/vnd.mobius.txf": {
        source: "iana",
        extensions: ["txf"]
      },
      "application/vnd.mophun.application": {
        source: "iana",
        extensions: ["mpn"]
      },
      "application/vnd.mophun.certificate": {
        source: "iana",
        extensions: ["mpc"]
      },
      "application/vnd.motorola.flexsuite": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.adsi": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.fis": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.gotap": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.kmr": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.ttc": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.wem": {
        source: "iana"
      },
      "application/vnd.motorola.iprm": {
        source: "iana"
      },
      "application/vnd.mozilla.xul+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xul"]
      },
      "application/vnd.ms-3mfdocument": {
        source: "iana"
      },
      "application/vnd.ms-artgalry": {
        source: "iana",
        extensions: ["cil"]
      },
      "application/vnd.ms-asf": {
        source: "iana"
      },
      "application/vnd.ms-cab-compressed": {
        source: "iana",
        extensions: ["cab"]
      },
      "application/vnd.ms-color.iccprofile": {
        source: "apache"
      },
      "application/vnd.ms-excel": {
        source: "iana",
        compressible: false,
        extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
      },
      "application/vnd.ms-excel.addin.macroenabled.12": {
        source: "iana",
        extensions: ["xlam"]
      },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: "iana",
        extensions: ["xlsb"]
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": {
        source: "iana",
        extensions: ["xlsm"]
      },
      "application/vnd.ms-excel.template.macroenabled.12": {
        source: "iana",
        extensions: ["xltm"]
      },
      "application/vnd.ms-fontobject": {
        source: "iana",
        compressible: true,
        extensions: ["eot"]
      },
      "application/vnd.ms-htmlhelp": {
        source: "iana",
        extensions: ["chm"]
      },
      "application/vnd.ms-ims": {
        source: "iana",
        extensions: ["ims"]
      },
      "application/vnd.ms-lrm": {
        source: "iana",
        extensions: ["lrm"]
      },
      "application/vnd.ms-office.activex+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-officetheme": {
        source: "iana",
        extensions: ["thmx"]
      },
      "application/vnd.ms-opentype": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-outlook": {
        compressible: false,
        extensions: ["msg"]
      },
      "application/vnd.ms-package.obfuscated-opentype": {
        source: "apache"
      },
      "application/vnd.ms-pki.seccat": {
        source: "apache",
        extensions: ["cat"]
      },
      "application/vnd.ms-pki.stl": {
        source: "apache",
        extensions: ["stl"]
      },
      "application/vnd.ms-playready.initiator+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-powerpoint": {
        source: "iana",
        compressible: false,
        extensions: ["ppt", "pps", "pot"]
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: "iana",
        extensions: ["ppam"]
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: "iana",
        extensions: ["pptm"]
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: "iana",
        extensions: ["sldm"]
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: "iana",
        extensions: ["ppsm"]
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: "iana",
        extensions: ["potm"]
      },
      "application/vnd.ms-printdevicecapabilities+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-printing.printticket+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-printschematicket+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-project": {
        source: "iana",
        extensions: ["mpp", "mpt"]
      },
      "application/vnd.ms-tnef": {
        source: "iana"
      },
      "application/vnd.ms-windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.nwprinting.oob": {
        source: "iana"
      },
      "application/vnd.ms-windows.printerpairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.wsd.oob": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-resp": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-resp": {
        source: "iana"
      },
      "application/vnd.ms-word.document.macroenabled.12": {
        source: "iana",
        extensions: ["docm"]
      },
      "application/vnd.ms-word.template.macroenabled.12": {
        source: "iana",
        extensions: ["dotm"]
      },
      "application/vnd.ms-works": {
        source: "iana",
        extensions: ["wps", "wks", "wcm", "wdb"]
      },
      "application/vnd.ms-wpl": {
        source: "iana",
        extensions: ["wpl"]
      },
      "application/vnd.ms-xpsdocument": {
        source: "iana",
        compressible: false,
        extensions: ["xps"]
      },
      "application/vnd.msa-disk-image": {
        source: "iana"
      },
      "application/vnd.mseq": {
        source: "iana",
        extensions: ["mseq"]
      },
      "application/vnd.msign": {
        source: "iana"
      },
      "application/vnd.multiad.creator": {
        source: "iana"
      },
      "application/vnd.multiad.creator.cif": {
        source: "iana"
      },
      "application/vnd.music-niff": {
        source: "iana"
      },
      "application/vnd.musician": {
        source: "iana",
        extensions: ["mus"]
      },
      "application/vnd.muvee.style": {
        source: "iana",
        extensions: ["msty"]
      },
      "application/vnd.mynfc": {
        source: "iana",
        extensions: ["taglet"]
      },
      "application/vnd.ncd.control": {
        source: "iana"
      },
      "application/vnd.ncd.reference": {
        source: "iana"
      },
      "application/vnd.nearst.inv+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nebumind.line": {
        source: "iana"
      },
      "application/vnd.nervana": {
        source: "iana"
      },
      "application/vnd.netfpx": {
        source: "iana"
      },
      "application/vnd.neurolanguage.nlu": {
        source: "iana",
        extensions: ["nlu"]
      },
      "application/vnd.nimn": {
        source: "iana"
      },
      "application/vnd.nintendo.nitro.rom": {
        source: "iana"
      },
      "application/vnd.nintendo.snes.rom": {
        source: "iana"
      },
      "application/vnd.nitf": {
        source: "iana",
        extensions: ["ntf", "nitf"]
      },
      "application/vnd.noblenet-directory": {
        source: "iana",
        extensions: ["nnd"]
      },
      "application/vnd.noblenet-sealer": {
        source: "iana",
        extensions: ["nns"]
      },
      "application/vnd.noblenet-web": {
        source: "iana",
        extensions: ["nnw"]
      },
      "application/vnd.nokia.catalogs": {
        source: "iana"
      },
      "application/vnd.nokia.conml+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.conml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.iptv.config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.isds-radio-presets": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.landmarkcollection+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ac"]
      },
      "application/vnd.nokia.n-gage.data": {
        source: "iana",
        extensions: ["ngdat"]
      },
      "application/vnd.nokia.n-gage.symbian.install": {
        source: "iana",
        extensions: ["n-gage"]
      },
      "application/vnd.nokia.ncd": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.radio-preset": {
        source: "iana",
        extensions: ["rpst"]
      },
      "application/vnd.nokia.radio-presets": {
        source: "iana",
        extensions: ["rpss"]
      },
      "application/vnd.novadigm.edm": {
        source: "iana",
        extensions: ["edm"]
      },
      "application/vnd.novadigm.edx": {
        source: "iana",
        extensions: ["edx"]
      },
      "application/vnd.novadigm.ext": {
        source: "iana",
        extensions: ["ext"]
      },
      "application/vnd.ntt-local.content-share": {
        source: "iana"
      },
      "application/vnd.ntt-local.file-transfer": {
        source: "iana"
      },
      "application/vnd.ntt-local.ogw_remote-access": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_remote": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_tcp_stream": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.chart": {
        source: "iana",
        extensions: ["odc"]
      },
      "application/vnd.oasis.opendocument.chart-template": {
        source: "iana",
        extensions: ["otc"]
      },
      "application/vnd.oasis.opendocument.database": {
        source: "iana",
        extensions: ["odb"]
      },
      "application/vnd.oasis.opendocument.formula": {
        source: "iana",
        extensions: ["odf"]
      },
      "application/vnd.oasis.opendocument.formula-template": {
        source: "iana",
        extensions: ["odft"]
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: "iana",
        compressible: false,
        extensions: ["odg"]
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: "iana",
        extensions: ["otg"]
      },
      "application/vnd.oasis.opendocument.image": {
        source: "iana",
        extensions: ["odi"]
      },
      "application/vnd.oasis.opendocument.image-template": {
        source: "iana",
        extensions: ["oti"]
      },
      "application/vnd.oasis.opendocument.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["odp"]
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: "iana",
        extensions: ["otp"]
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: "iana",
        compressible: false,
        extensions: ["ods"]
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: "iana",
        extensions: ["ots"]
      },
      "application/vnd.oasis.opendocument.text": {
        source: "iana",
        compressible: false,
        extensions: ["odt"]
      },
      "application/vnd.oasis.opendocument.text-master": {
        source: "iana",
        extensions: ["odm"]
      },
      "application/vnd.oasis.opendocument.text-template": {
        source: "iana",
        extensions: ["ott"]
      },
      "application/vnd.oasis.opendocument.text-web": {
        source: "iana",
        extensions: ["oth"]
      },
      "application/vnd.obn": {
        source: "iana"
      },
      "application/vnd.ocf+cbor": {
        source: "iana"
      },
      "application/vnd.oci.image.manifest.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oftn.l10n+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessdownload+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessstreaming+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.cspg-hexbinary": {
        source: "iana"
      },
      "application/vnd.oipf.dae.svg+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.dae.xhtml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.mippvcontrolmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.pae.gem": {
        source: "iana"
      },
      "application/vnd.oipf.spdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.spdlist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.ueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.userprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.olpc-sugar": {
        source: "iana",
        extensions: ["xo"]
      },
      "application/vnd.oma-scws-config": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-request": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-response": {
        source: "iana"
      },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.drm-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.imd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.ltkm": {
        source: "iana"
      },
      "application/vnd.oma.bcast.notification+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.provisioningtrigger": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgboot": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgdd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sgdu": {
        source: "iana"
      },
      "application/vnd.oma.bcast.simple-symbol-container": {
        source: "iana"
      },
      "application/vnd.oma.bcast.smartcard-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sprov+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.stkm": {
        source: "iana"
      },
      "application/vnd.oma.cab-address-book+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-feature-handler+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-pcc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-subs-invite+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-user-prefs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.dcd": {
        source: "iana"
      },
      "application/vnd.oma.dcdc": {
        source: "iana"
      },
      "application/vnd.oma.dd2+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dd2"]
      },
      "application/vnd.oma.drm.risd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.group-usage-list+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+cbor": {
        source: "iana"
      },
      "application/vnd.oma.lwm2m+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+tlv": {
        source: "iana"
      },
      "application/vnd.oma.pal+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.detailed-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.final-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.groups+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.invocation-descriptor+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.optimized-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.push": {
        source: "iana"
      },
      "application/vnd.oma.scidm.messages+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.xcap-directory+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.omads-email+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-file+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-folder+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omaloc-supl-init": {
        source: "iana"
      },
      "application/vnd.onepager": {
        source: "iana"
      },
      "application/vnd.onepagertamp": {
        source: "iana"
      },
      "application/vnd.onepagertamx": {
        source: "iana"
      },
      "application/vnd.onepagertat": {
        source: "iana"
      },
      "application/vnd.onepagertatp": {
        source: "iana"
      },
      "application/vnd.onepagertatx": {
        source: "iana"
      },
      "application/vnd.openblox.game+xml": {
        source: "iana",
        compressible: true,
        extensions: ["obgx"]
      },
      "application/vnd.openblox.game-binary": {
        source: "iana"
      },
      "application/vnd.openeye.oeb": {
        source: "iana"
      },
      "application/vnd.openofficeorg.extension": {
        source: "apache",
        extensions: ["oxt"]
      },
      "application/vnd.openstreetmap.data+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osm"]
      },
      "application/vnd.opentimestamps.ots": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["pptx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: "iana",
        extensions: ["sldx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: "iana",
        extensions: ["ppsx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: "iana",
        extensions: ["potx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: "iana",
        compressible: false,
        extensions: ["xlsx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: "iana",
        extensions: ["xltx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: "iana",
        compressible: false,
        extensions: ["docx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: "iana",
        extensions: ["dotx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oracle.resource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.orange.indata": {
        source: "iana"
      },
      "application/vnd.osa.netdeploy": {
        source: "iana"
      },
      "application/vnd.osgeo.mapguide.package": {
        source: "iana",
        extensions: ["mgp"]
      },
      "application/vnd.osgi.bundle": {
        source: "iana"
      },
      "application/vnd.osgi.dp": {
        source: "iana",
        extensions: ["dp"]
      },
      "application/vnd.osgi.subsystem": {
        source: "iana",
        extensions: ["esa"]
      },
      "application/vnd.otps.ct-kip+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oxli.countgraph": {
        source: "iana"
      },
      "application/vnd.pagerduty+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.palm": {
        source: "iana",
        extensions: ["pdb", "pqa", "oprc"]
      },
      "application/vnd.panoply": {
        source: "iana"
      },
      "application/vnd.paos.xml": {
        source: "iana"
      },
      "application/vnd.patentdive": {
        source: "iana"
      },
      "application/vnd.patientecommsdoc": {
        source: "iana"
      },
      "application/vnd.pawaafile": {
        source: "iana",
        extensions: ["paw"]
      },
      "application/vnd.pcos": {
        source: "iana"
      },
      "application/vnd.pg.format": {
        source: "iana",
        extensions: ["str"]
      },
      "application/vnd.pg.osasli": {
        source: "iana",
        extensions: ["ei6"]
      },
      "application/vnd.piaccess.application-licence": {
        source: "iana"
      },
      "application/vnd.picsel": {
        source: "iana",
        extensions: ["efif"]
      },
      "application/vnd.pmi.widget": {
        source: "iana",
        extensions: ["wg"]
      },
      "application/vnd.poc.group-advertisement+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.pocketlearn": {
        source: "iana",
        extensions: ["plf"]
      },
      "application/vnd.powerbuilder6": {
        source: "iana",
        extensions: ["pbd"]
      },
      "application/vnd.powerbuilder6-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder7": {
        source: "iana"
      },
      "application/vnd.powerbuilder7-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder75": {
        source: "iana"
      },
      "application/vnd.powerbuilder75-s": {
        source: "iana"
      },
      "application/vnd.preminet": {
        source: "iana"
      },
      "application/vnd.previewsystems.box": {
        source: "iana",
        extensions: ["box"]
      },
      "application/vnd.proteus.magazine": {
        source: "iana",
        extensions: ["mgz"]
      },
      "application/vnd.psfs": {
        source: "iana"
      },
      "application/vnd.publishare-delta-tree": {
        source: "iana",
        extensions: ["qps"]
      },
      "application/vnd.pvi.ptid1": {
        source: "iana",
        extensions: ["ptid"]
      },
      "application/vnd.pwg-multiplexed": {
        source: "iana"
      },
      "application/vnd.pwg-xhtml-print+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.qualcomm.brew-app-res": {
        source: "iana"
      },
      "application/vnd.quarantainenet": {
        source: "iana"
      },
      "application/vnd.quark.quarkxpress": {
        source: "iana",
        extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
      },
      "application/vnd.quobject-quoxdocument": {
        source: "iana"
      },
      "application/vnd.radisys.moml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-stream+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-base+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-group+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-speech+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-transform+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rainstor.data": {
        source: "iana"
      },
      "application/vnd.rapid": {
        source: "iana"
      },
      "application/vnd.rar": {
        source: "iana",
        extensions: ["rar"]
      },
      "application/vnd.realvnc.bed": {
        source: "iana",
        extensions: ["bed"]
      },
      "application/vnd.recordare.musicxml": {
        source: "iana",
        extensions: ["mxl"]
      },
      "application/vnd.recordare.musicxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musicxml"]
      },
      "application/vnd.renlearn.rlprint": {
        source: "iana"
      },
      "application/vnd.resilient.logic": {
        source: "iana"
      },
      "application/vnd.restful+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rig.cryptonote": {
        source: "iana",
        extensions: ["cryptonote"]
      },
      "application/vnd.rim.cod": {
        source: "apache",
        extensions: ["cod"]
      },
      "application/vnd.rn-realmedia": {
        source: "apache",
        extensions: ["rm"]
      },
      "application/vnd.rn-realmedia-vbr": {
        source: "apache",
        extensions: ["rmvb"]
      },
      "application/vnd.route66.link66+xml": {
        source: "iana",
        compressible: true,
        extensions: ["link66"]
      },
      "application/vnd.rs-274x": {
        source: "iana"
      },
      "application/vnd.ruckus.download": {
        source: "iana"
      },
      "application/vnd.s3sms": {
        source: "iana"
      },
      "application/vnd.sailingtracker.track": {
        source: "iana",
        extensions: ["st"]
      },
      "application/vnd.sar": {
        source: "iana"
      },
      "application/vnd.sbm.cid": {
        source: "iana"
      },
      "application/vnd.sbm.mid2": {
        source: "iana"
      },
      "application/vnd.scribus": {
        source: "iana"
      },
      "application/vnd.sealed.3df": {
        source: "iana"
      },
      "application/vnd.sealed.csf": {
        source: "iana"
      },
      "application/vnd.sealed.doc": {
        source: "iana"
      },
      "application/vnd.sealed.eml": {
        source: "iana"
      },
      "application/vnd.sealed.mht": {
        source: "iana"
      },
      "application/vnd.sealed.net": {
        source: "iana"
      },
      "application/vnd.sealed.ppt": {
        source: "iana"
      },
      "application/vnd.sealed.tiff": {
        source: "iana"
      },
      "application/vnd.sealed.xls": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.html": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.pdf": {
        source: "iana"
      },
      "application/vnd.seemail": {
        source: "iana",
        extensions: ["see"]
      },
      "application/vnd.seis+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sema": {
        source: "iana",
        extensions: ["sema"]
      },
      "application/vnd.semd": {
        source: "iana",
        extensions: ["semd"]
      },
      "application/vnd.semf": {
        source: "iana",
        extensions: ["semf"]
      },
      "application/vnd.shade-save-file": {
        source: "iana"
      },
      "application/vnd.shana.informed.formdata": {
        source: "iana",
        extensions: ["ifm"]
      },
      "application/vnd.shana.informed.formtemplate": {
        source: "iana",
        extensions: ["itp"]
      },
      "application/vnd.shana.informed.interchange": {
        source: "iana",
        extensions: ["iif"]
      },
      "application/vnd.shana.informed.package": {
        source: "iana",
        extensions: ["ipk"]
      },
      "application/vnd.shootproof+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shopkick+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shp": {
        source: "iana"
      },
      "application/vnd.shx": {
        source: "iana"
      },
      "application/vnd.sigrok.session": {
        source: "iana"
      },
      "application/vnd.simtech-mindmapper": {
        source: "iana",
        extensions: ["twd", "twds"]
      },
      "application/vnd.siren+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.smaf": {
        source: "iana",
        extensions: ["mmf"]
      },
      "application/vnd.smart.notebook": {
        source: "iana"
      },
      "application/vnd.smart.teacher": {
        source: "iana",
        extensions: ["teacher"]
      },
      "application/vnd.snesdev-page-table": {
        source: "iana"
      },
      "application/vnd.software602.filler.form+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fo"]
      },
      "application/vnd.software602.filler.form-xml-zip": {
        source: "iana"
      },
      "application/vnd.solent.sdkm+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sdkm", "sdkd"]
      },
      "application/vnd.spotfire.dxp": {
        source: "iana",
        extensions: ["dxp"]
      },
      "application/vnd.spotfire.sfs": {
        source: "iana",
        extensions: ["sfs"]
      },
      "application/vnd.sqlite3": {
        source: "iana"
      },
      "application/vnd.sss-cod": {
        source: "iana"
      },
      "application/vnd.sss-dtf": {
        source: "iana"
      },
      "application/vnd.sss-ntf": {
        source: "iana"
      },
      "application/vnd.stardivision.calc": {
        source: "apache",
        extensions: ["sdc"]
      },
      "application/vnd.stardivision.draw": {
        source: "apache",
        extensions: ["sda"]
      },
      "application/vnd.stardivision.impress": {
        source: "apache",
        extensions: ["sdd"]
      },
      "application/vnd.stardivision.math": {
        source: "apache",
        extensions: ["smf"]
      },
      "application/vnd.stardivision.writer": {
        source: "apache",
        extensions: ["sdw", "vor"]
      },
      "application/vnd.stardivision.writer-global": {
        source: "apache",
        extensions: ["sgl"]
      },
      "application/vnd.stepmania.package": {
        source: "iana",
        extensions: ["smzip"]
      },
      "application/vnd.stepmania.stepchart": {
        source: "iana",
        extensions: ["sm"]
      },
      "application/vnd.street-stream": {
        source: "iana"
      },
      "application/vnd.sun.wadl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wadl"]
      },
      "application/vnd.sun.xml.calc": {
        source: "apache",
        extensions: ["sxc"]
      },
      "application/vnd.sun.xml.calc.template": {
        source: "apache",
        extensions: ["stc"]
      },
      "application/vnd.sun.xml.draw": {
        source: "apache",
        extensions: ["sxd"]
      },
      "application/vnd.sun.xml.draw.template": {
        source: "apache",
        extensions: ["std"]
      },
      "application/vnd.sun.xml.impress": {
        source: "apache",
        extensions: ["sxi"]
      },
      "application/vnd.sun.xml.impress.template": {
        source: "apache",
        extensions: ["sti"]
      },
      "application/vnd.sun.xml.math": {
        source: "apache",
        extensions: ["sxm"]
      },
      "application/vnd.sun.xml.writer": {
        source: "apache",
        extensions: ["sxw"]
      },
      "application/vnd.sun.xml.writer.global": {
        source: "apache",
        extensions: ["sxg"]
      },
      "application/vnd.sun.xml.writer.template": {
        source: "apache",
        extensions: ["stw"]
      },
      "application/vnd.sus-calendar": {
        source: "iana",
        extensions: ["sus", "susp"]
      },
      "application/vnd.svd": {
        source: "iana",
        extensions: ["svd"]
      },
      "application/vnd.swiftview-ics": {
        source: "iana"
      },
      "application/vnd.sycle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.symbian.install": {
        source: "apache",
        extensions: ["sis", "sisx"]
      },
      "application/vnd.syncml+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xsm"]
      },
      "application/vnd.syncml.dm+wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["bdm"]
      },
      "application/vnd.syncml.dm+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xdm"]
      },
      "application/vnd.syncml.dm.notification": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["ddf"]
      },
      "application/vnd.syncml.dmtnds+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmtnds+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.syncml.ds.notification": {
        source: "iana"
      },
      "application/vnd.tableschema+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tao.intent-module-archive": {
        source: "iana",
        extensions: ["tao"]
      },
      "application/vnd.tcpdump.pcap": {
        source: "iana",
        extensions: ["pcap", "cap", "dmp"]
      },
      "application/vnd.think-cell.ppttc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tmd.mediaflex.api+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tml": {
        source: "iana"
      },
      "application/vnd.tmobile-livetv": {
        source: "iana",
        extensions: ["tmo"]
      },
      "application/vnd.tri.onesource": {
        source: "iana"
      },
      "application/vnd.trid.tpt": {
        source: "iana",
        extensions: ["tpt"]
      },
      "application/vnd.triscape.mxs": {
        source: "iana",
        extensions: ["mxs"]
      },
      "application/vnd.trueapp": {
        source: "iana",
        extensions: ["tra"]
      },
      "application/vnd.truedoc": {
        source: "iana"
      },
      "application/vnd.ubisoft.webplayer": {
        source: "iana"
      },
      "application/vnd.ufdl": {
        source: "iana",
        extensions: ["ufd", "ufdl"]
      },
      "application/vnd.uiq.theme": {
        source: "iana",
        extensions: ["utz"]
      },
      "application/vnd.umajin": {
        source: "iana",
        extensions: ["umj"]
      },
      "application/vnd.unity": {
        source: "iana",
        extensions: ["unityweb"]
      },
      "application/vnd.uoml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uoml"]
      },
      "application/vnd.uplanet.alert": {
        source: "iana"
      },
      "application/vnd.uplanet.alert-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.channel": {
        source: "iana"
      },
      "application/vnd.uplanet.channel-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.list": {
        source: "iana"
      },
      "application/vnd.uplanet.list-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.signal": {
        source: "iana"
      },
      "application/vnd.uri-map": {
        source: "iana"
      },
      "application/vnd.valve.source.material": {
        source: "iana"
      },
      "application/vnd.vcx": {
        source: "iana",
        extensions: ["vcx"]
      },
      "application/vnd.vd-study": {
        source: "iana"
      },
      "application/vnd.vectorworks": {
        source: "iana"
      },
      "application/vnd.vel+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.verimatrix.vcas": {
        source: "iana"
      },
      "application/vnd.veritone.aion+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veryant.thin": {
        source: "iana"
      },
      "application/vnd.ves.encrypted": {
        source: "iana"
      },
      "application/vnd.vidsoft.vidconference": {
        source: "iana"
      },
      "application/vnd.visio": {
        source: "iana",
        extensions: ["vsd", "vst", "vss", "vsw"]
      },
      "application/vnd.visionary": {
        source: "iana",
        extensions: ["vis"]
      },
      "application/vnd.vividence.scriptfile": {
        source: "iana"
      },
      "application/vnd.vsf": {
        source: "iana",
        extensions: ["vsf"]
      },
      "application/vnd.wap.sic": {
        source: "iana"
      },
      "application/vnd.wap.slc": {
        source: "iana"
      },
      "application/vnd.wap.wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["wbxml"]
      },
      "application/vnd.wap.wmlc": {
        source: "iana",
        extensions: ["wmlc"]
      },
      "application/vnd.wap.wmlscriptc": {
        source: "iana",
        extensions: ["wmlsc"]
      },
      "application/vnd.webturbo": {
        source: "iana",
        extensions: ["wtb"]
      },
      "application/vnd.wfa.dpp": {
        source: "iana"
      },
      "application/vnd.wfa.p2p": {
        source: "iana"
      },
      "application/vnd.wfa.wsc": {
        source: "iana"
      },
      "application/vnd.windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.wmc": {
        source: "iana"
      },
      "application/vnd.wmf.bootstrap": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica.package": {
        source: "iana"
      },
      "application/vnd.wolfram.player": {
        source: "iana",
        extensions: ["nbp"]
      },
      "application/vnd.wordperfect": {
        source: "iana",
        extensions: ["wpd"]
      },
      "application/vnd.wqd": {
        source: "iana",
        extensions: ["wqd"]
      },
      "application/vnd.wrq-hp3000-labelled": {
        source: "iana"
      },
      "application/vnd.wt.stf": {
        source: "iana",
        extensions: ["stf"]
      },
      "application/vnd.wv.csp+wbxml": {
        source: "iana"
      },
      "application/vnd.wv.csp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.wv.ssp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xacml+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xara": {
        source: "iana",
        extensions: ["xar"]
      },
      "application/vnd.xfdl": {
        source: "iana",
        extensions: ["xfdl"]
      },
      "application/vnd.xfdl.webform": {
        source: "iana"
      },
      "application/vnd.xmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xmpie.cpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.dpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.plan": {
        source: "iana"
      },
      "application/vnd.xmpie.ppkg": {
        source: "iana"
      },
      "application/vnd.xmpie.xlim": {
        source: "iana"
      },
      "application/vnd.yamaha.hv-dic": {
        source: "iana",
        extensions: ["hvd"]
      },
      "application/vnd.yamaha.hv-script": {
        source: "iana",
        extensions: ["hvs"]
      },
      "application/vnd.yamaha.hv-voice": {
        source: "iana",
        extensions: ["hvp"]
      },
      "application/vnd.yamaha.openscoreformat": {
        source: "iana",
        extensions: ["osf"]
      },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osfpvg"]
      },
      "application/vnd.yamaha.remote-setup": {
        source: "iana"
      },
      "application/vnd.yamaha.smaf-audio": {
        source: "iana",
        extensions: ["saf"]
      },
      "application/vnd.yamaha.smaf-phrase": {
        source: "iana",
        extensions: ["spf"]
      },
      "application/vnd.yamaha.through-ngn": {
        source: "iana"
      },
      "application/vnd.yamaha.tunnel-udpencap": {
        source: "iana"
      },
      "application/vnd.yaoweme": {
        source: "iana"
      },
      "application/vnd.yellowriver-custom-menu": {
        source: "iana",
        extensions: ["cmp"]
      },
      "application/vnd.youtube.yt": {
        source: "iana"
      },
      "application/vnd.zul": {
        source: "iana",
        extensions: ["zir", "zirz"]
      },
      "application/vnd.zzazz.deck+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zaz"]
      },
      "application/voicexml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["vxml"]
      },
      "application/voucher-cms+json": {
        source: "iana",
        compressible: true
      },
      "application/vq-rtcpxr": {
        source: "iana"
      },
      "application/wasm": {
        source: "iana",
        compressible: true,
        extensions: ["wasm"]
      },
      "application/watcherinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/webpush-options+json": {
        source: "iana",
        compressible: true
      },
      "application/whoispp-query": {
        source: "iana"
      },
      "application/whoispp-response": {
        source: "iana"
      },
      "application/widget": {
        source: "iana",
        extensions: ["wgt"]
      },
      "application/winhlp": {
        source: "apache",
        extensions: ["hlp"]
      },
      "application/wita": {
        source: "iana"
      },
      "application/wordperfect5.1": {
        source: "iana"
      },
      "application/wsdl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wsdl"]
      },
      "application/wspolicy+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wspolicy"]
      },
      "application/x-7z-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["7z"]
      },
      "application/x-abiword": {
        source: "apache",
        extensions: ["abw"]
      },
      "application/x-ace-compressed": {
        source: "apache",
        extensions: ["ace"]
      },
      "application/x-amf": {
        source: "apache"
      },
      "application/x-apple-diskimage": {
        source: "apache",
        extensions: ["dmg"]
      },
      "application/x-arj": {
        compressible: false,
        extensions: ["arj"]
      },
      "application/x-authorware-bin": {
        source: "apache",
        extensions: ["aab", "x32", "u32", "vox"]
      },
      "application/x-authorware-map": {
        source: "apache",
        extensions: ["aam"]
      },
      "application/x-authorware-seg": {
        source: "apache",
        extensions: ["aas"]
      },
      "application/x-bcpio": {
        source: "apache",
        extensions: ["bcpio"]
      },
      "application/x-bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/x-bittorrent": {
        source: "apache",
        extensions: ["torrent"]
      },
      "application/x-blorb": {
        source: "apache",
        extensions: ["blb", "blorb"]
      },
      "application/x-bzip": {
        source: "apache",
        compressible: false,
        extensions: ["bz"]
      },
      "application/x-bzip2": {
        source: "apache",
        compressible: false,
        extensions: ["bz2", "boz"]
      },
      "application/x-cbr": {
        source: "apache",
        extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
      },
      "application/x-cdlink": {
        source: "apache",
        extensions: ["vcd"]
      },
      "application/x-cfs-compressed": {
        source: "apache",
        extensions: ["cfs"]
      },
      "application/x-chat": {
        source: "apache",
        extensions: ["chat"]
      },
      "application/x-chess-pgn": {
        source: "apache",
        extensions: ["pgn"]
      },
      "application/x-chrome-extension": {
        extensions: ["crx"]
      },
      "application/x-cocoa": {
        source: "nginx",
        extensions: ["cco"]
      },
      "application/x-compress": {
        source: "apache"
      },
      "application/x-conference": {
        source: "apache",
        extensions: ["nsc"]
      },
      "application/x-cpio": {
        source: "apache",
        extensions: ["cpio"]
      },
      "application/x-csh": {
        source: "apache",
        extensions: ["csh"]
      },
      "application/x-deb": {
        compressible: false
      },
      "application/x-debian-package": {
        source: "apache",
        extensions: ["deb", "udeb"]
      },
      "application/x-dgc-compressed": {
        source: "apache",
        extensions: ["dgc"]
      },
      "application/x-director": {
        source: "apache",
        extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
      },
      "application/x-doom": {
        source: "apache",
        extensions: ["wad"]
      },
      "application/x-dtbncx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ncx"]
      },
      "application/x-dtbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dtb"]
      },
      "application/x-dtbresource+xml": {
        source: "apache",
        compressible: true,
        extensions: ["res"]
      },
      "application/x-dvi": {
        source: "apache",
        compressible: false,
        extensions: ["dvi"]
      },
      "application/x-envoy": {
        source: "apache",
        extensions: ["evy"]
      },
      "application/x-eva": {
        source: "apache",
        extensions: ["eva"]
      },
      "application/x-font-bdf": {
        source: "apache",
        extensions: ["bdf"]
      },
      "application/x-font-dos": {
        source: "apache"
      },
      "application/x-font-framemaker": {
        source: "apache"
      },
      "application/x-font-ghostscript": {
        source: "apache",
        extensions: ["gsf"]
      },
      "application/x-font-libgrx": {
        source: "apache"
      },
      "application/x-font-linux-psf": {
        source: "apache",
        extensions: ["psf"]
      },
      "application/x-font-pcf": {
        source: "apache",
        extensions: ["pcf"]
      },
      "application/x-font-snf": {
        source: "apache",
        extensions: ["snf"]
      },
      "application/x-font-speedo": {
        source: "apache"
      },
      "application/x-font-sunos-news": {
        source: "apache"
      },
      "application/x-font-type1": {
        source: "apache",
        extensions: ["pfa", "pfb", "pfm", "afm"]
      },
      "application/x-font-vfont": {
        source: "apache"
      },
      "application/x-freearc": {
        source: "apache",
        extensions: ["arc"]
      },
      "application/x-futuresplash": {
        source: "apache",
        extensions: ["spl"]
      },
      "application/x-gca-compressed": {
        source: "apache",
        extensions: ["gca"]
      },
      "application/x-glulx": {
        source: "apache",
        extensions: ["ulx"]
      },
      "application/x-gnumeric": {
        source: "apache",
        extensions: ["gnumeric"]
      },
      "application/x-gramps-xml": {
        source: "apache",
        extensions: ["gramps"]
      },
      "application/x-gtar": {
        source: "apache",
        extensions: ["gtar"]
      },
      "application/x-gzip": {
        source: "apache"
      },
      "application/x-hdf": {
        source: "apache",
        extensions: ["hdf"]
      },
      "application/x-httpd-php": {
        compressible: true,
        extensions: ["php"]
      },
      "application/x-install-instructions": {
        source: "apache",
        extensions: ["install"]
      },
      "application/x-iso9660-image": {
        source: "apache",
        extensions: ["iso"]
      },
      "application/x-iwork-keynote-sffkey": {
        extensions: ["key"]
      },
      "application/x-iwork-numbers-sffnumbers": {
        extensions: ["numbers"]
      },
      "application/x-iwork-pages-sffpages": {
        extensions: ["pages"]
      },
      "application/x-java-archive-diff": {
        source: "nginx",
        extensions: ["jardiff"]
      },
      "application/x-java-jnlp-file": {
        source: "apache",
        compressible: false,
        extensions: ["jnlp"]
      },
      "application/x-javascript": {
        compressible: true
      },
      "application/x-keepass2": {
        extensions: ["kdbx"]
      },
      "application/x-latex": {
        source: "apache",
        compressible: false,
        extensions: ["latex"]
      },
      "application/x-lua-bytecode": {
        extensions: ["luac"]
      },
      "application/x-lzh-compressed": {
        source: "apache",
        extensions: ["lzh", "lha"]
      },
      "application/x-makeself": {
        source: "nginx",
        extensions: ["run"]
      },
      "application/x-mie": {
        source: "apache",
        extensions: ["mie"]
      },
      "application/x-mobipocket-ebook": {
        source: "apache",
        extensions: ["prc", "mobi"]
      },
      "application/x-mpegurl": {
        compressible: false
      },
      "application/x-ms-application": {
        source: "apache",
        extensions: ["application"]
      },
      "application/x-ms-shortcut": {
        source: "apache",
        extensions: ["lnk"]
      },
      "application/x-ms-wmd": {
        source: "apache",
        extensions: ["wmd"]
      },
      "application/x-ms-wmz": {
        source: "apache",
        extensions: ["wmz"]
      },
      "application/x-ms-xbap": {
        source: "apache",
        extensions: ["xbap"]
      },
      "application/x-msaccess": {
        source: "apache",
        extensions: ["mdb"]
      },
      "application/x-msbinder": {
        source: "apache",
        extensions: ["obd"]
      },
      "application/x-mscardfile": {
        source: "apache",
        extensions: ["crd"]
      },
      "application/x-msclip": {
        source: "apache",
        extensions: ["clp"]
      },
      "application/x-msdos-program": {
        extensions: ["exe"]
      },
      "application/x-msdownload": {
        source: "apache",
        extensions: ["exe", "dll", "com", "bat", "msi"]
      },
      "application/x-msmediaview": {
        source: "apache",
        extensions: ["mvb", "m13", "m14"]
      },
      "application/x-msmetafile": {
        source: "apache",
        extensions: ["wmf", "wmz", "emf", "emz"]
      },
      "application/x-msmoney": {
        source: "apache",
        extensions: ["mny"]
      },
      "application/x-mspublisher": {
        source: "apache",
        extensions: ["pub"]
      },
      "application/x-msschedule": {
        source: "apache",
        extensions: ["scd"]
      },
      "application/x-msterminal": {
        source: "apache",
        extensions: ["trm"]
      },
      "application/x-mswrite": {
        source: "apache",
        extensions: ["wri"]
      },
      "application/x-netcdf": {
        source: "apache",
        extensions: ["nc", "cdf"]
      },
      "application/x-ns-proxy-autoconfig": {
        compressible: true,
        extensions: ["pac"]
      },
      "application/x-nzb": {
        source: "apache",
        extensions: ["nzb"]
      },
      "application/x-perl": {
        source: "nginx",
        extensions: ["pl", "pm"]
      },
      "application/x-pilot": {
        source: "nginx",
        extensions: ["prc", "pdb"]
      },
      "application/x-pkcs12": {
        source: "apache",
        compressible: false,
        extensions: ["p12", "pfx"]
      },
      "application/x-pkcs7-certificates": {
        source: "apache",
        extensions: ["p7b", "spc"]
      },
      "application/x-pkcs7-certreqresp": {
        source: "apache",
        extensions: ["p7r"]
      },
      "application/x-pki-message": {
        source: "iana"
      },
      "application/x-rar-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["rar"]
      },
      "application/x-redhat-package-manager": {
        source: "nginx",
        extensions: ["rpm"]
      },
      "application/x-research-info-systems": {
        source: "apache",
        extensions: ["ris"]
      },
      "application/x-sea": {
        source: "nginx",
        extensions: ["sea"]
      },
      "application/x-sh": {
        source: "apache",
        compressible: true,
        extensions: ["sh"]
      },
      "application/x-shar": {
        source: "apache",
        extensions: ["shar"]
      },
      "application/x-shockwave-flash": {
        source: "apache",
        compressible: false,
        extensions: ["swf"]
      },
      "application/x-silverlight-app": {
        source: "apache",
        extensions: ["xap"]
      },
      "application/x-sql": {
        source: "apache",
        extensions: ["sql"]
      },
      "application/x-stuffit": {
        source: "apache",
        compressible: false,
        extensions: ["sit"]
      },
      "application/x-stuffitx": {
        source: "apache",
        extensions: ["sitx"]
      },
      "application/x-subrip": {
        source: "apache",
        extensions: ["srt"]
      },
      "application/x-sv4cpio": {
        source: "apache",
        extensions: ["sv4cpio"]
      },
      "application/x-sv4crc": {
        source: "apache",
        extensions: ["sv4crc"]
      },
      "application/x-t3vm-image": {
        source: "apache",
        extensions: ["t3"]
      },
      "application/x-tads": {
        source: "apache",
        extensions: ["gam"]
      },
      "application/x-tar": {
        source: "apache",
        compressible: true,
        extensions: ["tar"]
      },
      "application/x-tcl": {
        source: "apache",
        extensions: ["tcl", "tk"]
      },
      "application/x-tex": {
        source: "apache",
        extensions: ["tex"]
      },
      "application/x-tex-tfm": {
        source: "apache",
        extensions: ["tfm"]
      },
      "application/x-texinfo": {
        source: "apache",
        extensions: ["texinfo", "texi"]
      },
      "application/x-tgif": {
        source: "apache",
        extensions: ["obj"]
      },
      "application/x-ustar": {
        source: "apache",
        extensions: ["ustar"]
      },
      "application/x-virtualbox-hdd": {
        compressible: true,
        extensions: ["hdd"]
      },
      "application/x-virtualbox-ova": {
        compressible: true,
        extensions: ["ova"]
      },
      "application/x-virtualbox-ovf": {
        compressible: true,
        extensions: ["ovf"]
      },
      "application/x-virtualbox-vbox": {
        compressible: true,
        extensions: ["vbox"]
      },
      "application/x-virtualbox-vbox-extpack": {
        compressible: false,
        extensions: ["vbox-extpack"]
      },
      "application/x-virtualbox-vdi": {
        compressible: true,
        extensions: ["vdi"]
      },
      "application/x-virtualbox-vhd": {
        compressible: true,
        extensions: ["vhd"]
      },
      "application/x-virtualbox-vmdk": {
        compressible: true,
        extensions: ["vmdk"]
      },
      "application/x-wais-source": {
        source: "apache",
        extensions: ["src"]
      },
      "application/x-web-app-manifest+json": {
        compressible: true,
        extensions: ["webapp"]
      },
      "application/x-www-form-urlencoded": {
        source: "iana",
        compressible: true
      },
      "application/x-x509-ca-cert": {
        source: "iana",
        extensions: ["der", "crt", "pem"]
      },
      "application/x-x509-ca-ra-cert": {
        source: "iana"
      },
      "application/x-x509-next-ca-cert": {
        source: "iana"
      },
      "application/x-xfig": {
        source: "apache",
        extensions: ["fig"]
      },
      "application/x-xliff+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/x-xpinstall": {
        source: "apache",
        compressible: false,
        extensions: ["xpi"]
      },
      "application/x-xz": {
        source: "apache",
        extensions: ["xz"]
      },
      "application/x-zmachine": {
        source: "apache",
        extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
      },
      "application/x400-bp": {
        source: "iana"
      },
      "application/xacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/xaml+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xaml"]
      },
      "application/xcap-att+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xav"]
      },
      "application/xcap-caps+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xca"]
      },
      "application/xcap-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdf"]
      },
      "application/xcap-el+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xel"]
      },
      "application/xcap-error+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcap-ns+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xns"]
      },
      "application/xcon-conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcon-conference-info-diff+xml": {
        source: "iana",
        compressible: true
      },
      "application/xenc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xenc"]
      },
      "application/xhtml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtml", "xht"]
      },
      "application/xhtml-voice+xml": {
        source: "apache",
        compressible: true
      },
      "application/xliff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml", "xsl", "xsd", "rng"]
      },
      "application/xml-dtd": {
        source: "iana",
        compressible: true,
        extensions: ["dtd"]
      },
      "application/xml-external-parsed-entity": {
        source: "iana"
      },
      "application/xml-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/xmpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/xop+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xop"]
      },
      "application/xproc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xpl"]
      },
      "application/xslt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsl", "xslt"]
      },
      "application/xspf+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xspf"]
      },
      "application/xv+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mxml", "xhvml", "xvml", "xvm"]
      },
      "application/yang": {
        source: "iana",
        extensions: ["yang"]
      },
      "application/yang-data+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-data+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/yin+xml": {
        source: "iana",
        compressible: true,
        extensions: ["yin"]
      },
      "application/zip": {
        source: "iana",
        compressible: false,
        extensions: ["zip"]
      },
      "application/zlib": {
        source: "iana"
      },
      "application/zstd": {
        source: "iana"
      },
      "audio/1d-interleaved-parityfec": {
        source: "iana"
      },
      "audio/32kadpcm": {
        source: "iana"
      },
      "audio/3gpp": {
        source: "iana",
        compressible: false,
        extensions: ["3gpp"]
      },
      "audio/3gpp2": {
        source: "iana"
      },
      "audio/aac": {
        source: "iana"
      },
      "audio/ac3": {
        source: "iana"
      },
      "audio/adpcm": {
        source: "apache",
        extensions: ["adp"]
      },
      "audio/amr": {
        source: "iana",
        extensions: ["amr"]
      },
      "audio/amr-wb": {
        source: "iana"
      },
      "audio/amr-wb+": {
        source: "iana"
      },
      "audio/aptx": {
        source: "iana"
      },
      "audio/asc": {
        source: "iana"
      },
      "audio/atrac-advanced-lossless": {
        source: "iana"
      },
      "audio/atrac-x": {
        source: "iana"
      },
      "audio/atrac3": {
        source: "iana"
      },
      "audio/basic": {
        source: "iana",
        compressible: false,
        extensions: ["au", "snd"]
      },
      "audio/bv16": {
        source: "iana"
      },
      "audio/bv32": {
        source: "iana"
      },
      "audio/clearmode": {
        source: "iana"
      },
      "audio/cn": {
        source: "iana"
      },
      "audio/dat12": {
        source: "iana"
      },
      "audio/dls": {
        source: "iana"
      },
      "audio/dsr-es201108": {
        source: "iana"
      },
      "audio/dsr-es202050": {
        source: "iana"
      },
      "audio/dsr-es202211": {
        source: "iana"
      },
      "audio/dsr-es202212": {
        source: "iana"
      },
      "audio/dv": {
        source: "iana"
      },
      "audio/dvi4": {
        source: "iana"
      },
      "audio/eac3": {
        source: "iana"
      },
      "audio/encaprtp": {
        source: "iana"
      },
      "audio/evrc": {
        source: "iana"
      },
      "audio/evrc-qcp": {
        source: "iana"
      },
      "audio/evrc0": {
        source: "iana"
      },
      "audio/evrc1": {
        source: "iana"
      },
      "audio/evrcb": {
        source: "iana"
      },
      "audio/evrcb0": {
        source: "iana"
      },
      "audio/evrcb1": {
        source: "iana"
      },
      "audio/evrcnw": {
        source: "iana"
      },
      "audio/evrcnw0": {
        source: "iana"
      },
      "audio/evrcnw1": {
        source: "iana"
      },
      "audio/evrcwb": {
        source: "iana"
      },
      "audio/evrcwb0": {
        source: "iana"
      },
      "audio/evrcwb1": {
        source: "iana"
      },
      "audio/evs": {
        source: "iana"
      },
      "audio/flexfec": {
        source: "iana"
      },
      "audio/fwdred": {
        source: "iana"
      },
      "audio/g711-0": {
        source: "iana"
      },
      "audio/g719": {
        source: "iana"
      },
      "audio/g722": {
        source: "iana"
      },
      "audio/g7221": {
        source: "iana"
      },
      "audio/g723": {
        source: "iana"
      },
      "audio/g726-16": {
        source: "iana"
      },
      "audio/g726-24": {
        source: "iana"
      },
      "audio/g726-32": {
        source: "iana"
      },
      "audio/g726-40": {
        source: "iana"
      },
      "audio/g728": {
        source: "iana"
      },
      "audio/g729": {
        source: "iana"
      },
      "audio/g7291": {
        source: "iana"
      },
      "audio/g729d": {
        source: "iana"
      },
      "audio/g729e": {
        source: "iana"
      },
      "audio/gsm": {
        source: "iana"
      },
      "audio/gsm-efr": {
        source: "iana"
      },
      "audio/gsm-hr-08": {
        source: "iana"
      },
      "audio/ilbc": {
        source: "iana"
      },
      "audio/ip-mr_v2.5": {
        source: "iana"
      },
      "audio/isac": {
        source: "apache"
      },
      "audio/l16": {
        source: "iana"
      },
      "audio/l20": {
        source: "iana"
      },
      "audio/l24": {
        source: "iana",
        compressible: false
      },
      "audio/l8": {
        source: "iana"
      },
      "audio/lpc": {
        source: "iana"
      },
      "audio/melp": {
        source: "iana"
      },
      "audio/melp1200": {
        source: "iana"
      },
      "audio/melp2400": {
        source: "iana"
      },
      "audio/melp600": {
        source: "iana"
      },
      "audio/mhas": {
        source: "iana"
      },
      "audio/midi": {
        source: "apache",
        extensions: ["mid", "midi", "kar", "rmi"]
      },
      "audio/mobile-xmf": {
        source: "iana",
        extensions: ["mxmf"]
      },
      "audio/mp3": {
        compressible: false,
        extensions: ["mp3"]
      },
      "audio/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["m4a", "mp4a"]
      },
      "audio/mp4a-latm": {
        source: "iana"
      },
      "audio/mpa": {
        source: "iana"
      },
      "audio/mpa-robust": {
        source: "iana"
      },
      "audio/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
      },
      "audio/mpeg4-generic": {
        source: "iana"
      },
      "audio/musepack": {
        source: "apache"
      },
      "audio/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["oga", "ogg", "spx", "opus"]
      },
      "audio/opus": {
        source: "iana"
      },
      "audio/parityfec": {
        source: "iana"
      },
      "audio/pcma": {
        source: "iana"
      },
      "audio/pcma-wb": {
        source: "iana"
      },
      "audio/pcmu": {
        source: "iana"
      },
      "audio/pcmu-wb": {
        source: "iana"
      },
      "audio/prs.sid": {
        source: "iana"
      },
      "audio/qcelp": {
        source: "iana"
      },
      "audio/raptorfec": {
        source: "iana"
      },
      "audio/red": {
        source: "iana"
      },
      "audio/rtp-enc-aescm128": {
        source: "iana"
      },
      "audio/rtp-midi": {
        source: "iana"
      },
      "audio/rtploopback": {
        source: "iana"
      },
      "audio/rtx": {
        source: "iana"
      },
      "audio/s3m": {
        source: "apache",
        extensions: ["s3m"]
      },
      "audio/scip": {
        source: "iana"
      },
      "audio/silk": {
        source: "apache",
        extensions: ["sil"]
      },
      "audio/smv": {
        source: "iana"
      },
      "audio/smv-qcp": {
        source: "iana"
      },
      "audio/smv0": {
        source: "iana"
      },
      "audio/sofa": {
        source: "iana"
      },
      "audio/sp-midi": {
        source: "iana"
      },
      "audio/speex": {
        source: "iana"
      },
      "audio/t140c": {
        source: "iana"
      },
      "audio/t38": {
        source: "iana"
      },
      "audio/telephone-event": {
        source: "iana"
      },
      "audio/tetra_acelp": {
        source: "iana"
      },
      "audio/tetra_acelp_bb": {
        source: "iana"
      },
      "audio/tone": {
        source: "iana"
      },
      "audio/tsvcis": {
        source: "iana"
      },
      "audio/uemclip": {
        source: "iana"
      },
      "audio/ulpfec": {
        source: "iana"
      },
      "audio/usac": {
        source: "iana"
      },
      "audio/vdvi": {
        source: "iana"
      },
      "audio/vmr-wb": {
        source: "iana"
      },
      "audio/vnd.3gpp.iufp": {
        source: "iana"
      },
      "audio/vnd.4sb": {
        source: "iana"
      },
      "audio/vnd.audiokoz": {
        source: "iana"
      },
      "audio/vnd.celp": {
        source: "iana"
      },
      "audio/vnd.cisco.nse": {
        source: "iana"
      },
      "audio/vnd.cmles.radio-events": {
        source: "iana"
      },
      "audio/vnd.cns.anp1": {
        source: "iana"
      },
      "audio/vnd.cns.inf1": {
        source: "iana"
      },
      "audio/vnd.dece.audio": {
        source: "iana",
        extensions: ["uva", "uvva"]
      },
      "audio/vnd.digital-winds": {
        source: "iana",
        extensions: ["eol"]
      },
      "audio/vnd.dlna.adts": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.1": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.2": {
        source: "iana"
      },
      "audio/vnd.dolby.mlp": {
        source: "iana"
      },
      "audio/vnd.dolby.mps": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2x": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2z": {
        source: "iana"
      },
      "audio/vnd.dolby.pulse.1": {
        source: "iana"
      },
      "audio/vnd.dra": {
        source: "iana",
        extensions: ["dra"]
      },
      "audio/vnd.dts": {
        source: "iana",
        extensions: ["dts"]
      },
      "audio/vnd.dts.hd": {
        source: "iana",
        extensions: ["dtshd"]
      },
      "audio/vnd.dts.uhd": {
        source: "iana"
      },
      "audio/vnd.dvb.file": {
        source: "iana"
      },
      "audio/vnd.everad.plj": {
        source: "iana"
      },
      "audio/vnd.hns.audio": {
        source: "iana"
      },
      "audio/vnd.lucent.voice": {
        source: "iana",
        extensions: ["lvp"]
      },
      "audio/vnd.ms-playready.media.pya": {
        source: "iana",
        extensions: ["pya"]
      },
      "audio/vnd.nokia.mobile-xmf": {
        source: "iana"
      },
      "audio/vnd.nortel.vbk": {
        source: "iana"
      },
      "audio/vnd.nuera.ecelp4800": {
        source: "iana",
        extensions: ["ecelp4800"]
      },
      "audio/vnd.nuera.ecelp7470": {
        source: "iana",
        extensions: ["ecelp7470"]
      },
      "audio/vnd.nuera.ecelp9600": {
        source: "iana",
        extensions: ["ecelp9600"]
      },
      "audio/vnd.octel.sbc": {
        source: "iana"
      },
      "audio/vnd.presonus.multitrack": {
        source: "iana"
      },
      "audio/vnd.qcelp": {
        source: "iana"
      },
      "audio/vnd.rhetorex.32kadpcm": {
        source: "iana"
      },
      "audio/vnd.rip": {
        source: "iana",
        extensions: ["rip"]
      },
      "audio/vnd.rn-realaudio": {
        compressible: false
      },
      "audio/vnd.sealedmedia.softseal.mpeg": {
        source: "iana"
      },
      "audio/vnd.vmx.cvsd": {
        source: "iana"
      },
      "audio/vnd.wave": {
        compressible: false
      },
      "audio/vorbis": {
        source: "iana",
        compressible: false
      },
      "audio/vorbis-config": {
        source: "iana"
      },
      "audio/wav": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/wave": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/webm": {
        source: "apache",
        compressible: false,
        extensions: ["weba"]
      },
      "audio/x-aac": {
        source: "apache",
        compressible: false,
        extensions: ["aac"]
      },
      "audio/x-aiff": {
        source: "apache",
        extensions: ["aif", "aiff", "aifc"]
      },
      "audio/x-caf": {
        source: "apache",
        compressible: false,
        extensions: ["caf"]
      },
      "audio/x-flac": {
        source: "apache",
        extensions: ["flac"]
      },
      "audio/x-m4a": {
        source: "nginx",
        extensions: ["m4a"]
      },
      "audio/x-matroska": {
        source: "apache",
        extensions: ["mka"]
      },
      "audio/x-mpegurl": {
        source: "apache",
        extensions: ["m3u"]
      },
      "audio/x-ms-wax": {
        source: "apache",
        extensions: ["wax"]
      },
      "audio/x-ms-wma": {
        source: "apache",
        extensions: ["wma"]
      },
      "audio/x-pn-realaudio": {
        source: "apache",
        extensions: ["ram", "ra"]
      },
      "audio/x-pn-realaudio-plugin": {
        source: "apache",
        extensions: ["rmp"]
      },
      "audio/x-realaudio": {
        source: "nginx",
        extensions: ["ra"]
      },
      "audio/x-tta": {
        source: "apache"
      },
      "audio/x-wav": {
        source: "apache",
        extensions: ["wav"]
      },
      "audio/xm": {
        source: "apache",
        extensions: ["xm"]
      },
      "chemical/x-cdx": {
        source: "apache",
        extensions: ["cdx"]
      },
      "chemical/x-cif": {
        source: "apache",
        extensions: ["cif"]
      },
      "chemical/x-cmdf": {
        source: "apache",
        extensions: ["cmdf"]
      },
      "chemical/x-cml": {
        source: "apache",
        extensions: ["cml"]
      },
      "chemical/x-csml": {
        source: "apache",
        extensions: ["csml"]
      },
      "chemical/x-pdb": {
        source: "apache"
      },
      "chemical/x-xyz": {
        source: "apache",
        extensions: ["xyz"]
      },
      "font/collection": {
        source: "iana",
        extensions: ["ttc"]
      },
      "font/otf": {
        source: "iana",
        compressible: true,
        extensions: ["otf"]
      },
      "font/sfnt": {
        source: "iana"
      },
      "font/ttf": {
        source: "iana",
        compressible: true,
        extensions: ["ttf"]
      },
      "font/woff": {
        source: "iana",
        extensions: ["woff"]
      },
      "font/woff2": {
        source: "iana",
        extensions: ["woff2"]
      },
      "image/aces": {
        source: "iana",
        extensions: ["exr"]
      },
      "image/apng": {
        compressible: false,
        extensions: ["apng"]
      },
      "image/avci": {
        source: "iana"
      },
      "image/avcs": {
        source: "iana"
      },
      "image/avif": {
        source: "iana",
        compressible: false,
        extensions: ["avif"]
      },
      "image/bmp": {
        source: "iana",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/cgm": {
        source: "iana",
        extensions: ["cgm"]
      },
      "image/dicom-rle": {
        source: "iana",
        extensions: ["drle"]
      },
      "image/emf": {
        source: "iana",
        extensions: ["emf"]
      },
      "image/fits": {
        source: "iana",
        extensions: ["fits"]
      },
      "image/g3fax": {
        source: "iana",
        extensions: ["g3"]
      },
      "image/gif": {
        source: "iana",
        compressible: false,
        extensions: ["gif"]
      },
      "image/heic": {
        source: "iana",
        extensions: ["heic"]
      },
      "image/heic-sequence": {
        source: "iana",
        extensions: ["heics"]
      },
      "image/heif": {
        source: "iana",
        extensions: ["heif"]
      },
      "image/heif-sequence": {
        source: "iana",
        extensions: ["heifs"]
      },
      "image/hej2k": {
        source: "iana",
        extensions: ["hej2"]
      },
      "image/hsj2": {
        source: "iana",
        extensions: ["hsj2"]
      },
      "image/ief": {
        source: "iana",
        extensions: ["ief"]
      },
      "image/jls": {
        source: "iana",
        extensions: ["jls"]
      },
      "image/jp2": {
        source: "iana",
        compressible: false,
        extensions: ["jp2", "jpg2"]
      },
      "image/jpeg": {
        source: "iana",
        compressible: false,
        extensions: ["jpeg", "jpg", "jpe"]
      },
      "image/jph": {
        source: "iana",
        extensions: ["jph"]
      },
      "image/jphc": {
        source: "iana",
        extensions: ["jhc"]
      },
      "image/jpm": {
        source: "iana",
        compressible: false,
        extensions: ["jpm"]
      },
      "image/jpx": {
        source: "iana",
        compressible: false,
        extensions: ["jpx", "jpf"]
      },
      "image/jxr": {
        source: "iana",
        extensions: ["jxr"]
      },
      "image/jxra": {
        source: "iana",
        extensions: ["jxra"]
      },
      "image/jxrs": {
        source: "iana",
        extensions: ["jxrs"]
      },
      "image/jxs": {
        source: "iana",
        extensions: ["jxs"]
      },
      "image/jxsc": {
        source: "iana",
        extensions: ["jxsc"]
      },
      "image/jxsi": {
        source: "iana",
        extensions: ["jxsi"]
      },
      "image/jxss": {
        source: "iana",
        extensions: ["jxss"]
      },
      "image/ktx": {
        source: "iana",
        extensions: ["ktx"]
      },
      "image/ktx2": {
        source: "iana",
        extensions: ["ktx2"]
      },
      "image/naplps": {
        source: "iana"
      },
      "image/pjpeg": {
        compressible: false
      },
      "image/png": {
        source: "iana",
        compressible: false,
        extensions: ["png"]
      },
      "image/prs.btif": {
        source: "iana",
        extensions: ["btif"]
      },
      "image/prs.pti": {
        source: "iana",
        extensions: ["pti"]
      },
      "image/pwg-raster": {
        source: "iana"
      },
      "image/sgi": {
        source: "apache",
        extensions: ["sgi"]
      },
      "image/svg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["svg", "svgz"]
      },
      "image/t38": {
        source: "iana",
        extensions: ["t38"]
      },
      "image/tiff": {
        source: "iana",
        compressible: false,
        extensions: ["tif", "tiff"]
      },
      "image/tiff-fx": {
        source: "iana",
        extensions: ["tfx"]
      },
      "image/vnd.adobe.photoshop": {
        source: "iana",
        compressible: true,
        extensions: ["psd"]
      },
      "image/vnd.airzip.accelerator.azv": {
        source: "iana",
        extensions: ["azv"]
      },
      "image/vnd.cns.inf2": {
        source: "iana"
      },
      "image/vnd.dece.graphic": {
        source: "iana",
        extensions: ["uvi", "uvvi", "uvg", "uvvg"]
      },
      "image/vnd.djvu": {
        source: "iana",
        extensions: ["djvu", "djv"]
      },
      "image/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "image/vnd.dwg": {
        source: "iana",
        extensions: ["dwg"]
      },
      "image/vnd.dxf": {
        source: "iana",
        extensions: ["dxf"]
      },
      "image/vnd.fastbidsheet": {
        source: "iana",
        extensions: ["fbs"]
      },
      "image/vnd.fpx": {
        source: "iana",
        extensions: ["fpx"]
      },
      "image/vnd.fst": {
        source: "iana",
        extensions: ["fst"]
      },
      "image/vnd.fujixerox.edmics-mmr": {
        source: "iana",
        extensions: ["mmr"]
      },
      "image/vnd.fujixerox.edmics-rlc": {
        source: "iana",
        extensions: ["rlc"]
      },
      "image/vnd.globalgraphics.pgb": {
        source: "iana"
      },
      "image/vnd.microsoft.icon": {
        source: "iana",
        extensions: ["ico"]
      },
      "image/vnd.mix": {
        source: "iana"
      },
      "image/vnd.mozilla.apng": {
        source: "iana"
      },
      "image/vnd.ms-dds": {
        extensions: ["dds"]
      },
      "image/vnd.ms-modi": {
        source: "iana",
        extensions: ["mdi"]
      },
      "image/vnd.ms-photo": {
        source: "apache",
        extensions: ["wdp"]
      },
      "image/vnd.net-fpx": {
        source: "iana",
        extensions: ["npx"]
      },
      "image/vnd.pco.b16": {
        source: "iana",
        extensions: ["b16"]
      },
      "image/vnd.radiance": {
        source: "iana"
      },
      "image/vnd.sealed.png": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.gif": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.jpg": {
        source: "iana"
      },
      "image/vnd.svf": {
        source: "iana"
      },
      "image/vnd.tencent.tap": {
        source: "iana",
        extensions: ["tap"]
      },
      "image/vnd.valve.source.texture": {
        source: "iana",
        extensions: ["vtf"]
      },
      "image/vnd.wap.wbmp": {
        source: "iana",
        extensions: ["wbmp"]
      },
      "image/vnd.xiff": {
        source: "iana",
        extensions: ["xif"]
      },
      "image/vnd.zbrush.pcx": {
        source: "iana",
        extensions: ["pcx"]
      },
      "image/webp": {
        source: "apache",
        extensions: ["webp"]
      },
      "image/wmf": {
        source: "iana",
        extensions: ["wmf"]
      },
      "image/x-3ds": {
        source: "apache",
        extensions: ["3ds"]
      },
      "image/x-cmu-raster": {
        source: "apache",
        extensions: ["ras"]
      },
      "image/x-cmx": {
        source: "apache",
        extensions: ["cmx"]
      },
      "image/x-freehand": {
        source: "apache",
        extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
      },
      "image/x-icon": {
        source: "apache",
        compressible: true,
        extensions: ["ico"]
      },
      "image/x-jng": {
        source: "nginx",
        extensions: ["jng"]
      },
      "image/x-mrsid-image": {
        source: "apache",
        extensions: ["sid"]
      },
      "image/x-ms-bmp": {
        source: "nginx",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/x-pcx": {
        source: "apache",
        extensions: ["pcx"]
      },
      "image/x-pict": {
        source: "apache",
        extensions: ["pic", "pct"]
      },
      "image/x-portable-anymap": {
        source: "apache",
        extensions: ["pnm"]
      },
      "image/x-portable-bitmap": {
        source: "apache",
        extensions: ["pbm"]
      },
      "image/x-portable-graymap": {
        source: "apache",
        extensions: ["pgm"]
      },
      "image/x-portable-pixmap": {
        source: "apache",
        extensions: ["ppm"]
      },
      "image/x-rgb": {
        source: "apache",
        extensions: ["rgb"]
      },
      "image/x-tga": {
        source: "apache",
        extensions: ["tga"]
      },
      "image/x-xbitmap": {
        source: "apache",
        extensions: ["xbm"]
      },
      "image/x-xcf": {
        compressible: false
      },
      "image/x-xpixmap": {
        source: "apache",
        extensions: ["xpm"]
      },
      "image/x-xwindowdump": {
        source: "apache",
        extensions: ["xwd"]
      },
      "message/cpim": {
        source: "iana"
      },
      "message/delivery-status": {
        source: "iana"
      },
      "message/disposition-notification": {
        source: "iana",
        extensions: [
          "disposition-notification"
        ]
      },
      "message/external-body": {
        source: "iana"
      },
      "message/feedback-report": {
        source: "iana"
      },
      "message/global": {
        source: "iana",
        extensions: ["u8msg"]
      },
      "message/global-delivery-status": {
        source: "iana",
        extensions: ["u8dsn"]
      },
      "message/global-disposition-notification": {
        source: "iana",
        extensions: ["u8mdn"]
      },
      "message/global-headers": {
        source: "iana",
        extensions: ["u8hdr"]
      },
      "message/http": {
        source: "iana",
        compressible: false
      },
      "message/imdn+xml": {
        source: "iana",
        compressible: true
      },
      "message/news": {
        source: "iana"
      },
      "message/partial": {
        source: "iana",
        compressible: false
      },
      "message/rfc822": {
        source: "iana",
        compressible: true,
        extensions: ["eml", "mime"]
      },
      "message/s-http": {
        source: "iana"
      },
      "message/sip": {
        source: "iana"
      },
      "message/sipfrag": {
        source: "iana"
      },
      "message/tracking-status": {
        source: "iana"
      },
      "message/vnd.si.simp": {
        source: "iana"
      },
      "message/vnd.wfa.wsc": {
        source: "iana",
        extensions: ["wsc"]
      },
      "model/3mf": {
        source: "iana",
        extensions: ["3mf"]
      },
      "model/e57": {
        source: "iana"
      },
      "model/gltf+json": {
        source: "iana",
        compressible: true,
        extensions: ["gltf"]
      },
      "model/gltf-binary": {
        source: "iana",
        compressible: true,
        extensions: ["glb"]
      },
      "model/iges": {
        source: "iana",
        compressible: false,
        extensions: ["igs", "iges"]
      },
      "model/mesh": {
        source: "iana",
        compressible: false,
        extensions: ["msh", "mesh", "silo"]
      },
      "model/mtl": {
        source: "iana",
        extensions: ["mtl"]
      },
      "model/obj": {
        source: "iana",
        extensions: ["obj"]
      },
      "model/step": {
        source: "iana"
      },
      "model/step+xml": {
        source: "iana",
        compressible: true,
        extensions: ["stpx"]
      },
      "model/step+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpz"]
      },
      "model/step-xml+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpxz"]
      },
      "model/stl": {
        source: "iana",
        extensions: ["stl"]
      },
      "model/vnd.collada+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dae"]
      },
      "model/vnd.dwf": {
        source: "iana",
        extensions: ["dwf"]
      },
      "model/vnd.flatland.3dml": {
        source: "iana"
      },
      "model/vnd.gdl": {
        source: "iana",
        extensions: ["gdl"]
      },
      "model/vnd.gs-gdl": {
        source: "apache"
      },
      "model/vnd.gs.gdl": {
        source: "iana"
      },
      "model/vnd.gtw": {
        source: "iana",
        extensions: ["gtw"]
      },
      "model/vnd.moml+xml": {
        source: "iana",
        compressible: true
      },
      "model/vnd.mts": {
        source: "iana",
        extensions: ["mts"]
      },
      "model/vnd.opengex": {
        source: "iana",
        extensions: ["ogex"]
      },
      "model/vnd.parasolid.transmit.binary": {
        source: "iana",
        extensions: ["x_b"]
      },
      "model/vnd.parasolid.transmit.text": {
        source: "iana",
        extensions: ["x_t"]
      },
      "model/vnd.pytha.pyox": {
        source: "iana"
      },
      "model/vnd.rosette.annotated-data-model": {
        source: "iana"
      },
      "model/vnd.sap.vds": {
        source: "iana",
        extensions: ["vds"]
      },
      "model/vnd.usdz+zip": {
        source: "iana",
        compressible: false,
        extensions: ["usdz"]
      },
      "model/vnd.valve.source.compiled-map": {
        source: "iana",
        extensions: ["bsp"]
      },
      "model/vnd.vtu": {
        source: "iana",
        extensions: ["vtu"]
      },
      "model/vrml": {
        source: "iana",
        compressible: false,
        extensions: ["wrl", "vrml"]
      },
      "model/x3d+binary": {
        source: "apache",
        compressible: false,
        extensions: ["x3db", "x3dbz"]
      },
      "model/x3d+fastinfoset": {
        source: "iana",
        extensions: ["x3db"]
      },
      "model/x3d+vrml": {
        source: "apache",
        compressible: false,
        extensions: ["x3dv", "x3dvz"]
      },
      "model/x3d+xml": {
        source: "iana",
        compressible: true,
        extensions: ["x3d", "x3dz"]
      },
      "model/x3d-vrml": {
        source: "iana",
        extensions: ["x3dv"]
      },
      "multipart/alternative": {
        source: "iana",
        compressible: false
      },
      "multipart/appledouble": {
        source: "iana"
      },
      "multipart/byteranges": {
        source: "iana"
      },
      "multipart/digest": {
        source: "iana"
      },
      "multipart/encrypted": {
        source: "iana",
        compressible: false
      },
      "multipart/form-data": {
        source: "iana",
        compressible: false
      },
      "multipart/header-set": {
        source: "iana"
      },
      "multipart/mixed": {
        source: "iana"
      },
      "multipart/multilingual": {
        source: "iana"
      },
      "multipart/parallel": {
        source: "iana"
      },
      "multipart/related": {
        source: "iana",
        compressible: false
      },
      "multipart/report": {
        source: "iana"
      },
      "multipart/signed": {
        source: "iana",
        compressible: false
      },
      "multipart/vnd.bint.med-plus": {
        source: "iana"
      },
      "multipart/voice-message": {
        source: "iana"
      },
      "multipart/x-mixed-replace": {
        source: "iana"
      },
      "text/1d-interleaved-parityfec": {
        source: "iana"
      },
      "text/cache-manifest": {
        source: "iana",
        compressible: true,
        extensions: ["appcache", "manifest"]
      },
      "text/calendar": {
        source: "iana",
        extensions: ["ics", "ifb"]
      },
      "text/calender": {
        compressible: true
      },
      "text/cmd": {
        compressible: true
      },
      "text/coffeescript": {
        extensions: ["coffee", "litcoffee"]
      },
      "text/cql": {
        source: "iana"
      },
      "text/cql-expression": {
        source: "iana"
      },
      "text/cql-identifier": {
        source: "iana"
      },
      "text/css": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["css"]
      },
      "text/csv": {
        source: "iana",
        compressible: true,
        extensions: ["csv"]
      },
      "text/csv-schema": {
        source: "iana"
      },
      "text/directory": {
        source: "iana"
      },
      "text/dns": {
        source: "iana"
      },
      "text/ecmascript": {
        source: "iana"
      },
      "text/encaprtp": {
        source: "iana"
      },
      "text/enriched": {
        source: "iana"
      },
      "text/fhirpath": {
        source: "iana"
      },
      "text/flexfec": {
        source: "iana"
      },
      "text/fwdred": {
        source: "iana"
      },
      "text/gff3": {
        source: "iana"
      },
      "text/grammar-ref-list": {
        source: "iana"
      },
      "text/html": {
        source: "iana",
        compressible: true,
        extensions: ["html", "htm", "shtml"]
      },
      "text/jade": {
        extensions: ["jade"]
      },
      "text/javascript": {
        source: "iana",
        compressible: true
      },
      "text/jcr-cnd": {
        source: "iana"
      },
      "text/jsx": {
        compressible: true,
        extensions: ["jsx"]
      },
      "text/less": {
        compressible: true,
        extensions: ["less"]
      },
      "text/markdown": {
        source: "iana",
        compressible: true,
        extensions: ["markdown", "md"]
      },
      "text/mathml": {
        source: "nginx",
        extensions: ["mml"]
      },
      "text/mdx": {
        compressible: true,
        extensions: ["mdx"]
      },
      "text/mizar": {
        source: "iana"
      },
      "text/n3": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["n3"]
      },
      "text/parameters": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/parityfec": {
        source: "iana"
      },
      "text/plain": {
        source: "iana",
        compressible: true,
        extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
      },
      "text/provenance-notation": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/prs.fallenstein.rst": {
        source: "iana"
      },
      "text/prs.lines.tag": {
        source: "iana",
        extensions: ["dsc"]
      },
      "text/prs.prop.logic": {
        source: "iana"
      },
      "text/raptorfec": {
        source: "iana"
      },
      "text/red": {
        source: "iana"
      },
      "text/rfc822-headers": {
        source: "iana"
      },
      "text/richtext": {
        source: "iana",
        compressible: true,
        extensions: ["rtx"]
      },
      "text/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "text/rtp-enc-aescm128": {
        source: "iana"
      },
      "text/rtploopback": {
        source: "iana"
      },
      "text/rtx": {
        source: "iana"
      },
      "text/sgml": {
        source: "iana",
        extensions: ["sgml", "sgm"]
      },
      "text/shaclc": {
        source: "iana"
      },
      "text/shex": {
        source: "iana",
        extensions: ["shex"]
      },
      "text/slim": {
        extensions: ["slim", "slm"]
      },
      "text/spdx": {
        source: "iana",
        extensions: ["spdx"]
      },
      "text/strings": {
        source: "iana"
      },
      "text/stylus": {
        extensions: ["stylus", "styl"]
      },
      "text/t140": {
        source: "iana"
      },
      "text/tab-separated-values": {
        source: "iana",
        compressible: true,
        extensions: ["tsv"]
      },
      "text/troff": {
        source: "iana",
        extensions: ["t", "tr", "roff", "man", "me", "ms"]
      },
      "text/turtle": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["ttl"]
      },
      "text/ulpfec": {
        source: "iana"
      },
      "text/uri-list": {
        source: "iana",
        compressible: true,
        extensions: ["uri", "uris", "urls"]
      },
      "text/vcard": {
        source: "iana",
        compressible: true,
        extensions: ["vcard"]
      },
      "text/vnd.a": {
        source: "iana"
      },
      "text/vnd.abc": {
        source: "iana"
      },
      "text/vnd.ascii-art": {
        source: "iana"
      },
      "text/vnd.curl": {
        source: "iana",
        extensions: ["curl"]
      },
      "text/vnd.curl.dcurl": {
        source: "apache",
        extensions: ["dcurl"]
      },
      "text/vnd.curl.mcurl": {
        source: "apache",
        extensions: ["mcurl"]
      },
      "text/vnd.curl.scurl": {
        source: "apache",
        extensions: ["scurl"]
      },
      "text/vnd.debian.copyright": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.dmclientscript": {
        source: "iana"
      },
      "text/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "text/vnd.esmertec.theme-descriptor": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.ficlab.flt": {
        source: "iana"
      },
      "text/vnd.fly": {
        source: "iana",
        extensions: ["fly"]
      },
      "text/vnd.fmi.flexstor": {
        source: "iana",
        extensions: ["flx"]
      },
      "text/vnd.gml": {
        source: "iana"
      },
      "text/vnd.graphviz": {
        source: "iana",
        extensions: ["gv"]
      },
      "text/vnd.hans": {
        source: "iana"
      },
      "text/vnd.hgl": {
        source: "iana"
      },
      "text/vnd.in3d.3dml": {
        source: "iana",
        extensions: ["3dml"]
      },
      "text/vnd.in3d.spot": {
        source: "iana",
        extensions: ["spot"]
      },
      "text/vnd.iptc.newsml": {
        source: "iana"
      },
      "text/vnd.iptc.nitf": {
        source: "iana"
      },
      "text/vnd.latex-z": {
        source: "iana"
      },
      "text/vnd.motorola.reflex": {
        source: "iana"
      },
      "text/vnd.ms-mediapackage": {
        source: "iana"
      },
      "text/vnd.net2phone.commcenter.command": {
        source: "iana"
      },
      "text/vnd.radisys.msml-basic-layout": {
        source: "iana"
      },
      "text/vnd.senx.warpscript": {
        source: "iana"
      },
      "text/vnd.si.uricatalogue": {
        source: "iana"
      },
      "text/vnd.sosi": {
        source: "iana"
      },
      "text/vnd.sun.j2me.app-descriptor": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["jad"]
      },
      "text/vnd.trolltech.linguist": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.wap.si": {
        source: "iana"
      },
      "text/vnd.wap.sl": {
        source: "iana"
      },
      "text/vnd.wap.wml": {
        source: "iana",
        extensions: ["wml"]
      },
      "text/vnd.wap.wmlscript": {
        source: "iana",
        extensions: ["wmls"]
      },
      "text/vtt": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["vtt"]
      },
      "text/x-asm": {
        source: "apache",
        extensions: ["s", "asm"]
      },
      "text/x-c": {
        source: "apache",
        extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
      },
      "text/x-component": {
        source: "nginx",
        extensions: ["htc"]
      },
      "text/x-fortran": {
        source: "apache",
        extensions: ["f", "for", "f77", "f90"]
      },
      "text/x-gwt-rpc": {
        compressible: true
      },
      "text/x-handlebars-template": {
        extensions: ["hbs"]
      },
      "text/x-java-source": {
        source: "apache",
        extensions: ["java"]
      },
      "text/x-jquery-tmpl": {
        compressible: true
      },
      "text/x-lua": {
        extensions: ["lua"]
      },
      "text/x-markdown": {
        compressible: true,
        extensions: ["mkd"]
      },
      "text/x-nfo": {
        source: "apache",
        extensions: ["nfo"]
      },
      "text/x-opml": {
        source: "apache",
        extensions: ["opml"]
      },
      "text/x-org": {
        compressible: true,
        extensions: ["org"]
      },
      "text/x-pascal": {
        source: "apache",
        extensions: ["p", "pas"]
      },
      "text/x-processing": {
        compressible: true,
        extensions: ["pde"]
      },
      "text/x-sass": {
        extensions: ["sass"]
      },
      "text/x-scss": {
        extensions: ["scss"]
      },
      "text/x-setext": {
        source: "apache",
        extensions: ["etx"]
      },
      "text/x-sfv": {
        source: "apache",
        extensions: ["sfv"]
      },
      "text/x-suse-ymp": {
        compressible: true,
        extensions: ["ymp"]
      },
      "text/x-uuencode": {
        source: "apache",
        extensions: ["uu"]
      },
      "text/x-vcalendar": {
        source: "apache",
        extensions: ["vcs"]
      },
      "text/x-vcard": {
        source: "apache",
        extensions: ["vcf"]
      },
      "text/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml"]
      },
      "text/xml-external-parsed-entity": {
        source: "iana"
      },
      "text/yaml": {
        compressible: true,
        extensions: ["yaml", "yml"]
      },
      "video/1d-interleaved-parityfec": {
        source: "iana"
      },
      "video/3gpp": {
        source: "iana",
        extensions: ["3gp", "3gpp"]
      },
      "video/3gpp-tt": {
        source: "iana"
      },
      "video/3gpp2": {
        source: "iana",
        extensions: ["3g2"]
      },
      "video/av1": {
        source: "iana"
      },
      "video/bmpeg": {
        source: "iana"
      },
      "video/bt656": {
        source: "iana"
      },
      "video/celb": {
        source: "iana"
      },
      "video/dv": {
        source: "iana"
      },
      "video/encaprtp": {
        source: "iana"
      },
      "video/ffv1": {
        source: "iana"
      },
      "video/flexfec": {
        source: "iana"
      },
      "video/h261": {
        source: "iana",
        extensions: ["h261"]
      },
      "video/h263": {
        source: "iana",
        extensions: ["h263"]
      },
      "video/h263-1998": {
        source: "iana"
      },
      "video/h263-2000": {
        source: "iana"
      },
      "video/h264": {
        source: "iana",
        extensions: ["h264"]
      },
      "video/h264-rcdo": {
        source: "iana"
      },
      "video/h264-svc": {
        source: "iana"
      },
      "video/h265": {
        source: "iana"
      },
      "video/iso.segment": {
        source: "iana",
        extensions: ["m4s"]
      },
      "video/jpeg": {
        source: "iana",
        extensions: ["jpgv"]
      },
      "video/jpeg2000": {
        source: "iana"
      },
      "video/jpm": {
        source: "apache",
        extensions: ["jpm", "jpgm"]
      },
      "video/jxsv": {
        source: "iana"
      },
      "video/mj2": {
        source: "iana",
        extensions: ["mj2", "mjp2"]
      },
      "video/mp1s": {
        source: "iana"
      },
      "video/mp2p": {
        source: "iana"
      },
      "video/mp2t": {
        source: "iana",
        extensions: ["ts"]
      },
      "video/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["mp4", "mp4v", "mpg4"]
      },
      "video/mp4v-es": {
        source: "iana"
      },
      "video/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
      },
      "video/mpeg4-generic": {
        source: "iana"
      },
      "video/mpv": {
        source: "iana"
      },
      "video/nv": {
        source: "iana"
      },
      "video/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogv"]
      },
      "video/parityfec": {
        source: "iana"
      },
      "video/pointer": {
        source: "iana"
      },
      "video/quicktime": {
        source: "iana",
        compressible: false,
        extensions: ["qt", "mov"]
      },
      "video/raptorfec": {
        source: "iana"
      },
      "video/raw": {
        source: "iana"
      },
      "video/rtp-enc-aescm128": {
        source: "iana"
      },
      "video/rtploopback": {
        source: "iana"
      },
      "video/rtx": {
        source: "iana"
      },
      "video/scip": {
        source: "iana"
      },
      "video/smpte291": {
        source: "iana"
      },
      "video/smpte292m": {
        source: "iana"
      },
      "video/ulpfec": {
        source: "iana"
      },
      "video/vc1": {
        source: "iana"
      },
      "video/vc2": {
        source: "iana"
      },
      "video/vnd.cctv": {
        source: "iana"
      },
      "video/vnd.dece.hd": {
        source: "iana",
        extensions: ["uvh", "uvvh"]
      },
      "video/vnd.dece.mobile": {
        source: "iana",
        extensions: ["uvm", "uvvm"]
      },
      "video/vnd.dece.mp4": {
        source: "iana"
      },
      "video/vnd.dece.pd": {
        source: "iana",
        extensions: ["uvp", "uvvp"]
      },
      "video/vnd.dece.sd": {
        source: "iana",
        extensions: ["uvs", "uvvs"]
      },
      "video/vnd.dece.video": {
        source: "iana",
        extensions: ["uvv", "uvvv"]
      },
      "video/vnd.directv.mpeg": {
        source: "iana"
      },
      "video/vnd.directv.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dlna.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dvb.file": {
        source: "iana",
        extensions: ["dvb"]
      },
      "video/vnd.fvt": {
        source: "iana",
        extensions: ["fvt"]
      },
      "video/vnd.hns.video": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsavc": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsmpeg2": {
        source: "iana"
      },
      "video/vnd.motorola.video": {
        source: "iana"
      },
      "video/vnd.motorola.videop": {
        source: "iana"
      },
      "video/vnd.mpegurl": {
        source: "iana",
        extensions: ["mxu", "m4u"]
      },
      "video/vnd.ms-playready.media.pyv": {
        source: "iana",
        extensions: ["pyv"]
      },
      "video/vnd.nokia.interleaved-multimedia": {
        source: "iana"
      },
      "video/vnd.nokia.mp4vr": {
        source: "iana"
      },
      "video/vnd.nokia.videovoip": {
        source: "iana"
      },
      "video/vnd.objectvideo": {
        source: "iana"
      },
      "video/vnd.radgamettools.bink": {
        source: "iana"
      },
      "video/vnd.radgamettools.smacker": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg1": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg4": {
        source: "iana"
      },
      "video/vnd.sealed.swf": {
        source: "iana"
      },
      "video/vnd.sealedmedia.softseal.mov": {
        source: "iana"
      },
      "video/vnd.uvvu.mp4": {
        source: "iana",
        extensions: ["uvu", "uvvu"]
      },
      "video/vnd.vivo": {
        source: "iana",
        extensions: ["viv"]
      },
      "video/vnd.youtube.yt": {
        source: "iana"
      },
      "video/vp8": {
        source: "iana"
      },
      "video/vp9": {
        source: "iana"
      },
      "video/webm": {
        source: "apache",
        compressible: false,
        extensions: ["webm"]
      },
      "video/x-f4v": {
        source: "apache",
        extensions: ["f4v"]
      },
      "video/x-fli": {
        source: "apache",
        extensions: ["fli"]
      },
      "video/x-flv": {
        source: "apache",
        compressible: false,
        extensions: ["flv"]
      },
      "video/x-m4v": {
        source: "apache",
        extensions: ["m4v"]
      },
      "video/x-matroska": {
        source: "apache",
        compressible: false,
        extensions: ["mkv", "mk3d", "mks"]
      },
      "video/x-mng": {
        source: "apache",
        extensions: ["mng"]
      },
      "video/x-ms-asf": {
        source: "apache",
        extensions: ["asf", "asx"]
      },
      "video/x-ms-vob": {
        source: "apache",
        extensions: ["vob"]
      },
      "video/x-ms-wm": {
        source: "apache",
        extensions: ["wm"]
      },
      "video/x-ms-wmv": {
        source: "apache",
        compressible: false,
        extensions: ["wmv"]
      },
      "video/x-ms-wmx": {
        source: "apache",
        extensions: ["wmx"]
      },
      "video/x-ms-wvx": {
        source: "apache",
        extensions: ["wvx"]
      },
      "video/x-msvideo": {
        source: "apache",
        extensions: ["avi"]
      },
      "video/x-sgi-movie": {
        source: "apache",
        extensions: ["movie"]
      },
      "video/x-smv": {
        source: "apache",
        extensions: ["smv"]
      },
      "x-conference/x-cooltalk": {
        source: "apache",
        extensions: ["ice"]
      },
      "x-shader/x-fragment": {
        compressible: true
      },
      "x-shader/x-vertex": {
        compressible: true
      }
    };
  }
});

// node_modules/mime-db/index.js
var require_mime_db = __commonJS({
  "node_modules/mime-db/index.js"(exports, module2) {
    init_shims();
    module2.exports = require_db();
  }
});

// node_modules/mime-types/index.js
var require_mime_types = __commonJS({
  "node_modules/mime-types/index.js"(exports) {
    init_shims();
    "use strict";
    var db = require_mime_db();
    var extname = require("path").extname;
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports.charset = charset;
    exports.charsets = { lookup: charset };
    exports.contentType = contentType;
    exports.extension = extension;
    exports.extensions = Object.create(null);
    exports.lookup = lookup;
    exports.types = Object.create(null);
    populateMaps(exports.extensions, exports.types);
    function charset(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var mime = match && db[match[1].toLowerCase()];
      if (mime && mime.charset) {
        return mime.charset;
      }
      if (match && TEXT_TYPE_REGEXP.test(match[1])) {
        return "UTF-8";
      }
      return false;
    }
    function contentType(str) {
      if (!str || typeof str !== "string") {
        return false;
      }
      var mime = str.indexOf("/") === -1 ? exports.lookup(str) : str;
      if (!mime) {
        return false;
      }
      if (mime.indexOf("charset") === -1) {
        var charset2 = exports.charset(mime);
        if (charset2)
          mime += "; charset=" + charset2.toLowerCase();
      }
      return mime;
    }
    function extension(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var exts = match && exports.extensions[match[1].toLowerCase()];
      if (!exts || !exts.length) {
        return false;
      }
      return exts[0];
    }
    function lookup(path) {
      if (!path || typeof path !== "string") {
        return false;
      }
      var extension2 = extname("x." + path).toLowerCase().substr(1);
      if (!extension2) {
        return false;
      }
      return exports.types[extension2] || false;
    }
    function populateMaps(extensions, types2) {
      var preference = ["nginx", "apache", void 0, "iana"];
      Object.keys(db).forEach(function forEachMimeType(type) {
        var mime = db[type];
        var exts = mime.extensions;
        if (!exts || !exts.length) {
          return;
        }
        extensions[type] = exts;
        for (var i = 0; i < exts.length; i++) {
          var extension2 = exts[i];
          if (types2[extension2]) {
            var from = preference.indexOf(db[types2[extension2]].source);
            var to = preference.indexOf(mime.source);
            if (types2[extension2] !== "application/octet-stream" && (from > to || from === to && types2[extension2].substr(0, 12) === "application/")) {
              continue;
            }
          }
          types2[extension2] = type;
        }
      });
    }
  }
});

// node_modules/type-is/index.js
var require_type_is = __commonJS({
  "node_modules/type-is/index.js"(exports, module2) {
    init_shims();
    "use strict";
    var typer = require_media_typer();
    var mime = require_mime_types();
    module2.exports = typeofrequest;
    module2.exports.is = typeis;
    module2.exports.hasBody = hasbody;
    module2.exports.normalize = normalize2;
    module2.exports.match = mimeMatch;
    function typeis(value, types_) {
      var i;
      var types2 = types_;
      var val = tryNormalizeType(value);
      if (!val) {
        return false;
      }
      if (types2 && !Array.isArray(types2)) {
        types2 = new Array(arguments.length - 1);
        for (i = 0; i < types2.length; i++) {
          types2[i] = arguments[i + 1];
        }
      }
      if (!types2 || !types2.length) {
        return val;
      }
      var type;
      for (i = 0; i < types2.length; i++) {
        if (mimeMatch(normalize2(type = types2[i]), val)) {
          return type[0] === "+" || type.indexOf("*") !== -1 ? val : type;
        }
      }
      return false;
    }
    function hasbody(req) {
      return req.headers["transfer-encoding"] !== void 0 || !isNaN(req.headers["content-length"]);
    }
    function typeofrequest(req, types_) {
      var types2 = types_;
      if (!hasbody(req)) {
        return null;
      }
      if (arguments.length > 2) {
        types2 = new Array(arguments.length - 1);
        for (var i = 0; i < types2.length; i++) {
          types2[i] = arguments[i + 1];
        }
      }
      var value = req.headers["content-type"];
      return typeis(value, types2);
    }
    function normalize2(type) {
      if (typeof type !== "string") {
        return false;
      }
      switch (type) {
        case "urlencoded":
          return "application/x-www-form-urlencoded";
        case "multipart":
          return "multipart/*";
      }
      if (type[0] === "+") {
        return "*/*" + type;
      }
      return type.indexOf("/") === -1 ? mime.lookup(type) : type;
    }
    function mimeMatch(expected, actual) {
      if (expected === false) {
        return false;
      }
      var actualParts = actual.split("/");
      var expectedParts = expected.split("/");
      if (actualParts.length !== 2 || expectedParts.length !== 2) {
        return false;
      }
      if (expectedParts[0] !== "*" && expectedParts[0] !== actualParts[0]) {
        return false;
      }
      if (expectedParts[1].substr(0, 2) === "*+") {
        return expectedParts[1].length <= actualParts[1].length + 1 && expectedParts[1].substr(1) === actualParts[1].substr(1 - expectedParts[1].length);
      }
      if (expectedParts[1] !== "*" && expectedParts[1] !== actualParts[1]) {
        return false;
      }
      return true;
    }
    function normalizeType(value) {
      var type = typer.parse(value);
      type.parameters = void 0;
      return typer.format(type);
    }
    function tryNormalizeType(value) {
      if (!value) {
        return null;
      }
      try {
        return normalizeType(value);
      } catch (err) {
        return null;
      }
    }
  }
});

// node_modules/@vendia/serverless-express/src/index.js
var require_src = __commonJS({
  "node_modules/@vendia/serverless-express/src/index.js"(exports) {
    init_shims();
    "use strict";
    var http2 = require("http");
    var url2 = require("url");
    var binarycase = require_binary_case();
    var isType = require_type_is();
    function getPathWithQueryStringParams(event) {
      return url2.format({ pathname: event.path, query: event.queryStringParameters });
    }
    function getEventBody(event) {
      return Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
    }
    function clone2(json) {
      return JSON.parse(JSON.stringify(json));
    }
    function getContentType(params) {
      return params.contentTypeHeader ? params.contentTypeHeader.split(";")[0] : "";
    }
    function isContentTypeBinaryMimeType(params) {
      return params.binaryMimeTypes.length > 0 && !!isType.is(params.contentType, params.binaryMimeTypes);
    }
    function mapApiGatewayEventToHttpRequest(event, context, socketPath) {
      const headers = Object.assign({}, event.headers);
      if (event.body && !headers["Content-Length"]) {
        const body = getEventBody(event);
        headers["Content-Length"] = Buffer.byteLength(body);
      }
      const clonedEventWithoutBody = clone2(event);
      delete clonedEventWithoutBody.body;
      headers["x-apigateway-event"] = encodeURIComponent(JSON.stringify(clonedEventWithoutBody));
      headers["x-apigateway-context"] = encodeURIComponent(JSON.stringify(context));
      return {
        method: event.httpMethod,
        path: getPathWithQueryStringParams(event),
        headers,
        socketPath
      };
    }
    function forwardResponseToApiGateway(server, response, resolver) {
      const buf = [];
      response.on("data", (chunk) => buf.push(chunk)).on("end", () => {
        const bodyBuffer = Buffer.concat(buf);
        const statusCode = response.statusCode;
        const headers = response.headers;
        if (headers["transfer-encoding"] === "chunked") {
          delete headers["transfer-encoding"];
        }
        Object.keys(headers).forEach((h) => {
          if (Array.isArray(headers[h])) {
            if (h.toLowerCase() === "set-cookie") {
              headers[h].forEach((value, i) => {
                headers[binarycase(h, i + 1)] = value;
              });
              delete headers[h];
            } else {
              headers[h] = headers[h].join(",");
            }
          }
        });
        const contentType = getContentType({ contentTypeHeader: headers["content-type"] });
        const isBase64Encoded = isContentTypeBinaryMimeType({ contentType, binaryMimeTypes: server._binaryTypes });
        const body = bodyBuffer.toString(isBase64Encoded ? "base64" : "utf8");
        const successResponse = { statusCode, body, headers, isBase64Encoded };
        resolver.succeed({ response: successResponse });
      });
    }
    function forwardConnectionErrorResponseToApiGateway(error3, resolver) {
      console.log("ERROR: @vendia/serverless-express connection error");
      console.error(error3);
      const errorResponse = {
        statusCode: 502,
        body: "",
        headers: {}
      };
      resolver.succeed({ response: errorResponse });
    }
    function forwardLibraryErrorResponseToApiGateway(error3, resolver) {
      console.log("ERROR: @vendia/serverless-express error");
      console.error(error3);
      const errorResponse = {
        statusCode: 500,
        body: "",
        headers: {}
      };
      resolver.succeed({ response: errorResponse });
    }
    function forwardRequestToNodeServer(server, event, context, resolver) {
      try {
        const requestOptions = mapApiGatewayEventToHttpRequest(event, context, getSocketPath(server._socketPathSuffix));
        const req = http2.request(requestOptions, (response) => forwardResponseToApiGateway(server, response, resolver));
        if (event.body) {
          const body = getEventBody(event);
          req.write(body);
        }
        req.on("error", (error3) => forwardConnectionErrorResponseToApiGateway(error3, resolver)).end();
      } catch (error3) {
        forwardLibraryErrorResponseToApiGateway(error3, resolver);
        return server;
      }
    }
    function startServer(server) {
      return server.listen(getSocketPath(server._socketPathSuffix));
    }
    function getSocketPath(socketPathSuffix) {
      if (/^win/.test(process.platform)) {
        const path = require("path");
        return path.join("\\\\?\\pipe", process.cwd(), `server-${socketPathSuffix}`);
      } else {
        return `/tmp/server-${socketPathSuffix}.sock`;
      }
    }
    function getRandomString() {
      return Math.random().toString(36).substring(2, 15);
    }
    function createServer(requestListener, serverListenCallback, binaryTypes) {
      const server = http2.createServer(requestListener);
      server._socketPathSuffix = getRandomString();
      server._binaryTypes = binaryTypes ? binaryTypes.slice() : [];
      server.on("listening", () => {
        server._isListening = true;
        if (serverListenCallback)
          serverListenCallback();
      });
      server.on("close", () => {
        server._isListening = false;
      }).on("error", (error3) => {
        if (error3.code === "EADDRINUSE") {
          console.warn(`WARNING: Attempting to listen on socket ${getSocketPath(server._socketPathSuffix)}, but it is already in use. This is likely as a result of a previous invocation error or timeout. Check the logs for the invocation(s) immediately prior to this for root cause, and consider increasing the timeout and/or cpu/memory allocation if this is purely as a result of a timeout. @vendia/serverless-express will restart the Node.js server listening on a new port and continue with this request.`);
          server._socketPathSuffix = getRandomString();
          return server.close(() => startServer(server));
        } else {
          console.log("ERROR: server error");
          console.error(error3);
        }
      });
      return server;
    }
    function proxy(server, event, context, resolutionMode, callback) {
      if (!resolutionMode) {
        const resolver = makeResolver({ context, resolutionMode: "CONTEXT_SUCCEED" });
        if (server._isListening) {
          forwardRequestToNodeServer(server, event, context, resolver);
          return server;
        } else {
          return startServer(server).on("listening", () => proxy(server, event, context));
        }
      }
      return {
        promise: new Promise((resolve2, reject) => {
          const promise = {
            resolve: resolve2,
            reject
          };
          const resolver = makeResolver({
            context,
            callback,
            promise,
            resolutionMode
          });
          if (server._isListening) {
            forwardRequestToNodeServer(server, event, context, resolver);
          } else {
            startServer(server).on("listening", () => forwardRequestToNodeServer(server, event, context, resolver));
          }
        })
      };
    }
    function makeResolver(params) {
      return {
        succeed: (params2) => {
          if (params.resolutionMode === "CONTEXT_SUCCEED")
            return params.context.succeed(params2.response);
          if (params.resolutionMode === "CALLBACK")
            return params.callback(null, params2.response);
          if (params.resolutionMode === "PROMISE")
            return params.promise.resolve(params2.response);
        }
      };
    }
    exports.createServer = createServer;
    exports.proxy = proxy;
    if (process.env.NODE_ENV === "test") {
      exports.getPathWithQueryStringParams = getPathWithQueryStringParams;
      exports.mapApiGatewayEventToHttpRequest = mapApiGatewayEventToHttpRequest;
      exports.forwardResponseToApiGateway = forwardResponseToApiGateway;
      exports.forwardConnectionErrorResponseToApiGateway = forwardConnectionErrorResponseToApiGateway;
      exports.forwardLibraryErrorResponseToApiGateway = forwardLibraryErrorResponseToApiGateway;
      exports.forwardRequestToNodeServer = forwardRequestToNodeServer;
      exports.startServer = startServer;
      exports.getSocketPath = getSocketPath;
      exports.makeResolver = makeResolver;
    }
  }
});

// node_modules/@vendia/serverless-express/index.js
var require_serverless_express = __commonJS({
  "node_modules/@vendia/serverless-express/index.js"(exports, module2) {
    init_shims();
    "use strict";
    module2.exports = require_src();
  }
});

// node_modules/aws-serverless-express/src/index.js
var require_src2 = __commonJS({
  "node_modules/aws-serverless-express/src/index.js"(exports) {
    init_shims();
    var serverlessExpress = require_serverless_express();
    exports.createServer = serverlessExpress.createServer;
    exports.proxy = serverlessExpress.proxy;
    if (process.env.NODE_ENV === "test") {
      exports.getPathWithQueryStringParams = serverlessExpress.getPathWithQueryStringParams;
      exports.mapApiGatewayEventToHttpRequest = serverlessExpress.mapApiGatewayEventToHttpRequest;
      exports.forwardResponseToApiGateway = serverlessExpress.forwardResponseToApiGateway;
      exports.forwardConnectionErrorResponseToApiGateway = serverlessExpress.forwardConnectionErrorResponseToApiGateway;
      exports.forwardLibraryErrorResponseToApiGateway = serverlessExpress.forwardLibraryErrorResponseToApiGateway;
      exports.forwardRequestToNodeServer = serverlessExpress.forwardRequestToNodeServer;
      exports.startServer = serverlessExpress.startServer;
      exports.getSocketPath = serverlessExpress.getSocketPath;
      exports.makeResolver = serverlessExpress.makeResolver;
    }
  }
});

// node_modules/aws-serverless-express/index.js
var require_aws_serverless_express = __commonJS({
  "node_modules/aws-serverless-express/index.js"(exports, module2) {
    init_shims();
    "use strict";
    module2.exports = require_src2();
  }
});

// node_modules/@architect/functions/src/http/express/index.js
var require_express = __commonJS({
  "node_modules/@architect/functions/src/http/express/index.js"(exports, module2) {
    init_shims();
    var aws = require_aws_serverless_express();
    module2.exports = function unexpress(app) {
      let server = aws.createServer(app);
      return function http2(event, context, callback) {
        if (process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL) {
          return aws.proxy(server, event, context, "CALLBACK", callback);
        } else {
          return aws.proxy(server, event, context);
        }
      };
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/format/transform.js
var require_transform = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/format/transform.js"(exports, module2) {
    init_shims();
    module2.exports = function transform({ Key, config, isBinary, defaults }) {
      let filetype = Key.split(".").pop();
      let plugins = config.plugins ? config.plugins[filetype] || [] : [];
      if (plugins.length === 0 || isBinary)
        return defaults;
      else {
        defaults.body = defaults.body.toString();
        return plugins.reduce(function run2(response, plugin) {
          let transformer = typeof plugin === "function" ? plugin : require(plugin);
          return transformer(Key, response, config);
        }, defaults);
      }
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/format/templatize.js
var require_templatize = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/format/templatize.js"(exports, module2) {
    init_shims();
    module2.exports = function templatizeResponse(params) {
      let { isBinary, assets: assets2, response, isLocal = false } = params;
      if (isBinary) {
        return response;
      } else {
        let staticRegex = /\${(STATIC|arc\.static)\(.*\)}/g;
        let body = response.body instanceof Buffer ? response.body.toString() : response.body;
        response.body = body.replace(staticRegex, function fingerprint(match) {
          let start = match.startsWith(`\${STATIC(`) ? 10 : 14;
          let Key = match.slice(start, match.length - 3);
          let startsWithSlash = Key.startsWith("/");
          let lookup = startsWithSlash ? Key.substr(1) : Key;
          if (assets2 && assets2[lookup] && !isLocal) {
            Key = assets2[lookup];
            Key = startsWithSlash ? `/${Key}` : Key;
          }
          return Key;
        });
        response.body = Buffer.from(response.body);
        return response;
      }
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/format/compress.js
var require_compress = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/format/compress.js"(exports, module2) {
    init_shims();
    var {
      gzipSync,
      gunzipSync,
      brotliCompressSync,
      brotliDecompressSync,
      deflateSync,
      inflateSync
    } = require("zlib");
    function compressor(direction, type, data) {
      let compress = direction === "compress";
      let exec = {
        gzip: compress ? gzipSync : gunzipSync,
        br: compress ? brotliCompressSync : brotliDecompressSync,
        deflate: compress ? deflateSync : inflateSync
      };
      if (!exec[type])
        throw ReferenceError("Invalid compression type specified, must be gzip, br, or deflate");
      return exec[type](data);
    }
    module2.exports = {
      compress: compressor.bind({}, "compress"),
      decompress: compressor.bind({}, "decompress")
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/format/response.js
var require_response = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/format/response.js"(exports, module2) {
    init_shims();
    var mime = require_mime_types();
    var path = require("path");
    var { compress } = require_compress();
    module2.exports = function normalizeResponse(params) {
      let { response, result, Key, isProxy, contentEncoding, config } = params;
      let noCache = [
        "text/html",
        "application/json",
        "application/vnd.api+json"
      ];
      response.headers = response.headers || {};
      let contentType = response.headers["Content-Type"] || response.headers["content-type"] || result && result.ContentType || mime.contentType(path.extname(Key));
      response.headers["Content-Type"] = contentType;
      let neverCache = noCache.some((n) => contentType.includes(n));
      if (config.cacheControl) {
        response.headers["Cache-Control"] = config.cacheControl;
      } else if (neverCache) {
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0";
      } else if (result && result.CacheControl) {
        response.headers["Cache-Control"] = result.CacheControl;
      } else {
        response.headers["Cache-Control"] = "public, max-age=0, must-revalidate";
      }
      if (config.headers) {
        Object.keys(config.headers).forEach((h) => response.headers[h] = config.headers[h]);
      }
      if (response.headers["content-type"]) {
        response.headers["Content-Type"] = response.headers["content-type"];
        delete response.headers["content-type"];
      }
      if (response.headers["cache-control"]) {
        response.headers["Cache-Control"] = response.headers["cache-control"];
        delete response.headers["cache-control"];
      }
      let notArcSix = !process.env.ARC_CLOUDFORMATION;
      let notArcProxy = !process.env.ARC_HTTP || process.env.ARC_HTTP === "aws";
      let isArcFive = notArcSix && notArcProxy;
      let isHTML = response.headers["Content-Type"].includes("text/html");
      if (isArcFive && isHTML && !isProxy) {
        response.body = Buffer.from(response.body).toString();
        response.type = response.headers["Content-Type"];
      } else {
        if (contentEncoding) {
          response.body = compress(contentEncoding, response.body);
          response.headers["Content-Encoding"] = contentEncoding;
        }
        response.body = Buffer.from(response.body).toString("base64");
        response.isBase64Encoded = true;
      }
      response.headers.ETag = result.ETag;
      return response;
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/read/_pretty.js
var require_pretty = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/read/_pretty.js"(exports, module2) {
    init_shims();
    var aws = require("aws-sdk");
    var { existsSync, readFileSync } = require("fs");
    var { join } = require("path");
    var { httpError } = require_errors();
    module2.exports = async function pretty(params) {
      let { Bucket, Key, assets: assets2, headers, isFolder, prefix } = params;
      let { ARC_LOCAL, ARC_SANDBOX_PATH_TO_STATIC, NODE_ENV } = process.env;
      let local = NODE_ENV === "testing" || ARC_LOCAL;
      let s3 = new aws.S3();
      function getKey(Key2) {
        let lookup = Key2.replace(prefix + "/", "");
        if (assets2 && assets2[lookup]) {
          Key2 = assets2[lookup];
          Key2 = prefix ? `${prefix}/${Key2}` : Key2;
        }
        return Key2;
      }
      async function getLocal(file) {
        let basepath = ARC_SANDBOX_PATH_TO_STATIC;
        if (!file.startsWith(basepath)) {
          file = join(basepath, file);
        }
        if (!existsSync(file)) {
          let err = ReferenceError(`NoSuchKey: ${Key} not found`);
          err.name = "NoSuchKey";
          throw err;
        } else
          return {
            Body: readFileSync(file)
          };
      }
      async function getS3(Key2) {
        return await s3.getObject({ Bucket, Key: Key2 }).promise();
      }
      async function get(file) {
        let getter = local ? getLocal : getS3;
        try {
          return await getter(file);
        } catch (err) {
          if (err.name === "NoSuchKey") {
            err.statusCode = 404;
            return err;
          } else {
            err.statusCode = 500;
            return err;
          }
        }
      }
      if (isFolder && !Key.endsWith("/")) {
        let peek = getKey(`${Key}/index.html`);
        let result2 = await get(peek);
        if (result2.Body) {
          let body = result2.Body.toString();
          return { headers, statusCode: 200, body };
        }
      }
      let notFound = getKey(`404.html`);
      let result = await get(notFound);
      if (result.Body) {
        let body = result.Body.toString();
        return {
          headers: {
            "Content-Type": "text/html; charset=utf8;",
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
          },
          statusCode: 404,
          body
        };
      } else {
        let err = result;
        let { statusCode } = err;
        let title = err.name;
        let message = `
      ${err.message} <pre><b>${Key}</b></pre><br>
      <pre>${err.stack}</pre>
    `;
        return httpError({ statusCode, title, message });
      }
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/read/_local.js
var require_local = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/read/_local.js"(exports, module2) {
    init_shims();
    var { existsSync, readFileSync } = require("fs");
    var { extname, join, sep } = require("path");
    var mime = require_mime_types();
    var crypto = require("crypto");
    var binaryTypes = require_binary_types();
    var { httpError } = require_errors();
    var transform = require_transform();
    var templatizeResponse = require_templatize();
    var normalizeResponse = require_response();
    var pretty = require_pretty();
    module2.exports = async function readLocal(params) {
      let { ARC_SANDBOX_PATH_TO_STATIC, ARC_STATIC_PREFIX, ARC_STATIC_FOLDER } = process.env;
      let { Key, IfNoneMatch, isFolder, isProxy, config } = params;
      let headers = {};
      let response = {};
      let staticAssets;
      let basePath = ARC_SANDBOX_PATH_TO_STATIC || join(process.cwd(), "..", "..", "..", "public");
      let staticManifest = join(basePath, "static.json");
      if (existsSync(staticManifest)) {
        staticAssets = JSON.parse(readFileSync(staticManifest));
      }
      let assets2 = config.assets || staticAssets;
      let filePath = join(basePath, Key);
      let staticPrefix = ARC_STATIC_PREFIX || ARC_STATIC_FOLDER;
      if (filePath.includes(staticPrefix)) {
        filePath = filePath.replace(`${staticPrefix}${sep}`, "");
      }
      try {
        let matchedETag = false;
        let contentType = mime.contentType(extname(Key));
        if (!existsSync(filePath)) {
          if (config.passthru)
            return null;
          return await pretty({ Key: filePath, config, isFolder });
        }
        let body = readFileSync(filePath);
        let ETag = crypto.createHash("sha256").update(body).digest("hex");
        let result = {
          ContentType: contentType,
          ETag
        };
        if (IfNoneMatch === ETag) {
          matchedETag = true;
          headers.ETag = IfNoneMatch;
          response = {
            statusCode: 304,
            headers
          };
        }
        if (!matchedETag) {
          let isBinary = binaryTypes.some((type) => result.ContentType.includes(type) || contentType.includes(type));
          response = transform({
            Key,
            config,
            isBinary,
            defaults: {
              headers,
              body
            }
          });
          response = templatizeResponse({
            isBinary,
            assets: assets2,
            response,
            isLocal: true
          });
          response = normalizeResponse({
            response,
            result,
            Key,
            isProxy,
            config
          });
          response.headers.ETag = result.ETag;
        }
        if (!response.statusCode) {
          response.statusCode = 200;
        }
        return response;
      } catch (err) {
        let notFound = err.name === "NoSuchKey";
        if (notFound) {
          if (config.passthru)
            return null;
          return await pretty({ Key: filePath, config, isFolder });
        } else {
          let title = err.name;
          let message = `
        ${err.message}<br>
        <pre>${err.stack}</pre>
      `;
          return httpError({ statusCode: 500, title, message });
        }
      }
    };
  }
});

// node_modules/@architect/functions/src/http/proxy/read/_s3.js
var require_s3 = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/read/_s3.js"(exports, module2) {
    init_shims();
    var { existsSync, readFileSync } = require("fs");
    var { extname, join } = require("path");
    var mime = require_mime_types();
    var aws = require("aws-sdk");
    var binaryTypes = require_binary_types();
    var { httpError } = require_errors();
    var transform = require_transform();
    var templatizeResponse = require_templatize();
    var normalizeResponse = require_response();
    var pretty = require_pretty();
    var { decompress } = require_compress();
    module2.exports = async function readS3(params) {
      let { Bucket, Key, IfNoneMatch, isFolder, isProxy, config, rootPath } = params;
      let { ARC_STATIC_PREFIX, ARC_STATIC_FOLDER } = process.env;
      let prefix = ARC_STATIC_PREFIX || ARC_STATIC_FOLDER || config.bucket && config.bucket.folder;
      let assets2 = config.assets || staticAssets;
      let headers = {};
      let response = {};
      try {
        let matchedETag = false;
        let s3 = new aws.S3();
        let contentType = mime.contentType(extname(Key));
        let capture = ["text/html", "application/json"];
        let isCaptured = capture.some((type) => contentType.includes(type));
        if (assets2 && assets2[Key] && isCaptured) {
          Key = assets2[Key];
        }
        if (assets2 && assets2[Key] && !isCaptured) {
          let location = rootPath ? `/${rootPath}/_static/${assets2[Key]}` : `/_static/${assets2[Key]}`;
          return {
            statusCode: 302,
            headers: {
              location,
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
            }
          };
        }
        if (prefix) {
          Key = `${prefix}/${Key}`;
        }
        let options2 = { Bucket, Key };
        if (IfNoneMatch) {
          options2.IfNoneMatch = IfNoneMatch;
        }
        let result = await s3.getObject(options2).promise().catch((err) => {
          if (err.code === "NotModified") {
            matchedETag = true;
            headers.ETag = IfNoneMatch;
            response = {
              statusCode: 304,
              headers
            };
          } else {
            throw err;
          }
        });
        if (!matchedETag) {
          let contentEncoding = result.ContentEncoding;
          if (contentEncoding) {
            result.Body = decompress(contentEncoding, result.Body);
          }
          let isBinary = binaryTypes.some((type) => result.ContentType.includes(type) || contentType.includes(type));
          response = transform({
            Key,
            config,
            isBinary,
            defaults: {
              headers,
              body: result.Body
            }
          });
          response = templatizeResponse({
            isBinary,
            assets: assets2,
            response
          });
          response = normalizeResponse({
            response,
            result,
            Key,
            isProxy,
            contentEncoding,
            config
          });
        }
        if (!response.statusCode) {
          response.statusCode = 200;
        }
        return response;
      } catch (err) {
        let notFound = err.name === "NoSuchKey";
        if (notFound) {
          if (config.passthru)
            return null;
          return await pretty({ Bucket, Key, assets: assets2, headers, isFolder, prefix });
        } else {
          let title = err.name;
          let message = `
        ${err.message}<br>
        <pre>${err.stack}</pre>
      `;
          return httpError({ statusCode: 500, title, message });
        }
      }
    };
    var staticAssets;
    var staticManifest = join(process.cwd(), "node_modules", "@architect", "shared", "static.json");
    if (staticAssets === false) {
      null;
    } else if (existsSync(staticManifest) && !staticAssets) {
      staticAssets = JSON.parse(readFileSync(staticManifest));
    } else {
      staticAssets = false;
    }
  }
});

// node_modules/@architect/functions/src/http/proxy/read/index.js
var require_read2 = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/read/index.js"(exports, module2) {
    init_shims();
    var readLocal = require_local();
    var readS3 = require_s3();
    function read2() {
      let { ARC_LOCAL, NODE_ENV } = process.env;
      let local = NODE_ENV === "testing" || ARC_LOCAL;
      return local ? readLocal : readS3;
    }
    module2.exports = read2();
  }
});

// node_modules/@architect/functions/src/http/proxy/index.js
var require_proxy = __commonJS({
  "node_modules/@architect/functions/src/http/proxy/index.js"(exports, module2) {
    init_shims();
    var read2 = require_read2();
    var errors = require_errors();
    function proxy(config = {}) {
      return async function httpProxy(req) {
        let { ARC_STATIC_BUCKET, ARC_STATIC_SPA, NODE_ENV } = process.env;
        let deprecated = req.version === void 0 || req.version === "1.0";
        let isProduction = NODE_ENV === "production";
        let path = deprecated ? req.path : req.rawPath;
        let isFolder = path.split("/").pop().indexOf(".") === -1;
        let Key;
        let configBucket = config.bucket;
        let bucketSetting = isProduction ? configBucket && configBucket["production"] : configBucket && configBucket["staging"];
        let Bucket = ARC_STATIC_BUCKET || bucketSetting;
        if (!Bucket) {
          return errors.proxyConfig;
        }
        let spa = ARC_STATIC_SPA === "false" ? false : config && config.spa;
        if (!spa)
          config.spa = false;
        if (spa) {
          Key = isFolder ? "index.html" : path.substring(1);
        } else {
          let last = path.split("/").filter(Boolean).pop();
          let isFile = last ? last.includes(".") : false;
          let isRoot = path === "/";
          Key = isRoot ? "index.html" : path.substring(1);
          if (isRoot === false && isFile === false) {
            Key = `${Key.replace(/\/$/, "")}/index.html`;
          }
        }
        let aliasing = config && config.alias && config.alias[path];
        if (aliasing) {
          Key = config.alias[path].substring(1);
        }
        if (Key.startsWith("staging/"))
          Key = Key.replace("staging/", "");
        if (Key.startsWith("production/"))
          Key = Key.replace("production/", "");
        let rootPath;
        let reqPath = req.requestContext && req.requestContext.path;
        if (deprecated && reqPath) {
          if (reqPath && reqPath.startsWith("/staging/"))
            rootPath = "staging";
          if (reqPath && reqPath.startsWith("/production/"))
            rootPath = "production";
        }
        let find = (k) => k.toLowerCase() === "if-none-match";
        let IfNoneMatch = req.headers && req.headers[Object.keys(req.headers).find(find)];
        let isProxy = req.resource === "/{proxy+}" || !!req.rawPath;
        return await read2({ Key, Bucket, IfNoneMatch, isFolder, isProxy, config, rootPath });
      };
    }
    module2.exports = {
      proxy,
      read: read2
    };
  }
});

// node_modules/@architect/functions/src/http/index.js
var require_http2 = __commonJS({
  "node_modules/@architect/functions/src/http/index.js"(exports, module2) {
    init_shims();
    var http2 = require_http();
    var bodyParser = require_body_parser();
    var interpolate = require_params();
    var _static = require_static();
    var url2 = require_url();
    var read2 = require_read();
    var write = require_write();
    var _async = require_async();
    var express = require_express();
    var proxy = require_proxy();
    http2.helpers = {
      bodyParser,
      interpolate,
      static: _static,
      url: url2
    };
    http2.session = { read: read2, write };
    http2.async = _async;
    http2.express = express;
    http2.proxy = proxy.proxy;
    http2.proxy.public = proxy.proxy;
    http2.proxy.read = proxy.read;
    http2.middleware = _async;
    module2.exports = http2;
  }
});

// node_modules/@architect/functions/src/discovery/index.js
var require_discovery = __commonJS({
  "node_modules/@architect/functions/src/discovery/index.js"(exports, module2) {
    init_shims();
    var aws = require("aws-sdk");
    var http2 = require("http");
    module2.exports = function lookup(callback) {
      let Path = `/${process.env.ARC_CLOUDFORMATION}`;
      let Recursive = true;
      let values = [];
      let isLocal = process.env.NODE_ENV === "testing";
      let config;
      if (isLocal) {
        let port = process.env.ARC_INTERNAL || 3332;
        let region = process.env.AWS_REGION || "us-west-2";
        config = {
          endpoint: new aws.Endpoint(`http://localhost:${port}/_arc/ssm`),
          region,
          httpOptions: { agent: new http2.Agent() }
        };
      }
      let ssm = new aws.SSM(config);
      function getParams(params) {
        ssm.getParametersByPath(params, function done(err, result) {
          if (err) {
            callback(err);
          } else if (result.NextToken) {
            values = values.concat(result.Parameters);
            getParams({ Path, Recursive, NextToken: result.NextToken });
          } else {
            values = values.concat(result.Parameters);
            callback(null, values.reduce((a, b) => {
              let hierarchy = b.Name.split("/");
              hierarchy.shift();
              hierarchy.shift();
              let type = hierarchy.shift();
              if (!a[type])
                a[type] = {};
              let parent = a[type];
              let child, lastChild, lastParent;
              while (child = hierarchy.shift()) {
                if (!parent[child])
                  parent[child] = {};
                lastParent = parent;
                parent = parent[child];
                lastChild = child;
              }
              lastParent[lastChild] = b.Value;
              return a;
            }, {}));
          }
        });
      }
      getParams({ Path, Recursive });
    };
  }
});

// node_modules/@architect/functions/src/ws/send-sandbox.js
var require_send_sandbox = __commonJS({
  "node_modules/@architect/functions/src/ws/send-sandbox.js"(exports, module2) {
    init_shims();
    var http2 = require("http");
    module2.exports = function send({ id, payload }, callback) {
      let port = process.env.PORT || 3333;
      let body = JSON.stringify({ id, payload });
      let req = http2.request({
        method: "POST",
        port,
        path: "/__arc",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      });
      req.on("error", callback);
      req.on("close", () => callback());
      req.write(body);
      req.end();
    };
  }
});

// node_modules/@architect/functions/src/ws/send.js
var require_send = __commonJS({
  "node_modules/@architect/functions/src/ws/send.js"(exports, module2) {
    init_shims();
    var aws = require("aws-sdk");
    module2.exports = function send({ id, payload }, callback) {
      let endpoint;
      let ARC_WSS_URL = process.env.ARC_WSS_URL;
      if (!ARC_WSS_URL.startsWith("wss://")) {
        endpoint = `https://${ARC_WSS_URL}/${process.env.NODE_ENV}`;
      } else {
        endpoint = `https://${ARC_WSS_URL.replace("wss://", "")}`;
      }
      let api = new aws.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint
      });
      api.postToConnection({
        ConnectionId: id,
        Data: JSON.stringify(payload)
      }, function postToConnection(err) {
        if (err)
          callback(err);
        else
          callback();
      });
    };
  }
});

// node_modules/@architect/functions/src/ws/index.js
var require_ws = __commonJS({
  "node_modules/@architect/functions/src/ws/index.js"(exports, module2) {
    init_shims();
    var sandbox = require_send_sandbox();
    var run2 = require_send();
    module2.exports = function send({ id, payload }, callback) {
      let promise;
      if (!callback) {
        promise = new Promise(function(res, rej) {
          callback = function(err, result) {
            err ? rej(err) : res(result);
          };
        });
      }
      let local = process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL;
      let exec = local ? sandbox : run2;
      exec({
        id,
        payload
      }, callback);
      return promise;
    };
  }
});

// node_modules/run-waterfall/index.js
var require_run_waterfall = __commonJS({
  "node_modules/run-waterfall/index.js"(exports, module2) {
    init_shims();
    module2.exports = runWaterfall;
    function runWaterfall(tasks, cb) {
      var current = 0;
      var isSync = true;
      function done(err, args) {
        function end() {
          args = args ? [].concat(err, args) : [err];
          if (cb)
            cb.apply(void 0, args);
        }
        if (isSync)
          process.nextTick(end);
        else
          end();
      }
      function each2(err) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (++current >= tasks.length || err) {
          done(err, args);
        } else {
          tasks[current].apply(void 0, [].concat(args, each2));
        }
      }
      if (tasks.length) {
        tasks[0](each2);
      } else {
        done(null);
      }
      isSync = false;
    }
  }
});

// node_modules/@architect/functions/src/tables/old.js
var require_old = __commonJS({
  "node_modules/@architect/functions/src/tables/old.js"(exports, module2) {
    init_shims();
    var parallel = require_run_parallel();
    function __trigger(types2, handler2) {
      return function __lambdaSignature(evt, ctx) {
        var handlers = evt.Records.map(function(record) {
          return function __actualHandler(callback) {
            var isInvoking = types2.indexOf(record.eventName) > -1;
            if (isInvoking) {
              handler2(record, callback);
            } else {
              callback();
            }
          };
        });
        parallel(handlers, function __processedRecords(err, results) {
          if (err) {
            ctx.fail(err);
          } else {
            ctx.succeed(results);
          }
        });
      };
    }
    module2.exports = {
      insert: __trigger.bind({}, ["INSERT"]),
      modify: __trigger.bind({}, ["MODIFY"]),
      update: __trigger.bind({}, ["MODIFY"]),
      remove: __trigger.bind({}, ["REMOVE"]),
      destroy: __trigger.bind({}, ["REMOVE"]),
      all: __trigger.bind({}, ["INSERT", "MODIFY", "REMOVE"]),
      save: __trigger.bind({}, ["INSERT", "MODIFY"]),
      change: __trigger.bind({}, ["INSERT", "REMOVE"])
    };
  }
});

// node_modules/@architect/functions/src/tables/promisify-object.js
var require_promisify_object = __commonJS({
  "node_modules/@architect/functions/src/tables/promisify-object.js"(exports, module2) {
    init_shims();
    module2.exports = function pfy(obj) {
      var copy = {};
      Object.keys(obj).forEach((k) => {
        copy[k] = promised(obj[k]);
      });
      return copy;
    };
    function promised(fn) {
      return function _promisified(params, callback) {
        if (!callback) {
          return new Promise(function(res, rej) {
            fn(params, function(err, result) {
              err ? rej(err) : res(result);
            });
          });
        } else {
          fn(params, callback);
        }
      };
    }
  }
});

// node_modules/@architect/functions/src/tables/factory.js
var require_factory = __commonJS({
  "node_modules/@architect/functions/src/tables/factory.js"(exports, module2) {
    init_shims();
    var dynamo = require_dynamo();
    var promisify = require_promisify_object();
    var parallel = require_run_parallel();
    module2.exports = function reflectFactory(tables, callback) {
      let { db, doc } = dynamo;
      parallel({ db, doc }, function done(err, { db: db2, doc: doc2 }) {
        if (err)
          throw err;
        else {
          let factory2 = function(TableName) {
            return promisify({
              delete(key, callback2) {
                let params = {};
                params.TableName = TableName;
                params.Key = key;
                doc2.delete(params, callback2);
              },
              get(key, callback2) {
                let params = {};
                params.TableName = TableName;
                params.Key = key;
                doc2.get(params, function _get(err2, result) {
                  if (err2)
                    callback2(err2);
                  else
                    callback2(null, result.Item);
                });
              },
              put(item, callback2) {
                let params = {};
                params.TableName = TableName;
                params.Item = item;
                doc2.put(params, function _put(err2) {
                  if (err2)
                    callback2(err2);
                  else
                    callback2(null, item);
                });
              },
              query(params, callback2) {
                params.TableName = TableName;
                doc2.query(params, callback2);
              },
              scan(params, callback2) {
                params.TableName = TableName;
                doc2.scan(params, callback2);
              },
              update(params, callback2) {
                params.TableName = TableName;
                doc2.update(params, callback2);
              }
            });
          };
          var factory = factory2;
          let data = Object.keys(tables).reduce((client, tablename) => {
            client[tablename] = factory2(tables[tablename]);
            return client;
          }, {});
          Object.defineProperty(data, "_db", {
            enumerable: false,
            value: db2
          });
          Object.defineProperty(data, "_doc", {
            enumerable: false,
            value: doc2
          });
          data.reflect = async function reflect() {
            return tables;
          };
          let _name = (name) => tables[name];
          data.name = _name;
          data._name = _name;
          callback(null, data);
        }
      });
    };
  }
});

// node_modules/@architect/functions/src/tables/sandbox.js
var require_sandbox = __commonJS({
  "node_modules/@architect/functions/src/tables/sandbox.js"(exports, module2) {
    init_shims();
    var promisifyObject = require_promisify_object();
    var parallel = require_run_parallel();
    var stagingTables = (tbl) => !tbl.includes("-production-");
    function client(doc, TableName) {
      let client2 = {
        delete(key, callback) {
          let params = {};
          params.TableName = TableName;
          params.Key = key;
          doc.delete(params, callback);
        },
        get(key, callback) {
          let params = {};
          params.TableName = TableName;
          params.Key = key;
          doc.get(params, function _get(err, result) {
            if (err) {
              callback(err);
            } else {
              callback(null, result.Item);
            }
          });
        },
        put(item, callback) {
          let params = {};
          params.TableName = TableName;
          params.Item = item;
          doc.put(params, function _put(err) {
            if (err) {
              callback(err);
            } else {
              callback(null, item);
            }
          });
        },
        query(params, callback) {
          params.TableName = TableName;
          doc.query(params, callback);
        },
        scan(params, callback) {
          params.TableName = TableName;
          doc.scan(params, callback);
        },
        update(params, callback) {
          params.TableName = TableName;
          doc.update(params, callback);
        }
      };
      return promisifyObject(client2);
    }
    module2.exports = function sandbox(dynamo, callback) {
      function done(err, results) {
        if (err) {
          return callback(err);
        }
        const db = results[0];
        const doc = results[1];
        db.listTables({}, function listed(err2, result) {
          if (err2) {
            return callback(err2);
          }
          const tables = result.TableNames.filter(stagingTables);
          const data = {};
          const tableMap = {};
          tables.forEach((fullTableName) => {
            const tableName = fullTableName.replace(/.+-staging-/, "");
            tableMap[tableName] = fullTableName;
            data[tableName] = client(doc, fullTableName);
          });
          Object.defineProperty(data, "_db", {
            enumerable: false,
            value: db
          });
          Object.defineProperty(data, "_doc", {
            enumerable: false,
            value: doc
          });
          data.reflect = async () => tableMap;
          let _name = (tableName) => tableMap[tableName];
          data.name = _name;
          data._name = _name;
          callback(null, data);
        });
      }
      parallel([dynamo.db, dynamo.doc], done);
    };
  }
});

// node_modules/@architect/functions/src/tables/index.js
var require_tables = __commonJS({
  "node_modules/@architect/functions/src/tables/index.js"(exports, module2) {
    init_shims();
    var waterfall = require_run_waterfall();
    var old = require_old();
    var factory = require_factory();
    var sandbox = require_sandbox();
    var dynamo = require_dynamo();
    var client = false;
    function tables(arc2) {
      function api(callback) {
        let promise;
        if (!callback) {
          promise = new Promise(function ugh(res, rej) {
            callback = function errback(err, result) {
              if (err)
                rej(err);
              else
                res(result);
            };
          });
        }
        let runningLocally = process.env.NODE_ENV === "testing";
        if (runningLocally) {
          sandbox(dynamo, callback);
        } else if (client) {
          callback(null, client);
        } else {
          waterfall([
            function(callback2) {
              arc2.services().then(function(serviceMap) {
                callback2(null, serviceMap.tables);
              }).catch(callback2);
            },
            factory,
            function(created, callback2) {
              client = created;
              callback2(null, client);
            }
          ], callback);
        }
        return promise;
      }
      api.doc = dynamo.direct.doc;
      api.db = dynamo.direct.db;
      api.insert = old.insert;
      api.modify = old.modify;
      api.update = old.update;
      api.remove = old.remove;
      api.destroy = old.destroy;
      api.all = old.all;
      api.save = old.save;
      api.change = old.change;
      return api;
    }
    module2.exports = tables;
  }
});

// node_modules/@architect/functions/src/queues/publish-old.js
var require_publish_old = __commonJS({
  "node_modules/@architect/functions/src/queues/publish-old.js"(exports, module2) {
    init_shims();
    var http2 = require("http");
    var waterfall = require_run_waterfall();
    var aws = require("aws-sdk");
    module2.exports = function _publish(params, callback) {
      if (!params.name)
        throw ReferenceError("missing params.name");
      if (!params.payload)
        throw ReferenceError("missing params.payload");
      let name = `${process.env.ARC_APP_NAME}-${process.env.NODE_ENV}-${params.name}`;
      let payload = params.payload;
      let promise;
      if (!callback) {
        promise = new Promise((resolve2, reject) => {
          callback = function errback(err, result) {
            err ? reject(err) : resolve2(result);
          };
        });
      }
      let local = process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL;
      if (local) {
        let port = process.env.ARC_EVENTS_PORT || 3334;
        let req = http2.request({
          method: "POST",
          port,
          path: "/queues"
        }, function done(res) {
          let data = [];
          res.resume();
          res.on("data", (chunk) => data.push(chunk));
          res.on("end", () => {
            let body = Buffer.concat(data).toString();
            let code = `${res.statusCode}`;
            if (!code.startsWith(2))
              callback(Error(`${body} (${code})`));
            else
              callback(null, body);
          });
        });
        req.write(JSON.stringify(params));
        req.end("\n");
      } else {
        let sqs = new aws.SQS();
        waterfall([
          function reads(callback2) {
            sqs.getQueueUrl({
              QueueName: name
            }, callback2);
          },
          function publishes(result, callback2) {
            let QueueUrl = result.QueueUrl;
            let DelaySeconds = params.delaySeconds || 0;
            sqs.sendMessage({
              QueueUrl,
              DelaySeconds,
              MessageBody: JSON.stringify(payload)
            }, callback2);
          }
        ], function _published(err, result) {
          if (err)
            throw err;
          callback(null, result);
        });
      }
      return promise;
    };
  }
});

// node_modules/@architect/functions/src/queues/subscribe.js
var require_subscribe = __commonJS({
  "node_modules/@architect/functions/src/queues/subscribe.js"(exports, module2) {
    init_shims();
    var parallel = require_run_parallel();
    module2.exports = function _subscribe(fn) {
      if (fn.constructor.name === "AsyncFunction") {
        return async function lambda(event) {
          return await Promise.all(event.Records.map(async (record) => {
            try {
              let result = JSON.parse(record.body);
              return await fn(result);
            } catch (e) {
              console.log("Queue subscribe error:", e);
              throw e;
            }
          }));
        };
      } else {
        return function _lambdaSignature(evt, ctx, callback) {
          parallel(evt.Records.map(function _iterator(record) {
            return function _actualHandler(callback2) {
              try {
                fn(JSON.parse(record.body), callback2);
              } catch (e) {
                callback2(e);
              }
            };
          }), callback);
        };
      }
    };
  }
});

// node_modules/@architect/functions/src/queues/publish-sandbox.js
var require_publish_sandbox = __commonJS({
  "node_modules/@architect/functions/src/queues/publish-sandbox.js"(exports, module2) {
    init_shims();
    var http2 = require("http");
    module2.exports = function sandbox(params, callback) {
      let port = process.env.ARC_EVENTS_PORT || 3334;
      let req = http2.request({
        method: "POST",
        port,
        path: "/queues"
      }, function done(res) {
        let data = [];
        res.resume();
        res.on("data", (chunk) => data.push(chunk));
        res.on("end", () => {
          let body = Buffer.concat(data).toString();
          let code = `${res.statusCode}`;
          if (!code.startsWith(2))
            callback(Error(`${body} (${code})`));
          else
            callback(null, body);
        });
      });
      req.write(JSON.stringify(params));
      req.end("\n");
    };
  }
});

// node_modules/@architect/functions/src/queues/publish-queue.js
var require_publish_queue = __commonJS({
  "node_modules/@architect/functions/src/queues/publish-queue.js"(exports, module2) {
    init_shims();
    var aws = require("aws-sdk");
    var ledger = {};
    module2.exports = function liveFactory(arc2) {
      return function live({ name, payload, delaySeconds, groupID }, callback) {
        function publish(QueueUrl, payload2, callback2) {
          let sqs = new aws.SQS();
          let params = {
            QueueUrl,
            DelaySeconds: delaySeconds || 0,
            MessageBody: JSON.stringify(payload2)
          };
          if (QueueUrl.endsWith(".fifo")) {
            params.MessageGroupId = groupID || name;
          }
          sqs.sendMessage(params, callback2);
        }
        function cacheLedgerAndPublish(serviceMap) {
          ledger = serviceMap.queues;
          if (!ledger[name])
            callback(ReferenceError(`${name} queue not found`));
          else
            publish(ledger[name], payload, callback);
        }
        let arn = ledger[name];
        if (arn) {
          publish(ledger[name], payload, callback);
        } else {
          arc2.services().then(cacheLedgerAndPublish).catch(callback);
        }
      };
    };
  }
});

// node_modules/@architect/functions/src/queues/publish.js
var require_publish = __commonJS({
  "node_modules/@architect/functions/src/queues/publish.js"(exports, module2) {
    init_shims();
    var sandbox = require_publish_sandbox();
    var queueFactory = require_publish_queue();
    module2.exports = function publishFactory(arc2) {
      let queue = queueFactory(arc2);
      return function publish(params, callback) {
        if (!params.name)
          throw ReferenceError("missing params.name");
        if (!params.payload)
          throw ReferenceError("missing params.payload");
        let promise;
        if (!callback) {
          promise = new Promise((resolve2, reject) => {
            callback = function errback(err, result) {
              err ? reject(err) : resolve2(result);
            };
          });
        }
        let isLocal = process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL;
        let exec = isLocal ? sandbox : queue;
        exec(params, callback);
        return promise;
      };
    };
  }
});

// node_modules/@architect/functions/src/queues/index.js
var require_queues = __commonJS({
  "node_modules/@architect/functions/src/queues/index.js"(exports, module2) {
    init_shims();
    var oldPublish = require_publish_old();
    var subscribe2 = require_subscribe();
    var publishFactory = require_publish();
    module2.exports = function queueFactory(arc2) {
      let publish = publishFactory(arc2);
      return {
        publish(params, callback) {
          if (process.env.ARC_CLOUDFORMATION) {
            return publish(params, callback);
          } else {
            return oldPublish(params, callback);
          }
        },
        subscribe: subscribe2
      };
    };
  }
});

// node_modules/@architect/functions/src/events/publish-old.js
var require_publish_old2 = __commonJS({
  "node_modules/@architect/functions/src/events/publish-old.js"(exports, module2) {
    init_shims();
    var http2 = require("http");
    var aws = require("aws-sdk");
    var sns = new aws.SNS();
    var ledger = {};
    function __publish(arn, payload, callback) {
      sns.publish({
        TopicArn: arn,
        Message: JSON.stringify(payload)
      }, function _published(err, result) {
        if (err)
          throw err;
        callback(null, result);
      });
    }
    module2.exports = function _publish(params, callback) {
      if (!params.name)
        throw ReferenceError("missing params.name");
      if (!params.payload)
        throw ReferenceError("missing params.payload");
      let promise;
      if (!callback) {
        promise = new Promise((resolve2, reject) => {
          callback = function errback(err, result) {
            err ? reject(err) : resolve2(result);
          };
        });
      }
      let isLocal = process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL;
      let exec = isLocal ? _local : _live;
      exec(params, callback);
      return promise;
    };
    function _live(params, callback) {
      let { name, payload } = params;
      let arn = ledger[name];
      if (arn) {
        __publish(ledger[name], payload, callback);
      } else {
        let override = params.app;
        let eventName = `${override ? params.app : process.env.ARC_APP_NAME}-${process.env.NODE_ENV}-${name}`;
        _scan({ eventName }, function _scan2(err, found) {
          if (err)
            throw err;
          ledger[name] = found;
          __publish(ledger[name], payload, callback);
        });
      }
    }
    function _local(params, callback) {
      let port = process.env.ARC_EVENTS_PORT || 3334;
      let req = http2.request({
        method: "POST",
        port,
        path: "/events"
      }, function done(res) {
        let data = [];
        res.resume();
        res.on("data", (chunk) => data.push(chunk));
        res.on("end", () => {
          let body = Buffer.concat(data).toString();
          let code = `${res.statusCode}`;
          if (!code.startsWith(2))
            callback(Error(`${body} (${code})`));
          else
            callback(null, body);
        });
      });
      req.write(JSON.stringify(params));
      req.end("\n");
    }
    function _scan({ eventName }, callback) {
      let sns2 = new aws.SNS();
      (function __scanner(params = {}, callback2) {
        sns2.listTopics(params, function _listTopics(err, results) {
          if (err)
            throw err;
          let found = results.Topics.find((t) => {
            let bits = t.TopicArn.split(":");
            let it = bits[bits.length - 1];
            return it === eventName;
          });
          if (found) {
            callback2(null, found.TopicArn);
          } else if (results.NextToken) {
            setTimeout(() => {
              __scanner({ NextToken: results.NextToken }, callback2);
            }, 50);
          } else {
            callback2(Error(`topic ${eventName} not found`));
          }
        });
      })({}, callback);
    }
  }
});

// node_modules/@architect/functions/src/events/subscribe.js
var require_subscribe2 = __commonJS({
  "node_modules/@architect/functions/src/events/subscribe.js"(exports, module2) {
    init_shims();
    var parallel = require_run_parallel();
    var fallback = {
      Records: [
        { Sns: { Message: JSON.stringify({}) } }
      ]
    };
    module2.exports = function _subscribe(fn) {
      if (fn.constructor.name === "AsyncFunction") {
        return async function lambda(event) {
          event = event && Object.keys(event).length ? event : fallback;
          return await Promise.all(event.Records.map(async (record) => {
            try {
              let result = JSON.parse(record.Sns.Message);
              return await fn(result);
            } catch (e) {
              console.log("Event subscribe error:", e);
              throw e;
            }
          }));
        };
      } else {
        return function _lambdaSignature(event, context, callback) {
          event = event && Object.keys(event).length ? event : fallback;
          parallel(event.Records.map(function _iterator(record) {
            return function _actualHandler(callback2) {
              try {
                fn(JSON.parse(record.Sns.Message), callback2);
              } catch (e) {
                callback2(e);
              }
            };
          }), callback);
        };
      }
    };
  }
});

// node_modules/@architect/functions/src/events/publish-sandbox.js
var require_publish_sandbox2 = __commonJS({
  "node_modules/@architect/functions/src/events/publish-sandbox.js"(exports, module2) {
    init_shims();
    var http2 = require("http");
    module2.exports = function publishLocal(params, callback) {
      let port = process.env.ARC_EVENTS_PORT || 3334;
      let req = http2.request({
        method: "POST",
        port,
        path: "/events"
      }, function done(res) {
        let data = [];
        res.resume();
        res.on("data", (chunk) => data.push(chunk));
        res.on("end", () => {
          let body = Buffer.concat(data).toString();
          let code = `${res.statusCode}`;
          if (!code.startsWith(2))
            callback(Error(`${body} (${code})`));
          else
            callback(null, body);
        });
      });
      req.write(JSON.stringify(params));
      req.end("\n");
    };
  }
});

// node_modules/@architect/functions/src/events/publish-topic.js
var require_publish_topic = __commonJS({
  "node_modules/@architect/functions/src/events/publish-topic.js"(exports, module2) {
    init_shims();
    var aws = require("aws-sdk");
    var ledger = {};
    module2.exports = function liveFactory(arc2) {
      return function live({ name, payload }, callback) {
        function publish(arn2, payload2, callback2) {
          let sns = new aws.SNS();
          sns.publish({
            TopicArn: arn2,
            Message: JSON.stringify(payload2)
          }, callback2);
        }
        function cacheLedgerAndPublish(serviceMap) {
          ledger = serviceMap.events;
          if (!ledger[name])
            callback(ReferenceError(`${name} event not found`));
          else
            publish(ledger[name], payload, callback);
        }
        let arn = ledger[name];
        if (arn) {
          publish(ledger[name], payload, callback);
        } else {
          arc2.services().then(cacheLedgerAndPublish).catch(callback);
        }
      };
    };
  }
});

// node_modules/@architect/functions/src/events/publish.js
var require_publish2 = __commonJS({
  "node_modules/@architect/functions/src/events/publish.js"(exports, module2) {
    init_shims();
    var sandbox = require_publish_sandbox2();
    var topicFactory = require_publish_topic();
    module2.exports = function publishFactory(arc2) {
      let topic = topicFactory(arc2);
      return function publish(params, callback) {
        if (!params.name)
          throw ReferenceError("missing params.name");
        if (!params.payload)
          throw ReferenceError("missing params.payload");
        let promise;
        if (!callback) {
          promise = new Promise((resolve2, reject) => {
            callback = function errback(err, result) {
              err ? reject(err) : resolve2(result);
            };
          });
        }
        let isLocal = process.env.NODE_ENV === "testing" || process.env.ARC_LOCAL;
        let exec = isLocal ? sandbox : topic;
        exec(params, callback);
        return promise;
      };
    };
  }
});

// node_modules/@architect/functions/src/events/index.js
var require_events = __commonJS({
  "node_modules/@architect/functions/src/events/index.js"(exports, module2) {
    init_shims();
    var oldPublish = require_publish_old2();
    var subscribe2 = require_subscribe2();
    var publishFactory = require_publish2();
    module2.exports = function eventFactory(arc2) {
      let publish = publishFactory(arc2);
      return {
        publish(params, callback) {
          if (process.env.ARC_CLOUDFORMATION) {
            return publish(params, callback);
          } else {
            return oldPublish(params, callback);
          }
        },
        subscribe: subscribe2
      };
    };
  }
});

// node_modules/@architect/functions/src/index.js
var require_src3 = __commonJS({
  "node_modules/@architect/functions/src/index.js"(exports, module2) {
    init_shims();
    var env = process.env.NODE_ENV;
    var isNotStagingOrProd = env !== "staging" && env !== "production";
    if (!env || isNotStagingOrProd) {
      process.env.NODE_ENV = "testing";
    }
    var http2 = require_http2();
    var _static = require_static();
    var serviceDiscovery = require_discovery();
    var services;
    var send = require_ws();
    var arc2 = {
      http: http2,
      static: _static,
      ws: { send },
      services: function() {
        return new Promise(function(resolve2, reject) {
          if (services)
            resolve2(services);
          else
            serviceDiscovery(function(err, serviceMap) {
              if (err)
                reject(err);
              else {
                services = serviceMap;
                resolve2(services);
              }
            });
        });
      }
    };
    arc2.tables = require_tables()(arc2);
    arc2.queues = require_queues()(arc2);
    arc2.events = require_events()(arc2);
    arc2.proxy = {};
    arc2.proxy.public = http2.proxy.public;
    arc2.middleware = http2.middleware;
    module2.exports = arc2;
  }
});

// .svelte-kit/begin/entry.js
__export(exports, {
  handler: () => handler,
  svelteHandler: () => svelteHandler
});
init_shims();
var import_url2 = __toModule(require("url"));

// .svelte-kit/output/server/app.js
init_shims();
var __require2 = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error$1(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return;
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error$1(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error$1(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
var subscriber_queue$1 = [];
function writable$1(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue$1.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue$1.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue$1.length; i += 2) {
            subscriber_queue$1[i][0](subscriber_queue$1[i + 1]);
          }
          subscriber_queue$1.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error22,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error22) {
    error22.stack = options2.get_stack(error22);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded: loaded2, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url2) => css2.add(url2));
      if (node.js)
        node.js.forEach((url2) => js.add(url2));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded2.maxage;
    });
    const session = writable$1($session);
    const props = {
      stores: {
        page: writable$1(null),
        navigating: writable$1(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error22)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url: url2, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url2}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error22) {
  if (!error22)
    return null;
  let serialized = try_serialize(error22);
  if (!serialized) {
    const { name, message, stack } = error22;
    serialized = try_serialize({ ...error22, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded2) {
  const has_error_status = loaded2.status && loaded2.status >= 400 && loaded2.status <= 599 && !loaded2.redirect;
  if (loaded2.error || has_error_status) {
    const status = loaded2.status;
    if (!loaded2.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error22 = typeof loaded2.error === "string" ? new Error(loaded2.error) : loaded2.error;
    if (!(error22 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error22}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error22 };
    }
    return { status, error: error22 };
  }
  if (loaded2.redirect) {
    if (!loaded2.status || Math.floor(loaded2.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded2.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded2;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error22
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded2;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url2;
        if (typeof resource === "string") {
          url2 = resource;
        } else {
          url2 = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url2.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url2.includes("?") ? url2.slice(url2.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url2,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url2}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url2);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url2, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url: url2,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error22;
    }
    loaded2 = await module2.load.call(null, load_input);
  } else {
    loaded2 = {};
  }
  if (!loaded2 && is_leaf && !is_error)
    return;
  if (!loaded2) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded2),
    context: loaded2.context || context,
    fetched,
    uses_credentials
  };
}
var escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error22 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded2 = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded2,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded2 ? loaded2.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error22
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error22,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error22;
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded2;
        if (node) {
          try {
            loaded2 = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded2)
              return;
            if (loaded2.loaded.redirect) {
              return {
                status: loaded2.loaded.status,
                headers: {
                  location: encodeURI(loaded2.loaded.redirect)
                }
              };
            }
            if (loaded2.loaded.error) {
              ({ status, error: error22 } = loaded2.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error22 = e;
          }
          if (loaded2 && !error22) {
            branch.push(loaded2);
          }
          if (error22) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error22
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error22
            });
          }
        }
        if (loaded2 && loaded2.loaded.context) {
          context = {
            ...context,
            ...loaded2.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      ...opts,
      page_config,
      status,
      error: error22,
      branch: branch.filter(Boolean)
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    });
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  constructor(map) {
    __privateAdd(this, _map, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of __privateGet(this, _map))
      yield key;
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
_map = new WeakMap();
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(request2.path);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$c = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$c);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
var base = "";
var assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU" crossorigin="anonymous">\n		<link rel="stylesheet" href="stylesheets/main.css" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-/bQdsTh/da6pkI1MST/rWKFNjaCP5gBSY4sEBT38Q/9RBh9AH40zEOg7Hlq2THRZ" crossorigin="anonymous"><\/script>\n		<div style="justify-content: center;" id="svelte">' + body + "</div>\n	</body>\n</html>\n\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-790f4740.js",
      css: [assets + "/_app/assets/start-464e9d0a.css"],
      js: [assets + "/_app/start-790f4740.js", assets + "/_app/chunks/vendor-0d868d72.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22, request) => {
      hooks.handleError({ error: error22, request });
      error22.stack = options.get_stack(error22);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/projects\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/projects.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/music\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/music.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/other\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/other.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/art\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/art.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error22 }) => console.error(error22.stack)),
  externalFetch: hooks.externalFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/projects.svelte": () => Promise.resolve().then(function() {
    return projects;
  }),
  "src/routes/music.svelte": () => Promise.resolve().then(function() {
    return music;
  }),
  "src/routes/other.svelte": () => Promise.resolve().then(function() {
    return other;
  }),
  "src/routes/art.svelte": () => Promise.resolve().then(function() {
    return art;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-075e3acd.js", "css": ["assets/pages/__layout.svelte-8ee189c1.css"], "js": ["pages/__layout.svelte-075e3acd.js", "chunks/vendor-0d868d72.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-84b05a18.js", "css": [], "js": ["error.svelte-84b05a18.js", "chunks/vendor-0d868d72.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-f77ffc74.js", "css": ["assets/pages/index.svelte-1de6e17a.css", "assets/footer-8107bb67.css"], "js": ["pages/index.svelte-f77ffc74.js", "chunks/vendor-0d868d72.js", "chunks/footer-307d44f1.js", "chunks/dbArt-b9c8fcdc.js", "chunks/dbMusic-ce4f969e.js", "chunks/dbProjects-a54810ee.js"], "styles": [] }, "src/routes/projects.svelte": { "entry": "pages/projects.svelte-00d5fa49.js", "css": ["assets/pages/projects.svelte-7d2ac603.css", "assets/footer-8107bb67.css"], "js": ["pages/projects.svelte-00d5fa49.js", "chunks/vendor-0d868d72.js", "chunks/footer-307d44f1.js", "chunks/dbProjects-a54810ee.js"], "styles": [] }, "src/routes/music.svelte": { "entry": "pages/music.svelte-e1888047.js", "css": ["assets/pages/music.svelte-23dacfaa.css", "assets/footer-8107bb67.css"], "js": ["pages/music.svelte-e1888047.js", "chunks/vendor-0d868d72.js", "chunks/footer-307d44f1.js", "chunks/dbMusic-ce4f969e.js"], "styles": [] }, "src/routes/other.svelte": { "entry": "pages/other.svelte-af6a5c2c.js", "css": ["assets/pages/other.svelte-1ceca582.css", "assets/footer-8107bb67.css"], "js": ["pages/other.svelte-af6a5c2c.js", "chunks/vendor-0d868d72.js", "chunks/footer-307d44f1.js"], "styles": [] }, "src/routes/art.svelte": { "entry": "pages/art.svelte-91be3176.js", "css": ["assets/pages/art.svelte-cc6c1208.css", "assets/footer-8107bb67.css"], "js": ["pages/art.svelte-91be3176.js", "chunks/vendor-0d868d72.js", "chunks/footer-307d44f1.js", "chunks/dbArt-b9c8fcdc.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var css$b = {
  code: ":root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}.spacing.svelte-t4nk2{margin-top:300px}",
  map: '{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script>\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"spacing\\"></div>\\r\\n<slot></slot>\\r\\n\\r\\n\\r\\n\\r\\n<style>:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}.spacing{margin-top:300px}</style>"],"names":[],"mappings":"AAQO,KAAK,CAAC,iBAAiB,IAAI,CAAC,YAAY,aAAa,CAAC,kBAAkB,CAAC,KAAK,CAAC,EAAE,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,CAAC,SAAS,CAAC,IAAI,CAAC,IAAI,CAAC,SAAS,CAAC,IAAI,CAAC,UAAU,CAAC,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC,qBAAQ,CAAC,WAAW,KAAK,CAAC"}'
};
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$b);
  return `<div class="${"spacing svelte-t4nk2"}"></div>
${slots.default ? slots.default({}) : ``}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape(status)}</h1>

<pre>${escape(error22.message)}</pre>



${error22.frame ? `<pre>${escape(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load
});
var css$a = {
  code: "h1.svelte-10qhhvt{color:#fff;font-family:Courier New,monospace;font-size:4rem;font-weight:100;line-height:1.1;text-transform:uppercase}div.svelte-10qhhvt{align-items:center;background-color:#000;display:flex;height:125px;justify-content:center;width:100%}.blink_me.svelte-10qhhvt{-webkit-animation:svelte-10qhhvt-blinker 1s linear infinite;animation:svelte-10qhhvt-blinker 1s linear infinite}@-webkit-keyframes svelte-10qhhvt-blinker{50%{opacity:0}}@keyframes svelte-10qhhvt-blinker{50%{opacity:0}}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}",
  map: `{"version":3,"file":"hello.svelte","sources":["hello.svelte"],"sourcesContent":["<script>\\r\\n  import { fly, slide } from 'svelte/transition';\\r\\n  import { quintOut } from 'svelte/easing';\\r\\n\\r\\n  function typewriter(node, { speed = 1 }) {\\r\\n\\t\\tconst valid = (\\r\\n\\t\\t\\tnode.childNodes.length === 1 &&\\r\\n\\t\\t\\tnode.childNodes[0].nodeType === Node.TEXT_NODE\\r\\n\\t\\t);\\r\\n\\r\\n\\t\\tif (!valid) {\\r\\n\\t\\t\\tthrow new Error(\`This transition only works on elements with a single text node child\`);\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\tconst text = node.textContent;\\r\\n\\t\\tconst duration = text.length / (speed * 0.005);\\r\\n\\r\\n\\t\\treturn {\\r\\n\\t\\t\\tduration,\\r\\n\\t\\t\\ttick: t => {\\r\\n\\t\\t\\t\\tconst i = ~~(text.length * t);\\r\\n\\t\\t\\t\\tnode.textContent = text.slice(0, i);\\r\\n\\t\\t\\t}\\r\\n\\t\\t};\\r\\n\\t}\\r\\n<\/script>\\r\\n\\r\\n<div>\\r\\n  <h1 in:typewriter>Hey</h1><h1 class=\\"blink_me\\">|</h1>\\r\\n</div>\\r\\n<style>h1{color:#fff;font-family:Courier New,monospace;font-size:4rem;font-weight:100;line-height:1.1;text-transform:uppercase}div{align-items:center;background-color:#000;display:flex;height:125px;justify-content:center;width:100%}.blink_me{-webkit-animation:blinker 1s linear infinite;animation:blinker 1s linear infinite}@-webkit-keyframes blinker{50%{opacity:0}}@keyframes blinker{50%{opacity:0}}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}</style>"],"names":[],"mappings":"AA8BO,iBAAE,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC,UAAU,IAAI,CAAC,YAAY,GAAG,CAAC,YAAY,GAAG,CAAC,eAAe,SAAS,CAAC,kBAAG,CAAC,YAAY,MAAM,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,OAAO,KAAK,CAAC,gBAAgB,MAAM,CAAC,MAAM,IAAI,CAAC,wBAAS,CAAC,kBAAkB,sBAAO,CAAC,EAAE,CAAC,MAAM,CAAC,QAAQ,CAAC,UAAU,sBAAO,CAAC,EAAE,CAAC,MAAM,CAAC,QAAQ,CAAC,mBAAmB,sBAAO,CAAC,GAAG,CAAC,QAAQ,CAAC,CAAC,CAAC,WAAW,sBAAO,CAAC,GAAG,CAAC,QAAQ,CAAC,CAAC,CAAC,KAAK,CAAC,iBAAiB,IAAI,CAAC,YAAY,aAAa,CAAC,kBAAkB,CAAC,KAAK,CAAC,EAAE,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,CAAC,SAAS,CAAC,IAAI,CAAC,IAAI,CAAC,SAAS,CAAC,IAAI,CAAC,UAAU,CAAC,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC"}`
};
var Hello = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$a);
  return `<div class="${"svelte-10qhhvt"}"><h1 class="${"svelte-10qhhvt"}">Hey</h1><h1 class="${"blink_me svelte-10qhhvt"}">|</h1>
</div>`;
});
var css$9 = {
  code: ".wrapper.svelte-dielzd{align-items:center;display:flex;justify-content:center;min-height:125px;width:100%}.wrapper.svelte-dielzd,button.svelte-dielzd{background-color:#000}button.svelte-dielzd{border:.1em solid #fff;border-radius:.12em;box-sizing:border-box;color:#fff;display:inline-block;font-family:Courier New,monospace;font-weight:300;margin:0 70px;padding:.75em 1.2em;text-align:center;text-decoration:none;transition:all .2s;width:auto}button.svelte-dielzd:hover{background-color:#fff;border:.3em solid #fff;color:#000}",
  map: '{"version":3,"file":"header.svelte","sources":["header.svelte"],"sourcesContent":["<script>\\r\\n\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"wrapper navbar fixed-top navbar-toggleable-md\\">\\r\\n    <a href=\\"/\\"><button >Home</button></a>\\r\\n    <a href=\\"/projects\\"><button >Projects</button></a>\\r\\n    <a href=\\"/music\\"><button >Music</button></a>\\r\\n    <a href=\\"/art\\"><button >Fine Art</button></a>\\r\\n</div>\\r\\n\\r\\n<style>.wrapper{align-items:center;display:flex;justify-content:center;min-height:125px;width:100%}.wrapper,button{background-color:#000}button{border:.1em solid #fff;border-radius:.12em;box-sizing:border-box;color:#fff;display:inline-block;font-family:Courier New,monospace;font-weight:300;margin:0 70px;padding:.75em 1.2em;text-align:center;text-decoration:none;transition:all .2s;width:auto}button:hover{background-color:#fff;border:.3em solid #fff;color:#000}</style>"],"names":[],"mappings":"AAWO,sBAAQ,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,WAAW,KAAK,CAAC,MAAM,IAAI,CAAC,sBAAQ,CAAC,oBAAM,CAAC,iBAAiB,IAAI,CAAC,oBAAM,CAAC,OAAO,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,KAAK,CAAC,WAAW,UAAU,CAAC,MAAM,IAAI,CAAC,QAAQ,YAAY,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC,YAAY,GAAG,CAAC,OAAO,CAAC,CAAC,IAAI,CAAC,QAAQ,KAAK,CAAC,KAAK,CAAC,WAAW,MAAM,CAAC,gBAAgB,IAAI,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,MAAM,IAAI,CAAC,oBAAM,MAAM,CAAC,iBAAiB,IAAI,CAAC,OAAO,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,IAAI,CAAC"}'
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$9);
  return `<div class="${"wrapper navbar fixed-top navbar-toggleable-md svelte-dielzd"}"><a href="${"/"}"><button class="${"svelte-dielzd"}">Home</button></a>
    <a href="${"/projects"}"><button class="${"svelte-dielzd"}">Projects</button></a>
    <a href="${"/music"}"><button class="${"svelte-dielzd"}">Music</button></a>
    <a href="${"/art"}"><button class="${"svelte-dielzd"}">Fine Art</button></a>
</div>`;
});
var css$8 = {
  code: ".wrapper.svelte-1tjht53{align-items:center;background-color:#000;display:flex;height:125px;justify-content:center;width:100%}p.svelte-1tjht53{color:#fff;font-family:Courier New,monospace}",
  map: '{"version":3,"file":"footer.svelte","sources":["footer.svelte"],"sourcesContent":["<script>\\r\\n\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"wrapper\\">\\r\\n    <p>Oladipupo Ogundipe Copyright\xA9 2021</p>\\r\\n</div>\\r\\n\\r\\n<style>.wrapper{align-items:center;background-color:#000;display:flex;height:125px;justify-content:center;width:100%}p{color:#fff;font-family:Courier New,monospace}</style>"],"names":[],"mappings":"AAQO,uBAAQ,CAAC,YAAY,MAAM,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,OAAO,KAAK,CAAC,gBAAgB,MAAM,CAAC,MAAM,IAAI,CAAC,gBAAC,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC"}'
};
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$8);
  return `<div class="${"wrapper svelte-1tjht53"}"><p class="${"svelte-1tjht53"}">Oladipupo Ogundipe Copyright\xA9 2021</p>
</div>`;
});
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
var loaded = writable(false);
var css$7 = {
  code: ".wrapper.svelte-11i1pag{background-color:#000;color:#fff;display:flex;margin-top:20px;width:100%}.intro.svelte-11i1pag,.wrapper.svelte-11i1pag{align-items:center;justify-content:center}.intro.svelte-11i1pag{float:left;font-family:Courier New,Courier,monospace;height:70%;justify-self:center;width:70%}img.svelte-11i1pag{float:left;height:30%;margin:5px;min-height:140px;min-width:200px;width:30%}.mov.svelte-11i1pag{color:#fff;font-family:Courier New,Courier,monospace;font-size:25px;text-align:justify;text-align:center}h2.svelte-11i1pag{display:inline-block;transition:transform .3s cubic-bezier(.155,1.105,.295,1.12)}h2.svelte-11i1pag:hover{transform:scale(1.1)}a.svelte-11i1pag{text-decoration:none}.kit.svelte-11i1pag{color:#ff3e00}.express.svelte-11i1pag{color:#417e38}.pure.svelte-11i1pag{color:#a4d4e8}.mongo.svelte-11i1pag{color:#13aa52}.boot.svelte-11i1pag{color:#7952b3}.type.svelte-11i1pag{color:#3178c6}.javascript.svelte-11i1pag{color:#fcdc00}",
  map: '{"version":3,"file":"introduction.svelte","sources":["introduction.svelte"],"sourcesContent":["<script lang=\\"ts\\">var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport { fly } from \\"svelte/transition\\";\\r\\nimport { loaded } from \\"../stores/loadedIcon\\";\\r\\nlet runAni = false;\\r\\n(() => __awaiter(void 0, void 0, void 0, function* () {\\r\\n    const img = new Image();\\r\\n    img.src = \\"https://drive.google.com/uc?id=1puNagIXyYtNyVqkaFIZQ8M-OsOsR6mPW\\";\\r\\n    yield img.decode();\\r\\n    // img is ready to use\\r\\n    if ($loaded) {\\r\\n        runAni = true;\\r\\n    }\\r\\n    setTimeout(() => {\\r\\n        runAni = true;\\r\\n        loaded.set(true);\\r\\n    }, 1000);\\r\\n}))();\\r\\n<\/script>\\r\\n\\r\\n{#if runAni}\\r\\n<div  class=\\"wrapper\\">\\r\\n    <div class=\\"intro\\" in:fly=\\"{{ y: 50, duration: 2000 }}\\">\\r\\n        <div>\\r\\n            <img src=\\"https://drive.google.com/uc?id=1puNagIXyYtNyVqkaFIZQ8M-OsOsR6mPW\\" id=\\"me\\" alt=\\"me\\"/>\\r\\n        </div>\\r\\n        <div class=\\"mov\\">\\r\\n            My name is Oladipupo Ogundipe. I graduated from Denison University with a degree in Computer Science and minor in Music Composition.\\r\\n            I am a software engineer, musician, thinker and artist. This site was made with <h2><a href=\\"https://kit.svelte.dev\\" class=\\"kit\\">SvelteKit</h2>\\r\\n            for the frontend. <h2><a href=\\"https://expressjs.com\\" class=\\"express\\">ExpressJS</a></h2> for the backend.\\r\\n            <h2><a href=\\"https://www.mongodb.com\\" class=\\"mongo\\">MongoDB</a></h2> for database storage. <h2><a href=\\"https://getbootstrap.com\\" class=\\"boot\\">Bootstrap</a></h2>\\r\\n            and <h2><a href=\\"https://purecss.io\\" class=\\"pure\\">PureCSS</a></h2> for styling. With <h2><a href=\\"https://www.typescriptlang.org\\" class=\\"type\\">Typescript</a></h2>\\r\\n            and <h2><a href=\\"https://www.javascript.com\\" class=\\"javascript\\">Javascript</a></h2> as the coding languages of choice. If you want to get in touch, enter your name, email, and \\r\\n            phone number below and I will reach back to you when I can. You can also call or email me.\\r\\n        </div>\\r\\n    </div>   \\r\\n</div>\\r\\n{/if}\\r\\n\\r\\n<style>.wrapper{background-color:#000;color:#fff;display:flex;margin-top:20px;width:100%}.intro,.wrapper{align-items:center;justify-content:center}.intro{float:left;font-family:Courier New,Courier,monospace;height:70%;justify-self:center;width:70%}img{float:left;height:30%;margin:5px;min-height:140px;min-width:200px;width:30%}.mov{color:#fff;font-family:Courier New,Courier,monospace;font-size:25px;text-align:justify;text-align:center}h2{display:inline-block;transition:transform .3s cubic-bezier(.155,1.105,.295,1.12)}h2:hover{transform:scale(1.1)}a{text-decoration:none}.kit{color:#ff3e00}.express{color:#417e38}.pure{color:#a4d4e8}.mongo{color:#13aa52}.boot{color:#7952b3}.type{color:#3178c6}.javascript{color:#fcdc00}</style>"],"names":[],"mappings":"AA8CO,uBAAQ,CAAC,iBAAiB,IAAI,CAAC,MAAM,IAAI,CAAC,QAAQ,IAAI,CAAC,WAAW,IAAI,CAAC,MAAM,IAAI,CAAC,qBAAM,CAAC,uBAAQ,CAAC,YAAY,MAAM,CAAC,gBAAgB,MAAM,CAAC,qBAAM,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,SAAS,CAAC,OAAO,GAAG,CAAC,aAAa,MAAM,CAAC,MAAM,GAAG,CAAC,kBAAG,CAAC,MAAM,IAAI,CAAC,OAAO,GAAG,CAAC,OAAO,GAAG,CAAC,WAAW,KAAK,CAAC,UAAU,KAAK,CAAC,MAAM,GAAG,CAAC,mBAAI,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,SAAS,CAAC,UAAU,IAAI,CAAC,WAAW,OAAO,CAAC,WAAW,MAAM,CAAC,iBAAE,CAAC,QAAQ,YAAY,CAAC,WAAW,SAAS,CAAC,GAAG,CAAC,aAAa,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,iBAAE,MAAM,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,gBAAC,CAAC,gBAAgB,IAAI,CAAC,mBAAI,CAAC,MAAM,OAAO,CAAC,uBAAQ,CAAC,MAAM,OAAO,CAAC,oBAAK,CAAC,MAAM,OAAO,CAAC,qBAAM,CAAC,MAAM,OAAO,CAAC,oBAAK,CAAC,MAAM,OAAO,CAAC,oBAAK,CAAC,MAAM,OAAO,CAAC,0BAAW,CAAC,MAAM,OAAO,CAAC"}'
};
var Introduction = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $loaded, $$unsubscribe_loaded;
  $$unsubscribe_loaded = subscribe(loaded, (value) => $loaded = value);
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  let runAni = false;
  (() => __awaiter(void 0, void 0, void 0, function* () {
    const img = new Image();
    img.src = "https://drive.google.com/uc?id=1puNagIXyYtNyVqkaFIZQ8M-OsOsR6mPW";
    yield img.decode();
    if ($loaded) {
      runAni = true;
    }
    setTimeout(() => {
      runAni = true;
      loaded.set(true);
    }, 1e3);
  }))();
  $$result.css.add(css$7);
  $$unsubscribe_loaded();
  return `${runAni ? `<div class="${"wrapper svelte-11i1pag"}"><div class="${"intro svelte-11i1pag"}"><div><img src="${"https://drive.google.com/uc?id=1puNagIXyYtNyVqkaFIZQ8M-OsOsR6mPW"}" id="${"me"}" alt="${"me"}" class="${"svelte-11i1pag"}"></div>
        <div class="${"mov svelte-11i1pag"}">My name is Oladipupo Ogundipe. I graduated from Denison University with a degree in Computer Science and minor in Music Composition.
            I am a software engineer, musician, thinker and artist. This site was made with <h2 class="${"svelte-11i1pag"}"><a href="${"https://kit.svelte.dev"}" class="${"kit svelte-11i1pag"}">SvelteKit</a></h2>
            for the frontend. <h2 class="${"svelte-11i1pag"}"><a href="${"https://expressjs.com"}" class="${"express svelte-11i1pag"}">ExpressJS</a></h2> for the backend.
            <h2 class="${"svelte-11i1pag"}"><a href="${"https://www.mongodb.com"}" class="${"mongo svelte-11i1pag"}">MongoDB</a></h2> for database storage. <h2 class="${"svelte-11i1pag"}"><a href="${"https://getbootstrap.com"}" class="${"boot svelte-11i1pag"}">Bootstrap</a></h2>
            and <h2 class="${"svelte-11i1pag"}"><a href="${"https://purecss.io"}" class="${"pure svelte-11i1pag"}">PureCSS</a></h2> for styling. With <h2 class="${"svelte-11i1pag"}"><a href="${"https://www.typescriptlang.org"}" class="${"type svelte-11i1pag"}">Typescript</a></h2>
            and <h2 class="${"svelte-11i1pag"}"><a href="${"https://www.javascript.com"}" class="${"javascript svelte-11i1pag"}">Javascript</a></h2> as the coding languages of choice. If you want to get in touch, enter your name, email, and 
            phone number below and I will reach back to you when I can. You can also call or email me.
        </div></div></div>` : ``}`;
});
var css$6 = {
  code: ".wrapper.svelte-1juvoyi{margin-top:5%}.sub.svelte-1juvoyi,.wrapper.svelte-1juvoyi{align-items:center;background-color:#000;display:flex;flex-wrap:wrap;justify-content:center;width:100%}h1.svelte-1juvoyi{font-size:70px}.colorText.svelte-1juvoyi,h1.svelte-1juvoyi{color:#fff;font-family:Courier New,Courier,monospace}.b.svelte-1juvoyi{background-color:#000;border:.1em solid #fff;border-radius:.12em;box-sizing:border-box;color:#fff;display:inline-block;font-family:Courier New,monospace;font-weight:300;margin:1% 70px 0;padding:.75em 1.2em;text-align:center;text-decoration:none;transition:all .2s;width:auto}.b.svelte-1juvoyi:hover{background-color:#fff;border:.3em solid #fff;color:#000}",
  map: `{"version":3,"file":"contactme.svelte","sources":["contactme.svelte"],"sourcesContent":["<script lang=\\"ts\\" >var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\\r\\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\\r\\n    return new (P || (P = Promise))(function (resolve, reject) {\\r\\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\\r\\n        function rejected(value) { try { step(generator[\\"throw\\"](value)); } catch (e) { reject(e); } }\\r\\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\\r\\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\\r\\n    });\\r\\n};\\r\\nimport { fly, fade } from \\"svelte/transition\\";\\r\\nimport { loaded } from \\"../stores/loadedIcon\\";\\r\\n$: name = \\"\\";\\r\\n$: email = \\"\\";\\r\\n$: phone = \\"\\";\\r\\n$: msg = \\"\\";\\r\\n$: contact = { \\"name\\": name, \\"email\\": email, \\"phone\\": phone, \\"msg\\": msg };\\r\\n$: sent = false;\\r\\nfunction send() {\\r\\n    return __awaiter(this, void 0, void 0, function* () {\\r\\n        yield fetch(\\"http://127.0.0.1:8080/api/v1/sendContact\\", {\\r\\n            method: \\"Post\\",\\r\\n            mode: 'no-cors',\\r\\n            credentials: 'omit',\\r\\n            body: new URLSearchParams(contact),\\r\\n            headers: {\\r\\n                //'Content-Type': 'application/json'\\r\\n                'Content-Type': 'application/x-www-form-urlencoded',\\r\\n            },\\r\\n        }).then(() => { sent = true; });\\r\\n    });\\r\\n}\\r\\nlet y = 0;\\r\\nlet runAni = false;\\r\\n$: if (y > 500 && $loaded) {\\r\\n    runAni = true;\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY={y} />\\r\\n\\r\\n{#if runAni && $loaded}\\r\\n<div  class=\\"wrapper\\"  in:fly=\\"{{ y: 50, duration: 2000 }}\\">\\r\\n    <h1>Contact Me</h1>\\r\\n</div>\\r\\n<div class=\\"wrapper\\"  in:fly=\\"{{ y: 50, duration: 2000 }}\\">\\r\\n    <div style=\\"margin-right:7%\\">\\r\\n        <ul>\\r\\n            <h4 class=\\"colorText\\">Phone: +1 (617) 322 4097</h4>\\r\\n            <h4 class=\\"colorText\\">Email: Oladipupo.Ogundipe@gmail.com</h4>\\r\\n        </ul>\\r\\n    </div>\\r\\n    <div style=\\"width: 50%\\">\\r\\n    <form class=\\"mb-5\\" action=\\"#\\" id=\\"contactForm\\" name=\\"contactForm\\">\\r\\n        <div class=\\"col-md-12 form-group\\">\\r\\n            <label for=\\"name\\" class=\\"col-form-label colorText\\">Name</label>\\r\\n            <input type=\\"text\\" class=\\"form-control\\" name=\\"name\\" id=\\"name\\" bind:value={name}>\\r\\n        </div>\\r\\n        <div class=\\"col-md-12 form-group\\">\\r\\n            <label for=\\"email\\" class=\\"col-form-label colorText\\">Email</label>\\r\\n            <input type=\\"text\\" class=\\"form-control\\" name=\\"email\\" id=\\"email\\" bind:value={email}>\\r\\n        </div>\\r\\n        <div class=\\"col-md-12 form-group\\">\\r\\n            <label for=\\"phone\\" class=\\"col-form-label colorText\\">Phone</label>\\r\\n            <input type=\\"text\\" class=\\"form-control\\" name=\\"phone\\" id=\\"phone\\" bind:value={phone}>\\r\\n        </div>\\r\\n        <div class=\\"col-md-12 form-group\\">\\r\\n            <label for=\\"message\\" class=\\"col-form-label colorText\\">Message</label>\\r\\n            <textarea class=\\"form-control\\" name=\\"message\\" id=\\"message\\" cols=\\"30\\" rows=\\"7\\" bind:value={msg}></textarea>\\r\\n        </div>\\r\\n        <div class=\\"sub\\">\\r\\n            <input type=\\"button\\" value=\\"Send Message\\" class=\\"btn btn-primary rounded-0 py-2 px-4 b\\" on:click={send}>\\r\\n\\r\\n        </div>\\r\\n    </form>\\r\\n    \\r\\n\\r\\n    {#if sent}\\r\\n    <div id=\\"form-message-warning mt-4\\" in:fade></div>\\r\\n    <div style=\\"color:rgb(19,170,82);\\" id=\\"form-message-success\\">\\r\\n        Your message was sent, thank you!\\r\\n    </div>\\r\\n    {/if}\\r\\n    </div>\\r\\n    \\r\\n\\r\\n\\r\\n</div>\\r\\n{/if}\\r\\n<style>.wrapper{margin-top:5%}.sub,.wrapper{align-items:center;background-color:#000;display:flex;flex-wrap:wrap;justify-content:center;width:100%}h1{font-size:70px}.colorText,h1{color:#fff;font-family:Courier New,Courier,monospace}.b{background-color:#000;border:.1em solid #fff;border-radius:.12em;box-sizing:border-box;color:#fff;display:inline-block;font-family:Courier New,monospace;font-weight:300;margin:1% 70px 0;padding:.75em 1.2em;text-align:center;text-decoration:none;transition:all .2s;width:auto}.b:hover{background-color:#fff;border:.3em solid #fff;color:#000}</style>"],"names":[],"mappings":"AAwFO,uBAAQ,CAAC,WAAW,EAAE,CAAC,mBAAI,CAAC,uBAAQ,CAAC,YAAY,MAAM,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,UAAU,IAAI,CAAC,gBAAgB,MAAM,CAAC,MAAM,IAAI,CAAC,iBAAE,CAAC,UAAU,IAAI,CAAC,yBAAU,CAAC,iBAAE,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,SAAS,CAAC,iBAAE,CAAC,iBAAiB,IAAI,CAAC,OAAO,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,KAAK,CAAC,WAAW,UAAU,CAAC,MAAM,IAAI,CAAC,QAAQ,YAAY,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC,YAAY,GAAG,CAAC,OAAO,EAAE,CAAC,IAAI,CAAC,CAAC,CAAC,QAAQ,KAAK,CAAC,KAAK,CAAC,WAAW,MAAM,CAAC,gBAAgB,IAAI,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,MAAM,IAAI,CAAC,iBAAE,MAAM,CAAC,iBAAiB,IAAI,CAAC,OAAO,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,MAAM,IAAI,CAAC"}`
};
var Contactme = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_loaded;
  $$unsubscribe_loaded = subscribe(loaded, (value) => value);
  (function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  });
  $$result.css.add(css$6);
  $$unsubscribe_loaded();
  return `

${``}`;
});
var css$5 = {
  code: ".wrapper.svelte-iwqrwu{align-items:center;background-color:#000;display:flex;justify-content:center;margin-top:5%;width:100%}a.svelte-iwqrwu{height:4%;margin-left:5%;margin-right:5%;transition:transform .3s cubic-bezier(.155,1.105,.295,1.12);width:4%}a.svelte-iwqrwu:hover{transform:scale(1.1)}",
  map: '{"version":3,"file":"socials.svelte","sources":["socials.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { fly } from \\"svelte/transition\\";\\r\\nimport { loaded } from \\"../stores/loadedIcon\\";\\r\\nlet y = 0;\\r\\nlet runAni = false;\\r\\n$: if (y > 250 && $loaded) {\\r\\n    runAni = true;\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY={y}/>\\r\\n\\r\\n{#if runAni && $loaded}\\r\\n<div class=\\"wrapper\\"  in:fly=\\"{{ y: 50, duration: 2000 }}\\">\\r\\n    <a href=\\"https://www.linkedin.com/in/oladipupoogundipe/\\">\\r\\n        <svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"50\\" height=\\"50\\" fill=\\"white\\" class=\\"bi bi-linkedin\\" viewBox=\\"0 0 16 16\\">\\r\\n            <path d=\\"M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z\\"/>\\r\\n          </svg>\\r\\n    </a>\\r\\n    <a href=\\"https://github.com/Oladipupo\\">\\r\\n        <svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"50\\" height=\\"50\\" fill=\\"rgb(240,246,252)\\" class=\\"bi bi-github\\" viewBox=\\"0 0 16 16\\">\\r\\n            <path d=\\"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z\\"/>\\r\\n        </svg>\\r\\n    </a>\\r\\n    <a href=\\"https://www.instagram.com/imyouridal/\\">\\r\\n        <svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"50\\" height=\\"50\\" fill=\\"white\\" class=\\"bi bi-instagram\\" viewBox=\\"0 0 16 16\\">\\r\\n            <path d=\\"M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z\\"/>\\r\\n          </svg>\\r\\n    </a>\\r\\n    \\r\\n    <a href=\\"https://www.discordapp.com/users/0028\\">\\r\\n        <svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"50\\" height=\\"50\\" fill=\\"white\\" class=\\"bi bi-discord\\" viewBox=\\"0 0 16 16\\">\\r\\n            <path d=\\"M6.552 6.712c-.456 0-.816.4-.816.888s.368.888.816.888c.456 0 .816-.4.816-.888.008-.488-.36-.888-.816-.888zm2.92 0c-.456 0-.816.4-.816.888s.368.888.816.888c.456 0 .816-.4.816-.888s-.36-.888-.816-.888z\\"/>\\r\\n            <path d=\\"M13.36 0H2.64C1.736 0 1 .736 1 1.648v10.816c0 .912.736 1.648 1.64 1.648h9.072l-.424-1.48 1.024.952.968.896L15 16V1.648C15 .736 14.264 0 13.36 0zm-3.088 10.448s-.288-.344-.528-.648c1.048-.296 1.448-.952 1.448-.952-.328.216-.64.368-.92.472-.4.168-.784.28-1.16.344a5.604 5.604 0 0 1-2.072-.008 6.716 6.716 0 0 1-1.176-.344 4.688 4.688 0 0 1-.584-.272c-.024-.016-.048-.024-.072-.04-.016-.008-.024-.016-.032-.024-.144-.08-.224-.136-.224-.136s.384.64 1.4.944c-.24.304-.536.664-.536.664-1.768-.056-2.44-1.216-2.44-1.216 0-2.576 1.152-4.664 1.152-4.664 1.152-.864 2.248-.84 2.248-.84l.08.096c-1.44.416-2.104 1.048-2.104 1.048s.176-.096.472-.232c.856-.376 1.536-.48 1.816-.504.048-.008.088-.016.136-.016a6.521 6.521 0 0 1 4.024.752s-.632-.6-1.992-1.016l.112-.128s1.096-.024 2.248.84c0 0 1.152 2.088 1.152 4.664 0 0-.68 1.16-2.448 1.216z\\"/>\\r\\n        </svg>\\r\\n    </a>\\r\\n</div>\\r\\n{/if}\\r\\n\\r\\n<style>.wrapper{align-items:center;background-color:#000;display:flex;justify-content:center;margin-top:5%;width:100%}a{height:4%;margin-left:5%;margin-right:5%;transition:transform .3s cubic-bezier(.155,1.105,.295,1.12);width:4%}a:hover{transform:scale(1.1)}</style>\\r\\n"],"names":[],"mappings":"AAsCO,sBAAQ,CAAC,YAAY,MAAM,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,WAAW,EAAE,CAAC,MAAM,IAAI,CAAC,eAAC,CAAC,OAAO,EAAE,CAAC,YAAY,EAAE,CAAC,aAAa,EAAE,CAAC,WAAW,SAAS,CAAC,GAAG,CAAC,aAAa,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,MAAM,EAAE,CAAC,eAAC,MAAM,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC"}'
};
var Socials = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_loaded;
  $$unsubscribe_loaded = subscribe(loaded, (value) => value);
  $$result.css.add(css$5);
  $$unsubscribe_loaded();
  return `

${``}`;
});
var pieces = writable([]);
var fetchPieces = async () => {
  const url2 = "https://oladipupo.io/api/v1/getart";
  const res = await fetch(url2);
  const data = await res.json();
  const loadedPieces = data.map((data2, index2) => {
    return {
      name: data2.name,
      img: data2.img,
      des: data2.des,
      link: data2.link
    };
  });
  pieces.set(loadedPieces);
};
fetchPieces();
var music$1 = writable([]);
var fetchProjects$1 = async () => {
  const url2 = "https://oladipupo.io/api/v1/getmusic";
  const res = await fetch(url2);
  const data = await res.json();
  const loadedProjects = data.map((data2, index2) => {
    return {
      name: data2.name,
      img: data2.img,
      link: data2.link
    };
  });
  music$1.set(loadedProjects);
};
fetchProjects$1();
var fetchProjects = async () => {
  const url2 = "https://oladipupo.io/api/v1/getproject";
  const res = await fetch(url2);
  const data = await res.json();
  const loadedProjects = data.map((data2) => {
    return {
      name: data2.name,
      img: data2.img,
      des: data2.des,
      git: data2.git
    };
  });
  projects$1.set(loadedProjects);
};
fetchProjects();
var projects$1 = writable([]);
var css$4 = {
  code: "div.svelte-3mxne4{background-color:#000;margin:0 auto;min-height:1400px;text-align:center}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Hello from '../components/hello.svelte';\\r\\nimport Header from \\"../components/header.svelte\\";\\r\\nimport Footer from \\"../components/footer.svelte\\";\\r\\nimport '../components/dbConnectionTest.svelte';\\r\\nimport Introduction from '../components/introduction.svelte';\\r\\nimport Contactme from '../components/contactme.svelte';\\r\\nimport Socials from '../components/socials.svelte';\\r\\nimport { pieces } from \\"../stores/dbArt\\";\\r\\nimport { music } from \\"../stores/dbMusic\\";\\r\\nimport { projects } from \\"../stores/dbProjects\\";\\r\\nfunction load() {\\r\\n    $pieces;\\r\\n    $music;\\r\\n    $projects;\\r\\n}\\r\\nload();\\r\\n<\/script>\\n\\n<Header></Header>\\n<div>\\n  <Hello />\\n  <Introduction />\\n  <Socials />\\n  <Contactme />\\n\\n</div>\\n <!--<DbConnectionTest />-->\\n  \\n  \\n  \\n <Footer></Footer>\\n  <style>div{background-color:#000;margin:0 auto;min-height:1400px;text-align:center}</style>\\n  "],"names":[],"mappings":"AA+BS,iBAAG,CAAC,iBAAiB,IAAI,CAAC,OAAO,CAAC,CAAC,IAAI,CAAC,WAAW,MAAM,CAAC,WAAW,MAAM,CAAC"}`
};
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_projects;
  let $$unsubscribe_music;
  let $$unsubscribe_pieces;
  $$unsubscribe_projects = subscribe(projects$1, (value) => value);
  $$unsubscribe_music = subscribe(music$1, (value) => value);
  $$unsubscribe_pieces = subscribe(pieces, (value) => value);
  $$result.css.add(css$4);
  $$unsubscribe_projects();
  $$unsubscribe_music();
  $$unsubscribe_pieces();
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
<div class="${"svelte-3mxne4"}">${validate_component(Hello, "Hello").$$render($$result, {}, {}, {})}
  ${validate_component(Introduction, "Introduction").$$render($$result, {}, {}, {})}
  ${validate_component(Socials, "Socials").$$render($$result, {}, {}, {})}
  ${validate_component(Contactme, "Contactme").$$render($$result, {}, {}, {})}</div>
 
  
  
  
 ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
var css$3 = {
  code: ".wrapper.svelte-x5yyi1{background-color:#000;display:flex;justify-content:center;padding-bottom:10%;width:100%}.card.svelte-x5yyi1:hover{box-shadow:0 10px 20px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.06);transform:scale(1.05)}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}",
  map: `{"version":3,"file":"projects.svelte","sources":["projects.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Header from \\"../components/header.svelte\\";\\r\\nimport Footer from \\"../components/footer.svelte\\";\\r\\nimport { fly } from \\"svelte/transition\\";\\r\\nimport { projects } from \\"../stores/dbProjects\\";\\r\\n<\/script>\\r\\n\\r\\n<Header></Header>\\r\\n<div class=\\"wrapper\\"><h1 style=\\"color: white; font-family:'Courier New', Courier, monospace\\">Projects</h1></div>\\r\\n<div class=\\"wrapper\\">\\r\\n    <div class=\\"container\\">\\r\\n        <div class=\\"row row-cols-1 row-cols-lg-2\\">\\r\\n        \\r\\n        {#each $projects as project}\\r\\n                <div class=\\"col\\">\\r\\n                <div class=\\"card\\" in:fly style=\\"border-color: white;  min-height: 275px ;border-width:1px; transition: .3s transform cubic-bezier(.155,1.105,.295,1.12); background-color:black\\">\\r\\n                    <a href=\\"{project.git}\\" class=\\"stretched-link\\"><img class=\\"card-img mx-auto\\" style=\\"width: 100%; min-height: 275px;\\"src=\\"{project.img}\\" alt=\\"\\"></a>\\r\\n                </div>\\r\\n                <h5 style=\\"color:white; text-align: center; font-family:'Courier New', Courier, monospace\\" >{project.name}</h5>\\r\\n            </div> \\r\\n        {/each}\\r\\n\\r\\n        </div>\\r\\n    </div>\\r\\n</div>\\r\\n<Footer></Footer>\\r\\n<style>.wrapper{background-color:#000;display:flex;justify-content:center;padding-bottom:10%;width:100%}.card:hover{box-shadow:0 10px 20px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.06);transform:scale(1.05)}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}</style>"],"names":[],"mappings":"AAyBO,sBAAQ,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,eAAe,GAAG,CAAC,MAAM,IAAI,CAAC,mBAAK,MAAM,CAAC,WAAW,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,UAAU,MAAM,IAAI,CAAC,CAAC,KAAK,CAAC,iBAAiB,IAAI,CAAC,YAAY,aAAa,CAAC,kBAAkB,CAAC,KAAK,CAAC,EAAE,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,CAAC,SAAS,CAAC,IAAI,CAAC,IAAI,CAAC,SAAS,CAAC,IAAI,CAAC,UAAU,CAAC,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC"}`
};
var Projects = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $projects, $$unsubscribe_projects;
  $$unsubscribe_projects = subscribe(projects$1, (value) => $projects = value);
  $$result.css.add(css$3);
  $$unsubscribe_projects();
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
<div class="${"wrapper svelte-x5yyi1"}"><h1 style="${"color: white; font-family:'Courier New', Courier, monospace"}">Projects</h1></div>
<div class="${"wrapper svelte-x5yyi1"}"><div class="${"container"}"><div class="${"row row-cols-1 row-cols-lg-2"}">${each($projects, (project) => `<div class="${"col"}"><div class="${"card svelte-x5yyi1"}" style="${"border-color: white; min-height: 275px ;border-width:1px; transition: .3s transform cubic-bezier(.155,1.105,.295,1.12); background-color:black"}"><a${add_attribute("href", project.git, 0)} class="${"stretched-link"}"><img class="${"card-img mx-auto"}" style="${"width: 100%; min-height: 275px;"}"${add_attribute("src", project.img, 0)} alt="${""}"></a></div>
                <h5 style="${"color:white; text-align: center; font-family:'Courier New', Courier, monospace"}">${escape(project.name)}</h5>
            </div>`)}</div></div></div>
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var projects = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Projects
});
var css$2 = {
  code: ".wrapper.svelte-3xti9t{background-color:#000;display:flex;justify-content:center;padding-bottom:10%;width:100%}.card.svelte-3xti9t:hover{box-shadow:0 10px 20px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.06);transform:scale(1.05)}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}.sp.svelte-3xti9t{align-items:center;align-self:center;display:none;justify-content:center;opacity:0;transition:all .2s linear}",
  map: '{"version":3,"file":"music.svelte","sources":["music.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Header from \\"../components/header.svelte\\";\\r\\nimport Footer from \\"../components/footer.svelte\\";\\r\\nimport { fly } from \\"svelte/transition\\";\\r\\nimport { music } from \\"../stores/dbMusic\\";\\r\\nclass Project {\\r\\n    constructor(name, img, link) {\\r\\n        this.name = \\"\\";\\r\\n        this.img = \\"\\";\\r\\n        this.link = \\"\\";\\r\\n        this.clicked = false;\\r\\n        this.name = name;\\r\\n        this.img = img;\\r\\n        this.link = link;\\r\\n    }\\r\\n}\\r\\nfunction click(p) {\\r\\n    if (!p.clicked) {\\r\\n        document.getElementById(`project${p.name}`).style.display = \\"inline\\";\\r\\n        setTimeout(() => {\\r\\n            document.getElementById(`project${p.name}`).style.opacity = \\"1\\";\\r\\n        }, 100);\\r\\n        p.clicked = true;\\r\\n    }\\r\\n    else {\\r\\n        document.getElementById(`project${p.name}`).style.opacity = \\"0\\";\\r\\n        setTimeout(() => {\\r\\n            document.getElementById(`project${p.name}`).style.display = \\"none\\";\\r\\n        }, 200);\\r\\n        p.clicked = false;\\r\\n    }\\r\\n}\\r\\n<\/script>\\r\\n\\r\\n<Header></Header>\\r\\n<div class=\\"wrapper\\"><h1 style=\\"color: white; font-family:\'Courier New\', Courier, monospace\\">Music</h1></div>\\r\\n<div class=\\"wrapper\\">\\r\\n    <div class=\\"container\\">\\r\\n        <div class=\\"row row-cols-1 \\" style=\\" align-items: center; justify-content:center; width:100%\\">\\r\\n        {#each $music as project, i}\\r\\n            \\r\\n                <div class=\\"col d-flex justify-content-center align-items-center mb-5\\" >\\r\\n                <div class=\\"card \\" in:fly style=\\" transition: .3s transform cubic-bezier(.155,1.105,.295,1.12); width:40%; background-color:black \\">\\r\\n                    <h5  style=\\"color:white; text-align: center; font-family:\'Courier New\', Courier, monospace;\\" >{project.name}</h5>\\r\\n                    <img class=\\"card-img mx-auto\\" style=\\"width: 100%; min-height: 50px;\\"src=\\"{project.img}\\" alt=\\"\\" on:click={()=>click(project)}>\\r\\n                    \\r\\n                </div>\\r\\n            </div> \\r\\n            <div id=\\"project{project.name}\\" class=\\"sp\\">\\r\\n                <div in:fly>\\r\\n                    <iframe title={project.name} src={project.link} width=\\"100%\\" height=\\"380\\" frameBorder=\\"0\\" allow=\\"encrypted-media\\" ></iframe>\\r\\n                </div>\\r\\n                \\r\\n            </div>        \\r\\n        {/each}\\r\\n        </div>\\r\\n    </div>\\r\\n</div>\\r\\n<Footer></Footer>\\r\\n<style>.wrapper{background-color:#000;display:flex;justify-content:center;padding-bottom:10%;width:100%}.card:hover{box-shadow:0 10px 20px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.06);transform:scale(1.05)}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}.sp{align-items:center;align-self:center;display:none;justify-content:center;opacity:0;transition:all .2s linear}</style>"],"names":[],"mappings":"AA0DO,sBAAQ,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,eAAe,GAAG,CAAC,MAAM,IAAI,CAAC,mBAAK,MAAM,CAAC,WAAW,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,UAAU,MAAM,IAAI,CAAC,CAAC,KAAK,CAAC,iBAAiB,IAAI,CAAC,YAAY,aAAa,CAAC,kBAAkB,CAAC,KAAK,CAAC,EAAE,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,CAAC,SAAS,CAAC,IAAI,CAAC,IAAI,CAAC,SAAS,CAAC,IAAI,CAAC,UAAU,CAAC,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC,iBAAG,CAAC,YAAY,MAAM,CAAC,WAAW,MAAM,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,QAAQ,CAAC,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,MAAM,CAAC"}'
};
var Music = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $music, $$unsubscribe_music;
  $$unsubscribe_music = subscribe(music$1, (value) => $music = value);
  $$result.css.add(css$2);
  $$unsubscribe_music();
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
<div class="${"wrapper svelte-3xti9t"}"><h1 style="${"color: white; font-family:'Courier New', Courier, monospace"}">Music</h1></div>
<div class="${"wrapper svelte-3xti9t"}"><div class="${"container"}"><div class="${"row row-cols-1 "}" style="${"align-items: center; justify-content:center; width:100%"}">${each($music, (project, i) => `<div class="${"col d-flex justify-content-center align-items-center mb-5"}"><div class="${"card  svelte-3xti9t"}" style="${"transition: .3s transform cubic-bezier(.155,1.105,.295,1.12); width:40%; background-color:black "}"><h5 style="${"color:white; text-align: center; font-family:'Courier New', Courier, monospace;"}">${escape(project.name)}</h5>
                    <img class="${"card-img mx-auto"}" style="${"width: 100%; min-height: 50px;"}"${add_attribute("src", project.img, 0)} alt="${""}">
                    
                </div></div> 
            <div id="${"project" + escape(project.name)}" class="${"sp svelte-3xti9t"}"><div><iframe${add_attribute("title", project.name, 0)}${add_attribute("src", project.link, 0)} width="${"100%"}" height="${"380"}" frameborder="${"0"}" allow="${"encrypted-media"}"></iframe></div>
                
            </div>`)}</div></div></div>
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var music = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Music
});
var css$1 = {
  code: "p.svelte-mmwkg4{color:#fff;font-family:Courier New,Courier,monospace}div.svelte-mmwkg4{align-items:center;background-color:#000;display:flex;height:125px;justify-content:center;width:100%}",
  map: '{"version":3,"file":"other.svelte","sources":["other.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Header from \\"../components/header.svelte\\";\\r\\nimport Footer from \\"../components/footer.svelte\\";\\r\\n<\/script>\\r\\n\\r\\n\\r\\n<Header></Header>\\r\\n<div>\\r\\n    <p> Under Construction</p>\\r\\n</div>\\r\\n\\r\\n<Footer></Footer>\\r\\n<style>p{color:#fff;font-family:Courier New,Courier,monospace}div{align-items:center;background-color:#000;display:flex;height:125px;justify-content:center;width:100%}</style>"],"names":[],"mappings":"AAWO,eAAC,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,SAAS,CAAC,iBAAG,CAAC,YAAY,MAAM,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,OAAO,KAAK,CAAC,gBAAgB,MAAM,CAAC,MAAM,IAAI,CAAC"}'
};
var Other = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
<div class="${"svelte-mmwkg4"}"><p class="${"svelte-mmwkg4"}">Under Construction</p></div>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var other = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Other
});
var css = {
  code: ".wrapper.svelte-12jlug7{background-color:#000;display:flex;justify-content:center;padding-bottom:10%;width:100%}.pop.svelte-12jlug7{transition:transform .3s cubic-bezier(.155,1.105,.295,1.12)}.pop.svelte-12jlug7:hover{box-shadow:0 10px 20px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.06);transform:scale(1.05)}.des.svelte-12jlug7{color:#fff;font-family:Courier New,Courier,monospace}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}",
  map: `{"version":3,"file":"art.svelte","sources":["art.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Header from \\"../components/header.svelte\\";\\r\\nimport Footer from \\"../components/footer.svelte\\";\\r\\nimport { fly } from \\"svelte/transition\\";\\r\\nimport { pieces } from \\"../stores/dbArt\\";\\r\\nlet start = false;\\r\\nsetTimeout(() => { start = true; }, 100);\\r\\n<\/script>\\r\\n\\r\\n<Header></Header>\\r\\n\\r\\n<div class=\\"wrapper\\"><h1 style=\\"color: white; font-family:'Courier New', Courier, monospace\\">Fine Art</h1></div>\\r\\n\\r\\n\\r\\n{#if start}\\r\\n<!-- Gallery -->\\r\\n<div class=\\"wrapper\\">\\r\\n<div class=\\"row justify-content-center \\" style=\\"width: 75%;\\">\\r\\n\\r\\n\\r\\n    {#each $pieces as piece}\\r\\n    <!-- Modal -->\\r\\n     <div class=\\"modal fade\\" id=\\"{piece.name}\\" tabindex=\\"-1\\" role=\\"dialog\\" aria-labelledby=\\"exampleModalCenterTitle\\" aria-hidden=\\"true\\">\\r\\n        <div class=\\"modal-dialog modal-dialog-centered\\" role=\\"document\\">\\r\\n        <div class=\\"modal-content\\" style=\\"background-color:black; border-width: 1px;\\">\\r\\n            <div class=\\"modal-body\\">\\r\\n                <img src=\\"{piece.img}\\" class=\\"w-100 shadow-1-strong rounded mb-4\\" alt=\\"\\"/>\\r\\n                <h4 style=\\"color:white; font-family:'Courier New', Courier, monospace; font-weight: 500;\\">Title: {piece.name}</h4>\\r\\n                <p class=\\"des\\">Description: {piece.des}</p>\\r\\n                <a href=\\"{piece.link}\\"><p style=\\"text-align: center; font-family:'Courier New', Courier, monospace; font-weight: 700;\\">LINK</p></a>\\r\\n            </div>\\r\\n        </div>\\r\\n        </div>\\r\\n    </div>\\r\\n    <!--Modal -->\\r\\n    {/each}\\r\\n    \\r\\n    <div class=\\"col-lg-4 col-md-12 mb-(4 mb-lg-0\\">\\r\\n    {#each $pieces.filter((v, i) => i%3 === 0) as piece}\\r\\n    <a data-bs-toggle=\\"modal\\" data-bs-target=\\"#{piece.name}\\"><img src=\\"{piece.img}\\" in:fly class=\\"w-100 shadow-1-strong rounded mb-4 pop\\" alt=\\"\\"/></a>\\r\\n    {/each}\\r\\n    </div>\\r\\n    \\r\\n    \\r\\n    <div class=\\"col-lg-4 col-md-12 mb-4 mb-lg-0\\">\\r\\n    {#each $pieces.filter((v, i) => i%3 === 1) as piece, i}\\r\\n    <a data-bs-toggle=\\"modal\\" data-bs-target=\\"#{piece.name}\\"><img src=\\"{piece.img}\\" in:fly class=\\"w-100 shadow-1-strong rounded mb-4 pop\\" alt=\\"\\"/></a>\\r\\n    {/each}\\r\\n    </div>\\r\\n   \\r\\n    <div class=\\"col-lg-4 col-md-12 mb-4 mb-lg-0\\">\\r\\n    {#each $pieces.filter((v, i) => i%3 === 2) as piece, i}\\r\\n    <a data-bs-toggle=\\"modal\\" data-bs-target=\\"#{piece.name}\\"><img src=\\"{piece.img}\\" in:fly class=\\"w-100 shadow-1-strong rounded mb-4 pop\\" alt=\\"\\"/></a>\\r\\n    {/each}\\r\\n\\r\\n\\r\\n    </div>\\r\\n  </div>\\r\\n</div>\\r\\n{/if}\\r\\n  <!-- Gallery -->\\r\\n\\r\\n<Footer></Footer>\\r\\n<style>.wrapper{background-color:#000;display:flex;justify-content:center;padding-bottom:10%;width:100%}.pop{transition:transform .3s cubic-bezier(.155,1.105,.295,1.12)}.pop:hover{box-shadow:0 10px 20px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.06);transform:scale(1.05)}.des{color:#fff;font-family:Courier New,Courier,monospace}:root{background-color:#000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif,Courier New,monospace}</style>"],"names":[],"mappings":"AA8DO,uBAAQ,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,gBAAgB,MAAM,CAAC,eAAe,GAAG,CAAC,MAAM,IAAI,CAAC,mBAAI,CAAC,WAAW,SAAS,CAAC,GAAG,CAAC,aAAa,IAAI,CAAC,KAAK,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,mBAAI,MAAM,CAAC,WAAW,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,UAAU,MAAM,IAAI,CAAC,CAAC,mBAAI,CAAC,MAAM,IAAI,CAAC,YAAY,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,SAAS,CAAC,KAAK,CAAC,iBAAiB,IAAI,CAAC,YAAY,aAAa,CAAC,kBAAkB,CAAC,KAAK,CAAC,EAAE,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,CAAC,SAAS,CAAC,IAAI,CAAC,IAAI,CAAC,SAAS,CAAC,IAAI,CAAC,UAAU,CAAC,OAAO,CAAC,GAAG,CAAC,SAAS,CAAC"}`
};
var Art = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $pieces, $$unsubscribe_pieces;
  $$unsubscribe_pieces = subscribe(pieces, (value) => $pieces = value);
  let start = false;
  setTimeout(() => {
    start = true;
  }, 100);
  $$result.css.add(css);
  $$unsubscribe_pieces();
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<div class="${"wrapper svelte-12jlug7"}"><h1 style="${"color: white; font-family:'Courier New', Courier, monospace"}">Fine Art</h1></div>


${start ? `
<div class="${"wrapper svelte-12jlug7"}"><div class="${"row justify-content-center "}" style="${"width: 75%;"}">${each($pieces, (piece) => `
     <div class="${"modal fade"}"${add_attribute("id", piece.name, 0)} tabindex="${"-1"}" role="${"dialog"}" aria-labelledby="${"exampleModalCenterTitle"}" aria-hidden="${"true"}"><div class="${"modal-dialog modal-dialog-centered"}" role="${"document"}"><div class="${"modal-content"}" style="${"background-color:black; border-width: 1px;"}"><div class="${"modal-body"}"><img${add_attribute("src", piece.img, 0)} class="${"w-100 shadow-1-strong rounded mb-4"}" alt="${""}">
                <h4 style="${"color:white; font-family:'Courier New', Courier, monospace; font-weight: 500;"}">Title: ${escape(piece.name)}</h4>
                <p class="${"des svelte-12jlug7"}">Description: ${escape(piece.des)}</p>
                <a${add_attribute("href", piece.link, 0)}><p style="${"text-align: center; font-family:'Courier New', Courier, monospace; font-weight: 700;"}">LINK</p></a>
            </div></div>
        </div></div>
    `)}
    
    <div class="${"col-lg-4 col-md-12 mb-(4 mb-lg-0"}">${each($pieces.filter((v, i) => i % 3 === 0), (piece) => `<a data-bs-toggle="${"modal"}" data-bs-target="${"#" + escape(piece.name)}"><img${add_attribute("src", piece.img, 0)} class="${"w-100 shadow-1-strong rounded mb-4 pop svelte-12jlug7"}" alt="${""}"></a>`)}</div>
    
    
    <div class="${"col-lg-4 col-md-12 mb-4 mb-lg-0"}">${each($pieces.filter((v, i) => i % 3 === 1), (piece, i) => `<a data-bs-toggle="${"modal"}" data-bs-target="${"#" + escape(piece.name)}"><img${add_attribute("src", piece.img, 0)} class="${"w-100 shadow-1-strong rounded mb-4 pop svelte-12jlug7"}" alt="${""}"></a>`)}</div>
   
    <div class="${"col-lg-4 col-md-12 mb-4 mb-lg-0"}">${each($pieces.filter((v, i) => i % 3 === 2), (piece, i) => `<a data-bs-toggle="${"modal"}" data-bs-target="${"#" + escape(piece.name)}"><img${add_attribute("src", piece.img, 0)} class="${"w-100 shadow-1-strong rounded mb-4 pop svelte-12jlug7"}" alt="${""}"></a>`)}</div></div></div>` : ``}
  

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var art = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Art
});

// .svelte-kit/begin/entry.js
var import_functions = __toModule(require_src3());
"use strict";
init();
var checkStatic = import_functions.default.http.proxy({ passthru: true });
var handler = import_functions.default.http.async(checkStatic, svelteHandler);
async function svelteHandler(event) {
  const { host, rawPath: path, httpMethod, rawQueryString, headers, body, isBase64Encoded } = event;
  const query = new import_url2.default.URLSearchParams(rawQueryString);
  const type = headers["content-type"];
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    host,
    method: httpMethod,
    headers,
    path,
    rawBody,
    query
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      headers: rendered.headers,
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not Found"
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler,
  svelteHandler
});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * csrf
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * media-typer
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * MIT Licensed
 */
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * random-bytes
 * Copyright(c) 2016 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * type-is
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * uid-safe
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/*! run-waterfall. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/**
 *  @license
 *    Copyright 2018 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
