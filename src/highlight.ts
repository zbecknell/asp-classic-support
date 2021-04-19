import { ExtensionContext, Range, window, workspace } from "vscode";
import { getAspRegions } from "./region";

export function addRegionHighlights(context: ExtensionContext) {
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

		const regions = getAspRegions(activeEditor.document);

		if (!regions) {
			return;
		}

		const blocks: Range[] = [];
		const brackets: Range[] = [];

		for(const region of regions) {
			brackets.push(region.openingBracket);
			blocks.push(region.codeBlock);
			brackets.push(region.closingBracket);
		}
		
		activeEditor.setDecorations(bracketDecorationType, brackets);
		activeEditor.setDecorations(codeBlockDecorationType, blocks);
	}
}