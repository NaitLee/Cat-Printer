///<reference path="main.d.ts" />

function imageDataColorToMonoSquare(data, threshold) {
    let newdata_horizonal = new Uint8ClampedArray(data.data.length);
    let newdata_vertical = new Uint8ClampedArray(data.data.length);
    let darkness = 0;
    for (let j = 0; j < data.height; j++) {
        for (let i = 0; i < data.width; i++) {
            let index = (j * data.width + i) * 4;
            let [r, g, b, a] = data.data.slice(index, index + 4);
            let visibility = 1 - ((r * 0.2125) + (g * 0.7154) + (b * 0.0721)) * (a / 255) / 255;
            darkness += visibility;
            if (darkness >= threshold) {
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
            if (darkness >= threshold) {
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
function imageDataColorToMonoDiamond(data, threshold) {
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
            if (darkness >= threshold) {
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
            if (darkness >= threshold) {
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
function imageDataMonoToPBM(data) {
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