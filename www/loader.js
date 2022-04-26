
/**
 * Satisfy both development and old-old webView need
 */
(function() {

    var fallbacks = [
        // main scripts, which we will directly modify
        'i18n-ext.js', 'i18n.js', 'image.js', 'accessibility.js', 'main.js',
        // "compatibility" script, produced with eg. typescript tsc
        'main.comp.js'
    ];
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