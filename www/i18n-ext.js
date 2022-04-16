
/**
 * Methods to know which string to use, per language
 */
var I18nExtensions = (function() {

    /** @type {ExtensionOf<'en-US'>} */
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

    /** @type {ExtensionOf<'zh-CN'>} */
    function chinese(things, conditions) {
        let text = conditions;
        return text;
    }

    /** @type {ExtensionOf<'de-DE'>} */
    function german(things, conditions) {
        let text = conditions;
        for (let index in things) {
            let value = things[index];
            if (value == 1) text = conditions['single'];
            else text = conditions['multiple'];
        }
        return text;
    }

    return {
        'en-US': english,
        'zh-CN': chinese,
        'de-DE': german
    }

})();
