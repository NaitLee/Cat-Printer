`
No rights reserved.

License CC0-1.0-only: https://directory.fsf.org/wiki/License:CC0
`;

'use strict';

function isHidden(element) {
    const parents = [element];
    while (parents[0].parentElement)
        parents.unshift(parents[0].parentElement);
    return parents.some(e => {
        const rect = e.getBoundingClientRect();
        return (
            e.classList.contains('hidden') ||
            e.classList.contains('hard-hidden') ||
            e.style.display == 'none' ||
            rect.width == 0 || rect.height == 0 ||
            // rect.x < 0 || rect.y < 0 ||
            e.style.visibility == 'none' ||
            e.style.opacity == '0'
        );
    });
}

function toLocaleKey(key) {
    if (typeof i18n === 'undefined') return key;
    const qwerty = '1234567890qwertyuiopasdfghjklzxcvbnm';
    let keys, index;
    if (key.length !== 1 ||
        (keys = i18n('KeyboardLayout')) === 'KeyboardLayout' ||
        (index = qwerty.indexOf(key)) === -1
    ) return key;
    return keys[index];
}

function keyToLetter(key) {
    const map = {
        ' ': 'SPACE',
        ',': 'COMMA',
        '.': "DOT"
    };
    return map[key] || key;
}

function keyFromCode(code) {
    const map = {
        9: 'Tab'
    };
    return map[code] || String.fromCharCode(code);
}

function initKeyboardShortcuts() {
    const layer = document.getElementById('keyboard-shortcuts-layer');
    const dialog = document.getElementById('dialog');
    const keys = 'qwertyuiopasdfghjklzxcvbnm';
    let focusing = false, started = false;
    let shortcuts = {};
    let focus, inputs;
    const mark_keys = () => {
        document.querySelectorAll(':focus').forEach(e => e.isSameNode(focus) || e.blur());
        let index, key;
        if (dialog.classList.contains('hidden'))
            inputs = Array.from(document.querySelectorAll('*[data-key]'));
        else inputs = Array.from(document.querySelectorAll('#dialog *[data-key]'));
        /** @type {{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }} */
        const keys2 = keys.split('');
        shortcuts = {};
        if (focusing) shortcuts = { 'ESC': focus };
        else
            for (const input of inputs) {
                if (isHidden(input)) continue;
                key = input.getAttribute('data-key');
                if ((index = keys2.indexOf(key)) !== -1) keys2.splice(index, 1);
                key = toLocaleKey(key || keys2.shift());
                shortcuts[key] = input;
            }
        // Array.from(layer.children).forEach(e => e.remove());
        for (let i = layer.children.length; i <= inputs.length; i++) {
            const span = document.createElement('span');
            layer.appendChild(span);
        }
        index = 0;
        for (key in shortcuts) {
            const span = layer.children[index++];
            const input = shortcuts[key];
            const position = input.getBoundingClientRect();
            const text = i18n(keyToLetter(key.toUpperCase()));
            if (span.innerText !== text) span.innerText = text;
            span.style.top = (position.y || position.top) + 'px';
            span.style.left = (position.x || position.left) + 'px';
            span.style.display = '';
        }
        for (let i = index; i < layer.children.length; i++) {
            layer.children[i].style.display = 'none';
        }
    }
    const start = () => setInterval(mark_keys, 1000);
    const types_to_click = ['submit', 'file', 'checkbox', 'radio', 'A'];
    document.body.addEventListener('keyup', (event) => {
        const key = event.key || keyFromCode(event.keyCode);
        if (!started) {
            if (key !== 'Tab') return;
            mark_keys();
            start();
            started = true;
        }
        requestAnimationFrame(mark_keys)
        const input = shortcuts[key];
        if (input) {
            if (types_to_click.includes(input.type || input.tagName))
                input.dispatchEvent(new MouseEvent(event.shiftKey ? 'contextmenu' : 'click'));
            else {
                input.focus();
                focusing = true;
            }
            focus = input;
        } else if ((key === 'Escape' || !event.isTrusted) && focus) {
            focus.blur();
            focusing = !focusing;
        }
    });
}
