(function () {
    'use strict';

    var app = require('electron').app;
    var BrowserWindow = require('electron').BrowserWindow;
    var Menu = require("electron").Menu;
    var env = require('./env_config');
    var devHelper = require('./dev_helper');
    var windowStateKeeper = require('./window_state');
    var fs = require('fs');
    // var git = require("git-rev-sync");
    //var Tray = require("electron").Tray;
    //
    //var Icon = new Tray("./icon.ico");
    var mainWindow;

    // Preserver of the window size and position between app launches.
    var mainWindowState = windowStateKeeper('main', {
        width: 772,
        height: 580
    });
    global.guid = mainWindowState.guid;
    // global.version = JSON.stringify(git.tag());

    app.on('ready', function () {

        mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height,
            maxWidth: 772,
            maxHeight: 580,
            useContentSize: true,
            backgroundColor: "#fafafa",
            resizable: false,
            icon: "./icon.ico"
        });

        //if (mainWindowState.isMaximized) {
        //    mainWindow.maximize();
        //}

        mainWindow.loadURL('file://' + __dirname + '/index.html');

        //if (env.name !== 'production') {
        //devHelper.setDevMenu();
        //mainWindow.openDevTools();
        //}

        mainWindow.on('close', function () {
            mainWindowState.saveState(mainWindow);
        });

        mainWindow.webContents.on('new-window', function(e, url) {
            e.preventDefault();
            require('electron').shell.openExternal(url);
        });

        // Create the Application's main menu

        var app_menu = process.platform === 'darwin' ?
            {
                label: "应用",
                submenu: [
                    // {label: "关于应用", selector: "orderFrontStandardAboutPanel:"},
                    // {type: "separator"},
                    {label: "退出", accelerator: "Command+Q", click: function () { app.quit(); }}
                ]
            }
            :
            {
                label: "文件",
                submenu: [
                    {label: "退出", accelerator: "Command+Q", click: function () { app.quit(); }}
                ]
            }

        var template = [app_menu, {
            label: "编辑",
            submenu: [
                // {label: "Undo", accelerator: "Command+Z", selector: "undo:"},
                // {label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:"},
                // {type: "separator"},
                {label: "剪切", accelerator: "Command+X", selector: "cut:"},
                {label: "复制", accelerator: "Command+C", selector: "copy:"},
                {label: "粘贴", accelerator: "Command+V", selector: "paste:"},
                {label: "全选", accelerator: "Command+A", selector: "selectAll:"}
            ]
        }, {
            label: '查看',
            submenu: [{
                label: '重新加载',
                accelerator: 'CmdOrCtrl+R',
                click: function () {
                    BrowserWindow.getFocusedWindow().reload();
                }
            }, {
                label: '开发者工具',
                accelerator: 'Alt+CmdOrCtrl+I',
                click: function () {
                    BrowserWindow.getFocusedWindow().toggleDevTools();
                }
            }]
        }
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    });

    app.on('window-all-closed', function () {
        app.quit();
    });

})();
//# sourceMappingURL=background.js.map
