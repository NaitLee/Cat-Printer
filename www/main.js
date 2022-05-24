
'use strict';

/**
 * In order to debug on a phone, we load vConsole
 * https://www.npmjs.com/package/vconsole
 * Double-tap notice bar to activate
 */
function debug() {
    const script = document.createElement('script');
    script.src = 'vconsole.js';
    document.body.appendChild(script);
    script.addEventListener('load', () => new window.VConsole());
}
document.getElementById('notice').addEventListener('dblclick', debug);

var hidden_area = document.getElementById('hidden');

const hint = (function() {
    let hints;
    const callback = (event) => {
        event.stopPropagation();
        event.currentTarget.classList.remove('hint');
        event.currentTarget.removeEventListener('click', callback);
    }
    return function(selector) {
        if (hints)
            hints.forEach(element => element.classList.remove('hint'));
        hints = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
        hints.forEach(element => {
            element.classList.add('hint');
            element.addEventListener('click', callback);
        });
    }
})();

document.querySelectorAll('*[data-once]').forEach(e => e.addEventListener('click', () => e.remove()));

const Notice = (function() {
    const notice = document.getElementById('notice');
    let last_span;
    function put(message, things, class_name) {
        let text = i18n(message, things) || message;
        if (last_span) last_span.remove();
        let span = document.createElement('span');
        span.innerText = text;
        span.setAttribute('data-i18n', message);
        span.classList.add(class_name);
        notice.appendChild(span);
        last_span = span;
    }
    return {
        note: (message, things) => put(message, things, 'note'),
        wait: (message, things) => put(message, things, 'wait'),
        warn: (message, things) => put(message, things, 'warn'),
        error: (message, things) => put(message, things, 'error')
    }
})();

const Hider = (function() {
    const manipulator = {
        hide: (name) => document.querySelectorAll(`[data-hide-as="${name}"]`).forEach(e => e.classList.add('hard-hidden')),
        show: (name) => document.querySelectorAll(`[data-hide-as="${name}"]`).forEach(e => e.classList.remove('hard-hidden')),
    };
    document.querySelectorAll('[data-hide-as]').forEach(e => e.classList.add('hard-hidden'));
    document.querySelectorAll('[data-show]').forEach(e => e.addEventListener('click',
        () => manipulator.show(e.getAttribute('data-show'))));
    return manipulator;
})();

const Dialog = (function() {
    const dialog = document.getElementById('dialog');
    const dialog_content = document.getElementById('dialog-content');
    const dialog_choices = document.getElementById('dialog-choices');
    const dialog_input = document.getElementById('dialog-input');
    let last_choices;
    function clean_up() {
        if (last_choices)
            for (let choice of last_choices)
                choice.remove();
        // elements
        for (let element of dialog_content.children)
            hidden_area.appendChild(element);
        // text nodes
        for (let node of dialog_content.childNodes)
            node.remove();
    }
    function show(argument, as_string = false) {
        dialog.classList.remove('hidden');
        if (as_string)
            dialog_content.innerText = argument;
        else
            dialog_content.appendChild(document.querySelector(argument));
    }
    function apply_callback(callback, have_input = false, ... choices) {
        last_choices = [];
        dialog_input.value = '';
        dialog_input.style.display = have_input ? 'unset' : 'none';
        const keys = 'nm,.';
        let index = 0;
        for (let choice of choices) {
            let button = document.createElement('button');
            button.setAttribute('data-i18n', choice);
            button.setAttribute('data-key', keys[index++]);
            button.innerText = i18n(choice);
            if (!have_input)
                button.addEventListener('click', () => dialog_input.value = choice);
            dialog_choices.appendChild(button);
            last_choices.push(button);
        }
        hint([last_choices[0]]);
        return new Promise(resolve => {
            last_choices[0].addEventListener('click', () => {
                dialog.classList.add('hidden');
                if (callback) resolve(callback(dialog_input.value));
            });
            if (last_choices.length > 1)
                last_choices[1].addEventListener('click', () => {
                    dialog.classList.add('hidden');
                    if (callback) resolve(callback(null));
                });
        });
    }
    return {
        alert: function(selector, callback, as_string = false) {
            clean_up();
            let promise = apply_callback(callback, false, 'ok');
            show(selector, as_string);
            return promise;
        },
        confirm: function(selector, callback, as_string = false) {
            clean_up();
            let promise = apply_callback(callback, false, 'yes', 'no');
            show(selector, as_string);
            return promise;
        },
        prompt: function(selector, callback, as_string = false) {
            clean_up();
            let promise = apply_callback(callback, true, 'ok', 'cancel');
            show(selector, as_string);
            return promise;
        }
    }
})();

class _ErrorHandler {
    // TODO make better
    recordElement;
    constructor() {
        this.recordElement = document.getElementById('error-record');
    }
    /**
     * @param {Error} error
     * @param {string} output
     */
    report(error, output) {
        Notice.error('error-happened-please-check-error-message');
        let div = document.createElement('div');
        div.innerText = (error.stack || (error.name + ': ' + error.message)) + '\n' + output;
        this.recordElement.appendChild(div);
        document.querySelector('button[data-panel="panel-error"]').classList.remove('hidden');
        document.querySelector('button[data-panel="panel-settings"]').click();
        hint('button[data-panel="panel-error"]');
    }
}

const ErrorHandler = new _ErrorHandler();

/**
 * Call server API
 * @param {string} path API entry, as a path
 * @param {any} body JSON to send
 * @param {(response: Response) => Promise<any>} errorPreHandler
 * An async function for handling the problem where `response.ok` is false.
 * Omit or use `return Promise.reject()` to do final failure, or return something else to circumstance
 */
async function callApi(path, body, errorPreHandler) {
    body = body || {};
    return await fetch(path, {
        method: 'POST',
        body: JSON.stringify(body)
    }).then(async (response) => {
        if (response.ok) return response.json()
        else {
            try {
                // forgive this dirty trick
                let json = response.json();
                response.json = () => json;
                if (errorPreHandler) return await errorPreHandler(response);
                else throw new Error('API Failure');
            } catch (error) {
                ErrorHandler.report(
                    error,
                    JSON.stringify(await response.json(), undefined, 4)
                )
                return Promise.reject('API Failure');
            }
        }
    });
}
/**
 * call addEventListener on all selected elements by `seletor`,
 * with each element itself as `this` unless specifyed `thisArg`,
 * with type `type` and a function `callback`.
 * If an element have attribute `data-default` or `checked`, dispatch event immediately on it.
 * You can of course assign resulting object to a variable for futher use.
 */
class EventPutter {
    elements;
    callback;
    /**
     * @param {string} selector
     * @param {string} type
     * @param {(event?: Event) => void} callback
     * @param {any} thisArg
     */
    constructor(selector, type, callback, thisArg) {
        let elements = this.elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        this.callback = callback;
        elements.forEach(element => {
            element.addEventListener(type, function(event) {
                event.stopPropagation();
                event.cancelBubble = true;
                callback.call(thisArg || element, event);
            });
            if (element.hasAttribute('data-default') || element.checked) {
                element.dispatchEvent(new Event(type));
            }
        });
    }
}
/**
 * @param {string} selector
 * @param {string} type
 * @param {(event?: Event) => void} callback
 * @param {any} thisArg
 */
function putEvent(selector, type, callback, thisArg) {
    return new EventPutter(selector, type, callback, thisArg);
}

(function() {
    let panels = document.querySelectorAll('.panel');
    let buttons = document.querySelectorAll('*[data-panel]');
    panels.forEach(panel => {
        let button = document.querySelector(`*[data-panel="${panel.id}"]`);
        if (button) button.addEventListener('click', event => {
            event.stopPropagation();
            panels.forEach(p => p.classList.remove('active'));
            buttons.forEach(b => b.classList.remove('active'));
            panel.classList.add('active');
            button.classList.add('active');
        });
        if (panel.hasAttribute('data-default')) button.click();
    });
})();

/**
 * Class to control Printing Canvas (manipulate, preview etc.)
 * "Brightness" is historically "Threshold", while the later is kept in code
 */
class CanvasController {
    /** @type {HTMLCanvasElement} */
    preview;
    /** @type {HTMLCanvasElement} */
    canvas;
    imageUrl;
    algorithm;
    _height;
    _threshold;
    _energy;
    _thresholdRange;
    _energyRange;
    transparentAsWhite;
    previewData;
    static defaultHeight = 384;
    static defaultThreshold = 256 / 3;
    get threshold() {
        return this._threshold;
    }
    set threshold(value) {
        this._threshold = this._thresholdRange.value = value;
    }
    get energy() {
        return this._energy;
    }
    set energy(value) {
        this._energy = this._energyRange.value = value;
    }
    get height() {
        return this._height;
    }
    set height(value) {
        this.canvas.height = this.preview.height = this._height = value;
    }
    constructor() {
        this.preview = document.getElementById('preview');
        this.canvas = document.getElementById('canvas');
        this.controls = document.getElementById('control-overlay');
        this.textSize = document.getElementById("text-size");
        this.textFont = document.getElementById("text-font");
        this.textArea = document.getElementById("insert-text-area");
        this.wrapBySpace = document.querySelector('input[name="wrap-by-space"]');
        this.textAlgorithm = document.querySelector('input[name="algo"][value="algo-direct"]');
        this.height = CanvasController.defaultHeight;
        this._thresholdRange = document.querySelector('[name="threshold"]');
        this._energyRange = document.querySelector('[name="energy"]');
        this.imageUrl = null;
        this.textAlign = 0; // 0: Left, 1: Center, 2: Right

        const prevent_default = (event) => {
            event.preventDefault();
            return false;
        }

        this.canvas.addEventListener('dragover', prevent_default);
        this.canvas.addEventListener('dragenter', prevent_default);
        this.canvas.addEventListener('drop', (event) => {
            this.insertPicture(event.dataTransfer.files);
            return prevent_default(event);
        });

        this.textArea.style["font-size"] = this.textSize.value + "px";
        this.textArea.style["font-family"] = this.textFont.value;
        this.textArea.style["word-break"] = this.wrapBySpace.checked ? "break-word" : "break-all";

        putEvent('input[name="algo"]', 'change', (event) => this.useAlgorithm(event.currentTarget.value), this);
        putEvent('#insert-picture'   , 'click', () => this.insertPicture(), this);
        putEvent('#insert-text'   , 'click', () => Dialog.alert("#text-input", () => this.insertText(this.textArea.value)));
        putEvent('#text-size'   , 'change', () => this.textArea.style["font-size"] = this.textSize.value + "px"); 
        putEvent('#text-font'   , 'change', () => this.textArea.style["font-family"] = this.textFont.value); 
        putEvent('input[name="wrap-by-space"]'   , 'change', () => this.textArea.style["word-break"] = this.wrapBySpace.checked ? "break-word" : "break-all");
        putEvent('#button-preview'   , 'click', this.activatePreview , this);
        putEvent('#button-reset'     , 'click', this.reset           , this);
        putEvent('#canvas-expand'    , 'click', this.expand          , this);
        putEvent('#canvas-crop'      , 'click', this.crop            , this);

        putEvent('[name="threshold"]', 'change', (event) => {
            this.threshold = parseInt(event.currentTarget.value);
            this.activatePreview();
        }, this);
        putEvent('[name="energy"]', 'change', (event) => {
            this.energy = parseInt(event.currentTarget.value);
            this.visualEnergy(this.energy);
        }, this);
        putEvent('[name="transparent-as-white"]', 'change', (event) => {
            this.transparentAsWhite = event.currentTarget.checked;
            this.activatePreview();
        }, this);
    }
    useAlgorithm(name) {
        this.algorithm = name;
        this.threshold = CanvasController.defaultThreshold;
        this._thresholdRange.dispatchEvent(new Event('change'));
        this.energy = name == 'algo-direct' ? 96 : 64;
        this._energyRange.dispatchEvent(new Event('change'));
        this.activatePreview();
    }
    expand(length = CanvasController.defaultHeight) {
        this.height += length;
    }
    crop() {}
    visualEnergy(amount) {
        let rate = amount / 256;
        let brightness = Math.max(1.6 - rate * 1.5, 0.75),
            contrast = 1 + rate * 2;
        this.preview.style.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    activatePreview() {
        if (!this.imageUrl) return;
        let preview = this.preview;
        let t = Math.min(this.threshold, 255);
        let canvas = this.canvas;
        let w = canvas.width, h = canvas.height;
        preview.width = w; preview.height = h;
        let context_c = canvas.getContext('2d');
        let context_p = preview.getContext('2d');
        let data = context_c.getImageData(0, 0, w, h);
        let mono_data = new Uint8ClampedArray(w * h);
        monoGrayscale(data.data, mono_data, w, h, t, this.transparentAsWhite);
        switch (this.algorithm) {
            case 'algo-direct':
                monoDirect(mono_data, w, h, t);
                break;
            case 'algo-steinberg':
                monoSteinberg(mono_data, w, h, Math.floor(t / 2 - 64));
                break;
            case 'algo-halftone':
                // monoHalftone(mono_data, w, h, t);
                // Sorry, do it later
                break;
            case 'algo-new':
                monoNew(mono_data, w, h, t);
                break;
            case 'algo-new-h':
                monoNewH(mono_data, w, h, Math.floor(t / 2 - 64));
                break;
            case 'algo-new-v':
                monoNewV(mono_data, w, h, t);
                break;
            case 'algo-legacy':
                monoLegacy(mono_data, w, h, t);
                break;
        }
        let new_data = context_p.createImageData(w, h);
        let p;
        for (let i = 0; i < mono_data.length; i++) {
            p = i * 4;
            new_data.data.fill(mono_data[i], p, p + 3);
            new_data.data[p + 3] = 255;
        }
        this.previewData = mono_data;
        context_p.putImageData(new_data, 0, 0);
    }
    insertPicture(files) {
        const put_image = (url) => {
            this.imageUrl = url;
            let img = document.createElement('img');
            img.src = url;
            hidden_area.appendChild(img);
            img.addEventListener('load', () => {
                let canvas = this.canvas;
                let rate = img.height / img.width;
                this.height = canvas.width * rate;
                let context = canvas.getContext('2d');
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                this.crop();
                this.activatePreview();
                hint('#button-print');
            });
        }
        let use_files = (files) => {
            let file = files[0];
            if (!file) return;
            let url = URL.createObjectURL(file);
            put_image(url);
            this.controls.classList.add('hidden');
        }
        if (files) use_files(files);
        else {
            document.querySelectorAll('.dummy').forEach(e => e.remove());
            let input = document.createElement('input');
            input.classList.add('dummy');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', () => {
                use_files(input.files);
            });
            hidden_area.appendChild(input);
            input.click();
        }
    }
    insertText(text) {
        if (text == null) { return; }

        const text_size = parseInt(this.textSize.value);
        const text_font = this.textFont.value;
        const y_step = text_size;
        
        const ctx = this.canvas.getContext("2d");
        let canvas_font = text_size + "px " + text_font;
        const max_width = this.canvas.width - 10;
        
        // Use Word Wrap to split the text over multiple lines
        let lines = [];
        // Calculate the aproximate maximum length of a string
        // taking font and text size in account
        const get_max_chars_per_line = (text, ctx) => { 
            let text_width = ctx.measureText(text).width;
            let textIndex = max_width / text_width;
            
            if (textIndex > 1) { return text.length}
            return Math.floor(textIndex * text.length); 
        }
        
        // Wrap the text if it does not fit on a single line
        const wrap_text = (text, max_length) => {
            let split_pos = max_length;
            let newline_index = text.indexOf("\n");
            if (newline_index > 0 && newline_index < max_length) {
                return [text.slice(0, newline_index).trim(), text.slice(newline_index, text.length).trim()];
            }

            if (this.wrapBySpace.checked) {
                split_pos = text.lastIndexOf(" ", max_length);
                if (split_pos <= 0) { split_pos = max_length; }
            }

            return [text.slice(0, split_pos).trim(), text.slice(split_pos, text.length).trim()];
        }
        
        ctx.font = canvas_font;
        while (ctx.measureText(text).width > max_width) {
            let line;
            let max_chars = get_max_chars_per_line(text, ctx);
            if (max_chars == 0) { 
                lines.push(text.slice(0, 1));
                text = text.slice(1, text.length);
                continue;
            }
            [line, text] = wrap_text(text, max_chars);
            lines.push(line);
        }
        
        for (let split of text.split("\n")) {
            lines.push(split);
        }

        this.height = (lines.length * y_step) + (y_step / 2);
        ctx.font = canvas_font; // Setting this.height resets the font.

        let y_pos = y_step;
        for (let line of lines) {
            let x_pos = 0;
            if (this.textAlign == 2) {
                x_pos = Math.max(max_width - ctx.measureText(line).width, 0)
            } else if (this.textAlign == 1) {
                x_pos = Math.max(max_width - ctx.measureText(line).width, 0) / 2;
            }
            
            ctx.fillText(line, x_pos, y_pos); 
            y_pos += y_step;
        }

        this.crop();

        this.textAlgorithm.checked = true;
        this.textAlgorithm.dispatchEvent(new Event("change"));
        
        this.imageUrl = this.canvas.toDataURL();
        this.activatePreview();
        
        this.controls.classList.add('hidden');

        hint('#button-print');
        return true;
    }
    reset() {
        let canvas = this.canvas;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        canvas.height = CanvasController.defaultHeight;
        this.activatePreview();
        this.imageUrl = null;
        this.controls.classList.remove('hidden');
    }
    makePbm() {
        let blob = mono2pbm(this.previewData, this.preview.width, this.preview.height);
        return blob;
    }
}

/** @param {Document} doc */
function applyI18nToDom(doc) {
    doc = doc || document;
    let elements = doc.querySelectorAll('*[data-i18n]');
    let i18n_data, translated_string;
    elements.forEach(element => {
        i18n_data = element.getAttribute('data-i18n');
        translated_string = i18n(i18n_data);
        if (translated_string === i18n_data) return;
        // element.innerText = translated_string;
        if (element.firstChild.textContent !== translated_string)
            element.firstChild.textContent = translated_string;
    });
}
async function initI18n(current_language) {
    if (typeof i18n === 'undefined') return;
    /** @type {HTMLSelectElement} */
    let language_options = document.getElementById('select-language');
    /** @type {{ [code: string]: string }} */
    let list = await fetch('/lang/list.json').then(r => r.json());
    let use_language = async (value) => {
        i18n.useLanguage(value);
        i18n.add(value, await fetch(`/lang/${value}.json`).then(r => r.json()), true);
        applyI18nToDom();
    }
    for (let code in list) {
        let option = document.createElement('option');
        option.value = code;
        option.innerText = list[code];
        option.addEventListener('click', (event) => {
            /** @type {HTMLOptionElement} */
            let option = event.currentTarget;
            let value = option.value;
            option.selected = true;
            language_options.selectedIndex = option.index;
            use_language(value);
            Notice.note('welcome');
        });
        language_options.appendChild(option);
    }
    if (!navigator.languages) {
        if (!navigator.language) return;
        else navigator.languages = [navigator.language, 'en-US'];
    }
    if (current_language) {
        for (let option of language_options.children)
            if (option.value === current_language)
                option.click();
    } else for (let code of navigator.languages)
        if (list[code]) for (let option of language_options.children)
            if (option.value === code) {
                option.setAttribute('data-default', '');
                if (!current_language) option.click();
                return;
            }
}

async function testI18n(lang) {
    i18n.useLanguage(lang);
    i18n.add(lang, await fetch(`/lang/${lang}-ex.jsonc`)
        .then(r => r.text())    // jsonc: JSON with comment
        .then(t => JSON.parse(t.replace(/\s*\/\/.*/g, '')))
    , true);
}

async function fakeAndroid(enable) {
    await callApi('/set', { 'is_android': enable });
    window.location.reload();
}

class Main {
    promise;
    /** @type {CanvasController} */
    canvasController;
    deviceOptions;
    /** An object containing configuration, fetched from server */
    settings;
    /** @type {{ [key: string]: EventPutter }} */
    setters;
    /**
     * There are race conditions in initialization query/set,
     * use this flag to avoid
     */
    allowSet;
    constructor() {
        this.allowSet = false;
        this.deviceOptions = document.getElementById('device-options');
        this.settings = {};
        this.setters = {};
        // window.addEventListener('unload', () => this.exit());
        this.promise = new Promise(async (resolve, reject) => {
            /** @type {HTMLIFrameElement} */
            let iframe = document.getElementById('frame');
            iframe.addEventListener('load', () => {
                if (!iframe.contentWindow.NodeList.prototype.forEach)
                    iframe.contentWindow.NodeList.prototype.forEach = NodeList.prototype.forEach;
                iframe.contentDocument.body.classList.value = document.body.classList.value;
                iframe.contentDocument.body.addEventListener('keyup', (event) => {
                    if (event.key === 'Escape' || event.keyCode === 27) {
                        document.body.dispatchEvent(
                            new KeyboardEvent('keyup', { key: 'Escape', keyCode: 27 })
                        );
                    }
                });
                applyI18nToDom(iframe.contentDocument);
            });
            function apply_class(class_name, value) {
                [document, iframe.contentDocument].forEach(d => value ?
                    d.body.classList.add(class_name) :
                    d.body.classList.remove(class_name)
                );
            }

            await this.loadConfig();
            await initI18n(this.settings['language']);

            this.canvasController = new CanvasController();
            putEvent('#button-exit', 'click', () => this.exit(false), this);
            putEvent('#button-exit', 'contextmenu',
                (event) => (event.preventDefault(), this.exit(true)), this);
            putEvent('#button-print', 'click', this.print, this);
            putEvent('#device-refresh', 'click', this.searchDevices, this);
            putEvent('#set-accessibility', 'click', () => Dialog.alert('#accessibility'));
            this.attachSetter('#device-options', 'input', 'printer', 
                (value) => callApi('/connect', { device: value })
            );
            putEvent('a[target="frame"]', 'click', () => Dialog.alert('#frame'));
            this.attachSetter('[name="scan-time"]', 'change', 'scan_timeout');
            this.attachSetter('input[name="algo"]', 'change', 'mono_algorithm',
                (value) => this.settings['text_mode'] = (value === 'algo-direct')
            );
            this.attachSetter('[name="transparent-as-white"]', 'change', 'transparent_as_white');
            this.attachSetter('[name="wrap-by-space"]', 'change', 'wrap_by_space');
            this.attachSetter('[name="dry-run"]', 'change', 'dry_run',
                (checked) => checked && Notice.note('dry-run-test-print-process-only')
            );
            this.attachSetter('[name="no-animation"]', 'change', 'no_animation',
                (checked) => apply_class('no-animation', checked)
            );
            this.attachSetter('[name="large-font"]', 'change', 'large_font',
                (checked) => apply_class('large-font', checked)
            );
            this.attachSetter('[name="force-rtl"]', 'change', 'force_rtl',
                (checked) => apply_class('force-rtl', checked)
            );
            this.attachSetter('[name="dark-theme"]', 'change', 'dark_theme',
                (checked) => apply_class('dark', checked)
            );
            this.attachSetter('[name="high-contrast"]', 'change', 'high_contrast',
                (checked) => apply_class('high-contrast', checked)
            );
            this.attachSetter('[name="threshold"]', 'change', 'threshold');
            this.attachSetter('[name="energy"]', 'change', 'energy');
            this.attachSetter('[name="quality"]', 'change', 'quality');
            this.attachSetter('[name="flip"]', 'change', 'flip');
            // this.attachSetter('[name="flip-h"]', 'change', 'flip_h');
            // this.attachSetter('[name="flip-v"]', 'change', 'flip_v');
            // this.attachSetter('[name="dump"]', 'change', 'dump');
            await this.activateConfig();
            // one exception
            this.attachSetter('#select-language option', 'click', 'language');

            if (this.settings['is_android']) {
                document.body.classList.add('android');
                // select[multiple] doesn't work well with Android
                let div = document.createElement('div');
                let select = document.getElementById('select-language');
                Array.from(select.children).forEach(e => {
                    e.selected = false;
                    div.appendChild(e);
                });
                div.id = 'select-language';
                select.replaceWith(div);
            }
            if (typeof initKeyboardShortcuts === 'function') initKeyboardShortcuts();
            // this.searchDevices();
            document.querySelector('main').classList.remove('hard-hidden');
            document.getElementById('loading-screen').classList.add('hidden');
            resolve();
        });
    }
    query(key) { return this.settings[key]; }
    /** Sync setting(s) to server ("set") */
    async set(body, errorPreHandler) {
        if (this.allowSet) return await callApi('/set', body, errorPreHandler);
        else return null;
    }
    /**
     * Load saved config from server
     */
    async loadConfig() {
        this.settings = await callApi('/query');
    }
    /**
     * Activate all setters with corresponding values in settings.
     * Before calling, please first loadConfig & do `attachSetter` on all desired elements/inputs.
     * After the load, will save config to server again in order to sync default values.
     * Then, if permitted, every single change will sync to server instantly
     */
    async activateConfig() {
        this.allowSet = false;
        if (this.settings['first_run'])
            Dialog.alert('#accessibility', () => this.set({ first_run: false }));
        for (let key in this.settings) {
            let value = this.settings[key];
            if (this.setters[key] === undefined) continue;
            // Set the *reasonable* value
            this.setters[key].elements.forEach(element => {
                switch (element.type) {
                    case 'checkbox':
                        element.checked = value;
                        break;
                    case 'radio':
                        // Only dispatch on the selected one
                        if (element.value !== value) return;
                        element.checked = value;
                        break;
                    case 'text':
                    case 'number':
                    case 'range':
                        element.value = value;
                        break;
                    default:
                        if (element.value === value)
                            element.click();
                }
                element.dispatchEvent(new Event('change'));
            });
        }
        this.allowSet = true;
        await this.set(this.settings);
    }
    /**
     * Create an event handler and attach to selected elements, that change/reflect `settings`
     * @param {string} attribute The setting to change, i.e. `this.setting[attribute] = value;`
     * @param {(value: any) => any} callback Optional additinal post-procedure to call, with a *reasonable* value as parameter
     */
    attachSetter(selector, type, attribute, callback) {
        this.setters[attribute] = putEvent(selector, type, event => {
            event.stopPropagation();
            event.cancelBubble = true;
            let input = event.currentTarget;
            let value;
            // Get the *reasonable* value
            switch (input.type) {
                case 'number':
                case 'range':
                    value = parseFloat(input.value); break;
                case 'checkbox':
                    value = input.checked; break;
                case 'radio':
                    if (input.checked) value = input.value; break;
                default:
                    value = input.value;
            }
            this.settings[attribute] = value;
            this.set({ [attribute]: value });
            return callback ? callback(value) : undefined;
        }, this);
    }
    async exit(reset) {
        Notice.wait('exiting');
        if (reset &&
            (await Dialog.confirm(
                i18n('reset-configuration-'),
                value => !!value, true)
            )
        )
            this.settings['version'] = -1;
        await this.set(this.settings);
        await callApi('/exit');
        window.close();
        // Browser may block the exit
        Notice.note('you-can-close-this-page-manually');
    }
    /** @param {Response} response */
    async bluetoothProblemHandler(response) {
        // Not complete yet, it's different across other platforms
        let error_details = await response.json();
        if (
            error_details.name === 'org.bluez.Error.NotReady' ||
            error_details.name === 'org.freedesktop.DBus.Error.UnknownObject' ||
            error_details.details.includes('not turned on') ||
            error_details.details.includes('WinError -2147020577')
        ) Notice.warn('please-enable-bluetooth');
        else if (
            error_details.details.includes('no running event loop')
        ) Notice.error('internal-error-please-see-terminal');
        else throw new Error('Unknown Bluetooth Problem');
        return null;
    }
    async searchDevices() {
        Notice.wait('scanning-for-devices');
        let search_result = await callApi('/devices', null, this.bluetoothProblemHandler);
        if (search_result === null) return false;
        let devices = search_result.devices;
        Array.from(this.deviceOptions.children).forEach(e => e.remove());
        if (devices.length === 0) {
            Notice.note('no-available-devices-found');
            hint('#device-refresh');
            return false;
        }
        Notice.note('found-0-available-devices', [devices.length]);
        hint('#insert-picture');
        devices.forEach(device => {
            let option = document.createElement('option');
            option.value = `${device.name},${device.address}`;
            option.innerText = `${device.name}-${device.address.slice(3, 5)}${device.address.slice(0, 2)}`;
            this.deviceOptions.appendChild(option);
        });
        this.deviceOptions.dispatchEvent(new Event('input'));
        return true;
    }
    async print() {
        if (this.canvasController.imageUrl === null) return;
        await this.set(this.settings);
        Notice.wait('printing');
        await fetch('/print', {
            method: 'POST',
            body: this.canvasController.makePbm()
        }).then(async (response) => {
            if (response.ok) Notice.note('finished')
            else {
                let json = response.json();
                response.json = () => json;
                let error_data = await response.json();
                if (/address.+not found|Not connected/.test(error_data.details) ||
                        error_data.name === 'EOFError') {
                    if (await this.searchDevices()) this.print();
                    else Notice.error('please-check-if-the-printer-is-down');
                } else if (error_data.name === 'no-available-devices-found')
                    Notice.warn('no-available-devices-found');
                else
                    ErrorHandler.report(
                        new Error('API Failure'),
                        JSON.stringify(await response.json(), undefined, 4)
                    )
            }
        });
    }
}

var main = new Main();
