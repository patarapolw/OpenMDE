const kanjiRegexStr = "(?:\\{|\\｛)([^\\}\\｝]+)(?:\\}|\\｝)(?:\\（|\\()([^\\}\\｝]+)(?:\\）|\\))";
const kanjiRegex = new RegExp(kanjiRegexStr, "g");

function parseFurigana(text: string) {
    let match;

    while (match = kanjiRegex.exec(text)) {
        const html = ["<ruby>"];
        const phrase = match[0];
        
        let kanji = match[1];
        let reading = match[2];

        html.push(kanji);
        html.push("<rt>");
        html.push(reading);
        html.push("</rt>");

        html.push("</ruby>");

        text = text.replace(phrase, html.join(""));
    }

    return text;
}

export default parseFurigana;
