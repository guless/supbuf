/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/// @Copyright ~2016 ☜Samlv9☞ and other contributors
/// @MIT-LICENSE | 1.0.0 | http://apidev.guless.com/
/// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
///                                              }|
///                                              }|
///                                              }|     　 へ　　　 ／|    
///      _______     _______         ______      }|      /　│　　 ／ ／
///     /  ___  |   |_   __ \      .' ____ '.    }|     │　Z ＿,＜　／　　 /`ヽ
///    |  (__ \_|     | |__) |     | (____) |    }|     │　　　　　ヽ　　 /　　〉
///     '.___`-.      |  __ /      '_.____. |    }|      Y　　　　　`　 /　　/
///    |`\____) |    _| |  \ \_    | \____| |    }|    ｲ●　､　●　　⊂⊃〈　　/
///    |_______.'   |____| |___|    \______,'    }|    ()　 v　　　　|　＼〈
///    |=========================================\|    　>ｰ ､_　 ィ　 │ ／／
///    |> LESS IS MORE                           ||     / へ　　 /　ﾉ＜|＼＼
///    `=========================================/|    ヽ_ﾉ　　(_／　 │／／
///                                              }|     7　　　　　　  |／
///                                              }|     ＞―r￣￣`ｰ―＿`
///                                              }|
///                                              }|
/// Permission is hereby granted, free of charge, to any person obtaining a copy
/// of this software and associated documentation files (the "Software"), to deal
/// in the Software without restriction, including without limitation the rights
/// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
/// copies of the Software, and to permit persons to whom the Software is
/// furnished to do so, subject to the following conditions:
///
/// The above copyright notice and this permission notice shall be included in all
/// copies or substantial portions of the Software.
///
/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
/// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
/// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
/// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
/// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
/// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
/// THE SOFTWARE.
const BLOCK_SIZE = 16 * 1024;
const BIG_ENDIAN = false >>> 0;
const LITTLE_ENDIAN = true >>> 0;

const UTF8_TEXT_ENCODER   = (typeof TextEncoder == "undefined" ? null : new TextEncoder("utf-8"));
const UTF8_TEXT_DECODER   = (typeof TextDecoder == "undefined" ? null : new TextDecoder("utf-8"));
const UCS2LE_TEXT_ENCODER = (typeof TextEncoder == "undefined" ? null : new TextEncoder("utf-16le"));
const UCS2LE_TEXT_DECODER = (typeof TextDecoder == "undefined" ? null : new TextDecoder("utf-16le"));
const UCS2BE_TEXT_ENCODER = (typeof TextEncoder == "undefined" ? null : new TextEncoder("utf-16be"));
const UCS2BE_TEXT_DECODER = (typeof TextDecoder == "undefined" ? null : new TextDecoder("utf-16be"));

function IEEE754_READ(buffer, offset, isLE, mLen, nBytes) {
/// https://github.com/feross/ieee754
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function IEEE754_WRITE(buffer, value, offset, isLE, mLen, nBytes) {
/// https://github.com/feross/ieee754
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

function TO_CHAR( bytes ) {
    var chars = "";
    for ( var i = 0, len = bytes.length; i < len; ++i ) chars += String.fromCharCode(bytes[i]);
    return chars;
}

function TO_BYTE( chars ) {
    var bytes = new Uint8Array(chars.length);
    for ( var i = 0, len = chars.length; i < len; ++i ) bytes[i] = chars.charCodeAt(i);
    return bytes;
}

function TO_UCS2LE_CHAR( bytes ) {
    var chars = "";
    for ( var i = 0, len = bytes.length; i < len; i += 2 ) chars += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
    return chars;
}

function TO_UCS2LE_BYTE( chars ) {
    var bytes = new Uint8Array(chars.length << 1);
    for ( var i = 0, k = 0, c = 0, len = chars.length; i < len; ++i ) { bytes[k++] = (c = chars.charCodeAt(i)); bytes[k++] = (c >>> 8); }
    return bytes;
}

function TO_UCS2BE_CHAR( bytes ) {
    var chars = "";
    for ( var i = 0, len = bytes.length; i < len; i += 2 ) chars += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    return chars;
}

function TO_UCS2BE_BYTE( chars ) {
    var bytes = new Uint8Array(chars.length << 1);
    for ( var i = 0, k = 0, c = 0, len = chars.length; i < len; ++i ) { bytes[k++] = (c = chars.charCodeAt(i)) >>> 8; bytes[k++] = (c); }
    return bytes;
}

function ZIG( iVal ) {
    return ((iVal << 1) ^ (iVal >> 31)) >>> 0;
}

function ZAG( uVal ) {
    return (uVal << 31 >> 31) ^ (uVal >>> 1);
}

export default class Supbuf {
    
    static get LITTLE_ENDIAN() { 
        return LITTLE_ENDIAN;
    }
    
    static get BIG_ENDIAN() { 
        return BIG_ENDIAN; 
    }
    
    constructor( content = 0, endian = Supbuf.LITTLE_ENDIAN ) {
        this._content = (typeof content == "number" || content instanceof ArrayBuffer) ? new Uint8Array(content) : new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
        this._dataview = null;
        this._endian = endian;
        this._offset = 0;
        this._length = this._content.length;
    }
    
    get endian() {
        return this._endian;
    }
    
    set endian( value ) {
        if ( !(LITTLE_ENDIAN === value || BIG_ENDIAN === value) ) throw new TypeError("Endian of buffer must be `LITTLE_ENDIAN` or `BIG_ENDIAN`");
        this._endian = value;
    }
    
    get offset() {
        return this._offset;
    }
    
    set offset( value ) {
        if ( (this._offset = value) < 0 ) throw new RangeError("Invalid buffer offset");
    }
    
    get length() {
        return this._length;
    }
    
    set length( value ) {
        if ( (this._length = value) < 0 ) throw new RangeError("Invalid buffer length");
        this.extend(this._length);
    }
    
    get remain() {
        return this._length - this._offset;
    }
    
    get content() {
        return this._content.subarray(this._offset, this._length);
    }
    
    getSerial( obj ) {
        return obj.decode(this), obj;
    }
    
    setSerial( obj ) {
        obj.encode(this);
    }
    
    getBool() {
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        return !!this._content[this._offset++];
    }
    
    setBool( value ) {
        if ( this.remain < 1 ) this.extend(this._length = 1 + this._offset);
        this._content[this._offset++] = +(value);
    }
    
    getSI8() {
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        return this._content[this._offset++] << 24 >> 24;
    }
    
    setSI8( value ) {
        if ( this.remain < 1 ) this.extend(this._length = 1 + this._offset);
        this._content[this._offset++] = value;
    }
    
    getUI8() {
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        return this._content[this._offset++];
    }
    
    setUI8( value ) {
        if ( this.remain < 1 ) this.extend(this._length = 1 + this._offset);
        this._content[this._offset++] = value;
    }
    
    getSI16() {
        if ( this.remain < 2 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var h = this._content[this._offset++];
        var l = this._content[this._offset++];
        
        return (this._endian == LITTLE_ENDIAN ? (h | (l << 8)) << 16 >> 16 : ((h << 8) | l) << 16 >> 16);
    }
    
    setSI16( value ) {
        if ( this.remain < 2 ) this.extend(this._length = 2 + this._offset);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = value;
            this._content[this._offset++] = value >> 8;
        }
        
        else {
            this._content[this._offset++] = value >> 8;
            this._content[this._offset++] = value;
        }
    }
    
    getUI16() {
        if ( this.remain < 2 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var h = this._content[this._offset++];
        var l = this._content[this._offset++];
        
        return (this._endian == LITTLE_ENDIAN ? ((l << 8) | h) : ((h << 8) | l));
    }
    
    setUI16( value ) {
        if ( this.remain < 2 ) this.extend(this._length = 2 + this._offset);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = value;
            this._content[this._offset++] = value >>> 8;
        }
        
        else {
            this._content[this._offset++] = value >>> 8;
            this._content[this._offset++] = value;
        }
    }
    
    getSI24() {
        if ( this.remain < 3 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var a = this._content[this._offset++];
        var b = this._content[this._offset++];
        var c = this._content[this._offset++];
        
        return (this._endian == LITTLE_ENDIAN ? (a | (b << 8) | (c << 16)) << 8 >> 8 : ((a << 16) | (b << 8) | c) << 8 >> 8);
    }
    
    setSI24( value ) {
        if ( this.remain < 3 ) this.extend(this._length = 3 + this._offset);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = value;
            this._content[this._offset++] = value >> 8;
            this._content[this._offset++] = value >> 16;
        }
        
        else {
            this._content[this._offset++] = value >> 16;
            this._content[this._offset++] = value >> 8;
            this._content[this._offset++] = value;
        }
    }
    
    getUI24() {
        if ( this.remain < 3 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var a = this._content[this._offset++];
        var b = this._content[this._offset++];
        var c = this._content[this._offset++];
        
        return (this._endian == LITTLE_ENDIAN ? (a | (b << 8) | (c << 16)) : ((a << 16) | (b << 8) | c));
    }
    
    setUI24( value ) {
        if ( this.remain < 3 ) this.extend(this._length = 3 + this._offset);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = value;
            this._content[this._offset++] = value >>> 8;
            this._content[this._offset++] = value >>> 16;
        }
        
        else {
            this._content[this._offset++] = value >>> 16;
            this._content[this._offset++] = value >>> 8;
            this._content[this._offset++] = value;
        }
    }
    
    getSI32() {
        if ( this.remain < 4 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var a = this._content[this._offset++];
        var b = this._content[this._offset++];
        var c = this._content[this._offset++];
        var d = this._content[this._offset++];
        
        return (this._endian == LITTLE_ENDIAN ? (a | (b << 8) | (c << 16) | (d << 24)) : ((a << 24) | (b << 16) | (c << 8) | d));
    }
    
    setSI32( value ) {
        if ( this.remain < 4 ) this.extend(this._length = 4 + this._offset);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = value;
            this._content[this._offset++] = value >> 8;
            this._content[this._offset++] = value >> 16;
            this._content[this._offset++] = value >> 24;
        }
        
        else {
            this._content[this._offset++] = value >> 24;
            this._content[this._offset++] = value >> 16;
            this._content[this._offset++] = value >> 8;
            this._content[this._offset++] = value;
        }
    }
    
    getUI32() {
        if ( this.remain < 4 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var a = this._content[this._offset++];
        var b = this._content[this._offset++];
        var c = this._content[this._offset++];
        var d = this._content[this._offset++];
        
        return (this._endian == LITTLE_ENDIAN ? (a | (b << 8) | (c << 16) | (d << 24)) : ((a << 24) | (b << 16) | (c << 8) | d)) >>> 0;
    }
    
    setUI32( value ) {
        if ( this.remain < 4 ) this.extend(this._length = 4 + this._offset);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = value;
            this._content[this._offset++] = value >>> 8;
            this._content[this._offset++] = value >>> 16;
            this._content[this._offset++] = value >>> 24;
        }
        
        else {
            this._content[this._offset++] = value >>> 24;
            this._content[this._offset++] = value >>> 16;
            this._content[this._offset++] = value >>> 8;
            this._content[this._offset++] = value;
        }
    }
    
    getFL16() {
        if ( this.remain < 2 ) throw new RangeError("Offset is outside the bounds of the buffer");
        return IEEE754_READ(this._content, (this._offset += 2) - 2, this._endian, 10, 2);
    }
    
    setFL16( value ) {
        if ( this.remain < 2 ) this.extend(this._length = 2 + this._offset);
        IEEE754_WRITE(this._content, value, (this._offset += 2) - 2, this._endian, 10, 2);
    }
    
    getFL32() {
        if ( this.remain < 4 ) throw new RangeError("Offset is outside the bounds of the buffer");
        if ( !this._dataview || this._dataview.buffer !== this._content.buffer )
            this._dataview = new DataView(this._content.buffer, this._content.byteOffset, this._content.byteLength);
            
        return this._dataview.getFloat32((this._offset += 4) - 4, this._endian);
    }
    
    setFL32( value ) {
        if ( this.remain < 4 ) this.extend(this._length = 4 + this._offset);
        if ( !this._dataview || this._dataview.buffer !== this._content.buffer )
            this._dataview = new DataView(this._content.buffer, this._content.byteOffset, this._content.byteLength);
            
        this._dataview.setFloat32((this._offset += 4) - 4, value, this._endian);
    }
    
    getFL64() {
        if ( this.remain < 8 ) throw new RangeError("Offset is outside the bounds of the buffer");
        if ( !this._dataview || this._dataview.buffer !== this._content.buffer )
            this._dataview = new DataView(this._content.buffer, this._content.byteOffset, this._content.byteLength);
            
        return this._dataview.getFloat64((this._offset += 8) - 8, this._endian);
    }
    
    setFL64( value ) {
        if ( this.remain < 8 ) this.extend(this._length = 8 + this._offset);
        if ( !this._dataview || this._dataview.buffer !== this._content.buffer )
            this._dataview = new DataView(this._content.buffer, this._content.byteOffset, this._content.byteLength);
            
        this._dataview.setFloat64((this._offset += 8) - 8, value, this._endian);
    }
    
    getFP16() {
        if ( this.remain < 2 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var a = this._content[this._offset++];
        var b = this._content[this._offset++];
        
        var k = (this._endian == LITTLE_ENDIAN ? (a | (b << 8)) << 16 >> 16 : ((a << 8) | b) << 16 >> 16);
        return k / (1 << 8);
    }
    
    setFP16( value ) {
        if ( this.remain < 2 ) this.extend(this._length = 2 + this._offset);
        var k = ((value * (1 << 8)) << 16 >> 16);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = k;
            this._content[this._offset++] = k >> 8;
        }
        
        else {
            this._content[this._offset++] = k >> 8;
            this._content[this._offset++] = k;
        }
    }
    
    getFP32() {
        if ( this.remain < 4 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var a = this._content[this._offset++];
        var b = this._content[this._offset++];
        var c = this._content[this._offset++];
        var d = this._content[this._offset++];
        
        var k = (this._endian == LITTLE_ENDIAN ? (a | (b << 8) | (c << 16) | (d << 24)) : ((a << 24) | (b << 16) | (c << 8) | d));
        return k / (1 << 16);
    }
    
    setFP32( value ) {
        if ( this.remain < 4 ) this.extend(this._length = 4 + this._offset);
        var k = ((value * (1 << 16)) | 0);
        
        if ( this._endian == LITTLE_ENDIAN ) {
            this._content[this._offset++] = k;
            this._content[this._offset++] = k >> 8;
            this._content[this._offset++] = k >> 16;
            this._content[this._offset++] = k >> 24;
        }
        
        else {
            this._content[this._offset++] = k >> 24;
            this._content[this._offset++] = k >> 16;
            this._content[this._offset++] = k >> 8;
            this._content[this._offset++] = k;
        }
    }
    
    getEU32() {
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        var k = this._content[this._offset++];
        
        if ( !(k & 0x80) ) {
            return k;
        }
        
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        k = (this._content[this._offset++] << 7) | (k & 0x7F);
        
        if ( !(k & 0x4000) ) {
            return k;
        }
        
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        k = (this._content[this._offset++] << 14) | (k & 0x3FFF);
        
        if ( !(k & 0x200000) ) {
            return k;
        }
        
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        k = (this._content[this._offset++] << 21) | (k & 0x1FFFFF);
        
        if ( !(k & 0x10000000) ) {
            return k;
        }
        
        if ( this.remain < 1 ) throw new RangeError("Offset is outside the bounds of the buffer");
        return ((this._content[this._offset++] << 28) | (k & 0xFFFFFFF));
    }
    
    setEU32( value ) {
        for ( var i = 0, k = value >>> 0; i < 5; ++i, k >>>= 7 ) {
            if ( this.remain < 1 ) this.extend(this._length = 1 + this._offset);
            
            if ( k <= 0x7F ) {
                this._content[this._offset++] = k;
                break;
            }
            
            else {
                this._content[this._offset++] = (k & 0x7F) | 0x80;
            }
        }
    }
    
    getVI32( value ) {
        return ZAG(this.getEU32());
    }
    
    setVI32( value ) {
        this.setEU32(ZIG(value));
    }
    
    getUTF8( length ) {
        if ( length < 0 ) throw new RangeError("Invalid UTF-8 string length");
        if ( this.remain < length ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var bytes = this._content.subarray(this._offset, this._offset += length);
        
        /// https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
        if ( null !== UTF8_TEXT_DECODER ) {
            return UTF8_TEXT_DECODER.decode(bytes);
        }
        
        else {
            return decodeURIComponent(escape(TO_CHAR(bytes)));
        }
    }
    
    setUTF8( value ) {
        /// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
        if ( null !== UTF8_TEXT_ENCODER ) {
            var bytes = UTF8_TEXT_ENCODER.encode(value);
        }
        
        else {
            var bytes = TO_BYTE(unescape(encodeURIComponent(value)));
        }
        
        if ( this.remain < bytes.length ) {
            this.extend(this._length = bytes.length + this._offset);
        }
        
        this._content.set(bytes, (this._offset += bytes.length) - bytes.length);
    }
    
    getUCS2( length ) {
        if ( length < 0 || length & 1 ) throw new RangeError("Invalid UCS-2 string length");
        if ( this.remain < length ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var bytes = this._content.subarray(this._offset, this._offset += length);
        
        /// https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
        if ( null !== UCS2LE_TEXT_ENCODER && null !== UCS2BE_TEXT_ENCODER ) {
            return (this._endian == LITTLE_ENDIAN ? UCS2LE_TEXT_DECODER.decode(bytes) : UCS2BE_TEXT_DECODER.decode(bytes));
        }
        
        else {
            return (this._endian == LITTLE_ENDIAN ? TO_UCS2LE_CHAR(bytes) : TO_UCS2BE_CHAR(bytes));
        }
    }
    
    setUCS2( value ) {
        /// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
        if ( null !== UCS2LE_TEXT_ENCODER && null !== UCS2BE_TEXT_ENCODER ) {
            var bytes = (this._endian == LITTLE_ENDIAN ? UCS2LE_TEXT_ENCODER.encode(value) : UCS2BE_TEXT_ENCODER.encode(value));
        }
        
        else {
            var bytes = (this._endian == LITTLE_ENDIAN ? TO_UCS2LE_BYTE(value) : TO_UCS2BE_BYTE(value));
        }
        
        if ( this.remain < bytes.length ) {
            this.extend(this._length = bytes.length + this._offset);
        }
        
        this._content.set(bytes, (this._offset += bytes.length) - bytes.length);
    }
    
    getBytes( length, depth = false ) {
        if ( length < 0 ) throw new RangeError("Invalid bytes length");
        if ( this.remain < length ) throw new RangeError("Offset is outside the bounds of the buffer");
        var bytes = this._content.subarray(this._offset, this._offset += length);
        return (depth ? new Uint8Array(bytes) : bytes);
    }
    
    setBytes( bytes ) {
        if ( this.remain < bytes.length ) this.extend(this._length = bytes.length + this._offset);
        this._content.set(bytes, (this._offset += bytes.length) - bytes.length);
    }
    
    extend( length ) {
        if ( this._content.length >= length ) return;
        
        var newlen = BLOCK_SIZE * Math.ceil(length / BLOCK_SIZE);
        var oldbuf = this._content;
        
        this._content = new Uint8Array(newlen);
        this._content.set(oldbuf, 0);
    }
    
    append( bytes ) {
        this.extend(this._length += bytes.length);
        this._content.set(bytes, this._length - bytes.length);
    }
    
    clear() {
        this._offset = this._length = 0;
    }
    
    find( value ) {
        for ( var start = this._offset; start < this._length && value !== this._content[start]; ++start);
        return start - this._offset;
    }
    
    swap16() {
        if ( this.remain < 2 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var t = this._content[this._offset];
        
        this._content[this._offset] = this._content[this._offset + 1];
        this._content[this._offset + 1] = t;
    }
    
    swap32() {
        if ( this.remain < 4 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var t = this._content[this._offset];
        
        this._content[this._offset] = this._content[this._offset + 3];
        this._content[this._offset + 3] = t;
        
        t = this._content[this._offset + 1];
        
        this._content[this._offset + 1] = this._content[this._offset + 2];
        this._content[this._offset + 2] = t;
    }
    
    swap64() {
        if ( this.remain < 8 ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        var t = this._content[this._offset];
        
        this._content[this._offset] = this._content[this._offset + 7];
        this._content[this._offset + 7] = t;
        
        t = this._content[this._offset + 1];
        
        this._content[this._offset + 1] = this._content[this._offset + 6];
        this._content[this._offset + 6] = t;
        
        t = this._content[this._offset + 2];
        
        this._content[this._offset + 2] = this._content[this._offset + 5];
        this._content[this._offset + 5] = t;
        
        t = this._content[this._offset + 3];
        
        this._content[this._offset + 3] = this._content[this._offset + 4];
        this._content[this._offset + 4] = t;
    }
    
    swap( length ) {
        if ( length < 0 || length & 1 ) throw new RangeError("Invalid bytes length");
        if ( this.remain < length ) throw new RangeError("Offset is outside the bounds of the buffer");
        
        for ( var i = this._offset, j = this._offset + length - 1; j > i; ++i, --j ) {
            var t = this._content[i];
            
            this._content[i] = this._content[j];
            this._content[j] = t;
        }
    }
    
    skip( size ) {
        if ( (this._offset += size) < 0 ) throw new RangeError("Offset is outside the bounds of the buffer");
    }
    
    move( offset ) {
        if ( (this._offset = offset) < 0 ) throw new RangeError("Invalid buffer offset");
    }
    
    concat( buffer ) {
        this.append(buffer.content);
    }
    
    slice( length, depth = false ) {
        return new Supbuf(this.getBytes(length, depth));
    }
    
    clone() {
        return new Supbuf(new Uint8Array(this.content));
    }
    
    toString() {
        var data = this.content;
        var list = new Array(Math.min(data.length, 16));
        
        for ( var i = 0; i < list.length; ++i ) {
            list[i] = ("0" + data[i].toString(16)).slice(-2);
        }
        
        if ( list.length < data.length ) {
            list.push("...");
        }
        
        return `[Supbuf length=${this.length}, offset=${this.offset}, content=<${list.join(" ")}>]`;
    }
}
