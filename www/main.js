
'use strict';

/**
 * In order to debug on a phone, we load vConsole  
 * https://www.npmjs.com/package/vconsole  
 * Double-tap the "Cat Printer" title to activate
 */
function debug() {
    let script = document.createElement('script');
    script.src = 'vconsole.js';
    document.body.appendChild(script);
    script.addEventListener('load', () => new window.VConsole());
}
document.getElementById('title').addEventListener('dblclick', debug);

var hidden_area = document.getElementById('hidden');

const hint = (function() {
    let hints = [];
    let callback = (event) => {
        event.stopPropagation();
        event.currentTarget.classList.remove('hint');
        event.currentTarget.removeEventListener('click', callback);
    }
    return function(selector) {
        hints.forEach(element => element.classList.remove('hint'));
        hints = document.querySelectorAll(selector);
        hints.forEach(element => {
            element.classList.add('hint');
            element.addEventListener('click', callback);
        });
    }
})();

class _Notice {
    element;
    constructor() {
        this.element = document.getElementById('notice');
    }
    _message(message, things) {
        this.element.innerText = i18n(message, things) || message;
    }
    makeLogger(class_name) {
        return (message, things) => {
            this.element.classList.value = class_name;
            this._message(message, things);
        }
    }
    notice = this.makeLogger('notice');
    warn = this.makeLogger('warning');
    error = this.makeLogger('error');
}

const Notice = new _Notice();

class _ErrorHandler {
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
        let hidden_panel = this.recordElement.parentElement;
        if (hidden_panel) hidden_panel.classList.remove('hidden');
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

class PanelController {
    last;
    panels;
    outerPanels;
    subPanels;
    constructor(selector = '.panel') {
        const class_expanded = 'expanded';
        const class_sub = 'sub';
        let panels = this.panels = [... document.querySelectorAll(selector)];
        let outer_panels = this.outerPanels = panels.filter(e => !e.classList.contains(class_sub));
        let sub_panels = this.subPanels = panels.filter(e => e.classList.contains(class_sub));
        const expand = (panel) => panel.classList.add(class_expanded);
        const fold = (panel) => {
            panel.classList.remove(class_expanded);
        }
        const fold_all_outer = () => outer_panels.forEach(e => fold(e));
        const fold_all_sub = () => sub_panels.forEach(e => fold(e));
        // const fold_all = () => panels.forEach(e => e.classList.remove(class_expanded));
        fold_all_outer();
        putEvent(selector + '>:nth-child(1)', 'click', event => {
            event.stopPropagation();
            event.cancelBubble = true;
            let current = event.currentTarget.parentElement,
                last = this.last;
            this.last = current;
            if (!last) {
                expand(current);
                this.last = current;
                return;
            }
            let is_sub = current.classList.contains(class_sub),
                last_is_sub = last.classList.contains(class_sub);
            if (current.classList.contains(class_expanded)) {
                fold(current);
                return;
            }
            fold_all_outer();
            if (is_sub && last_is_sub) {
                fold(last);
                expand(current.parentElement);
                last.scrollTo(0, 0);
            } else if (is_sub && !last_is_sub) {
                fold_all_sub();
                expand(last);
            } else if (!is_sub && last_is_sub) {
                last.parentElement.scrollTo(0, 0);
            }
            expand(current);
        }, this);
    }
}

class CanvasController {
    /** @type {HTMLCanvasElement} */
    preview;
    /** @type {HTMLCanvasElement} */
    canvas;
    div;
    isCanvas;
    algorithm;
    threshold;
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
        this.activatePreview();
    }
    expand(length = CanvasController.defaultHeight) {
        this.height += length;
    }
    crop() {}
    activatePreview() {
        let preview = this.preview;
        let t = this.threshold;
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
                    monoSteinberg(mono_data, w, h, t);
                    break;
                case 'algo-halftone':
                    // monoHalftone(mono_data, w, h, t);
                    // Sorry, do it later
                    break;
                case 'algo-new':
                    monoNew(mono_data, w, h, t);
                    break;
                case 'algo-new-h':
                    monoNewH(mono_data, w, h, t);
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
                    hint('#button-print, #panel-settings');
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

class Main {
    promise;
    /** @type {PanelController} */
    panelController;
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
            await this.initI18n();
            this.panelController = new PanelController();
            this.canvasController = new CanvasController();
            putEvent('#button-exit', 'click', this.exit, this);
            putEvent('#button-print', 'click', this.print, this);
            putEvent('#device-refresh', 'click', this.searchDevices, this);
            this.attachSetter('#scan-time', 'change', 'scan_timeout');
            this.attachSetter('#device-options', 'input', 'printer');
            this.attachSetter('input[name="algo"]', 'change', 'mono_algorithm');
            this.attachSetter('#transparent-as-white', 'change', 'transparent_as_white');
            this.attachSetter('#dry-run', 'change', 'dry_run',
                (checked) => checked && Notice.notice('dry-run-test-print-process-only')
            );
            this.attachSetter('#no-animation', 'change', 'no_animation',
                (checked) => checked ? document.body.classList.add('no-animation')
                    : document.body.classList.remove('no-animation')
            );
            this.attachSetter('#threshold', 'change', 'threshold',
                (value) => this.canvasController.threshold = value
            );
            this.attachSetter('#flip-h', 'change', 'flip_h');
            this.attachSetter('#flip-v', 'change', 'flip_v');
            this.attachSetter('#dump', 'change', 'dump');
            await this.loadConfig();
            this.searchDevices();
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
                    default:
                        element.value = value;
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
        await this.set(this.settings);
        await callApi('/exit');
        window.close();
        // Browser may block the exit
        Notice.notice('you-can-close-this-page-manually');
    }
    /** @param {Response} response */
    async bluetoothProblemHandler(response) {
        // Not complete yet, it's different across other platforms
        let error_details = await response.json();
        if (
            error_details.name === 'org.bluez.Error.NotReady' ||
            error_details.details.indexOf('not turned on') !== -1 ||
            error_details.details.indexOf('WinError -2147020577') !== -1
        ) Notice.warn('please-enable-bluetooth');
        else throw new Error('Unknown Bluetooth Problem');
        return null;
    }
    async searchDevices() {
        Notice.notice('scanning-for-devices');
        let search_result = await callApi('/devices', null, this.bluetoothProblemHandler);
        if (search_result === null) return;
        let devices = search_result.devices;
        [... this.deviceOptions.children].forEach(e => e.remove());
        if (devices.length === 0) {
            Notice.notice('no-available-devices-found');
            hint('#device-refresh');
            return;
        }
        Notice.notice('found-0-available-devices', [devices.length]);
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
        Notice.notice('printing');
        await fetch('/print', {
            method: 'POST',
            body: this.canvasController.makePbm()
        }).then(async (response) => {
            if (response.ok) Notice.notice('finished')
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
    async initI18n() {
        if (typeof i18n === 'undefined') return;
        i18n.useLanguage(navigator.languages[0]);
        for (let language of navigator.languages) {
            let data = await fetch(`/lang/${language}.json`)
                .then(response => response.ok ? response.json() : null);
            if (data !== null) {
                i18n.add(language, data);
                console.log('Loaded language:', language);
            }
        }
        let elements = document.querySelectorAll('*[data-i18n]');
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
}

var main = new Main();
