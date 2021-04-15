# Helpful Tips

## Logging to Output

```ts
	var functionIncludesFile = context.asAbsolutePath("./definitions/functions.vbs");

	let output = window.createOutputChannel("ASP Classic");

  // Add a line to output window
	output.appendLine(`Global file path: ${functionIncludesFile}`);

  // Show the output window in VS
```