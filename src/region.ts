import { Position, Range } from "vscode";

export interface AspRegion {
	openingBracket: Range;

	codeBlock: Range;

	closingBracket: Range;
}

export function replaceCharacter(origString: string, replaceChar: string, index: number) {
  let firstPart = origString.substr(0, index);
  let lastPart = origString.substr(index + 1);
    
  let newString = firstPart + replaceChar + lastPart;
  return newString;
}


export function isInsideAspRegion(regions: AspRegion[], position: Position): boolean {
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