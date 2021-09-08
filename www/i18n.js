
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.i18N = {}));
    }
}(this, function (exports) {
    var _document = document;

    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    var data = '', dataelem = _document.querySelector('#i18-N');
    if (dataelem != null) data = dataelem.value; else return;

    var lang = {}, langname = '', defaultlang = 'en_US', matchedtags = [];

    matchedtags = data.match(/\[(.+)\]/ig);
    matchedtags.forEach(function(tag) {
        langname = tag.slice(1, -1);
        lang[langname] = {};
        data.split(tag+'\n')[1].split('\n\n[')[0].split('\n').map(function(value) { return value.split('='); }).forEach(function(array) {
            lang[langname][array[0]] = array[1];
        });
    });

    for (var i in lang['global']) {
        for (var j in lang) {
            lang[j][i] = lang['global'][i];
        }
    }

    var parseattr = [];

    function backup() {
        lang['originalattr'] = [];
        lang['originaltext'] = [];
        _document.querySelectorAll('*').forEach(function(elem) {
            parseattr.forEach(function(attr) {
                var originaltext = elem[attr];
                if (originaltext == undefined) return;
                lang['originalattr'].push([elem, originaltext]);
            });
            elem.childNodes.forEach(function(node){
                if (node.nodeType == Node.TEXT_NODE) {
                    var originaltext = node.nodeValue;
                    if (originaltext == undefined) return;
                    lang['originaltext'].push([node, originaltext]);
                }
            });
        });
    }

    backup();

    function recover() {
        for (var i in lang['originalattr']) {
            lang['originalattr'][i][0].value = lang['originalattr'][i][1];
        }
        for (var i in lang['originaltext']) {
            lang['originaltext'][i][0].nodeValue = lang['originaltext'][i][1];
        }
    }

    function get(originaltext, language) {
        if (lang[language] == undefined) return originaltext;
        language = language || userlang || defaultlang;
        return lang[language][originaltext] || originaltext;
    }

    function force(language) {
        recover(); userlang = language;
        _document.querySelectorAll('*').forEach(function(elem) {
            parseattr.forEach(function(attr) {
                var originaltext = elem[attr];
                if (originaltext == undefined) return;
                var localizedtext = lang[language][originaltext];
                if (localizedtext == undefined) return;
                elem[attr] = localizedtext;
            });
            elem.childNodes.forEach(function(node){
                if (node.nodeType == Node.TEXT_NODE) {
                    var originaltext = node.nodeValue;
                    var localizedtext = lang[language][originaltext];
                    if (localizedtext == undefined) return;
                    node.nodeValue = localizedtext;
                }
            });
        });
    }
    exports.get = get;
    exports.force = force;
    exports.recover = recover;

    var userlang = navigator.language;
    if (lang[userlang] == undefined) return;
    force(userlang);
}));
