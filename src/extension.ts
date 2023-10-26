import * as vscode from 'vscode';

function getLastLetter(line: string, pattern: string){
	let whitespace = 0;
	let currentWhitespace = 0;

	let words = [];
	let currentWord = "";

	let foundFirst = false;
	for (let i=0; i<line.length; i++) {
		if (line[i] == " " || line[i] == "\t") {
			if (foundFirst && currentWord.length > 0) {
				words.push(currentWord);
				currentWord = "";
			}

			currentWhitespace++;
		} else if (i == line.length - 1) {
			currentWord += line[i];
			words.push(currentWord);
		} else {
			whitespace += currentWhitespace;
			currentWhitespace = 0;
			foundFirst = true;
			currentWord += line[i];
		}
	}
	
	let total = whitespace;
	for (let i=0; i<words.length; i++) {
		total += words[i].length;
	}

	return total;
}

async function alignPattern(editor: vscode.TextEditor, pattern: string, splitByIndent: boolean) {
	let blocks: number[][];
	blocks = [];
	if (splitByIndent) {
		let blockStart = 0;
		let blockEnd = 0;

		const labelRegexp = new RegExp("^[a-z\-_\d]+$", "gmi");
		for (let i=0; i<editor.document.lineCount; i++) {
			let thisLine = editor.document.lineAt(i).text;
			let regexMatch = thisLine.match(labelRegexp);

			if (regexMatch) {
				blockEnd = i-1;
				blocks.push([blockStart, blockEnd]);
				blockStart = i;
			}
		}
		blocks.push([blockStart, editor.document.lineCount - 1]);
	} else {
		blocks.push([0, editor.document.lineCount - 1]);
	}

	
	const patternRegexp = new RegExp(".*(?=" + pattern + ")", "gmi");
	for (let b=0; b<blocks.length; b++) {
		let toReplace: number[][];
		toReplace = [];
		let maxIndex = 0;
		for (let i=blocks[b][0]; i<blocks[b][1]; i++) {
			let thisLine = editor.document.lineAt(i).text;
			let regexMatch = thisLine.match(patternRegexp);

			if (regexMatch) {
				const whitespaceRegex = new RegExp("^[ \t]*(" + pattern + ")", "gmi");
				let wsMatch = thisLine.match(whitespaceRegex);

				if (!wsMatch) {
					let index = getLastLetter(regexMatch[0], pattern);
					toReplace.push([i, index, regexMatch[0].length]);

					if (index > maxIndex) maxIndex = index;
				}
			}
		}

		await editor.edit(editBuilder => {
			for (let i=0; i<toReplace.length; i++) {
				let start = new vscode.Position(toReplace[i][0], toReplace[i][1]);

				if (toReplace[i][2] > maxIndex) {
					let rangeToRemove = new vscode.Range(start, new vscode.Position(toReplace[i][0], start.character+toReplace[i][2] - maxIndex - 1));
					editBuilder.replace(rangeToRemove, "");
				} else if (toReplace[i][2] < maxIndex) {
					editBuilder.insert(start, " ".repeat(maxIndex + 1 - toReplace[i][2]));
				} else {
					editBuilder.insert(start, " ");
				}
			}
		})
	}
}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand("format-arm.format", async () => {
		let patterns = ["defw", "defb", ";"];

		for (const p of patterns) {
			let editor = vscode.window.activeTextEditor;
			if (!editor) return;
			
			if (p == ";") {
				await alignPattern(editor, p, true);
			} else {
				await alignPattern(editor, p, false);
			}
		};
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
