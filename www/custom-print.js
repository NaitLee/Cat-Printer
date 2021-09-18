///<reference path="main.js" />
///<reference path="main.d.ts" />

class CustomPrinter {
    WIDTH = 384;
    threshold = 0.6;
    bluetoothMACInput = document.getElementById('bluetooth_address_input');
    thresholdInput = document.getElementById('filter_threshold');
    fileSelection = document.createElement('input');
    dummyImage = new Image();
    canvasPreview = document.getElementById('image_preview');
    previewButton = document.getElementById('preview_button');
    printButton = document.getElementById('print_button');
    actionInsertText = document.getElementById('action_insert_text');
    actionInsertImage = document.getElementById('action_insert_image');
    actionInsertQR = document.getElementById('action_insert_qr');
    canvasHeightInput = document.getElementById('canvas_height');
    fabricCanvas = new fabric.Canvas('work_canvas', {
        backgroundColor: 'white'
    });
    monoMethod = imageDataColorToMonoSquare;
    insertImage() {
        this.fileSelection.click();
    }
    preview() {
        let context = this.fabricCanvas.getContext('2d');
        let imagedata = context.getImageData(0, 0, this.WIDTH, this.fabricCanvas.height);
        this.canvasPreview.height = this.fabricCanvas.height;
        this.canvasPreview.getContext('2d').putImageData(this.monoMethod(imagedata, this.threshold), 0, 0);
    }
    constructor() {
        this.fileSelection.type = 'file';
        this.monoMethod = imageDataColorToMonoSquare;
        this.fileSelection.addEventListener('input', this.preview.bind(this));
        this.previewButton.addEventListener('click', this.preview.bind(this));
        this.thresholdInput.onchange = event => {
            this.threshold = this.thresholdInput.value;
        }
        this.canvasHeightInput.onchange = event => {
            this.fabricCanvas.setHeight(this.canvasHeightInput.value);
        }
        this.actionInsertText.addEventListener('click', event => {
            let text = new fabric.Textbox(i18N.get('Double click to edit'), {
                color: 'black',
                fontSize: 24,
            });
            this.fabricCanvas.add(text);
        });
        this.fileSelection.addEventListener('input', event => {
            let reader = new FileReader();
            reader.onload = event1 => {
                this.dummyImage.src = event1.target.result;
                let fimage = new fabric.Image(this.dummyImage, {});
                fimage.scale(this.WIDTH / this.dummyImage.width);
                this.fabricCanvas.add(fimage);
            }
            reader.readAsDataURL(this.fileSelection.files[0]);
        });
        this.actionInsertImage.addEventListener('click', this.insertImage.bind(this));
        this.actionInsertQR.addEventListener('click', event => {
            let div = document.createElement('div');
            new QRCode(div, prompt(i18N.get('Content of QRCode:')));
            // QRCode generation is async, currently have no better way than waiting for a while
            setTimeout(() => {
                let fimage = new fabric.Image(div.lastChild, {
                    left: this.WIDTH / 4,
                    top: this.WIDTH / 4
                });
                fimage.scale((this.WIDTH / 2) / div.lastChild.width);
                this.fabricCanvas.add(fimage);
            }, 1000);
        });
        this.printButton.addEventListener('click', event => {
            // this.preview();
            if (this.canvasPreview.height == 0) {
                notice(i18N.get('Please preview image first'));
                return;
            }
            let mac_address = this.bluetoothMACInput.value;
            if (mac_address == '') {
                notice(i18N.get('Please select a device'));
                return;
            }
            notice(i18N.get('Printing, please wait.'));
            let context = this.canvasPreview.getContext('2d');
            let pbm_data = imageDataMonoToPBM(context.getImageData(0, 0, this.WIDTH, this.canvasPreview.height));
            let xhr = new XMLHttpRequest();
            xhr.open('POST', '/~print?address=' + mac_address);
            xhr.setRequestHeader('Content-Type', 'application-octet-stream');
            xhr.onload = () => {
                notice(i18N.get(xhr.responseText));
            }
            xhr.send(pbm_data);
        });
        let boldFunction = () => {
            let object = this.fabricCanvas.getActiveObject();
            if (!object) return;
            if (object.type == 'textbox') {
                if (object.fontWeight == 'normal') object.fontWeight = 'bold';
                else if (object.fontWeight == 'bold') object.fontWeight = 'normal';
                this.fabricCanvas.renderAll();
            }
        }
        document.getElementById('action_make_bold').addEventListener('click', boldFunction.bind(this));
        let italicFunction = () => {
            let object = this.fabricCanvas.getActiveObject();
            if (!object) return;
            if (object.type == 'textbox') {
                if (object.fontStyle == 'normal') object.fontStyle = 'italic';
                else if (object.fontStyle == 'italic') object.fontStyle = 'normal';
                this.fabricCanvas.renderAll();
            }
        }
        document.getElementById('action_make_italic').addEventListener('click', italicFunction.bind(this));
        document.getElementById('action_make_underline').addEventListener('click', event => {
            let object = this.fabricCanvas.getActiveObject();
            if (!object) return;
            if (object.type == 'textbox') {
                object.underline = !object.underline;
                // Seems there's a bug in fabric, underline cannot be rendered before changing bold/italic
                boldFunction();
                this.fabricCanvas.renderAll();
                boldFunction();
                this.fabricCanvas.renderAll();
            }
        });
        document.getElementById('action_delete').addEventListener('click', event => {
            let object = this.fabricCanvas.getActiveObject();
            if (!object) return;
            this.fabricCanvas.remove(object);
            this.fabricCanvas.renderAll();
        });
        this.fabricCanvas.freeDrawingBrush.color = 'black';
        this.fabricCanvas.freeDrawingBrush.width = 6;
        document.getElementById('action_switch_paint').addEventListener('click', event => {
            this.fabricCanvas.isDrawingMode = !this.fabricCanvas.isDrawingMode;
        })
    }
}

var custom_printer = new CustomPrinter();
