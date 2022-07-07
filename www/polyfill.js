`
Copyright © 2021-2022 NaitLee Soft. No rights reserved.

License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
`;

// Polyfills

// home-made minimal fetch
// Note: only useful with this application. Extend (or remove) it as needed.
// In fact I wanted to support Otter Browser for resource-concerning people
if (!window.fetch) window.fetch = function(url, options) {
    options = options || {};
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url);
        function response(is_binary) {
            return new Promise(function(resolve, reject) {
                resolve(is_binary ? xhr.response : xhr.responseText);
            });
        }
        xhr.onload = function() {
            resolve({
                text: function() { return response(false); },
                json: function() { return response(false).then(t => JSON.parse(t)); },
                ok: Math.floor(xhr.status / 100) === 2
            });
        }
        xhr.send(options.body || null);
    });
}

// and this
if (!NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
