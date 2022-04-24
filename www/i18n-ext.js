
///<reference path="i18n.d.ts" />

/**
 * Methods to know which string to use, per language
 * Regard other as examples, and make your own!
 */
var I18nExtensions = (function() {

    // Don't forget to register your extension first!
    var registers = {
        'en-US': english,
        'zh-CN': chinese,
        'de-DE': german
    };

    /**
     * Here's especially useful for showing what can be done!
     * @type {ExtensionOf<'en-US'>}
     */
    function english(things, conditions) {
        let text = conditions;
        for (let index in things) {
            let value = things[index];
            if (value == 1) text = conditions['single'];
            else text = conditions['multiple'];
            if (!text && typeof value === 'number') {
                if (value < 10 || value > 20) {
                    if (value % 10 === 1) text = conditions['1st'];
                    else if (value % 10 === 2) text = conditions['2nd'];
                    else if (value % 10 === 3) text = conditions['3rd'];
                    else text = conditions['nth'];
                } else text = conditions['nth'];
            }
        }
        return text;
    }

    /**
     * 精辟。不解释。
     * 不过，量词什么的，以后再说……
     * @type {ExtensionOf<'zh-CN'>}
     */
    function chinese(things, conditions) {
        return conditions;
    }

    /**
     * @type {ExtensionOf<'de-DE'>}
     */
    function german(things, conditions) {
        let text = conditions;
        for (let index in things) {
            let value = things[index];
            if (value == 1) text = conditions['single'];
            else text = conditions['multiple'];
        }
        return text;
    }

    return registers;

})();
