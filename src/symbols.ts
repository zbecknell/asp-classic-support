/* eslint-disable complexity */
/* eslint-disable max-statements */
import { languages, SymbolKind, DocumentSymbol, Range, workspace, TextDocument, Position } from "vscode";
import * as PATTERNS from "./patterns";
import * as path from "path";
import { getImportedFiles, includes } from "./includes";
import { builtInSymbols, getAspRegions, output } from "./extension";
import { AspRegion, getRegionsInsideRange, isInsideAspRegion, replaceCharacter } from "./region";

const showVariableSymbols: boolean = workspace.getConfiguration("asp").get<boolean>("showVariableSymbols");
const showParameterSymbols: boolean = workspace.getConfiguration("asp").get<boolean>("showParameterSymbols");

const FUNCTION = RegExp(PATTERNS.FUNCTION.source, "i");

/** 1: comment, 2: definition, 3: name */
const CLASS = RegExp(PATTERNS.CLASS.source, "i");
const PROP = RegExp(PATTERNS.PROP.source, "i");

export interface AspSymbol {
  symbol: DocumentSymbol;
  isTopLevel: boolean;
	sourceFile: string;
}


export const currentDocSymbols = new Set<AspSymbol>();

/** Gets all DocumentSymbols for the given document. */
function getSymbolsForDocument(doc: TextDocument, collection: Set<AspSymbol>, fileName: string): DocumentSymbol[] {
 
  /** The final list of symbols parsed from this document */
  const result: DocumentSymbol[] = [];

  const varList: string[] = [];

  const blocks: DocumentSymbol[] = [];

  const aspRegions = getAspRegions(doc);

  if (aspRegions.length === 0) {
    return [];
  }

  for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {

    /** The current line of the document */
    const line = doc.lineAt(lineNum);

    if (line.isEmptyOrWhitespace) {
      continue;
    }

    let originalLineText = line.text;

    // Is the line inside a region or are any regions in the line?
    if (!isInsideAspRegion(aspRegions, line.range.start)) {

      const interiorRegions = getRegionsInsideRange(aspRegions, line.range);

      if(interiorRegions.length > 0) {

        for (let index = 0; index < originalLineText.length; index++) {
          const characterPosition = new Position(line.lineNumber, index);

          let isInsideRegion = false;

          // is the character inside the region?
          for(const interiorRegion of interiorRegions) {
            if(interiorRegion.contains(characterPosition)) {
              // This character is inside a region
              isInsideRegion = true;

              break;
            }
          }

          // Blank out the non-ASP stuff in this line
          if(!isInsideRegion) {
            originalLineText = replaceCharacter(originalLineText, " ", index);
          }
        }
      } 
      else {
        continue;
      }
    }

    // Don't provide symbols for blank or commented lines
    if (line.text.charAt(line.firstNonWhitespaceCharacterIndex) === "'") {
      continue;
    }

    const lineTextWithoutComment = (/^([^'\n\r]*).*$/m).exec(originalLineText);

    for (const lineText of lineTextWithoutComment[1].split(":")) {

      let name: string;
      let symbol: DocumentSymbol | null;

      let matches: RegExpMatchArray | null = [];

      if ((matches = CLASS.exec(lineText)) !== null) {

        name = matches[3];
        symbol = new DocumentSymbol(name, "", SymbolKind.Class, line.range, line.range);

      } else if ((matches = FUNCTION.exec(lineText)) !== null) {

        name = matches[4];
        let symKind = SymbolKind.Function;

        if (matches[3].toLowerCase() === "sub" && (/class_(initialize|terminate)/i).test(name)) {
          symKind = SymbolKind.Constructor;
        }

        // if params are shown extra, def line shouldn't contain it too
        if (showParameterSymbols) {
          name = matches[5];
        }

        symbol = new DocumentSymbol(name, null, symKind, line.range, line.range);

        if (showParameterSymbols) {
          if (matches[6]) {
            matches[6].split(",").forEach(param => {
              symbol.children.push(new DocumentSymbol(param.trim(), null, SymbolKind.Variable, line.range, line.range));
            });
          }
        }

      } 
      else if ((matches = PROP.exec(lineText)) !== null) {

        name = matches[4];
        symbol = new DocumentSymbol(name, matches[3], SymbolKind.Property, line.range, line.range);

      } 
      else if (showVariableSymbols) {
        
        while ((matches = PATTERNS.VAR.exec(lineText)) !== null) {

          const varNames = matches[2].split(",");

          for (const varname of varNames) {

            const vname = varname.replace(PATTERNS.ARRAYBRACKETS, "").trim();

            if (varList.indexOf(vname) === -1 || !(/\bSet\b/i).test(matches[0])) { 

              // match multiple same Dim, but not an additional set to a dim
              varList.push(vname);

              let symKind = SymbolKind.Variable;

              if ((/\bConst\b/i).test(matches[1])) {
                symKind = SymbolKind.Constant;
              }
              else if ((/\bSet\b/i).test(matches[0])) {
                symKind = SymbolKind.Struct;
              }
              else if ((/\w+[\t ]*\([\t ]*\d*[\t ]*\)/i).test(varname)) {
                symKind = SymbolKind.Array;
              }

              const r = new Range(line.lineNumber, 0, line.lineNumber, PATTERNS.VAR.lastIndex);
              const variableSymbol = new DocumentSymbol(vname, "", symKind, r, r);

              if (blocks.length === 0) {
                result.push(variableSymbol);
								collection.add({ isTopLevel: true, symbol: variableSymbol, sourceFile: fileName })
              }
              else {
                blocks[blocks.length - 1].children.push(variableSymbol);
								collection.add({ isTopLevel: false, symbol: variableSymbol, sourceFile: fileName })
              }
            }
          }
        }
      }

      if (symbol) {

        if (blocks.length === 0) {
          result.push(symbol);
					collection.add({ isTopLevel: true, symbol: symbol, sourceFile: fileName })
        }
        else {
          blocks[blocks.length - 1].children.push(symbol);
					collection.add({ isTopLevel: false, symbol: symbol, sourceFile: fileName })
        }

        blocks.push(symbol);

      }

      if ((matches = PATTERNS.ENDLINE.exec(lineText)) !== null) {
        blocks.pop();
      }
    }
  } // next linenum

  return result; 
}

async function provideDocumentSymbols(doc: TextDocument): Promise<DocumentSymbol[]> {

	// Get built-in symbols only once
	if (builtInSymbols.size <= 0) {
		
		for(const includedFile of includes) {
			var includedDoc = await workspace.openTextDocument(includedFile[1].Uri);
			
			const fileName = path.basename(includedDoc.fileName);
			
			// This will place the symbols in builtInSymbols
			getSymbolsForDocument(includedDoc, builtInSymbols, fileName);
		}
	}

	// Clear out the current doc symbols to reload them
	currentDocSymbols.clear();
	const localIncludes = getImportedFiles(doc);

  // Loop through included files FOR THIS DOC and add symbols for them
  for(const includedFile of localIncludes) {
    var includedDoc = await workspace.openTextDocument(includedFile[1].Uri);

		const fileName = path.basename(includedDoc.fileName);
    getSymbolsForDocument(includedDoc, currentDocSymbols, fileName);
  }

	// Get the local doc symbols
	const localFileName = path.basename(doc.fileName);
  const localSymbols = getSymbolsForDocument(doc, currentDocSymbols, localFileName);

  return localSymbols;
}

export default languages.registerDocumentSymbolProvider(
  { scheme: "file", language: "asp" },
  { provideDocumentSymbols }
);

