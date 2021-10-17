var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
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

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});

// node_modules/@sveltejs/kit/dist/install-fetch.js
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_zlib = __toModule(require("zlib"));
var import_stream = __toModule(require("stream"));
var import_util = __toModule(require("util"));
var import_crypto = __toModule(require("crypto"));
var import_url = __toModule(require("url"));
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
var src = dataUriToBuffer;
var dataUriToBuffer$1 = src;
var { Readable } = import_stream.default;
var wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
var Blob = class {
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
var fetchBlob = Blob;
var Blob$1 = fetchBlob;
var FetchBaseError = class extends Error {
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
var FetchError = class extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
};
var NAME = Symbol.toStringTag;
var isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
var isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
var isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
var carriage = "\r\n";
var dashes = "-".repeat(2);
var carriageLength = Buffer.byteLength(carriage);
var getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
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
var getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
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
var INTERNALS$2 = Symbol("Body internals");
var Body = class {
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
        const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error2;
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
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
var clone = (instance, highWaterMark) => {
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
var extractContentType = (body, request) => {
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
var getTotalBytes = (request) => {
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
var writeToStream = (dest, { body }) => {
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
var validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
    throw err;
  }
};
var validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
    throw err;
  }
};
var Headers = class extends URLSearchParams {
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
var redirectStatus = new Set([301, 302, 303, 307, 308]);
var isRedirect = (code) => {
  return redirectStatus.has(code);
};
var INTERNALS$1 = Symbol("Response internals");
var Response = class extends Body {
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
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
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
var getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
};
var INTERNALS = Symbol("Request internals");
var isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
var Request = class extends Body {
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
var getNodeRequestOptions = (request) => {
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
var AbortError = class extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
};
var supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
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
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
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
              } catch (error2) {
                reject(error2);
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
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error2) => {
        reject(error2);
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
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error2) => {
          reject(error2);
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

// .svelte-kit/output/server/app.js
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
  error: error2,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded: loaded2, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
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
					error: ${serialize_error(error2)},
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

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
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
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
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
    const error2 = typeof loaded2.error === "string" ? new Error(loaded2.error) : loaded2.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
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
  error: error2
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
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
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
        const resolved = resolve(request.path, url.split("?")[0]);
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
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
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
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
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
                    url,
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
      load_input.error = error2;
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
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
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
      error: error2
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
      error: error2,
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
  let error2;
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
              ({ status, error: error2 } = loaded2.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded2 && !error2) {
            branch.push(loaded2);
          }
          if (error2) {
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
                    error: error2
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
              error: error2
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
      error: error2,
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
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
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
    target: null,
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
  handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
  externalFetch: hooks.externalFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error;
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
function load({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error2 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
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
  const url = "https://oladipupo.io/api/v1/getart";
  const res = await fetch(url);
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
  const url = "https://oladipupo.io/api/v1/getmusic";
  const res = await fetch(url);
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
  const url = "https://oladipupo.io/api/v1/getproject";
  const res = await fetch(url);
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

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
