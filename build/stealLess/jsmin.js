steal(function( steal ) {
	'use strict';
	function closureCompress ( src, quiet, currentLineMap ) {
		var rnd = Math.floor(Math.random() * 1000000 + 1),
			filename = "tmp" + rnd + ".js",
			tmpFile = new steal.File(filename);

		tmpFile.save(src);

		var outBaos = new java.io.ByteArrayOutputStream(),
			output = new java.io.PrintStream(outBaos),
			options = {
				err: '',
				output: output
			};
		if ( quiet ) {
			runCommand("java", "-jar", "steal/build/scripts/compiler.jar", "--compilation_level", "SIMPLE_OPTIMIZATIONS",
				"--warning_level", "QUIET", "--js", filename, options);
		} else {
			runCommand("java", "-jar", "steal/build/scripts/compiler.jar", "--compilation_level", "SIMPLE_OPTIMIZATIONS",
				"--js", filename, options);
		}
		// print(options.err);
		// if there's an error, go through the lines and find the right location
		if( /ERROR/.test(options.err) ){
			if (!currentLineMap) {
				print(options.error);
			}
			else {

				var errMatch;
				while (!!(errMatch = /\:(\d+)\:\s(.*)/g.exec(options.err))) {
					var lineNbr = parseInt(errMatch[1], 10),
						found = false,
						item,
						lineCount = 0,
						i = 0,
						realLine,
						error = errMatch[2];
					while (!found) {
						item = currentLineMap[i];
						lineCount += item.lines;
						if (lineCount >= lineNbr) {
							found = true;
							realLine = lineNbr - (lineCount - item.lines);
						}
						i++;
					}

					steal.print('ERROR in ' + item.src + ' at line ' + realLine + ': ' + error + '\n');
					var text = readFile(item.src), split = text.split(/\n/), start = realLine - 2, end = realLine + 2;
					if (start < 0) {
						start = 0;
					}
					if (end > split.length - 1) {
						end = split.length - 1;
					}
					steal.print(split.slice(start, end).join('\n') + '\n');
				}
			}
		}
		tmpFile.remove();

		return outBaos.toString();
	}

	steal.build.builders.scripts.min = function( src, quiet, currentLineMap ) {
		steal.print("steal.compress - Using Google Closure app");
		return closureCompress( src, quiet, currentLineMap );
	};

});