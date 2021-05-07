import { languages, CompletionItem, CompletionItemKind, TextDocument, Position, SymbolKind, DocumentSymbol } from "vscode";
import { builtInSymbols, output } from "./extension_old"
import * as PATTERNS from "./patterns";
import { currentDocSymbols } from "./symbols";
import { getRegionsInsideRange, positionIsInsideAspRegion, replaceCharacter } from "./region";

const objectSourceImportName = "ObjectDefs";

function getVariableCompletions(text: string, scope: string): CompletionItem[] {
  const results: CompletionItem[] = [];
  const foundVals = new Array<string>(); // list to prevent doubles

  let matches: RegExpExecArray;
  while (matches = PATTERNS.VAR.exec(text)) {
    for (const match of matches[2].split(",")) {
      const name = match.replace(PATTERNS.ARRAYBRACKETS, "").trim();
      if (foundVals.indexOf(name.toLowerCase()) === -1) {
        foundVals.push(name.toLowerCase());

        let itmKind = CompletionItemKind.Variable;

        if ((/\bconst\b/i).test(matches[1]))
          itmKind = CompletionItemKind.Constant;

        const ci = new CompletionItem(name, itmKind);
        ci.documentation = matches[3];

        if (new RegExp(PATTERNS.COLOR, "i").test(name)) {
          ci.kind = CompletionItemKind.Color;
          ci.filterText = `ColorConstants.${name}`;
          ci.insertText = name;
        }

        ci.detail = `${matches[0]} [${scope}]`;

        results.push(ci);
      }
    }
  }

  return results;
}

function getFunctionCompletions(text: string, scope: string, parseParams = false): CompletionItem[] {
  const results: CompletionItem[] = [];
  const foundVals = new Array<string>();

  let matches: RegExpExecArray;
  while (matches = PATTERNS.FUNCTION.exec(text)) {
    const name = matches[5];

    if (foundVals.indexOf(name.toLowerCase()) === -1) {
      foundVals.push(name.toLowerCase());

      const ci = new CompletionItem(name, CompletionItemKind.Function);

      if (matches[1]) {
        const summary = PATTERNS.COMMENT_SUMMARY.exec(matches[1]);
        ci.documentation = summary?.[1];
      }

      // currently only parse in local document, but for all functions, since there is no context
      if (parseParams && matches[6])
        for (const param of matches[6].split(",")) {
          const paramCI = new CompletionItem(param.trim(), CompletionItemKind.Variable);
          if (matches[1]) {
            const paramComment = PATTERNS.PARAM_SUMMARY(matches[1], param.trim());
            if (paramComment)
              paramCI.documentation = paramComment[1];
          }

          results.push(paramCI);
        }

      ci.detail = `${matches[2]} [${scope}]`;

      results.push(ci);
    }
  }

  return results;
}

function getPropertyCompletions(text: string, scope: string): CompletionItem[] {
  const results: CompletionItem[] = [];
  const foundVals = new Array<string>();

  let matches: RegExpExecArray;
  while (matches = PATTERNS.PROP.exec(text)) {
    const name = matches[4];

    if (foundVals.indexOf(name.toLowerCase()) === -1) {

      foundVals.push(name.toLowerCase());

      const ci = new CompletionItem(name, CompletionItemKind.Property);

      if (matches[1]) {
        const summary = PATTERNS.COMMENT_SUMMARY.exec(matches[1]);
        ci.documentation = summary?.[1];
      }

      ci.detail = `${matches[2]} [${scope}]`;

      results.push(ci);
    }
  }

  return results;
}

function getClassCompletions(text: string, scope: string): CompletionItem[] {
  const results: CompletionItem[] = [];
  const foundVals = new Array<string>();

  let matches: RegExpExecArray;

  while (matches = PATTERNS.CLASS.exec(text)) {
    const name = matches[3];
    if (foundVals.indexOf(name.toLowerCase()) === -1) {

      foundVals.push(name.toLowerCase());
      const ci = new CompletionItem(name, CompletionItemKind.Class);

      if (matches[1]) {
        const summary = PATTERNS.COMMENT_SUMMARY.exec(matches[1]);
        ci.documentation = summary?.[1];
      }

      ci.detail = `${name} [${scope}]`;
      results.push(ci);
    }
  }

  return results;
}

function getCompletions(text: string, scope: string, parseParams = false) {
  return [
    ...getVariableCompletions(text, scope),
    ...getFunctionCompletions(text, scope, parseParams),
    ...getPropertyCompletions(text, scope),
    ...getClassCompletions(text, scope)
  ];
}

/** Returns true if an object was found... or something? */
function getObjectMembersCode(objectsToAdd : CompletionItem[], objectName: string): boolean {

  for(const symbol of [...currentDocSymbols, ...builtInSymbols]) {
    if(symbol.symbol.kind === SymbolKind.Class && symbol.symbol.name.toLowerCase() === objectName.toLowerCase()) {

      for(const item of symbol.symbol.children) {

        const completion = getCompletionFromSymbol(item);

        // We've already added it, go on
        if(objectsToAdd.some(i => i.label === completion.label && i.kind == completion.kind )) continue;

        objectsToAdd.push(getCompletionFromSymbol(item));
      }

      return true;
    }
  }

  return false;
}

function getCompletionFromSymbol(symbol: DocumentSymbol): CompletionItem {
  let kind: CompletionItemKind = CompletionItemKind.Variable;

  if(symbol.kind === SymbolKind.Variable) kind = CompletionItemKind.Variable;
  if(symbol.kind === SymbolKind.Property) kind = CompletionItemKind.Property;
  if(symbol.kind === SymbolKind.Function) kind = CompletionItemKind.Function;
  if(symbol.kind === SymbolKind.Class) kind = CompletionItemKind.Class;

  return new CompletionItem(symbol.name, kind);
}

function provideCompletionItems(doc: TextDocument, position: Position): CompletionItem[] {

  const regionTest = positionIsInsideAspRegion(doc, position);

  // We're not in ASP, exit
  if(!regionTest.isInsideRegion) {
    return [];
  }

  const line = doc.lineAt(position);
  let lineText = line.text;

  // Remove completion offerings from commented lines
  if (line.text.charAt(line.firstNonWhitespaceCharacterIndex) === "'") {
    return [];
  }

  const interiorRegions = getRegionsInsideRange(regionTest.regions, line.range);

  if(interiorRegions.length > 0) {

    for (let index = 0; index < lineText.length; index++) {
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
        lineText = replaceCharacter(lineText, " ", index);
      }
    }
  }

  // TODO: sanitize non-ASP code
  const codeAtPosition = lineText.substring(0, position.character);

  // No completion during writing a definition, still buggy
  if (PATTERNS.VAR_COMPLS.test(codeAtPosition)) {
    return [];
  }

  // No completion within open string
  let quoteCount = 0;

  for (const char of codeAtPosition) {
    if (char === '"') quoteCount++;
  }

  // No completion inside a quote block
  if (quoteCount % 2 === 1) {
    return [];
  }

  const results: CompletionItem[] = [];

  /**  
   * Matches when the last character typed is a dot
   * 
   * 1. The word preceding the dot.
  */
  const dotTypedMatch = /.*\b(\w+)\.\w*$/.exec(codeAtPosition);

  // DOT typed, only show members!
  if (dotTypedMatch && dotTypedMatch.length > 0) {

    const objectName = dotTypedMatch[1];

    output.appendLine(`Dot typed for object: ${objectName}`);

    // eslint-disable-next-line no-empty
    if (getObjectMembersCode(results, objectName)) {

    } 
    else {

			// Fall back to using all available symbols
			for(const symbol of [...currentDocSymbols, ...builtInSymbols]) {

				const completion = getCompletionFromSymbol(symbol.symbol);

				if(!symbol.isTopLevel) continue;
				if(results.some(i => i.label === completion.label && i.kind == completion.kind )) continue;

				results.push(completion);
			}

    }
  } 
  else { 

		// TODO: don't factor out this and above as it's copy/paste
		// No DOT, use all available symbols
    for(const symbol of [...currentDocSymbols, ...builtInSymbols]) {

			const completion = getCompletionFromSymbol(symbol.symbol);

      if(!symbol.isTopLevel) continue;
			if(results.some(i => i.label === completion.label && i.kind == completion.kind )) continue;

      results.push(completion);
    }
  }

  return results;
}

export default languages.registerCompletionItemProvider(
  { scheme: "file", language: "asp" },
  { provideCompletionItems }, "."
);
