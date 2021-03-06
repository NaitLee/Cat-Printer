`
No rights reserved.

License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
`;

///<reference path="i18n.d.ts" />

/**
 * Methods to know which string to use, per language
 * Regard other as examples, and make your own!
 */
var I18nExtensions = (function() {

    // Don't forget to register your extension first!
    var registers = {
        'en-US': English,
        'zh-CN': Chinese,
        'de-DE': German,
        'ar': Arabic
    };

    /**
     * Here's especially useful for showing what can be done!
     * @type {ExtensionOf<'en-US'>}
     */
    function English(things, conditions) {
        if (typeof conditions === 'string')
            return conditions;
        for (let key in things) {
            let value = things[key];
            if (typeof value === 'number') {
                if (conditions['nth']) {
                    // You can also replace what would be shown!
                    if (value < 10 || value > 20) {
                        if (value % 10 === 1) things[key] = value + 'st';
                        else if (value % 10 === 2) things[key] = value + 'nd';
                        else if (value % 10 === 3) things[key] = value + 'rd';
                        else things[key] = value + 'th';
                    } else things[key] = value + 'th';
                    return conditions['nth'];
                } else {
                    if (value == 1) return conditions['single'];
                    else return conditions['multiple'];
                }
            } else {
                if (conditions['an']) {
                    if ('aeiouAEIOU'.includes(value[0]))
                        things[key] = 'an ' + things[key];
                    else things[key] = 'a ' + things[key];
                    return conditions['an'];
                }
            }
            // There are many thing else. Eg. Floor counting of en-US versus en-GB
            // But in a project we should take just enough
        }
    }

    /**
     * @type {ExtensionOf<'zh-CN'>}
     */
    function Chinese(things, conditions) {
        if (typeof conditions === 'string')
            return conditions;
        for (let key in things) {
            function prepend(value) { things[key] = value + things[key]; }
            let value = things[key];
            if (typeof value === 'number') {
                // ?????????????????????
                return conditions;
            } else {
                if (conditions['measure']) {
                    // ??????????????????????????????
                    switch (value) {
                        case '???':
                        case '???':
                            prepend('???'); break;
                        case '???':
                        case '???':
                            prepend('???'); break;
                        case '???':
                        case '???':
                            prepend('???'); break;
                        case '???':
                        case '???':
                            prepend('???'); break;
                        case '??????':
                        case '??????':
                            prepend('???'); break;
                        case '??????':
                            prepend('???'); break;
                        default:
                            prepend('???');
                    }
                    // ??????????????????????????????????????????
                    return conditions['measure'];
                }
            }
        }
    }

    /**
     * @type {ExtensionOf<'de-DE'>}
     */
    function German(things, conditions) {
        if (typeof conditions === 'string')
            return conditions;
        for (let index in things) {
            let value = things[index];
            if (typeof value === 'number') {
                if (value == 1) return conditions['single'];
                else return conditions['multiple'];
            }
        }
    }

    /**
     * @type {ExtensionOf<'ar'>}
     */
    function Arabic(things, conditions) {
        // Another example of replacement
        // const arabic_numbers = '????????????????????';
        for (let key in things) {
            let value = things[key];
            if (typeof value === 'number')
                things[key] = value.toLocaleString('ar');
        }
        return conditions;
    }

    return registers;

})();
