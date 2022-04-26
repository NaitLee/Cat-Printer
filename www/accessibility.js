
function isHidden(element) {
    let parents = [element];
    while (parents[0].parentElement)
        parents.unshift(parents[0].parentElement);
    return parents.some(e => {
        let rect = e.getBoundingClientRect();
        return (
            e.classList.contains('hidden') ||
            e.classList.contains('hard-hidden') ||
            e.style.display == 'none' ||
            rect.width == 0 || rect.height == 0 ||
            rect.x < 0 || rect.y < 0 ||
            e.style.visibility == 'none' ||
            e.style.opacity == '0'
        );
    });
}

function toLocaleKey(key) {
    const qwerty = '1234567890qwertyuiopasdfghjklzxcvbnm';
    let keys, index;
    if (
        typeof i18n === 'undefined' ||
        key.length !== 1 ||
        (keys = i18n('KeyboardLayout')) === 'KeyboardLayout' ||
        (index = qwerty.indexOf(key)) === -1
    ) return key;
    return keys[index];
}

function initKeyboardShortcuts() {
    const layer = document.getElementById('keyboard-shortcuts-layer');
    const dialog = document.getElementById('dialog');
    let key, keys = 'qwertyuiopasdfghjklzxcvbnm';
    let focus, focusing = false, started = false;
    let inputs, shortcuts = {};
    const mark_keys = () => {
        if (dialog.classList.contains('hidden'))
            inputs = Array.from(document.querySelectorAll('*[data-key]'));
        else inputs = Array.from(document.querySelectorAll('#dialog *[data-key]'));
        /** @type {{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }} */
        let key_index = 0;
        shortcuts = {};
        if (focusing) shortcuts = { ESC: focus };
        else
            for (let input of inputs) {
                if (isHidden(input)) continue;
                let key = toLocaleKey(input.getAttribute('data-key') || keys[key_index++]);
                shortcuts[key] = input;
            }
        // Array.from(layer.children).forEach(e => e.remove());
        for (let i = layer.children.length; i <= inputs.length; i++) {
            let span = document.createElement('span');
            layer.appendChild(span);
        }
        let index = 0;
        for (let key in shortcuts) {
            let span = layer.children[index++];
            let input = shortcuts[key];
            let position = input.getBoundingClientRect();
            let text = key.toUpperCase().replace(' ', 'SPACE');
            if (span.innerText !== text) span.innerText = text;
            span.style.top = position.y + 'px';
            span.style.left = position.x + 'px';
            span.style.display = '';
        }
        for (let i = index; i < layer.children.length; i++) {
            layer.children[i].style.display = 'none';
        }
    }
    const start = () => setInterval(mark_keys, 1000);
    const types_to_click = ['submit', 'file', 'checkbox', 'radio', 'A'];
    document.body.addEventListener('keyup', (event) => {
        key = event.key;
        if (!started) {
            if (key !== 'Tab') return;
            mark_keys();
            start();
            started = true;
        }
        document.body.addEventListener('keyup', () =>
            requestAnimationFrame(mark_keys)
        , { once: true });
        let input = shortcuts[key];
        if (input) {
            if (types_to_click.includes(input.type || input.tagName))
                input.click();
            else {
                input.focus();
                focusing = true;
            }
            focus = input;
        } else if (key === 'Escape' && focus) {
            focus.blur();
            focusing = !focusing;
        }
    });
}
