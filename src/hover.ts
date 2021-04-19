import { languages, Hover, TextDocument, Position, Range, MarkdownString, DocumentHighlight } from "vscode";
import * as PATTERNS from "./patterns";
import { getImportedFiles } from "./includes";
import { builtInSymbols, output } from "./extension";
import { currentDocSymbols } from "./symbols";
import { positionIsInsideAspRegion } from "./region";

function getHover(docText: string, lookup: string, scope: string): Hover[] {
  const results: Hover[] = [];

  let matches = PATTERNS.DEF(docText, lookup);

  if (matches) {

    let body = new MarkdownString();

    body.appendCodeblock(matches[2], "vbs");
    body.appendText(`${scope}\n`);

    if(matches[1]){
      const summary = PATTERNS.COMMENT_SUMMARY.exec(matches[1]);

      if(summary[1]){
        body.appendMarkdown(`---\n${summary[1]}`);
      }
    }

    results.push(new Hover(body));
  }

  matches = PATTERNS.DEFVAR(docText, lookup);
  if (matches) {
    
    let body = new MarkdownString();
    
    body.appendCodeblock(matches[2], "vbs");
    body.appendText(`${scope}\n`);
    
    if(matches[1]){
      const summary = PATTERNS.COMMENT_SUMMARY.exec(matches[1]);
      
      if(summary[1]){
        body.appendMarkdown(`---\n${summary[1]}`);
      }
    }

    results.push(new Hover(body));
  }

  return results;
}

function getParamHover(text: string, lookup: string): Hover[] {
  const hovers: Hover[] = [];

  let matches: RegExpExecArray;
  while (matches = PATTERNS.FUNCTION.exec(text))
    matches[6]?.split(",").filter(p => p.trim() === lookup).forEach(() => {
      hovers.push(new Hover({ language: "vbs", value: `${lookup} ' [Parameter]` }));
    });

  // last result should be nearest hit
  if (hovers.length > 0)
    return [hovers[hovers.length - 1]];
  else
    return [];
}

function getPrecedingWord(doc: TextDocument, position: Position): string {
  const wordRange = doc.getWordRangeAtPosition(position);

	// If we're at the start of the line, return nothing
	if(wordRange.start.character <= 1) {
		return;
	}

	const precedingCharacterIndex = wordRange.start.character - 1;
	const lineText = doc.lineAt(position.line).text;
	const precedingCharacter = lineText[precedingCharacterIndex];

	if(precedingCharacter !== '.') {
		return;
	}

	output.appendLine("There's a dot at the start!");

	const precedingWordRange = doc.getWordRangeAtPosition(new Position(position.line, precedingCharacterIndex - 1));

	return doc.getText(precedingWordRange);
}

function provideHover(doc: TextDocument, position: Position): Hover {

  // We're not in ASP, exit
  if(!positionIsInsideAspRegion(doc, position).isInsideRegion) {
    return null;
  }

  const wordRange = doc.getWordRangeAtPosition(position);

	// Get the range of the preceding character
	const precedingWord = getPrecedingWord(doc, position);

  const word: string = wordRange ? doc.getText(wordRange) : "";
  const line = doc.lineAt(position).text;

	const allSymbols = new Set([...builtInSymbols, ...currentDocSymbols]);

	for(const item of allSymbols) {
		const symbol = item.symbol;

		if(symbol.name.toLowerCase() === word.toLowerCase()){

			const content = new MarkdownString();

			content.appendCodeblock(item.definition ?? symbol.name, "vbs");
			content.appendMarkdown(`\n---\n${item.sourceFile}`);

			return new Hover(content);
		}
	}

	return null;





  // const hoverresults: Hover[] = [];

  // if (word.trim() === "") {
  //   return null;
  // }

  // if (!new RegExp(`^[^']*${word}`).test(line))
  //   return null;

  // let count = 0;
  // for (let i = 0; i < position.character; i++) {
  //   if (line[i] === '"') {
  //     count++;
  //   } 
  // }

  // if (count % 2 === 1) {
  //   return null;
  // }

  // hoverresults.push(...getHover(doc.getText(), word, "Local"));

  // for (const includedFile of getImportedFiles(doc)) {
  //   hoverresults.push(...getHover(includedFile[1].Content, word, includedFile[0]));
  // }

  //// hoverresult for param must be above
  // hoverresults.push(...getParamHover(doc.getText(new Range(new Position(0, 0), new Position(position.line + 1, 0))), word));

  // if (hoverresults.length > 0) {
  //   return hoverresults[0];
	// }
  // else {
  //   return null;
	// }
}

export default languages.registerHoverProvider(
  { scheme: "file", language: "asp" },
  { provideHover }
);
