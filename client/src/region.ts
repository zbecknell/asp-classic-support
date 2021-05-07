import { Range, TextDocument } from 'vscode';
import { ASP_BRACKETS } from './patterns';
import { AspRegion } from './types';

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