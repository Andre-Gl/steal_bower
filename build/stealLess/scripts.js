
steal('steal/parse').then(function( s ) {
	'use strict';

	s.build.builders = s.build.builders || {};

	var scripts = ( steal.build.builders.scripts = function( opener, opts ) {
		s.print( "\nBUILDING SCRIPTS --------------- " );

		var currentPackage = [];

		var out = opts.path + opts.fileName + ".js";

		opts.exclude = opts.exclude || [];
		opts.exclude.push("steal/dev/");

		var inExclude = function(path){
				for (var i = 0; i < opts.exclude.length; i++) {
					if (path.indexOf(opts.exclude[i]) > -1) {
						return true;
					}
				}
				return false;
			};

		opener.each('js', function(stl, content, i){
			if (!stl.ignore && !inExclude(stl.rootSrc)) {
				if (content) {
					s.print("  > " + stl.rootSrc);
					currentPackage.push(getContent(content, opts.funcParam));
				}
			} else {
				s.print("  Ignoring " + stl.rootSrc);
			}
		});

		var output = currentPackage.join(";\n");

		//Compress script
		if (opts.compressJS === true) {
			output = s.build.builders.scripts.min(output);
		}

		s.print("--> " + out);
		new s.File(out).save(output);

		return {
			name: out,
			dependencies: currentPackage
		};
	});

	var getContent = function(content, param) {
		if (content.indexOf('steal') !== -1) {
			var unwrappedContent = getFunction(content);
			if (unwrappedContent) {
				content =  "(" + clean(unwrappedContent) + ")(" + param + ")";
			} else {
				content = "";
			}
		}
		return content;
	};

	var getFunction = function(content, ith){
		var p = s.parse(content),
			token,
			funcs = [];

		var fpush = function(func){
			funcs.push(func);
		};

		while (!!(token = p.moveNext())) {
			//print(token.value)
			if (token.type !== "string") {
				if (token.value === "steal") {
					stealPull(p, content, fpush);
				}
			}
		}
		return funcs[ith || 0];

	};
	//gets a function from steal
	var stealPull = function(p, content, cb){
		var token = p.next(), startToken, endToken;
		if (!token || (token.value !== "." && token.value !== "(")) {
			// we said steal .. but we don't care
			return;
		}
		else {
			p.moveNext();
		}
		if (token.value === ".") {
			p.until("(");
		}
		var tokens = p.until("function", ")");
		if (tokens && tokens[0].value === "function") {

			token = tokens[0];

			startToken = p.until("{")[0];

			endToken = p.partner("{");
			cb(content.substring(token.from, endToken.to));
			//print("CONTENT\n"+  );
			p.moveNext();
		}
		else {

		}
		stealPull(p, content, cb);

	};


	var clean = function( text, file ) {
		var stealDevTest = /steal\.dev/;
		var parsedTxt = String(java.lang.String(text)
			.replaceAll("(?s)\/\/!steal-remove-start(.*?)\/\/!steal-remove-end", ""));

		// the next part is slow, try to skip if possible
		// if theres not a standalone steal.dev, skip

		if(! stealDevTest.test(parsedTxt) ) {
			return parsedTxt;
		}

		var positions = [],
			p,
			tokens,
			i,
			position;

		try{
			p = s.parse(parsedTxt);
		} catch(e){
			print("Parsing problem");
			print(e);
			return parsedTxt;
		}

		while (!!(tokens = p.until(["steal", ".", "dev", ".", "log", "("], ["steal", ".", "dev", ".", "warn", "("]))) {
			var end = p.partner("(");
			positions.push({
				start: tokens[0].from,
				end: end.to
			});
		}
		// go through in reverse order
		for (i = positions.length - 1; i >= 0; i--) {
			position = positions[i];
			parsedTxt = parsedTxt.substring(0, position.start) + parsedTxt.substring(position.end);
		}
		return parsedTxt;
	};
}).then(
	'./jsmin.js'
);