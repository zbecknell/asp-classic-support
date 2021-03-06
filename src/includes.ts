import { TextDocument, Uri, workspace } from "vscode";
import * as pathns from "path";
import * as fs from "fs";
import { virtualPaths } from "./extension";

export class IncludeFile {
  constructor(path: string) {
    let path2 = path;
    if (!pathns.isAbsolute(path2))
      path2 = pathns.join(workspace.workspaceFolders[0].uri.fsPath, path2);

    this.Uri = Uri.file(path2);

    if (fs.existsSync(path2) && fs.statSync(path2).isFile())
      this.Content = fs.readFileSync(path2).toString();
  }

  Content = "";

  Uri: Uri;
}

export const includes = new Map<string, IncludeFile>();

/** Matches `<!-- #include file="myfile.asp" --> */
export const includePattern = /<!--\s*#include\s*file="(.*?)"\s*-->/ig
export const virtualInclude = /<!--\s*#include\s*virtual="(.*?)"\s*-->/ig

/** Gets any included files in the given document. */
export function getImportedFiles(doc: TextDocument) : [string, IncludeFile][] {
  const localIncludes = [];
  const processedMatches = Array<string>();

  let match : RegExpExecArray;

  // Loop through each included file
  while ((match = includePattern.exec(doc.getText())) !== null) {

    if (processedMatches.indexOf(match[1].toLowerCase())) {

      // Directory for the current doc
      const currentDirectory = pathns.dirname(doc.fileName);

      const path = pathns.resolve(currentDirectory, match[1]);

      if (fs.existsSync(path) && fs.statSync(path)?.isFile()) {

        localIncludes.push([
          `Import Statement ${match[1]}`,
          new IncludeFile(path)
        ]);

      }
      else if (fs.existsSync(`${path }.vbs`) && fs.statSync(`${path }.vbs`)?.isFile()) {

        localIncludes.push([
          `Import Statement ${match[1]}`,
          new IncludeFile(`${path}.vbs`)
        ]);

      }

      processedMatches.push(match[1].toLowerCase());
    }
  }

  // Loop through each virtual included file
  while ((match = virtualInclude.exec(doc.getText())) !== null) {

    if (processedMatches.indexOf(match[1].toLowerCase())) {

			// TODO: get the real directory from virtualPaths
      // Directory for the current doc
			var myVirtualPath = virtualPaths.find(v => match[1].toLowerCase().includes(v.virtualPath.toLowerCase()));

			if (!myVirtualPath) {
				// TODO: show warning in console
				return;
			}

			const path = match[1].replace(myVirtualPath.virtualPath, myVirtualPath.physicalPath);

      if (fs.existsSync(path) && fs.statSync(path)?.isFile()) {

        localIncludes.push([
          `Import Statement ${match[1]}`,
          new IncludeFile(path)
        ]);

      }
      else if (fs.existsSync(`${path }.vbs`) && fs.statSync(`${path }.vbs`)?.isFile()) {

        localIncludes.push([
          `Import Statement ${match[1]}`,
          new IncludeFile(`${path}.vbs`)
        ]);

      }

      processedMatches.push(match[1].toLowerCase());
    }
  }

  return localIncludes;
}
