///<reference path="main.js" />
///<reference path="main.d.ts" />

class ImagePrinter {
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
            context.putImageData(this.monoMethod(data, this.threshold), 0, 0);
        }
        reader.readAsDataURL(this.fileSelection.files[0]);
    }
    switchDevice() {
        this.bluetoothMACInput.value = this.deviceSelection.selectedOptions[0].value;
    }
    constructor() {
        this.monoMethod = imageDataColorToMonoSquare;
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
                this.deviceSelection.selectedIndex = 0;
                this.switchDevice();
            }
            xhr.send();
        });
        this.deviceSelection.addEventListener('input', this.switchDevice.bind(this));
        this.printButton.addEventListener('click', event => {
            // this.preview();
            if (this.imagePreview.height == 0) {
                this.notice('Please preview image first');
                return;
            }
            this.notice('Printing, please wait.')
            let context = this.imagePreview.getContext('2d');
            let pbm_data = imageDataMonoToPBM(context.getImageData(0, 0, this.WIDTH, this.imagePreview.height));
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

var image_printer = new ImagePrinter();
