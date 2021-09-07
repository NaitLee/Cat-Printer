
declare interface ImagePrinter {
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
}

declare function imageDataColorToMonoSquare(data: ImageData, threshold: number): ImageData;
declare function imageDataColorToMonoDiamond(data: ImageData, threshold: number): ImageData;
declare function imageDataMonoToPBM(data: ImageData): Blob;
