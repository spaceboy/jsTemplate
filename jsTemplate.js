function isArray (m) {
  if (!m.length && 0 !== m.length) {
    return false;
  }
  if ('string' == typeof(m)) {
    return false;
  }
  return true;
}

function for_ (a, f) {
  var r;
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f.call(this, i, a[i], a);
    if (r || 0 == r || false == r) {
      return r;
    }
  }
}

function keyReplace (template, rep, strict) {
  var tagVal = template.match(/\{\$([^\}]+)\}/gi);
  var tagQuest = template.match(/\{\?([^\}]+)\}/gi);
  var key;
  var innerCode;
  if (!(tagVal || tagQuest)) {
    return template;
  }
  /* Internal calls: */
  function cleanKey (s) {
    return s.replace(/\{[\$\?\/]([^\}]+)\}/, '$1');
  }
  function doReplace (template, rep, strict, key) {
    /* Look for else "{:key}" statement and resolve template part: */ 
    template = template.replace(new RegExp(['(.*)\\{:', key, '\\}(.*)'].join('')), function () {
      return (rep.hasOwnProperty(key)
        ? arguments[1]
        : (arguments[2] ? arguments[2] : '')
      );
    });
    if (!rep.hasOwnProperty(key)) {
      return template;
    }
    if (isArray(rep[key])) {
      var o = [];
      for_(rep[key], function (i, r) {
        o.push(keyReplace(template, r, strict));
      });
      return o.join('');
    }
    return keyReplace(template, rep[key], strict);
  }
  /* resolve {?...} {/...} pair tags: */
  if (tagQuest) {
    for_(tagQuest, function (i, el) {
      key = cleanKey(el);
      template = template.replace(
        new RegExp(['(.*)\\{\\?', key, '\\}(.*)\\{\\/', key, '\}(.*)'].join(''), 'gi'),
        function () {
          return [
            arguments[1],
            doReplace(arguments[2], rep, strict, key),
            arguments[3]
            ].join('');
          }
      );
    });
  }
  /* Resolve {$...} tags: */
  if (tagVal) {
    for_(tagVal, function (i, el) {
      key = cleanKey(el);
      if (rep.hasOwnProperty(key)) {
        template = template.replace(
          new RegExp(['\\{\\$', key, '\\}'].join(''), 'gi'),
          rep[key]
        );
      }
    });
  }
  /* In STRICT mode, replace the rest {$...} tags: */
  if (!!strict) {
    template = template.replace(/\{\$[^\}]+\}/gi, '');
  }
  /* Return output (modified template): */
  return template;
}
