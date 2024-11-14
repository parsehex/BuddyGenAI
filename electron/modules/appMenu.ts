import { app, BrowserWindow, Menu } from 'electron';

const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
	{
		label: 'Edit',
		submenu: [
			{
				label: 'Undo',
				accelerator: 'CmdOrCtrl+Z',
				role: 'undo',
			},
			{
				label: 'Redo',
				accelerator: 'Shift+CmdOrCtrl+Z',
				role: 'redo',
			},
			{ type: 'separator' },
			{
				label: 'Cut',
				accelerator: 'CmdOrCtrl+X',
				role: 'cut',
			},
			{
				label: 'Copy',
				accelerator: 'CmdOrCtrl+C',
				role: 'copy',
			},
			{
				label: 'Paste',
				accelerator: 'CmdOrCtrl+V',
				role: 'paste',
			},
			{
				label: 'Select All',
				accelerator: 'CmdOrCtrl+A',
				role: 'selectAll',
			},
		],
	},
	{
		label: 'Tools',
		submenu: [
			{
				label: 'Settings',
				accelerator: 'CmdOrCtrl+,',
			},
		],
	},
];

export default (mainWindow: BrowserWindow) => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	if (process.platform === 'darwin') {
		// OS X
		const name = 'BuddyGenAI';
		template.unshift({
			label: name,
			submenu: [
				{
					label: 'About ' + name,
					role: 'about',
				},

				{
					label: 'Reload',
					accelerator: 'Command+R',
					click() {
						if (mainWindow) {
							mainWindow.reload();
						}
					},
				},
				{
					label: 'Restart App',
					accelerator: 'Command+Shift+R',
					click() {
						app.relaunch();
						app.exit();
					},
				},
				...(isDevelopment
					? [
							{
								label: 'Toggle Developer Tools',
								accelerator: 'Alt+Command+I',
								click() {
									if (mainWindow) {
										mainWindow.webContents.toggleDevTools();
									}
								},
							},
					  ]
					: []),
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					click() {
						app.quit();
					},
				},
			],
		});

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);

		console.log('[-] MODULE::appMenu Initialized');
	}
};
