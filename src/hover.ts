import { languages, Hover, TextDocument, Position, MarkdownString, SymbolKind, workspace } from "vscode";
import { output } from "./extension";
import { getDocsForLine, getDocumentMarkdown, getSymbolAtPosition } from "./symbols";

async function provideHover(doc: TextDocument, position: Position): Promise<Hover> {

	try {
		const item = getSymbolAtPosition(doc, position);

		if(item) {

			// Get up-to-date docs for non-built-in items
			if (!item.isBuiltIn) {
				if(item.sourceFilePath !== doc.fileName) {
					var externalDoc = await workspace.openTextDocument(item.sourceFilePath);
					item.documentation = getDocsForLine(externalDoc, externalDoc.lineAt(item.symbol.range.start));
				} else {
					item.documentation = getDocsForLine(doc, doc.lineAt(item.symbol.range.start));
				}
			}

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
