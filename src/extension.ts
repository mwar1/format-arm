import * as vscode from 'vscode';

function getLastLetter(line: string, pattern: string){
	var whitespace = 0;

	var words = [];
	var currentWord = "";
	var currentWhitespace = 0;
	var foundFirst = false;
	for (const letter of line) {
		if (letter == " " || letter == "\t") {
			if (foundFirst && currentWord.length > 0) {
				words.push(currentWord);
				currentWord = "";
			}

			currentWhitespace++;
		} else {
			whitespace += currentWhitespace;
			currentWhitespace = 0;
			foundFirst = true;
			currentWord += letter;
		}
	}
	
	var total = whitespace;
	for (let i=0; i<words.length; i++) {
		total += words[i].length;
	}

	return total;
}

async function alignPattern(editor: vscode.TextEditor, pattern: string) {
	const regexp = new RegExp(".*(?=" + pattern + ")", "gmi");
	let toReplace: number[][];
	toReplace = [];
	
	var maxIndex = 0;
	for (let i=0; i<editor.document.lineCount; i++) {
		var thisLine = editor.document.lineAt(i).text;
		var regexMatch = thisLine.match(regexp);
		if (regexMatch) {
			let index = getLastLetter(regexMatch[0], pattern);
			toReplace.push([i, index, regexMatch[0].length]);
			if (index > maxIndex) maxIndex = index;
		}
	}

	await editor.edit(editBuilder => {
		for (let i=0; i<toReplace.length; i++) {
			var start = new vscode.Position(toReplace[i][0], toReplace[i][1]);

			if (toReplace[i][2]-1 - maxIndex > 0) {
				editBuilder.replace(new vscode.Range(start, new vscode.Position(toReplace[i][0], start.character+toReplace[i][2] - maxIndex - 1)), "");
			} else if (toReplace[i][2]-1 - maxIndex < 0) {
				var diff = maxIndex - toReplace[i][1];

				editBuilder.insert(start, " ".repeat(diff));
			}
		}
	})
}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand("format-arm.format", async () => {
		vscode.window.showInformationMessage("Formatting ARM code...");

		let patterns = ["defw", "defb", ";"];

		for (const p of patterns) {
			let editor = vscode.window.activeTextEditor;
			if (!editor) return;
			
			await alignPattern(editor, p);
		};
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
