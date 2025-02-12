import { app, BrowserWindow, Menu } from 'electron';
import log from 'electron-log/main';

// Helpers
// =======
const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] =
	[];

// Module
// ======
export default (mainWindow: BrowserWindow) => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	const name = 'buddygenai';
	template.unshift({
		label: name,
		submenu: [
			{
				label: 'About ' + name,
				role: 'about',
			},
			{
				label: 'Quit',
				accelerator: 'Command+Q',
				click() {
					app.quit();
				},
			},
			{
				label: 'Reload',
				accelerator: 'Command+R',
				click() {
					// Reload the current window
					if (mainWindow) {
						mainWindow.reload();
					}
				},
			},
			...(isDevelopment
				? [
						{
							label: 'Toggle Developer Tools',
							accelerator: 'Alt+Command+I',
							click() {
								// Open the DevTools.
								if (mainWindow) {
									mainWindow.webContents.toggleDevTools();
								}
							},
						},
				  ]
				: []),
		],
	});

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);

	log.log('[-] MODULE::appMenu Initialized');
};
