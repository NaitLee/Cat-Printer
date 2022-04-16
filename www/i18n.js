
'use strict';

/**
 * Yet another i18n solution
 */
class I18n {
    /** @type {DictOf<LanguageData>} */
    database;
    /** @type {DictOf<Extension>} */
    extensions;
    /** @type {Languages} */
    language;
    constructor(language = 'en') {
        this.database = {};
        this.extensions = {};
        this.useLanguage(language);
    }
    /**
     * Use this language as main language
     * @param {Languages} language
     */
    useLanguage(language) {
        this.language = language;
        if (!this.database[language])
            this.database[language] = {};
    }
    /**
     * Add data as corresponding language, also to
     * other (added) languages as fallback
     * @param {Languages} language
     * @param {LanguageData} data
     */
    add(language, data) {
        if (!this.database[language])
            this.database[language] = {};
        for (let key in data) {
            let value = data[key];
            this.database[language][key] = value;
            for (let lang in this.database)
                if (!this.database[lang][key])
                    this.database[lang][key] = value;
        }
    }
    /**
     * Use extension in the language
     * @param {Languages} language
     * @param {Extension} extension
     */
    extend(language, extension) {
        this.extensions[language] = extension;
    }
    /**
     * Alias a language code to another, usually formal/more used/as fallback
     * @param {DictOf<Languages>} aliases 
     */
    alias(aliases) {
        for (let alt_code in aliases) {
            let code = aliases[alt_code];
            this.database[alt_code] = this.database[code];
            this.extensions[alt_code] = this.extensions[code];
        }
    }
    /**
     * Translate a string ("text"), using "things" such as numbers
     * @param {string} text
     * @param {Things} things
     * @param {boolean} can_change_things
     */
    translate(text, things, can_change_things = true) {
        let conditions = this.database[this.language][text] || text;
        if (!things) return conditions;
        if (!can_change_things) things = { ... things };
        if (this.extensions[this.language] && typeof conditions !== 'string')
            text = this.extensions[this.language](things, conditions);
        else text = conditions;
        for (let key in things) {
            text = text.replace(`{${key}}`, things[key].toString());
        }
        return text;
    }
}

/**
 * A i18n instance that is directly callable
 * @type {I18nCallable}
 */
var i18n = (function() {

    let instance = new I18n();

    /**
     * @param {string} text
     * @param {Things} things 
     * @param {boolean} can_change_things
     */
    let i18n_callable = function(text, things, can_change_things = true) {
        return instance.translate.call(i18n_callable, text, things, can_change_things);
    }

    Object.setPrototypeOf(i18n_callable, instance);

    if (typeof I18nExtensions === 'object') {
        for (let key in I18nExtensions)
            instance.extend(key, I18nExtensions[key]);
    }

    return i18n_callable;
})();
