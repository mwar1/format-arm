import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand("format-arm.format", () => {
		vscode.window.showInformationMessage("Formatting ARM code...");
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
