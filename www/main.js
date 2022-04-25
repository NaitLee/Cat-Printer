
'use strict';

/**
 * In order to debug on a phone, we load vConsole  
 * https://www.npmjs.com/package/vconsole  
 * Double-tap the "Cat Printer" title to activate
 */
function debug() {
    const script = document.createElement('script');
    script.src = 'vconsole.js';
    document.body.appendChild(script);
    script.addEventListener('load', () => new window.VConsole());
}
document.getElementById('title').addEventListener('dblclick', debug);

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
        for (let choice of choices) {
            let button = document.createElement('button');
            button.setAttribute('data-i18n', choice);
            button.innerText = i18n(choice);
            if (!have_input)
                button.addEventListener('click', () => dialog_input.value = choice);
            dialog_choices.appendChild(button);
            last_choices.push(button);
        }
        last_choices[0].addEventListener('click', () => {
            if (callback) callback(dialog_input.value);
            dialog.classList.add('hidden');
        });
        if (last_choices.length > 1)
            last_choices[1].addEventListener('click', () => {
                if (callback) callback(null);
                dialog.classList.add('hidden');
            });
        hint([last_choices[0]]);
    }
    return {
        alert: function(selector, callback, as_string = false) {
            clean_up();
            apply_callback(callback, false, 'ok');
            show(selector, as_string);
        },
        confirm: function(selector, callback, as_string = false) {
            clean_up();
            apply_callback(callback, false, 'yes', 'no');
            show(selector, as_string);
        },
        prompt: function(selector, callback, as_string = false) {
            clean_up();
            apply_callback(callback, true, 'ok', 'cancel');
            show(selector, as_string);
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
        let button = document.querySelector('button[data-panel="panel-error"]');
        if (button) {
            button.classList.remove('hidden');
            button.click();
        }
        let div = document.createElement('div');
        div.innerText = (error.stack || (error.name + ': ' + error.message)) + '\n' + output;
        this.recordElement.appendChild(div);
        hint('#panel-error');
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

class CanvasController {
    /** @type {HTMLCanvasElement} */
    preview;
    /** @type {HTMLCanvasElement} */
    canvas;
    div;
    imageUrl;
    isCanvas;
    algorithm;
    threshold;
    thresholdRange;
    transparentAsWhite;
    previewData;
    static defaultHeight = 384;
    _height;
    get height() {
        return this._height;
    }
    set height(value) {
        this.div.style.height = (this.canvas.height = this.preview.height = this._height = value) + 'px';
    }
    constructor() {
        this.preview = document.getElementById('preview');
        this.canvas = document.getElementById('control-canvas');
        this.div = document.getElementById('control-document');
        this.height = CanvasController.defaultHeight;
        this.thresholdRange = document.getElementById('threshold');
        this.imageUrl = null;

        putEvent('input[name="mode"]', 'change', (event) => this.enableMode(event.currentTarget.value), this);
        putEvent('input[name="algo"]', 'change', (event) => this.useAlgorithm(event.currentTarget.value), this);
        putEvent('#button-preview'   , 'click', this.activatePreview , this);
        putEvent('#canvas-expand'    , 'click', this.expand          , this);
        putEvent('#canvas-crop'      , 'click', this.crop            , this);
        putEvent('#insert-picture'   , 'click', this.insertPicture   , this);
        
        putEvent('#threshold', 'change', (event) => {
            this.threshold = parseInt(event.currentTarget.value);
            this.activatePreview();
        }, this);
        putEvent('#transparent-as-white', 'change', (event) => {
            this.transparentAsWhite = event.currentTarget.checked;
            this.activatePreview();
        }, this);
    }
    enableMode(mode) {
        switch (mode) {
            case 'mode-document':
                this.div.classList.remove('disabled');
                this.canvas.classList.add('disabled');
                this.isCanvas = false;
                break;
            case 'mode-canvas':
                this.canvas.classList.remove('disabled');
                this.div.classList.add('disabled');
                this.isCanvas = true;
                break;
        }
    }
    useAlgorithm(name) {
        this.algorithm = name;
        this.thresholdRange.value = 128;
        this.activatePreview();
    }
    expand(length = CanvasController.defaultHeight) {
        this.height += length;
    }
    crop() {}
    activatePreview() {
        if (!this.imageUrl) return;
        let preview = this.preview;
        let t = Math.min(this.threshold, 255);
        if (this.isCanvas) {
            let canvas = this.canvas;
            let w = canvas.width, h = canvas.height;
            let context_c = canvas.getContext('2d');
            let context_p = preview.getContext('2d');
            let data = context_c.getImageData(0, 0, w, h);
            let mono_data = new Uint8ClampedArray(w * h);
            monoGrayscale(data.data, mono_data, w, h, this.transparentAsWhite);
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
    }
    insertPicture() {
        const put_image = (url) => {
            this.imageUrl = url;
            if (this.isCanvas) {
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
        }
        let input = document.createElement('input');
        input.type = 'file';
        input.addEventListener('change', () => {
            let url = URL.createObjectURL(input.files[0]);
            put_image(url);
        });
        hidden_area.appendChild(input);
        input.click();
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
async function initI18n() {
    if (typeof i18n === 'undefined') return;
    /** @type {HTMLOptionElement} */
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
            let option = event.currentTarget;
            let value = option.value;
            use_language(value);
        });
        language_options.appendChild(option);
    }
    apply_default:
    for (let code of navigator.languages) {
        if (list[code]) {
            for (let option of language_options.children) {
                if (option.value === code) {
                    // option.setAttribute('data-default', '');
                    option.setAttribute('data-default', '');
                    option.click();
                    i18n.useLanguage(navigator.languages[0]);
                    for (let language of navigator.languages) {
                        if (!list[language]) return;
                        let data = await fetch(`/lang/${language}.json`)
                            .then(response => response.ok ? response.json() : null);
                        if (data !== null) {
                            i18n.add(language, data);
                        }
                    }
                    break apply_default;
                }
            }
        }
    }
}

async function testI18n(lang) {
    i18n.useLanguage(lang);
    i18n.add(lang, await fetch(`/lang/${lang}-ex.jsonc`)
        .then(r => r.text())    // jsonc: JSON with comment
        .then(t => JSON.parse(t.replace(/\s*\/\/.*/g, '')))
    , true);
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
            await initI18n();
            /** @type {HTMLIFrameElement} */
            let iframe = document.getElementById('frame');
            iframe.addEventListener('load', () => {
                iframe.contentDocument.body.classList.value = document.body.classList.value;
                applyI18nToDom(iframe.contentDocument);
            });
            function apply_class(class_name, value) {
                [document, iframe.contentDocument].forEach(d => value ?
                    d.body.classList.add(class_name) :
                    d.body.classList.remove(class_name)
                );
            }
            this.canvasController = new CanvasController();
            putEvent('#button-exit', 'click', this.exit, this);
            putEvent('#button-print', 'click', this.print, this);
            putEvent('#device-refresh', 'click', this.searchDevices, this);
            putEvent('#set-accessibility', 'click', () => Dialog.alert('#accessibility'));
            putEvent('a[target="frame"]', 'click', () => Dialog.alert('#frame'));
            this.attachSetter('#scan-time', 'change', 'scan_timeout');
            this.attachSetter('#device-options', 'input', 'printer');
            this.attachSetter('input[name="algo"]', 'change', 'mono_algorithm');
            this.attachSetter('#transparent-as-white', 'change', 'transparent_as_white');
            this.attachSetter('#select-language option', 'click', 'language');
            this.attachSetter('#dry-run', 'change', 'dry_run',
                (checked) => checked && Notice.note('dry-run-test-print-process-only')
            );
            this.attachSetter('#no-animation', 'change', 'no_animation',
                (checked) => apply_class('no-animation', checked)
            );
            this.attachSetter('#large-font', 'change', 'large_font',
                (checked) => apply_class('large-font', checked)
            );
            this.attachSetter('#force-rtl', 'change', 'force_rtl',
                (checked) => apply_class('force-rtl', checked)
            );
            this.attachSetter('#dark-theme', 'change', 'dark_theme',
                (checked) => apply_class('dark', checked)
            );
            this.attachSetter('#high-contrast', 'change', 'high_contrast',
                (checked) => apply_class('high-contrast', checked)
            );
            this.attachSetter('#threshold', 'change', 'threshold',
                (value) => this.canvasController.threshold = value
            );
            this.attachSetter('#flip-h', 'change', 'flip_h');
            this.attachSetter('#flip-v', 'change', 'flip_v');
            this.attachSetter('#dump', 'change', 'dump');
            await this.loadConfig();
            this.searchDevices();
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
     * Load saved config from server, and activate all setters with corresponding values in settings.  
     * Please do `attachSetter` on all desired elements/inputs before calling.  
     * After the load, will save config to server again in order to sync default values.  
     * Then, if permitted, every single change will sync to server instantly
     */
    async loadConfig() {
        this.settings = await callApi('/query');
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
        this.setters[attribute] = putEvent(selector, type, (event => {
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
        }).bind(this), this);
    }
    async exit() {
        Notice.wait('exiting');
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
        else throw new Error('Unknown Bluetooth Problem');
        return null;
    }
    async searchDevices() {
        Notice.wait('scanning-for-devices');
        let search_result = await callApi('/devices', null, this.bluetoothProblemHandler);
        if (search_result === null) return;
        let devices = search_result.devices;
        [... this.deviceOptions.children].forEach(e => e.remove());
        if (devices.length === 0) {
            Notice.note('no-available-devices-found');
            hint('#device-refresh');
            return;
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
    }
    async print() {
        Notice.wait('printing');
        await fetch('/print', {
            method: 'POST',
            body: this.canvasController.makePbm()
        }).then(async (response) => {
            if (response.ok) Notice.note('finished')
            else {
                let error_data = await response.json();
                if (/address.+not found/.test(error_data.details))
                    Notice.error('please-check-if-the-printer-is-down');
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
