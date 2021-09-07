///<reference path="main.js" />
///<reference path="main.d.ts" />

class DocumentPrinter {
    WIDTH = 384;
    thresholdInput = document.getElementById('filter_threshold');
    bluetoothMACInput = document.getElementById('bt_mac');
    container = document.getElementById('container');
    printButton = document.getElementById('print_button');
    threshold = 0.6;
    imagePreview = document.getElementById('image_preview');
    monoMethod = imageDataColorToMonoSquare;
    constructor() {
        this.thresholdInput.onchange = event => {
            this.threshold = this.thresholdInput.value;
        }
        this.printButton.addEventListener('click', event => {
            html2canvas(this.container).then(canvas => {
                notice('Printing, please wait.');
                let context = canvas.getContext('2d');
                let imagedata = context.getImageData(0, 0, this.WIDTH, canvas.height);
                let mono_imagedata = this.monoMethod(imagedata, this.threshold);
                context.putImageData(mono_imagedata, 0, 0);
                this.imagePreview.appendChild(canvas);
                let pbm_data = imageDataMonoToPBM(mono_imagedata);
                let xhr = new XMLHttpRequest();
                xhr.open('POST', '/~print?address=' + this.bluetoothMACInput.value);
                xhr.setRequestHeader('Content-Type', 'application-octet-stream');
                xhr.onload = () => {
                    notice(xhr.responseText);
                }
                xhr.send(pbm_data);
            })
        });
    }
}

var document_printer = new DocumentPrinter();
