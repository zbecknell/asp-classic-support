import { DocumentSymbol, Range } from "vscode";

export interface AspSymbol {
	symbol?: DocumentSymbol;
  isTopLevel: boolean;
	sourceFile: string;

	/** The definition of the symbol, e.g. `Dim someVariable` or `Class MyClass` */
	definition?: string;

	parentName?: string;

	regionStartLine?: number;
	regionEndLine?: number;
}

export interface AspRegion {
	openingBracket: Range;
	codeBlock: Range;
	closingBracket: Range;
}