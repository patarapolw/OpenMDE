const kanjiRegexStr = "(?:\\{|\\｛)([^\\}\\｝]+)(?:\\}|\\｝)(?:\\（|\\()([^\\}\\｝]+)(?:\\）|\\))";
const patternRegex = new RegExp(`(?:${kanjiRegexStr}.*)+`, "g");
const kanjiRegex = new RegExp(kanjiRegexStr, "g");

function parseFurigana(text: string) {
    let match = patternRegex.exec(text);

    while (match) {
        const html = ["<ruby>"];
        const phrase = match[0];
        console.log(phrase)

        let secondMatch = kanjiRegex.exec(phrase);
        while (secondMatch) {
            console.log(secondMatch)
            const kanji = secondMatch[1];
            const reading = secondMatch[2];

            html.push(kanji);
            html.push("<rt>");
            html.push(reading);
            html.push("</rt>");

            secondMatch = kanjiRegex.exec(phrase)
        }

        html.push("</ruby>");

        text = match.input.replace(phrase, html.join(""));
        match = patternRegex.exec(text)
    }

    return text;
}

export default parseFurigana;
