`
No rights reserved.

License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
`;

window.exports = {};

/**
 * Satisfy both development and old-old webView need
 */
(function() {

    var fallbacks;
    if (location.href.indexOf('?debug') !== -1)
        fallbacks = ['i18n-ext.js', 'i18n.js', 'image.js', 'dash-xml.js', 'accessibility.js', 'main.js'];
    else
        fallbacks = ['~every.js', 'main.comp.js'];
    var trial_count = 0;
    /**
     * Try to load next "fallback" script,  
     * until we see the "main" variable (ie. success)  
     * fail if nothing is left to load.  
     * This is recursive. Just call once.
     */
    function try_load() {
        var script = document.createElement('script');
        script.addEventListener('load', function() {
            if (typeof main === 'undefined') {
                // the script can't be 'unrun', though
                script.remove();
                try_load();
            } else {
                console.log('Success');
            }
        });
        var path = fallbacks[trial_count++];
        if (!path) throw new Error('All fallback scripts were tried');
        script.src = path;
        console.log('Trying script: ' + path);
        document.body.appendChild(script);
    }
    
    try_load();
    
})();