import { languages, Hover, TextDocument, Position, MarkdownString, SymbolKind } from "vscode";
import { output } from "./extension_old";
import { getDocumentMarkdown, getSymbolAtPosition } from "./symbols";

function provideHover(doc: TextDocument, position: Position): Hover {

	try {
		const item = getSymbolAtPosition(doc, position);
	
		if(item) {
	
			const content = new MarkdownString();
	
			let definition = item.definition ?? item.symbol.name;
	
			// If this is a prop/function, put the parent name in front of the symbol name
			if (item.parentName && (item.symbol.kind === SymbolKind.Function || item.symbol.kind === SymbolKind.Property)) {
				definition = definition.replace(item.symbol.name, `${item.parentName}.${item.symbol.name}`);
			}
	
			content.appendCodeblock(definition, "vbs");
	
			if (item.documentation) {
				content.appendMarkdown(getDocumentMarkdown(item));
			}
	
			if (!item.isBuiltIn) {
				if(item.sourceFilePath === doc.fileName) {
					content.appendText(`\nLocal to ${item.sourceFile}`);
				}
				else {
					content.appendText(`\n${item.sourceFile}`);
				}
			}
	
			return new Hover(content);
		}
	
		return null;

	} catch (error) {
		output.appendLine(error);
	}

}

export default languages.registerHoverProvider(
  { scheme: "file", language: "asp" },
  { provideHover }
);
