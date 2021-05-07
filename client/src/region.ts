import { Position, Range, TextDocument } from "vscode";
import { ASP_BRACKETS } from "./patterns";
import { AspRegion } from "./types";

export function replaceCharacter(origString: string, replaceChar: string, index: number) {
  let firstPart = origString.substr(0, index);
  let lastPart = origString.substr(index + 1);
    
  let newString = firstPart + replaceChar + lastPart;
  return newString;
}


export function regionIsInsideAspRegion(regions: AspRegion[], position: Position): boolean {
  for(const region of regions) {
    if(region.codeBlock.contains(position)) {
      return true;
    }
  }

  return false;
}

export function getRegionsInsideRange(regions: AspRegion[], range: Range): Range[] {

  const interiorRegions: Range[] = [];

  for(const region of regions) {
    if(range.contains(region.codeBlock)) {
      interiorRegions.push(region.codeBlock);
    }
  }

  return interiorRegions;
}

export function getAspRegions(doc: TextDocument): AspRegion[] {
		// If we're not in an ASP context, no need to decorate
		if (doc.languageId != "asp") {
			return;
		}

		const text = doc.getText();
		// const brackets: DecorationOptions[] = [];
		const brackets: Range[] = [];

		let match: RegExpExecArray;

		while (match = ASP_BRACKETS.exec(text)) {

			// Bracket start
			const startPos = doc.positionAt(match.index);

			// Bracket end
			const endPos = doc.positionAt(match.index + match[0].length);
			
			// const decoration = { range: new Range(startPos, endPos) };

			brackets.push(new Range(startPos, endPos));
		}

		let index = 0;
		let max = brackets.length;

		const aspRegions: AspRegion[] = [];

		brackets.forEach(element => {

			if(index + 1 < max) {


				const start = brackets[index];
				const end = brackets[index + 1];
				const block = new Range(start.end, end.start);

				aspRegions.push({
					openingBracket: start,
					codeBlock: block,
					closingBracket: end
				})
			}

			index += 2;
		});

		return aspRegions;
}

/** Returns true when we are inside an ASP code block. */
export function positionIsInsideAspRegion(doc: TextDocument, position: Position): { isInsideRegion: boolean, regions: AspRegion[]} {

  const regions = getAspRegions(doc);

  if(regions.length === 0) {
    return { isInsideRegion: false, regions: regions};
  }

  for(const region of regions) {
    if(region.codeBlock.contains(position)) {
      return { isInsideRegion: true, regions: regions};
    }
  }

  return { isInsideRegion: false, regions: regions};

}