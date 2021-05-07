import { sign } from "crypto";
import { languages, SignatureHelp, SignatureInformation, ParameterInformation,
  TextDocument, Position, SignatureHelpContext, CancellationToken, MarkdownString } from "vscode";
import { builtInSymbols } from "./extension_old";
import * as PATTERNS from "./patterns";
import { positionIsInsideAspRegion } from "./region";
import { currentDocSymbols, getDocumentMarkdown, getParentOfMember } from "./symbols";

/**
 * Reduces a partial line of code to the current Function for parsing
 * @param {string} code The line of code
 */
function getParsableCode(code: string): string {

  const reducedCode = code
    .replace(/\w+\([^()]*\)/g, "")
    .replace(/"[^"]*"/g, "")
    .replace(/"[^"]*(?=$)/g, "") // Remove double quote and text at end of line
    .replace(/\([^()]*\)/g, "") // Remove paren sets
    .replace(/\({2,}/g, "("); // Reduce multiple open parens

  return reducedCode;

}

function getCurrentFunction(code: string) {

  const parenSplit = code.split("(");
  let index: number;

  if (parenSplit.length === 1)
    index = 0;
  else
    index = parenSplit.length - 2;

  // Get the 2nd to last item (right in front of last open paren)
  // and clean up the results
  return parenSplit[index].match(/(?:.*)\b(\w+)/)[1];

}

function countCommas(code: string) {

  // Find the position of the closest/last open paren
  const openParen = code.lastIndexOf("(");

  // Count non-string commas in text following open paren
  const commas = code.slice(openParen).match(/(?!\B["'][^"']*),(?![^"']*['"]\B)/g);

  if (commas === null) {
    return 0;
  } else {
    return commas.length;
  }

}

function getCallInfo(doc: TextDocument, pos: Position) {

	const line = doc.lineAt(pos);

  // Acquire the text up the point where the current cursor/paren/comma is at
  const codeAtPosition = line.text.substring(0, pos.character);
  const cleanCode = getParsableCode(codeAtPosition);
	
	const func = getCurrentFunction(cleanCode);

	const funcIndex = line.text.indexOf(func);

	const funcPosition = new Position(pos.line, funcIndex);
	
	const parent = getParentOfMember(doc, funcPosition);

  return {
    func: getCurrentFunction(cleanCode),
    commas: countCommas(cleanCode),
		parent: parent
  };

}

function provideSignatureHelp(doc: TextDocument, position: Position, _token: CancellationToken, context: SignatureHelpContext): SignatureHelp {

  // We're not in ASP, exit
  if(!positionIsInsideAspRegion(doc, position).isInsideRegion) {
    return null;
  }

  const caller = getCallInfo(doc, position);

  if (caller === null) {
    return null;
  }

	const signatureHelp = new SignatureHelp();

	// Is there already an active signature help up?
  if (context.activeSignatureHelp) {
    signatureHelp.activeSignature = context.activeSignatureHelp.activeSignature;
	}
  else {
    signatureHelp.activeSignature = 0;
	}

	// Set the parameter we're currently on
  signatureHelp.activeParameter = caller.commas;

  let candidateSignatures: SignatureInformation[] | undefined;

	// Get candidate signatures for the caller.func name from all symbols
	const allSymbols = new Set([...builtInSymbols, ...currentDocSymbols]);

	for(const symbol of allSymbols) {

		// Names don't match, continue
		if(symbol.symbol.name.toLowerCase() !== caller.func.toLowerCase()) {
			continue;
		}

		if(caller.parent && !symbol.parentName) {
			continue;
		}

		if(!caller.parent && symbol.parentName) {
			continue;
		}

		if(caller.parent && symbol.parentName && caller.parent.toLowerCase() !== symbol.parentName.toLowerCase()) {
			continue;
		}
		
		// Start with basic definition
		const signature = new SignatureInformation(symbol.definition);

		// Add summary documentation if we have it
		if (symbol.documentation) {
			const markdown = new MarkdownString(symbol.documentation.summary);
			
			signature.documentation = markdown;
		}

		// Do we have parameters at all?
		if (symbol.parameters) {
			for(const parameter of symbol.parameters) {
				const parameterInfo = new ParameterInformation(parameter.name);

				// If we have docs for the parameter, find it
				if(symbol.documentation && symbol.documentation.parameters) {
					const parameterSummary = symbol.documentation.parameters.find(p => p.name.toLocaleLowerCase() === parameter.name.toLocaleLowerCase())

					if(parameterSummary) {
						parameterInfo.documentation = parameterSummary.summary;
					}
				}

				signature.parameters.push(parameterInfo);
			}
		}

		signatureHelp.activeParameter = caller.commas;
		signatureHelp.signatures.push(signature);
	}

	// TODO: handle multiple signatures gracefully

  // if ((candidateSignatures = getSignatures(doc.getText(), "Local").get(caller.func)) !== undefined) {

	// 	// Add signatures with enough parameters for the amount of commas we have
  //   signatureHelp.signatures.push(...candidateSignatures.filter(signatureToFilter =>
	// 		signatureToFilter.parameters.length >= caller.commas));
  // }

	return signatureHelp;
}

export default languages.registerSignatureHelpProvider(
  { language: "asp" },
  { provideSignatureHelp }, "(", ",", " "
);
