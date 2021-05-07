import { config } from "process";
import { ExtensionContext, Range, TextEditorDecorationType, window, workspace } from "vscode";
import { getAspRegions } from "./region";

export function addRegionHighlights(context: ExtensionContext) {

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

	workspace.onDidChangeConfiguration(event => {
		configurationDidChange = true;
		triggerUpdateDecorations();
	});

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

	let bracketDecorationType: TextEditorDecorationType;
	let codeBlockDecorationType: TextEditorDecorationType;

	function setDecorationTypes() {
		const aspConfig = workspace.getConfiguration("asp");

		const bracketLightColor = aspConfig.get<string>("bracketLightColor");
		const bracketDarkColor = aspConfig.get<string>("bracketDarkColor");
		const codeBlockLightColor = aspConfig.get<string>("codeBlockLightColor");
		const codeBlockDarkColor = aspConfig.get<string>("codeBlockDarkColor");

		bracketDecorationType = window.createTextEditorDecorationType({
			light: {
				backgroundColor: bracketLightColor
			},
			dark: {
				backgroundColor: bracketDarkColor
			}
		});

		codeBlockDecorationType = window.createTextEditorDecorationType({
			light: {
				backgroundColor: codeBlockLightColor
			},
			dark: {
				backgroundColor: codeBlockDarkColor
			}
		});
	}

	let configurationDidChange = false;

	function updateDecorations() {

		const aspConfig = workspace.getConfiguration("asp");
		const highlightAspRegions: boolean = aspConfig.get<boolean>("highlightAspRegions");

		// Create our decoration types
		if(!bracketDecorationType || !codeBlockDecorationType) {
			setDecorationTypes();
		}

		if(configurationDidChange || !highlightAspRegions) {
			bracketDecorationType.dispose();
			codeBlockDecorationType.dispose();
			setDecorationTypes();

			configurationDidChange = false;
		}

		if (!highlightAspRegions) {
			return;
		}

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