///<reference path="main.d.ts" />

class PrintManager {
    WIDTH = 384;
    threshold = 0.6;
    noticeElement = document.getElementById('notice');
    thresholdInput = document.getElementById('filter_threshold');
    deviceSelection = document.getElementById('device_selection');
    refreshDeviceButton = document.getElementById('refresh_device');
    bluetoothMACInput = document.getElementById('bt_mac');
    fileSelection = document.getElementById('file_selection');
    dummyImage = new Image();
    imagePreview = document.getElementById('image_preview');
    previewButton = document.getElementById('preview_button');
    printButton = document.getElementById('print_button');
    notice(message) {
        this.noticeElement.innerText = message;
    }
    imageDataColorToMonoSquare(data) {
        let newdata_horizonal = new Uint8ClampedArray(data.data.length);
        let newdata_vertical = new Uint8ClampedArray(data.data.length);
        let darkness = 0;
        for (let j = 0; j < data.height; j++) {
            for (let i = 0; i < data.width; i++) {
                let index = (j * data.width + i) * 4;
                let [r, g, b, a] = data.data.slice(index, index + 4);
                let visibility = 1 - ((r * 0.2125) + (g * 0.7154) + (b * 0.0721)) * (a / 255) / 255;
                darkness += visibility;
                if (darkness >= this.threshold) {
                    newdata_horizonal[index] = 0;
                    newdata_horizonal[index + 1] = 0;
                    newdata_horizonal[index + 2] = 0;
                    newdata_horizonal[index + 3] = 255;
                    darkness = 0;
                } else {
                    newdata_horizonal[index] = 255;
                    newdata_horizonal[index + 1] = 255;
                    newdata_horizonal[index + 2] = 255;
                    newdata_horizonal[index + 3] = 255;
                }
            }
            darkness = 0;
        }
        for (let i = 0; i < data.width; i++) {
            for (let j = 0; j < data.height; j++) {
                let index = (j * data.width + i) * 4;
                let [r, g, b, a] = data.data.slice(index, index + 4);
                let visibility = 1 - ((r * 0.2125) + (g * 0.7154) + (b * 0.0721)) * (a / 255) / 255;
                darkness += visibility;
                if (darkness >= this.threshold) {
                    newdata_vertical[index] = 0;
                    newdata_vertical[index + 1] = 0;
                    newdata_vertical[index + 2] = 0;
                    newdata_vertical[index + 3] = 255;
                    darkness = 0;
                } else {
                    newdata_vertical[index] = 255;
                    newdata_vertical[index + 1] = 255;
                    newdata_vertical[index + 2] = 255;
                    newdata_vertical[index + 3] = 255;
                }
            }
            darkness = 0;
        }
        let newdata_intersection = new Uint8ClampedArray(data.data.length);
        for (let i = 0; i < data.data.length; i += 4) {
            if (newdata_horizonal[i] == 0 && newdata_vertical[i] == 0) {
                newdata_intersection[i] = 0;
                newdata_intersection[i + 1] = 0;
                newdata_intersection[i + 2] = 0;
                newdata_intersection[i + 3] = 255;
            } else {
                newdata_intersection[i] = 255;
                newdata_intersection[i + 1] = 255;
                newdata_intersection[i + 2] = 255;
                newdata_intersection[i + 3] = 255;
            }
        }
        return new ImageData(newdata_intersection, data.width, data.height);
    }
    imageDataColorToMonoDiamond(data) {
        // Not completed yet, but in theory will be beautiful
        let newdata_lefttop_to_rightbottom = new Uint8ClampedArray(data.data.length);
        let newdata_leftbottom_to_righttop = new Uint8ClampedArray(data.data.length);
        let darkness = 0;
        let is_odd = false;
        for (let j = 0; j < data.height; j++) {
            for (let i = 0; i < data.width; i++) {
                let index = (j * data.width + i + (is_odd ? 1 : 0)) * 4;
                let [r, g, b, a] = data.data.slice(index, index + 4);
                let visibility = 1 - ((r * 0.2125) + (g * 0.7154) + (b * 0.0721)) * (a / 255) / 255;
                darkness += visibility;
                if (darkness >= this.threshold) {
                    newdata_lefttop_to_rightbottom[index] = 0;
                    newdata_lefttop_to_rightbottom[index + 1] = 0;
                    newdata_lefttop_to_rightbottom[index + 2] = 0;
                    newdata_lefttop_to_rightbottom[index + 3] = 255;
                    darkness = 0;
                } else {
                    newdata_lefttop_to_rightbottom[index] = 255;
                    newdata_lefttop_to_rightbottom[index + 1] = 255;
                    newdata_lefttop_to_rightbottom[index + 2] = 255;
                    newdata_lefttop_to_rightbottom[index + 3] = 255;
                }
            }
            darkness = 0;
            is_odd = !is_odd;
        }
        for (let i = 0; i < data.width; i++) {
            for (let j = 0; j < data.height; j++) {
                let index = (j * data.width + i + (is_odd ? 1 : 0)) * 4;
                let [r, g, b, a] = data.data.slice(index, index + 4);
                let visibility = 1 - ((r * 0.2125) + (g * 0.7154) + (b * 0.0721)) * (a / 255) / 255;
                darkness += visibility;
                if (darkness >= this.threshold) {
                    newdata_leftbottom_to_righttop[index] = 0;
                    newdata_leftbottom_to_righttop[index + 1] = 0;
                    newdata_leftbottom_to_righttop[index + 2] = 0;
                    newdata_leftbottom_to_righttop[index + 3] = 255;
                    darkness = 0;
                } else {
                    newdata_leftbottom_to_righttop[index] = 255;
                    newdata_leftbottom_to_righttop[index + 1] = 255;
                    newdata_leftbottom_to_righttop[index + 2] = 255;
                    newdata_leftbottom_to_righttop[index + 3] = 255;
                }
            }
            darkness = 0;
            is_odd = !is_odd;
        }
        let newdata_intersection = new Uint8ClampedArray(data.data.length);
        for (let i = 0; i < data.data.length; i += 4) {
            if (newdata_lefttop_to_rightbottom[i] == 0 && newdata_leftbottom_to_righttop[i] == 0) {
                newdata_intersection[i] = 0;
                newdata_intersection[i + 1] = 0;
                newdata_intersection[i + 2] = 0;
                newdata_intersection[i + 3] = 255;
            } else {
                newdata_intersection[i] = 255;
                newdata_intersection[i + 1] = 255;
                newdata_intersection[i + 2] = 255;
                newdata_intersection[i + 3] = 255;
            }
        }
        return new ImageData(newdata_intersection, data.width, data.height);
    }
    preview() {
        let reader = new FileReader();
        reader.onload = event1 => {
            this.dummyImage.src = event1.target.result;
            let height = this.WIDTH / this.dummyImage.width * this.dummyImage.height;
            this.imagePreview.width = this.WIDTH;
            this.imagePreview.height = height;
            let context = this.imagePreview.getContext('2d');
            context.drawImage(this.dummyImage, 0, 0, this.WIDTH, height);
            let data = context.getImageData(0, 0, this.WIDTH, height);
            context.putImageData(this.monoMethod(data), 0, 0);
        }
        reader.readAsDataURL(this.fileSelection.files[0]);
    }
    imageDataMonoToPBM(data) {
        let result = new ArrayBuffer(data.data.length / 4 / 8);
        let view = new DataView(result);
        for (let i = 0; i < data.data.length; i += 8 * 4) {
            let code = 0;
            if (data.data[i + 0 * 4] == 0) code += 0b10000000;
            if (data.data[i + 1 * 4] == 0) code += 0b01000000;
            if (data.data[i + 2 * 4] == 0) code += 0b00100000;
            if (data.data[i + 3 * 4] == 0) code += 0b00010000;
            if (data.data[i + 4 * 4] == 0) code += 0b00001000;
            if (data.data[i + 5 * 4] == 0) code += 0b00000100;
            if (data.data[i + 6 * 4] == 0) code += 0b00000010;
            if (data.data[i + 7 * 4] == 0) code += 0b00000001;
            view.setInt8(i / 4 / 8, code);
        }
        let pbm_data = new Blob([`P4\n${data.width} ${data.height}\n`, result]);
        return pbm_data;
    }
    constructor() {
        this.monoMethod = this.imageDataColorToMonoSquare;
        this.fileSelection.addEventListener('input', this.preview.bind(this));
        this.previewButton.addEventListener('click', this.preview.bind(this));
        this.thresholdInput.onchange = event => {
            this.threshold = this.thresholdInput.value;
        }
        this.refreshDeviceButton.addEventListener('click', event => {
            this.notice('Searching devices. Please wait for 5 seconds.')
            this.deviceSelection.childNodes.forEach(e => e.remove());
            let xhr = new XMLHttpRequest();
            xhr.open('GET', '/~getdevices');
            xhr.onload = () => {
                for (let i of xhr.responseText.split('\n')) {
                    let [name, address] = i.split(',');
                    if (address == undefined) continue;
                    let option = document.createElement('option');
                    option.value = address;
                    option.innerText = `${name} - ${address}`;
                    this.deviceSelection.appendChild(option);
                }
            }
            xhr.send();
        });
        this.deviceSelection.addEventListener('input', () => this.bluetoothMACInput.value = this.deviceSelection.selectedOptions[0]);
        this.printButton.addEventListener('click', event => {
            // this.preview();
            this.notice('Printing, please wait.')
            let context = this.imagePreview.getContext('2d');
            let pbm_data = this.imageDataMonoToPBM(context.getImageData(0, 0, this.WIDTH, this.imagePreview.height));
            let xhr = new XMLHttpRequest();
            xhr.open('POST', '/~print?address=' + this.bluetoothMACInput.value);
            xhr.setRequestHeader('Content-Type', 'application-octet-stream');
            xhr.onload = () => {
                this.notice(xhr.responseText);
            }
            xhr.send(pbm_data);
        });
    }
}

var print_manager = new PrintManager();
