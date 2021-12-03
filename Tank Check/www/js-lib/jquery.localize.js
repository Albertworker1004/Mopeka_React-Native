
/*
Copyright (c) Jim Garvin (http://github.com/coderifous), 2008.
Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
Written by Jim Garvin (@coderifous) for use on LMGTFY.com.
http://github.com/coderifous/jquery-localize
Based off of Keith Wood's Localisation jQuery plugin.
http://keith-wood.name/localisation.html
 */
 
/** @constructor */
function ScriptLoader() {
}

ScriptLoader.prototype = {

    timer: function (times, // number of times to try
                     delay, // delay per try
                     delayMore, // extra delay per try (additional to delay)
                     test, // called each try, timer stops if this returns true
                     failure, // called on failure
                     result // used internally, shouldn't be passed
            ) {
        var me = this;
        if (times == -1 || times > 0) {
            setTimeout(function () {
                result = (test()) ? 1 : 0;
                me.timer((result) ? 0 : (times > 0) ? times = times - 1 : times, delay + ((delayMore) ? delayMore : 0), delayMore, test, failure, result);
            }, (result || delay < 0) ? 0.1 : delay);
        } else if (typeof failure == 'function') {
            setTimeout(failure, 1);
        }
    },

    addEvent: function (el, eventName, eventFunc) {
        if (typeof el != 'object') {
            return false;
        }

        if (el.addEventListener) {
            el.addEventListener(eventName, eventFunc, false);
            return true;
        }

        if (el.attachEvent) {
            el.attachEvent("on" + eventName, eventFunc);
            return true;
        }

        return false;
    },

    // add script to dom
    require: function (url, args) {
        var me = this;
        args = args || {};

        var scriptTag = document.createElement('script');
        var headTag = document.getElementsByTagName('head')[0];
        if (!headTag) {
            return false;
        }

        setTimeout(function () {
            var f = (typeof args.success == 'function') ? args.success : function () {
            };
            args.failure = (typeof args.failure == 'function') ? args.failure : function () {
            };
            var fail = function () {
                if (!scriptTag['__es']) {
                    scriptTag['__es'] = true;
                    scriptTag.id = 'failed';
                    args.failure(scriptTag);
                }
            };
            scriptTag.onload = function () {
                scriptTag.id = 'loaded';
                f(scriptTag);
            };
            scriptTag.type = 'text/javascript';
            scriptTag.async = (typeof args.async == 'boolean') ? args.async : false; 
            scriptTag.charset = 'utf-8';
            me.__es = false;
            me.addEvent(scriptTag, 'error', fail); // when supported
            // when error event is not supported fall back to timer
            me.timer(15, 1000, 0, function () {
                return (scriptTag.id == 'loaded');
            }, function () {
                if (scriptTag.id != 'loaded') {
                    fail();
                }
            });
            scriptTag.src = url;
            setTimeout(function () {
                try {
                    headTag.appendChild(scriptTag);
                } catch (e) {
                    fail();
                }
            }, 1);
        }, (typeof args.delay == 'number') ? args.delay : 1);
        return true;
    }
};

 
(function($) {
  var normaliseLang;
  normaliseLang = function(lang) {
    lang = lang.replace(/_/, '-').toLowerCase();
    if (lang.length > 3) {
      lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
    }
    return lang;
  };  
  $.defaultLanguage = normaliseLang(navigator.languages && navigator.languages.length > 0 ? navigator.languages[0] : navigator.language || navigator.userLanguage);
  $.localize = function(pkg, options) {
    var defaultCallback, deferred, fileExtension, intermediateLangData, jsonCall, lang, loadLanguage, localizeElement, localizeForSpecialKeys, localizeImageElement, localizeInputElement, localizeOptgroupElement, notifyDelegateLanguageLoaded, regexify, setAttrFromValueForKey, setTextFromValueForKey, valueForKey, wrappedSet;
    if (options == null) {
      options = {};
    }
    wrappedSet = this;
    intermediateLangData = {};
    fileExtension = options.fileExtension || "js";
    deferred = $.Deferred();
    loadLanguage = function(pkg, lang, level) {
      var file;
      if (level == null) {
        level = 1;
      }
      switch (level) {
        case 1:
          intermediateLangData = {};
          if (options.loadBase) {
            file = pkg + ("." + fileExtension);
            return jsonCall(file, pkg, lang, level);
          } else {
            return loadLanguage(pkg, lang, 2);
          }
        case 2:
          file = "" + pkg + "-" + (lang.split('-')[0]) + "." + fileExtension;          
          return jsonCall(file, pkg, lang, level);
        //case 3:
          //file = "" + pkg + "-" + (lang.split('-').slice(0, 2).join('-')) + "." + fileExtension;          
          //return jsonCall(file, pkg, lang, level);
        default:
          return deferred.resolve();
      }
    };
    jsonCall = function(file, pkg, lang, level) {
        var ajaxOptions, errorFunc, successFunc;
        if (options.pathPrefix != null) {
            file = "" + options.pathPrefix + "/" + file;
        }
        successFunc = function(d) {        
            $.extend(intermediateLangData, d);
            notifyDelegateLanguageLoaded(intermediateLangData);
            return loadLanguage(pkg, lang, level + 1);
        };
        errorFunc = function() {        
            if (level === 2 && lang.indexOf('-') > -1) {
                return loadLanguage(pkg, lang, level + 1);
            } else if (options.fallback && options.fallback !== lang) {
                return loadLanguage(pkg, options.fallback);
            }
        };      
      
        function load(success, error) {
            var loader = new ScriptLoader();
            loader.require(
                file, 
                {
                    async: false, 
                    success: function () {
                        successFunc(lang_data);
                    },
                    failure: errorFunc
                }
            );
        }      
        return load(successFunc, errorFunc);
    };
    notifyDelegateLanguageLoaded = function(data) {
      if (options.callback != null) {
        return options.callback(data, defaultCallback);
      } else {
        return defaultCallback(data);
      }
    };
    defaultCallback = function(data) {
      $.localize.data[pkg] = data;
      return wrappedSet.each(function() {
        var elem, key, value;
        elem = $(this);
        key = elem.data("localize");
        key || (key = elem.attr("rel").match(/localize\[(.*?)\]/)[1]);
        value = valueForKey(key, data);
        if (value != null) {
          return localizeElement(elem, key, value);
        }
      });
    };
    localizeElement = function(elem, key, value) {
      if (elem.is('input')) {
        localizeInputElement(elem, key, value);
      } else if (elem.is('textarea')) {
        localizeInputElement(elem, key, value);
      } else if (elem.is('img')) {
        localizeImageElement(elem, key, value);
      } else if (elem.is('optgroup')) {
        localizeOptgroupElement(elem, key, value);
      } else if (!$.isPlainObject(value)) {
        elem.html(value);
      }
      if ($.isPlainObject(value)) {
        return localizeForSpecialKeys(elem, value);
      }
    };
    localizeInputElement = function(elem, key, value) {
      var val;
      val = $.isPlainObject(value) ? value.value : value;
      if (elem.is("[placeholder]")) {
        return elem.attr("placeholder", val);
      } else {
        return elem.val(val);
      }
    };
    localizeForSpecialKeys = function(elem, value) {
      setAttrFromValueForKey(elem, "title", value);
      setAttrFromValueForKey(elem, "href", value);
      return setTextFromValueForKey(elem, "text", value);
    };
    localizeOptgroupElement = function(elem, key, value) {
      return elem.attr("label", value);
    };
    localizeImageElement = function(elem, key, value) {
      setAttrFromValueForKey(elem, "alt", value);
      return setAttrFromValueForKey(elem, "src", value);
    };
    valueForKey = function(key, data) {
      var keys, value, _i, _len;
      keys = key.split(/\./);
      value = data;
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        value = value != null ? value[key] : null;
      }
      return value;
    };
    setAttrFromValueForKey = function(elem, key, value) {
      value = valueForKey(key, value);
      if (value != null) {
        return elem.attr(key, value);
      }
    };
    setTextFromValueForKey = function(elem, key, value) {
      value = valueForKey(key, value);
      if (value != null) {
        return elem.text(value);
      }
    };
    regexify = function(string_or_regex_or_array) {
      var thing;
      if (typeof string_or_regex_or_array === "string") {
        return "^" + string_or_regex_or_array + "$";
      } else if (string_or_regex_or_array.length != null) {
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = string_or_regex_or_array.length; _i < _len; _i++) {
            thing = string_or_regex_or_array[_i];
            _results.push(regexify(thing));
          }
          return _results;
        })()).join("|");
      } else {
        return string_or_regex_or_array;
      }
    };
    lang = normaliseLang(options.language ? options.language : $.defaultLanguage);
    if (options.skipLanguage && lang.match(regexify(options.skipLanguage))) {
      deferred.resolve();
    } else {
      loadLanguage(pkg, lang, 1);
    }
    wrappedSet.localizePromise = deferred;
    return wrappedSet;
  };
  $.fn.localize = $.localize;
  return $.localize.data = {};
})(jQuery);
