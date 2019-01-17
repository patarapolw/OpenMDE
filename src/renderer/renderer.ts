import { remote } from "electron";
import fs from "fs";
import MarkdownIt from "markdown-it";
import SimpleMDE from "./simplemde";
import url from "url";
import parseFurigana from "./plugins/furigana"

import "@fortawesome/fontawesome-free/css/all.css"
import "simplemde/dist/simplemde.min.css"

const { app, dialog } = remote;

let promptOnSave = true;
let currentFile = url.parse(location.href, true).query.file as string || "~";

const md = MarkdownIt();
const mde = new SimpleMDE({
    previewRender: markdownToHtml,
    spellChecker: false,
    toolbar: [
        "bold", "italic", "heading", {
            name: "furigana",
            action(editor) {
                const cm = editor.codemirror;
                const s = cm.getSelection();
                cm.replaceSelection(`{${s}}()`);
            },
            title: "Add furigana",
            innerHTML: "<b>ふ</b>"
        }, "|", 
        "quote", "unordered-list", "ordered-list", "|",
        "link", "image", "|",
        "preview", "side-by-side", "fullscreen", "|",
        {
            name: "open",
			action(editor){
				openFile();
			},
			className: "fa fa-folder-open-o",
			title: "Open new file",
        },
        {
            name: "save",
			action(editor){
				saveFile();
			},
			className: "fa fa-save",
			title: "Save file",
        },
        {
            name: "export",
            action(editor) {
                exportFile();
            },
            className: "fas fa-file-export",
            title: "Export to HTML",
        },
        "|", "guide"
    ]
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
            saveFile();
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
                const file = dialog.showSaveDialog({
                    defaultPath: currentFile,
                    filters: [{
                        name: "Markdown files",
                        extensions: ["md"],
                    }]
                });
    
                if (file !== undefined) {
                    currentFile = file;
                    promptOnSave = !checked;
                    saveFileSilent();
                }
            }
        });
    } else {
        saveFileSilent();
    }
}

function saveFileSilent() {
    fs.writeFile(currentFile, mde.value(), (err) => {
        if (err) {
            return console.log(err);
        }
    })
}

function exportFile() {
    const file = dialog.showSaveDialog({
        defaultPath: currentFile,
        filters: [{
            name: "HTML files",
            extensions: ["html", "htm"],
        }]
    });

    if (file !== undefined) {
        fs.writeFile(file, markdownToHtml(mde.value()), (err) => {
            if (err) {
                return console.log(err);
            }
        })
    }
}

function markdownToHtml(mdText: string) {
    return parseFurigana(md.render(mdText));
}
