(function () {
  'use strict';

  /**
   * CookieBridge service
   *
   * - Normalizes cookie read/write operations for the AngularJS host
   * - Exposes a tiny global object so modern MFEs (Angular, React, etc.) can
   *   interact with the exact same helper when they run inside the host shell
   * - Uses sane defaults (Path=/, SameSite=Lax) so cookies are available across
   *   all embedded MFEs while still respecting modern browser requirements
   */
  angular
    .module('phonecatApp')
    .service('cookieBridge', ['$window', function ($window) {
      function parseCookies() {
        return ($window.document.cookie || '')
          .split(';')
          .map(function (cookie) { return cookie.trim(); })
          .filter(Boolean)
          .reduce(function (acc, cookie) {
            var parts = cookie.split('=');
            var name = decodeURIComponent(parts.shift() || '');
            var value = decodeURIComponent(parts.join('=') || '');
            acc[name] = value;
            return acc;
          }, {});
      }

      function buildCookieString(name, value, options) {
        options = options || {};
        var cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
        cookie += '; Path=' + (options.path || '/');

        if (options.domain) {
          cookie += '; Domain=' + options.domain;
        }
        if (typeof options.maxAge === 'number') {
          cookie += '; Max-Age=' + options.maxAge;
        }
        if (options.expires instanceof Date) {
          cookie += '; Expires=' + options.expires.toUTCString();
        }
        if (options.secure) {
          cookie += '; Secure';
        }
        if (options.sameSite) {
          cookie += '; SameSite=' + options.sameSite;
        } else {
          cookie += '; SameSite=Lax';
        }

        // HttpOnly cannot be set via JavaScript; warn once if requested
        if (options.httpOnly) {
          console.warn('[cookieBridge] HttpOnly cannot be set from JavaScript. Configure this server-side.');
        }

        return cookie;
      }

      this.set = function (name, value, options) {
        if (!name) {
          throw new Error('[cookieBridge] Cookie name is required.');
        }
        $window.document.cookie = buildCookieString(name, value, options);
      };

      this.get = function (name) {
        if (!name) {
          return null;
        }
        var cookies = parseCookies();
        return cookies.hasOwnProperty(name) ? cookies[name] : null;
      };

      this.getAll = function () {
        return parseCookies();
      };

      this.remove = function (name, options) {
        if (!name) {
          return;
        }
        var removalOptions = angular.extend({}, options, {
          maxAge: 0,
          expires: new Date(0)
        });
        $window.document.cookie = buildCookieString(name, '', removalOptions);
      };
    }])
    .run(['$window', 'cookieBridge', function ($window, cookieBridge) {
      // Expose a safe global so Angular (or any other MFE) can reuse helpers
      if (!$window.cookieBridge) {
        $window.cookieBridge = {
          set: cookieBridge.set.bind(cookieBridge),
          get: cookieBridge.get.bind(cookieBridge),
          getAll: cookieBridge.getAll.bind(cookieBridge),
          remove: cookieBridge.remove.bind(cookieBridge)
        };
      }
    }]);
})();

