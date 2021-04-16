import { ExtensionContext, workspace, window, DecorationOptions, Range, TextDocument, Position } from "vscode";
import hoverProvider from "./hover";
import completionProvider from "./completion";
import symbolsProvider from "./symbols";
import signatureProvider from "./signature";
import definitionProvider from "./definition";
import colorProvider from "./colorprovider";
import { IncludeFile, includes } from "./includes";
import { ASP_BRACKETS } from "./patterns";
import { AspRegion } from "./region";

export const output = window.createOutputChannel("ASP Classic");

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

export function getAspRegions(doc: TextDocument): AspRegion[] {
		// If we're not in an ASP context, no need to decorate
		if (doc.languageId != "asp") {
			return;
		}

		const text = doc.getText();
		// const brackets: DecorationOptions[] = [];
		const brackets: Range[] = [];

		let match: RegExpExecArray;

		while (match = ASP_BRACKETS.exec(text)) {

			// Bracket start
			const startPos = doc.positionAt(match.index);

			// Bracket end
			const endPos = doc.positionAt(match.index + match[0].length);
			
			// const decoration = { range: new Range(startPos, endPos) };

			brackets.push(new Range(startPos, endPos));
		}

		let index = 0;
		let max = brackets.length;

		const aspRegions: AspRegion[] = [];

		brackets.forEach(element => {

			if(index + 1 < max) {


				const start = brackets[index];
				const end = brackets[index + 1];
				const block = new Range(start.end, end.start);

				aspRegions.push({
					openingBracket: start,
					codeBlock: block,
					closingBracket: end
				})
			}

			index += 2;
		});

		return aspRegions;
}

export function activate(context: ExtensionContext): void {

	output.show();

	var functionIncludesFile = context.asAbsolutePath("./definitions/functions.asp");
	var objectIncludesFile = context.asAbsolutePath("./definitions/objects.asp");

  includes.set("Global", new IncludeFile(functionIncludesFile));
  includes.set("ObjectDefs", new IncludeFile(objectIncludesFile));

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
