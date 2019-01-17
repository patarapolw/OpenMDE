import { app, BrowserWindow, ipcMain, protocol } from 'electron';
// import reload from "electron-reload";
import * as path from 'path';
import * as url from 'url';
import isAsar from "electron-is-running-in-asar";

// reload(path.join(__dirname, '../../dist'))

let mainWindow: Electron.BrowserWindow;
let openedFilePath: string;
let showExitPrompt = true;

function setFilePath(filePath: string) {
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true,
            query: {
                file: filePath
            }
        })
    );
}

function createWindow(filePath: string = "~") {
    mainWindow = new BrowserWindow({
        height: 768,
        width: 1024,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    mainWindow.maximize();

    setFilePath(filePath);

    if (!isAsar()) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("close", (e) => {
        if (showExitPrompt) {
            e.preventDefault();
            mainWindow.webContents.send("on-app-closing");
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

ipcMain.on("quitter", () => {
    if (mainWindow !== null) {
        showExitPrompt = false;
        mainWindow.close();
    }
})

app.on("will-finish-launching", () => {
    app.on("open-file", (e, path) => {
        if (mainWindow) {
            setFilePath(path);
        } else if (app.isReady() && !mainWindow) {
            createWindow(path);
        } else {
            openedFilePath = path;
        }
    })
})

app.on('ready', () => {
    protocol.registerFileProtocol('atom', (request, callback) => {
        const url = request.url.substr(7)
        callback(path.normalize(`${__dirname}/${url}`))
    }, (error) => {
        if (error) console.error('Failed to register protocol')
    })

    createWindow(openedFilePath);
});

app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') {
    app.quit();
    // }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
