///<reference path="main.js" />
///<reference path="main.d.ts" />

class ImagePrinter {
    WIDTH = 384;
    threshold = 0.6;
    bluetoothMACInput = document.getElementById('bt_mac');
    thresholdInput = document.getElementById('filter_threshold');
    fileSelection = document.getElementById('file_selection');
    dummyImage = new Image();
    imagePreview = document.getElementById('image_preview');
    previewButton = document.getElementById('preview_button');
    printButton = document.getElementById('print_button');
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
    constructor() {
        this.monoMethod = imageDataColorToMonoSquare;
        this.fileSelection.addEventListener('input', this.preview.bind(this));
        this.previewButton.addEventListener('click', this.preview.bind(this));
        this.thresholdInput.onchange = event => {
            this.threshold = this.thresholdInput.value;
        }
        this.printButton.addEventListener('click', event => {
            // this.preview();
            if (this.imagePreview.height == 0) {
                notice('Please preview image first');
                return;
            }
            notice('Printing, please wait.')
            let context = this.imagePreview.getContext('2d');
            let pbm_data = imageDataMonoToPBM(context.getImageData(0, 0, this.WIDTH, this.imagePreview.height));
            let xhr = new XMLHttpRequest();
            xhr.open('POST', '/~print?address=' + this.bluetoothMACInput.value);
            xhr.setRequestHeader('Content-Type', 'application-octet-stream');
            xhr.onload = () => {
                notice(xhr.responseText);
            }
            xhr.send(pbm_data);
        });
    }
}

var image_printer = new ImagePrinter();
