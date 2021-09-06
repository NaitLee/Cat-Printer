
declare interface PrintManager {
    noticeElement: HTMLParagraphElement;
    thresholdInput: HTMLInputElement;
    bluetoothMACInput: HTMLInputElement;
    deviceSelection: HTMLSelectElement;
    refreshDeviceButton: HTMLButtonElement;
    fileSelection: HTMLInputElement;
    dummyImage: HTMLImageElement;
    imagePreview: HTMLCanvasElement;
    previewButton: HTMLButtonElement;
    printButton: HTMLButtonElement;
    monoMethod: Function;
    imageDataColorToMonoSquare(data: ImageData): ImageData;
    imageDataColorToMonoDiamond(data: ImageData): ImageData;
    imageDataMonoToPBM(data: ImageData): Blob;
}
