import { ExtensionContext, workspace, window, DecorationOptions, Range } from "vscode";
import hoverProvider from "./hover";
import completionProvider from "./completion";
import symbolsProvider from "./symbols";
import signatureProvider from "./signature";
import definitionProvider from "./definition";
import colorProvider from "./colorprovider";
import { IncludeFile, includes } from "./includes";
import { basename } from "path";

function reloadImportDocuments() {
  const SourceImportFiles = workspace.getConfiguration("vbs").get<string[]>("includes");
  for (const key of includes.keys()) {
    if (key.startsWith("Import"))
      includes.delete(key);
  }
  SourceImportFiles?.forEach((file) => {
    includes.set(`Import ${basename(file)}`, new IncludeFile(file));
  });
}

function specialHighlighting(context: ExtensionContext) {
  const bracketDecorationType = window.createTextEditorDecorationType({
		light: {
			backgroundColor: 'rgba(255, 100, 0, .2)'
		},
		dark: {
			backgroundColor: 'rgba(0, 100, 255, .2)'
		}
	});

	const codeBlockDecorationType = window.createTextEditorDecorationType({
		light: {
			backgroundColor: 'rgba(100,100,100,0.1)'
		},
		dark: {
			backgroundColor: 'rgba(220,220,220,0.1)'
		}
	});

	let activeEditor = window.activeTextEditor;
	if (activeEditor) {
		triggerUpdateDecorations();
	}

	window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	var timeout = null;
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateDecorations, 200);
	}

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /(<%@|<%\+|<%=|<%)|(%>)+/g;
		const text = activeEditor.document.getText();
		const brackets: DecorationOptions[] = [];
		let match: RegExpExecArray;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new Range(startPos, endPos) };

			brackets.push(decoration);
		}


		const blocks: DecorationOptions[] = [];

		let index = 0;
		let max = brackets.length;
		brackets.forEach(element => {

			if(index + 1 < max) {
				const start = brackets[index];
				const end = brackets[index + 1];

				const decoration = { range: new Range(start.range.end, end.range.start), hoverMessage: "" };

				blocks.push(decoration);
			}

			index += 2;
		});

		activeEditor.setDecorations(bracketDecorationType, brackets);
		activeEditor.setDecorations(codeBlockDecorationType, blocks);
	}
}

export function activate(context: ExtensionContext): void {
	var functionIncludesFile = context.asAbsolutePath("./definitions/functions.vbs");
	var objectIncludesFile = context.asAbsolutePath("./definitions/objects.vbs");

  includes.set("Global", new IncludeFile(functionIncludesFile));
  includes.set("ObjectDefs", new IncludeFile(objectIncludesFile));

  workspace.onDidChangeConfiguration(reloadImportDocuments);
  reloadImportDocuments();

  specialHighlighting(context);

  context.subscriptions.push(
    hoverProvider,
    completionProvider,
    symbolsProvider,
    signatureProvider,
    definitionProvider,
    colorProvider
  );
}
