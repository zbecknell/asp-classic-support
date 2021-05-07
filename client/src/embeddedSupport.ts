/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Position, Range } from 'vscode-languageclient';
import { LanguageService, TokenType } from 'vscode-html-languageservice';
import { getAspRegions } from './region';
import { TextDocument } from 'vscode';

export interface LanguageRange extends Range {
	languageId: string | undefined;
	attributeValue?: boolean;
}

export interface HTMLDocumentRegions {
	getEmbeddedDocument(languageId: string, ignoreAttributeValues?: boolean): TextDocument;
	getLanguageRanges(range: Range): LanguageRange[];
	getLanguageAtPosition(position: Position): string | undefined;
	getLanguagesInDocument(): string[];
	getImportedScripts(): string[];
}

export const CSS_STYLE_RULE = '__';

interface EmbeddedRegion {
	languageId: string | undefined;
	start: number;
	end: number;
	attributeValue?: boolean;
}

export function isInsideStyleRegion(
	languageService: LanguageService,
	documentText: string,
	offset: number
) {
	let scanner = languageService.createScanner(documentText);

	let token = scanner.scan();
	while (token !== TokenType.EOS) {
		switch (token) {
			case TokenType.Styles:
				if (offset >= scanner.getTokenOffset() && offset <= scanner.getTokenEnd()) {
					return true;
				}
		}
		token = scanner.scan();
	}
	
	return false;
}

export function getHtmlVirtualContent(
	doc: TextDocument
): string {
	let documentText = doc.getText();

	const aspRegions = getAspRegions(doc);

	let whiteSpace = documentText
		.split('\n')
		.map(line => {
			return ' '.repeat(line.length);
		}).join('\n');

	// Blank out each ASP region
	aspRegions.forEach(r => {
		const start = doc.offsetAt(r.openingBracket.start);
		const end = doc.offsetAt(r.closingBracket.end);
		documentText = documentText.slice(0, start) + whiteSpace.slice(start, end) + documentText.slice(end);
	});

	return documentText;
}


function substituteWithWhitespace(
	result: string,
	start: number,
	end: number,
	oldContent: string,
	before: string,
	after: string
) {
	let accumulatedWS = 0;
	result += before;
	for (let i = start + before.length; i < end; i++) {
		let ch = oldContent[i];
		if (ch === '\n' || ch === '\r') {
			// only write new lines, skip the whitespace
			accumulatedWS = 0;
			result += ch;
		} else {
			accumulatedWS++;
		}
	}
	result = append(result, ' ', accumulatedWS - after.length);
	result += after;
	return result;
}

function append(result: string, str: string, n: number): string {
	while (n > 0) {
		if (n & 1) {
			result += str;
		}
		n >>= 1;
		str += str;
	}
	return result;
}
