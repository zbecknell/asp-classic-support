import { languages, Location, TextDocument, Position, Uri, Range, Definition } from "vscode";
import { getSymbolAtPosition } from "./symbols";

function provideDefinition(doc: TextDocument, position: Position): Location[] {

	const item = getSymbolAtPosition(doc, position);

	// We ain't got nothing, return
	if(!item) {
		return;
	}

  const symbolLocations: Location[] = [];

	const uri = Uri.file(item.sourceFilePath);
	const location = new Location(uri, item.symbol.range.start);

	symbolLocations.push(location);

  return symbolLocations;
}

export default languages.registerDefinitionProvider({ scheme: "file", language: "asp" }, { provideDefinition });
