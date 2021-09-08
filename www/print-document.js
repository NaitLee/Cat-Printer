///<reference path="main.js" />
///<reference path="main.d.ts" />

class DocumentPrinter {
    WIDTH = 384;
    thresholdInput = document.getElementById('filter_threshold');
    bluetoothMACInput = document.getElementById('bt_mac');
    container = document.getElementById('container');
    printButton = document.getElementById('print_button');
    previewButton = document.getElementById('preview_button');
    threshold = 0.2;
    imagePreview = document.getElementById('image_preview');
    monoMethod = imageDataColorToMonoSquare;
    constructor() {
        this.thresholdInput.onchange = event => {
            this.threshold = this.thresholdInput.value;
        }
        this.printButton.addEventListener('click', event => {
            let mac_address = this.bluetoothMACInput.value;
            if (mac_address == '') {
                notice(i18N.get('Please select a device'));
                return;
            }
            if (this.imagePreview.children.length == 0) {
                notice(i18N.get('Please preview image first'));
                return;
            }
            html2canvas(this.container).then(canvas => {
                notice(i18N.get('Printing, please wait.'));
                let context = canvas.getContext('2d');
                let imagedata = context.getImageData(0, 0, this.WIDTH, canvas.height);
                let mono_imagedata = this.monoMethod(imagedata, this.threshold);
                context.putImageData(mono_imagedata, 0, 0);
                let pbm_data = imageDataMonoToPBM(mono_imagedata);
                let xhr = new XMLHttpRequest();
                xhr.open('POST', '/~print?address=' + mac_address);
                xhr.setRequestHeader('Content-Type', 'application-octet-stream');
                xhr.onload = () => {
                    notice(i18N.get(xhr.responseText));
                }
                xhr.send(pbm_data);
            });
        });
        this.previewButton.addEventListener('click', event => {
            if (this.imagePreview.children[0] != null) this.imagePreview.children[0].remove();
            html2canvas(this.container).then(canvas => {
                let context = canvas.getContext('2d');
                let imagedata = context.getImageData(0, 0, this.WIDTH, canvas.height);
                let mono_imagedata = this.monoMethod(imagedata, this.threshold);
                context.putImageData(mono_imagedata, 0, 0);
                this.imagePreview.appendChild(canvas);
            });
        })
    }
}

var document_printer = new DocumentPrinter();
