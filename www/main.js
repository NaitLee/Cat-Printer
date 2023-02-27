
`
Cat-Printer: Web Frontend
Use together with 'index.html'

Copyright © 2021-2022 NaitLee Soft. All rights reserved.

License GPL-3.0-or-later: https://www.gnu.org/licenses/gpl-3.0.html
`;

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

const Ev = (function() {
    /** @type {Record<string, NodeListOf<HTMLElement>>} */
    let map = {};
    return {
        /**
         * Attach event & callback to elements selected by selector.
         * @param {string} selector
         * @param {string} type
         * @param {(event?: Event) => void} callback
         * @param {any} thisArg
         */
        put: function(selector, type, callback, thisArg) {
            let elements = document.querySelectorAll(selector);
            map[selector] = elements;
            for (let e of elements) {
                e.addEventListener(type, function(event) {
                    event.stopPropagation();
                    event.cancelBubble = true;
                    callback.call(thisArg || e, event);
                });
                if (e.hasAttribute('data-default') || e.checked) {
                    e.dispatchEvent(new Event(type));
                }
            }
        },
        /**
         * Dispatch event to elements that are selected before with the same selector.
         * Optionally set a value.
         * @param {string} selector
         * @param {string} type
         * @param {{
         *  event?: Event,
         *  value?: string | number | boolean
         * }} args
         */
        dispatch: function(selector, type, { event, value } = {}) {
            if (map[selector] === undefined) return;
            for (let e of map[selector]) {
                if (value !== undefined)
                    switch (e.type) {
                        case 'checkbox':
                            if (e.checked === !value) e.click();
                            break;
                        case 'radio':
                            if (e.value === value) e.click();
                            break;
                        case 'text':
                        case 'number':
                        case 'range':
                            e.value = value;
                            break;
                        default:
                            if (e.value === value) e.click();
                    }
                else e.dispatchEvent(event || new Event(type));
            }
        }
    };
})();

/**
 * Open a panel
 * @type {(id: string) => void}
 */
const Panel = (function() {
    let panels = document.querySelectorAll('.panel');
    let buttons = document.querySelectorAll('*[data-panel]');
    let map = {};
    for (let panel of panels) {
        let button = document.querySelector(`*[data-panel="${panel.id}"]`);
        if (!button) continue;
        button.addEventListener('click', event => {
            event.stopPropagation();
            panels.forEach(p => p.classList.remove('active'));
            buttons.forEach(b => b.classList.remove('active'));
            panel.classList.add('active');
            button.classList.add('active');
        });
        map[panel.id] = button;
        if (panel.hasAttribute('data-default')) button.click();
    }
    return id => map[id]?.click();
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
    isImageNew;
    // this costs most of the effort. cache it
    /** @type {Uint8ClampedArray} */
    grayscaleCache;
    algorithm;
    textFont;
    textSize;
    textArea;
    transparentAsWhite;
    previewPbm;
    rotate;
    #height;
    #threshold;
    #energy;
    static defaultHeight = 384;
    static defaultThreshold = 256 / 3;
    get threshold() {
        return this.#threshold;
    }
    set threshold(value) {
        Ev.dispatch('#threshold', 'change', { value: this.#threshold = value });
    }
    get energy() {
        return this.#energy;
    }
    set energy(value) {
        Ev.dispatch('#energy', 'change', { value: this.#energy = value });
    }
    get height() {
        return this.#height;
    }
    set height(value) {
        this.canvas.height = this.preview.height = this.#height = value;
    }
    constructor() {
        this.preview = document.getElementById('preview');
        this.canvas = document.getElementById('canvas');
        this.controls = document.getElementById('control-overlay');
        this.textSize = document.getElementById("text-size");
        this.textFont = document.getElementById("text-font");
        this.textArea = document.getElementById("insert-text-area");
        this.wrapBySpace = document.querySelector('input[name="wrap-words-by-spaces"]');
        this.height = CanvasController.defaultHeight;
        this.imageUrl = null;
        this.textAlign = "left";
        this.rotate = false;
        this.isImageNew = true;
        this.grayscaleCache = null;
        
        for (let elem of document.querySelectorAll("input[name=text-align]")){
            if (elem.checked) { this.textAlign = elem.value; }
        }

        const prevent_default = (event) => {
            event.preventDefault();
            return false;
        }

        this.canvas.addEventListener('dragover', prevent_default);
        this.canvas.addEventListener('dragenter', prevent_default);
        this.canvas.addEventListener('drop', (event) => {
            if (event.dataTransfer?.files[0]?.type.split("/")[0] == "text") {
                let file_reader = new FileReader();
                file_reader.onload = () => {
                    this.textArea.value = file_reader.result; 
                    Dialog.alert("#text-input", () => this.insertText(this.textArea.value));
                };
                file_reader.readAsText(event.dataTransfer.files[0]);
            } else {
                this.useFiles(event.dataTransfer.files);
            }
            return prevent_default(event);
        });

        this.textArea.style["font-size"] = this.textSize.value + "px";
        this.textArea.style["font-family"] = this.textFont.value;
        this.textArea.style["word-break"] = this.wrapBySpace.checked ? "break-word" : "break-all";

        Ev.put('[name="algo"]'  , 'change', (event) => this.useAlgorithm(event.currentTarget.value), this);
        Ev.put('#insert-picture', 'click' , () => this.useFiles(), this);
        Ev.put('#insert-text'   , 'click' , () => Dialog.alert("#text-input", () => this.insertText(this.textArea.value)));
        Ev.put('#text-size'     , 'change', () => this.textArea.style["font-size"] = this.textSize.value + "px"); 
        Ev.put('#text-font'     , 'change', () => this.textArea.style["font-family"] = this.textFont.value); 
        Ev.put('input[name="text-align"]', 'change', (event) => {
            this.textAlign = event.currentTarget.value;
            this.textArea.style["text-align"] = this.textAlign;
        }, this);
        Ev.put('input[name="wrap-words-by-spaces"]', 'change',
            () => this.textArea.style["word-break"] = this.wrapBySpace.checked ? "break-word" : "break-all");
        Ev.put('#button-preview'   , 'click', this.activatePreview , this);
        Ev.put('#button-reset'     , 'click', this.reset           , this);
        Ev.put('#canvas-expand'    , 'click', this.expand          , this);
        Ev.put('#canvas-crop'      , 'click', this.crop            , this);
        Ev.put('[name="rotate"]'   , 'change', e => this.setRotate(e.currentTarget.checked), this);

        Ev.put('[name="threshold"]', 'change', (event) => {
            this.threshold = parseInt(event.currentTarget.value);
            // it's really new
            this.isImageNew = true;
            this.activatePreview();
        }, this);
        Ev.put('[name="energy"]', 'change', (event) => {
            this.energy = parseInt(event.currentTarget.value);
            this.visualEnergy(this.energy);
        }, this);
        Ev.put('[name="transparent-as-white"]', 'change', (event) => {
            this.transparentAsWhite = event.currentTarget.checked;
            this.isImageNew = true;
            this.activatePreview();
        }, this);
    }
    useAlgorithm(name) {
        this.algorithm = name;
        // Ev.dispatch('[name="algo"]', 'change', { value: name });
        Ev.dispatch('[name="threshold"]', 'change', { value: CanvasController.defaultThreshold });
        Ev.dispatch('[name="energy"]', 'change', { value: (name == 'algo-direct' ? 96 : 64) });
        this.activatePreview();
    }
    expand(length = CanvasController.defaultHeight) {
        this.height += length;
    }
    crop() {
        // STUB
    }
    setRotate(value) {
        this.rotate = value;
        if (this.imageUrl !== null) this.putImage(this.imageUrl);
    }
    visualEnergy(amount) {
        let rate = amount / 256;
        let brightness = Math.max(1.6 - rate * 1.5, 0.75),
            contrast = 1 + rate * 2;
        this.preview.style.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    activatePreview() {
        if (!this.imageUrl) return;
        let preview = this.preview;
        let threshold = Math.min(this.threshold, 255);
        let canvas = this.canvas;
        let w = canvas.width, h = canvas.height;
        preview.width = w; preview.height = h;
        let context_c = canvas.getContext('2d');
        let context_p = preview.getContext('2d');
        let rgba_data = context_c.getImageData(0, 0, w, h);
        let gray_data = (this.grayscaleCache =
            this.isImageNew || !this.grayscaleCache
                ? monoGrayscale(
                      new Uint32Array(rgba_data.data.buffer),
                      threshold,
                      this.transparentAsWhite
                  )
                : this.grayscaleCache).slice(0);
        /** @type {Uint8ClampedArray} */
        let result;
        switch (this.algorithm) {
            case 'algo-direct':
                result = monoDirect(gray_data, w, h);
                break;
            case 'algo-steinberg':
                result = monoSteinberg(gray_data, w, h);
                break;
            case 'algo-halftone':
                result = monoHalftone(gray_data, w, h);
                break;
        }
        this.previewPbm = monoToPbm(result);
        let rgba = new Uint8ClampedArray(monoToRgba(result).buffer);
        context_p.putImageData(new ImageData(rgba, w, h), 0, 0);
        this.isImageNew = false;
    }
    putImage(url) {
        let before = document.createElement('canvas');
        let b_ctx = before.getContext('2d');
        let img = document.getElementById('img');
        img.src = ''; // trigger some dumb browser
        img.src = url;
        img.addEventListener('load', () => {
            let canvas = this.canvas;
            let ctx = canvas.getContext('2d');
            if (this.rotate) {
                let w = canvas.width;
                let h = this.height = Math.floor(canvas.width * img.width / img.height);
                before.width = h, before.height = w;
                b_ctx.drawImage(img, 0, 0, h, w);
                let data = new ImageData(
                    new Uint8ClampedArray(
                        rotateRgba(
                            new Uint32Array(
                                b_ctx.getImageData(0, 0, h, w).data.buffer
                            ), w, h
                        ).buffer
                    ), w, h
                );
                ctx.putImageData(data, 0, 0);
            } else {
                this.height = Math.floor(canvas.width * img.height / img.width);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            this.crop();
            this.isImageNew = true;
            this.activatePreview();
            hint('#button-print');
        }, { once: true });
    }
    useFiles(files) {
        const use_files = (files) => {
            let file = files[0];
            if (!file) return;
            let url = URL.createObjectURL(file);
            this.imageUrl = url;
            this.putImage(url);
            this.controls.classList.add('hidden');
        }
        if (files) { use_files(files); return; }
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
    insertText(text) {
        if (text == null || text.trim() == "") { return false; }

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
                return [text.slice(0, newline_index), text.slice(newline_index, text.length)];
            }

            if (this.wrapBySpace.checked) {
                split_pos = text.lastIndexOf(" ", max_length);
                if (split_pos <= 0) { split_pos = max_length; }
            }

            return [text.slice(0, split_pos), text.slice(split_pos, text.length)];
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
             // Text-alignment
            if (this.textAlign.value == "right") {
                x_pos = Math.max(max_width - ctx.measureText(line).width, 0)
            } else if (this.textAlign.value == "center") {
                x_pos = Math.max(max_width - ctx.measureText(line).width, 0) / 2;
            }
            
            ctx.fillText(line, x_pos, y_pos); 
            y_pos += y_step;
        }

        this.crop();

        this.useAlgorithm('algo-direct');
        this.threshold = 16;

        this.setRotate(false);
        this.putImage(this.imageUrl = this.canvas.toDataURL());

        this.controls.classList.add('hidden');

        hint('#button-print');
        return true;
    }
    reset() {
        let canvas = this.canvas;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        canvas.height = CanvasController.defaultHeight;
        this.isImageNew = true;
        this.activatePreview();
        this.imageUrl = null;
        this.controls.classList.remove('hidden');
        
        // Reset hinted button
        for (let elem of document.getElementsByClassName("hint")) {
            elem.classList.remove("hint");
        }
    }
    makePbm() {
        let blob = new Blob([`P4\n${this.canvas.width} ${this.canvas.height}\n`, this.previewPbm]);
        return blob;
    }
}

/** Global variable indicating current language */
var language = navigator.language;

/** @param {Document} doc */
function applyI18nToDom(doc) {
    doc = doc || document;
    let elements = doc.querySelectorAll('*[data-i18n]');
    let i18n_data, translated_string;
    doc.querySelector('html').lang = language;
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
    let language_select = document.getElementById('select-language');
    /** @type {{ [code: string]: string }} */
    let list = await fetch('/lang/list.json').then(r => r.json());
    let use_language = async (value) => {
        language = value;
        i18n.useLanguage(language);
        i18n.add(value, await fetch(`/lang/${value}.json`).then(r => r.json()), true);
        applyI18nToDom();
    }
    language_select.addEventListener('change', () => use_language(language_select.value));
    for (let code in list) {
        let option = document.createElement('option');
        option.value = code;
        option.innerText = list[code];
        option.addEventListener('click', (event) => {
            /** @type {HTMLOptionElement} */
            let option = event.currentTarget;
            let value = option.value;
            option.selected = true;
            language_select.selectedIndex = option.index;
            use_language(value);
            Notice.note('welcome');
        });
        language_select.appendChild(option);
    }
    if (!navigator.languages) {
        if (!navigator.language) return;
        else navigator.languages = [navigator.language];
    }
    navigator.languages = navigator.languages.concat('en-US');
    if (current_language) {
        for (let option of language_select.children)
            if (option.value === current_language)
                option.click();
    } else for (let code of navigator.languages)
        if (list[code]) for (let option of language_select.children)
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
const dashDoc = (function() {
    const dashdoc = document.getElementById('dashdoc');
    const dashxml = new DashXml();
    return async function(path) {
        let html = '';
        const t = await fetch(path).then(r => r.ok ? r.text() : '');
        if (t === '') return false;
        for (const line of t.split('\n'))
            html += dashxml.translateLine(line);
        dashdoc.innerHTML = html;
        if (dashxml.tags.length !== 0) {
            console.warn('Warning: there are leftover Dash XML tags, cleaning up')
            dashxml.tags.splice(0, dashxml.tags.length);
        }
        return true;
    }
})();

async function initHelp() {
    const help_content = document.getElementById('help-content');
    for (const lang of navigator.languages) {
        const content = await fetch(`/helps/${lang}/content.txt`)
            .then(r => r.ok ? r.text() : '')
            .catch(_ => '');
        if (content === '') continue;
        const list = content.split('\n').map(s => s.split('\t'));
        for (const [path, title] of list) {
            if (!path || !title) continue;
            const entry = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'javascript:';
            a.addEventListener('click', () => {
                if (dashDoc(path))
                    Dialog.alert('#dashdoc');
                else
                    Dialog.alert('failed-to-load-this-help');
            });
            a.setAttribute('data-i18n', title);
            a.setAttribute('data-key', '');
            a.innerText = i18n(title);
            entry.appendChild(a);
            help_content.appendChild(entry);
        }
        break;
    }
}

class Main {
    promise;
    /** @type {CanvasController} */
    canvasController;
    deviceOptions;
    testUnknownDevice;
    /** An object containing configuration, fetched from server */
    settings;
    selectorMap;
    /**
     * There are race conditions in initialization query/set,
     * use this flag to avoid
     */
    allowSet;
    constructor() {
        this.allowSet = false;
        this.testUnknownDevice = false;
        this.deviceOptions = document.getElementById('device-options');
        this.settings = {};
        this.selectorMap = {};
        // window.addEventListener('unload', () => this.exit());
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

        this.canvasController = new CanvasController();

        Ev.put('#button-exit'     , 'click', () => this.exit(false), this);
        Ev.put('#button-print'    , 'click', this.print, this);
        Ev.put('#device-refresh'  , 'click', this.searchDevices, this);
        Ev.put('#button-exit'     , 'contextmenu', (event) => (event.preventDefault(), this.exit(true)), this);
        Ev.put('#set-accessibility'   , 'click', () => Dialog.alert('#accessibility'));
        Ev.put('a[target="frame"]', 'click', () => Dialog.alert('#frame'));
        Ev.put('#test-unknown-device' , 'click', () => {
            Dialog.alert(i18n('now-will-scan-for-all-bluetooth-devices-nearby'), null, true);
            this.testUnknownDevice = true;
            Panel('panel-print');
            Hider.show('print');
            this.searchDevices();
        });

        this.conf('#device-options', 'change', 'printer', 
            (value) => callApi('/connect', { device: value })
        );
        this.conf('[name="algo"]'  , 'change', 'mono_algorithm',
            (value) => this.settings['text_mode'] = (value === 'algo-direct')
        );
        this.conf('[name="dry-run"]', 'change', 'dry_run',
            (checked) => checked && Notice.note('dry-run-test-print-process-only')
        );

        const apply_class = (class_name, value) => {
            for (let d of [document, iframe.contentDocument])
                value ? d.body.classList.add(class_name)
                    : d.body.classList.remove(class_name);
        };
        // const toggle_class = (class_name) => (value) => apply_class(class_name, value);
        const conf = (...keys) => {
            for (let key of keys)
                this.conf(
                    '[name="' + key + '"]', 'change',
                    key.replace(/-/g, '_')
                );
        };
        const conf_class = (...keys) => {
            for (let key of keys)
                this.conf(
                    '[name="' + key + '"]', 'change',
                    key.replace(/-/g, '_'),
                    value => apply_class(key, value)
                );
        };

        conf(
            'scan-time',
            'rotate',
            'transparent-as-white',
            'wrap-words-by-spaces',
            'threshold',
            'energy',
            'quality',
            'flip'
        );
        conf_class(
            'no-animation',
            'large-font',
            'force-rtl',
            'dark-theme',
            'high-contrast'
        );

        this.promise = new Promise(async (resolve, reject) => {
            await this.loadConfig();
            await initI18n(this.settings['language']);
            await this.activateConfig();
            initHelp();

            // one exception
            this.conf('#select-language', 'change', 'language');

            if (this.settings['is_android']) {
                document.body.classList.add('android');
                // select[multiple] doesn't work well with Android WebView
                let div = document.createElement('div');
                let select = document.getElementById('select-language');
                Array.from(select.children).forEach(e => {
                    e.selected = false;
                    e.addEventListener('click', () => this.set({ language: e.value }));
                    div.appendChild(e);
                });
                div.id = 'select-language';
                select.replaceWith(div);
            }
            if (typeof initKeyboardShortcuts === 'function') initKeyboardShortcuts();
            // this.searchDevices();
            document.body.classList.remove('hard-animation');
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
            if (this.selectorMap[key] === undefined) continue;
            let value = this.settings[key];
            Ev.dispatch(this.selectorMap[key], 'change', { value: value });
        }
        this.allowSet = true;
        await this.set(this.settings);
    }
    /**
     * Create an event handler and attach to selected elements, that change/reflect `settings`
     * @param {string} attribute The setting to change, i.e. `this.setting[attribute] = value;`
     * @param {(value: any) => any} callback Optional additinal post-procedure to call, with a *reasonable* value as parameter
     */
    conf(selector, type, attribute, callback) {
        this.selectorMap[attribute] = selector;
        Ev.put(selector, type, event => {
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
    async handleBluetoothProblem(response) {
        // Not complete yet, it's different across other platforms
        let error_details = await response.json();
        if (
            error_details.name === 'org.bluez.Error.NotReady' ||
            error_details.name === 'org.freedesktop.DBus.Error.UnknownObject' ||
            error_details.name === 'org.bluez.Error.NotReady' ||
            error_details.details.includes('not turned on') ||
            error_details.details.includes('WinError -2147020577')
        ) Notice.warn('please-enable-bluetooth');
        else if (
            error_details.details.includes('no running event loop')
        ) Notice.error('internal-error-please-see-terminal');
        else
            ErrorHandler.report(
                new Error('API Failure'),
                JSON.stringify(await response.json(), undefined, 4)
            )
        return null;
    }
    async searchDevices() {
        Notice.wait('scanning-for-devices');
        let search_result = await callApi('/devices', {
            everything: this.testUnknownDevice
        }, this.handleBluetoothProblem);
        if (search_result === null) return false;
        let devices = search_result.devices;
        for (let e of this.deviceOptions.children) e.remove();
        if (devices.length === 0) {
            Notice.note('no-available-devices-found');
            hint('#device-refresh');
            return false;
        }
        Notice.note('found-0-available-devices', [devices.length]);
        hint('#insert-picture');
        for (let device of devices) {
            let option = document.createElement('option');
            option.value = `${device.name},${device.address}`;
            option.innerText = `${device.name}-${device.address.slice(3, 5)}${device.address.slice(0, 2)}`;
            this.deviceOptions.appendChild(option);
        }
        Ev.dispatch('#device-options', 'change');
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
            if (response.ok) { Notice.note('finished'); return; }
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
                this.handleBluetoothProblem(response);
        });
    }
}

var main = new Main();
