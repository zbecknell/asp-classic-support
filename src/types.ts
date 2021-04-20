import { DocumentSymbol, Range } from "vscode";

export interface AspSymbol {
	symbol?: DocumentSymbol;
  isTopLevel: boolean;
	sourceFile: string;

	/** The full path of the source file this symbol originates from. */
	sourceFilePath: string;

	/** The definition of the symbol, e.g. `Dim someVariable` or `Class MyClass` */
	definition?: string;

	parentName?: string;

	regionStartLine?: number;
	regionEndLine?: number;

	rawCommentText?: string;

	isBuiltIn: boolean;
}

export interface AspRegion {
	openingBracket: Range;
	codeBlock: Range;
	closingBracket: Range;
}