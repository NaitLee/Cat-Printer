
declare interface ImagePrinter {
    noticeElement: HTMLParagraphElement;
    thresholdInput: HTMLInputElement;
    bluetoothMACInput: HTMLInputElement;
    fileSelection: HTMLInputElement;
    dummyImage: HTMLImageElement;
    imagePreview: HTMLCanvasElement;
    previewButton: HTMLButtonElement;
    printButton: HTMLButtonElement;
    monoMethod: Function;
}

declare interface DocumentPrinter {
    thresholdInput: HTMLInputElement;
    bluetoothMACInput: HTMLInputElement;
    container: HTMLDivElement;
    printButton: HTMLButtonElement;
    imagePreview: HTMLDivElement;
    monoMethod: Function;
}

declare function notice(message: string): void;
declare function imageDataColorToMonoSquare(data: ImageData, threshold: number): ImageData;
declare function imageDataColorToMonoDiamond(data: ImageData, threshold: number): ImageData;
declare function imageDataMonoToPBM(data: ImageData): Blob;
