import { Position, SnippetString, TextDocument } from "vscode";
import { output } from "./extension";
import { FUNCTION } from "./patterns";

export function createDocumentSnippet(doc: TextDocument, position: Position): SnippetString {

  const snippet = new SnippetString(" <summary>$1</summary>");

  const nextLine = doc.lineAt(position.line + 1);

  FUNCTION.lastIndex = 0;
  const functionMatches = FUNCTION.exec(nextLine.text);

  if(functionMatches) {
    const paramString = functionMatches[6];
    if(paramString) {
      const params = paramString.split(",");

      let tabStopNumber = 2;

      for(const param of params) {
        snippet.appendText(`\n''' <param name="${param.trim()}">`);
        snippet.appendTabstop(tabStopNumber);
        snippet.appendText(`</param>`);

        tabStopNumber += 1;
      }
    }
  }


  return snippet;
}