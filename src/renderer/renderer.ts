import { ipcRenderer, remote } from "electron";
import fs from "fs";
import MarkdownIt from "markdown-it";
// @ts-ignore
import MdAdmonition from "markdown-it-admonition";
import SimpleMDE from "./simplemde";
import url from "url";
import parseFurigana from "./plugins/furigana"

import "./index.css"
import "simplemde/dist/simplemde.min.css"

const { dialog } = remote;

let promptOnSave = true;
let currentFile = url.parse(location.href, true).query.file as string || "~";
let currentContent = "";

ipcRenderer.on("on-app-closing", () => {
    saveBeforeFunction(() => {
        ipcRenderer.send("quitter");
    })
})

const md = MarkdownIt().use(MdAdmonition);
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
            name: "newFile",
            action(editor) {
                newFile();
            },
            className: "fa fa-plus",
            title: "New markdown file",
        },
        {
            name: "open",
            action(editor) {
                openFile();
            },
            className: "fa fa-folder-open-o",
            title: "Open new file",
        },
        {
            name: "save",
            action(editor) {
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
            title: "Export to HTML",
            innerHTML: `<img class='fas fa-file-export' src=# />`
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

function setTitle() {
    document.getElementsByTagName("title")[0].innerText = "OpenMDE - " + currentFile;
}

function newFile() {
    saveBeforeFunction(() => {
        promptOnSave = true;
        currentFile = "~";
        currentContent = "";
        document.getElementsByTagName("title")[0].innerText = "OpenMDE";
        mde.value(currentContent);
    });
}

function readFile() {
    promptOnSave = true;
    fs.readFile(currentFile, "utf-8", (err, data) => {
        if (err) {
            dialog.showMessageBox({
                type: "error",
                message: "An error ocurred reading the file :" + err.message,
            });
        }
        setTitle();
        mde.value(data)
    });
}

function saveFile(quitAfterSaving = false) {
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
                    setTitle();
                    promptOnSave = !checked;
                    saveFileSilent();

                    if (quitAfterSaving) {
                        ipcRenderer.send("quitter");
                    }
                }
            }
        });
    } else {
        saveFileSilent();
    }
}

function saveFileSilent() {
    currentContent = mde.value();
    fs.writeFile(currentFile, currentContent, (err) => {
        if (err) {
            return console.log(err);
        }
    })
}

function saveBeforeFunction(fn: () => void) {
    if (mde.value() !== currentContent) {
        dialog.showMessageBox({
            type: "question",
            message: "Do you want to save first?",
            buttons: ["Yes", "No", "Cancel"],
            defaultId: 0,
        }, (response) => {
            if (response === 0) {
                saveFile()
                fn();
            } else if (response === 1) {
                fn();
            }
        })
    } else {
        fn();
    }
}

function exportFile() {
    const html = markdownToHtml(mde.value());
    console.log(html);

    const file = dialog.showSaveDialog({
        defaultPath: currentFile,
        filters: [{
            name: "HTML files",
            extensions: ["html", "htm"],
        }]
    });

    if (file !== undefined) {
        fs.writeFile(file, html, (err) => {
            if (err) {
                return console.log(err);
            }
        })
    }
}

function markdownToHtml(mdText: string) {
    return parseFurigana(md.render(mdText));
}
