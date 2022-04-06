
/**
 * Polyfill
 */
(function() {
    if (!NodeList.prototype.forEach)
        NodeList.prototype.forEach = Array.prototype.forEach;
})();
