import { remote } from "electron";
import fs from "fs";
import MarkdownIt from "markdown-it";
import SimpleMDE from "simplemde";
import url from "url";
import parseFurigana from "./plugins/furigana"

import "simplemde/dist/simplemde.min.css"

const { app, dialog, process } = remote;

let promptOnSave = true;
let currentFile = url.parse(location.href, true).query.file as string || "~";

const md = MarkdownIt();
const mde = new SimpleMDE({
    previewRender(plainText) {
        return parseFurigana(md.render(plainText));
    },
    spellChecker: false,
});

SimpleMDE.toggleSideBySide(mde);
SimpleMDE.toggleFullScreen(mde);

if (currentFile !== "~") {
    readFile();
}

document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey) {
        if (e.key === "s") {
            e.preventDefault();

            if (promptOnSave) {
                dialog.showMessageBox({
                    type: "question",
                    message: "Do you want to save?",
                    buttons: ["Yes", "Cancel"],
                    defaultId: 0,
                    checkboxLabel: "Remember save location",
                    checkboxChecked: true
                }, (response, checked) => {
                    if (response === 0) {
                        promptOnSave = !checked;
                        const file = dialog.showSaveDialog({
                            defaultPath: currentFile,
                            filters: [{
                                name: "Markdown files",
                                extensions: ["md"],
                            }]
                        });
    
                        if (file !== undefined) {
                            currentFile = file;
                            saveFile();
                        }
                    }
                });
            } else {
                saveFile();
            }
        } else if (e.key === "o") {
            openFile();
        }
    }
});

function openFile() {
    const file = dialog.showOpenDialog({
        properties: ["openFile"],
        defaultPath: "~",
        filters: [{
            name: "Markdown files",
            extensions: ["md"],
        }]
    });

    if (file !== undefined) {
        currentFile = file[0];
    }
    console.log(currentFile);

    if (currentFile === "~") {
        app.quit();
    } else {
        readFile();
    }
}

function readFile() {
    fs.readFile(currentFile, "utf-8", (err, data) => {
        if (err) {
            dialog.showMessageBox({
                type: "error",
                message: "An error ocurred reading the file :" + err.message,
            });
        }
        mde.value(data)
    });
}

function saveFile() {
    fs.writeFile(currentFile, mde.value(), (err) => {
        if (err) {
            return console.log(err);
        }
    })
}
