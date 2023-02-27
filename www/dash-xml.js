// @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0-1.0
// deno-fmt-ignore-file
// deno-lint-ignore-file

var DashXml = (function() {
const SD = "-";
const DD = "--";
const SP = " ";
const SDSP = " - ";
const DDSP = " -- ";
const RE_WORD = "[^ ]+";
const RE_INDENT = "[ \t]*";
const RE_DMX = new RegExp(`^(${RE_INDENT})` + `(${RE_WORD})?` + `((?:${SDSP}.+?)*)?` + `(${DDSP}.+)?` + `(?:${SP}|^)(${SD}|${DD})$`);
const XmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
};
class DashXml {
    tags;
    constructor(){
        this.tags = [];
    }
    translateLine(line) {
        if (line.endsWith(SD) || /^[ \t]*<.+>$/.test(line)) Object.entries(XmlEntities).forEach(([__char, entity])=>line = line.replaceAll(__char, entity));
        if (!line.endsWith(SD)) return line;
        const match = line.match(RE_DMX);
        if (match === null) {
            if (line.match(/^ *!-- (.+) --$/)) {
                return line.replace("!", "<!") + ">";
            }
            console.warn("Warning: failed to match this Dash Markup, probably this line is bad or current regexp is faulty");
            console.warn(">", line);
            return "";
        }
        if (!match[2]) {
            const tag = this.tags.pop();
            if (tag === undefined) {
                console.warn("Warning: no more tags to close, probably previous lines closed one too early, or this translator is faulty");
                console.warn("will leave out an '</undefined>', please check result");
            }
            return line.slice(0, -1) + "</" + tag + ">";
        }
        const tag1 = match[2];
        let result = match[1] + "<" + tag1;
        if (match[3]) {
            const segs = match[3].split(SDSP).map((s)=>s.replaceAll("---", "-"));
            segs.shift();
            for (const seg of segs){
                const space = seg.indexOf(SP);
                if (space === -1) {
                    result += SP + seg;
                } else {
                    result += SP + seg.slice(0, space) + '="' + seg.slice(space + 1) + '"';
                }
            }
        }
        if (match[4]) {
            result += ">" + match[4].slice(DDSP.length);
        }
        if (match[5] === SD) {
            result += ">";
            this.tags.push(tag1);
        } else if (match[5] === DD) {
            if (match[4]) {
                result += "</" + tag1 + ">";
            } else if (tag1[0] === "!") {
                result += ">";
            } else if (tag1[0] === "?") {
                result += "?>";
            } else {
                result += " />";
            }
        }
        return result;
    }
}

return DashXml;
})();
// @license-end
