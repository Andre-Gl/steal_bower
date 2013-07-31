steal(function ( steal ) {
	'use strict';
	/**
	* Builds and compresses CSS files.
	* @param {Object} opener a steal opener that can give the final version of scripts
	* @param {Object} options options configuring the css building
	*
	*   - __to__ where the css should be built.
	*/
	var _filesBuffer = {};

	var styles = ( steal.build.builders.styles = function( opener, opts ) {
		steal.print( "\nBUILDING STYLES --------------- " );
		//where we are putting stuff
		var out = opts.path + opts.fileName + ".css";

		//where the page is
		var folder = opts.path;
		var pageFolder = steal.File( opener.url ).dir();
		var scriptsConverted = [];
		var currentPackage = [];
		var resFolder = '/' + (opts.resources || "resources");

		//create the destination folder for resources
		new steal.File( folder + resFolder ).mkdir();

		opener.each( "css", function( link, text, i ) {
			steal.print( link.src );
			scriptsConverted.push( link.rootSrc );

			var loc = steal.File( pageFolder ).join( link.src );
			var converted = convert( text, loc, folder, resFolder, link );

			currentPackage.push(converted);
		});

		steal.print( "" );

		if (currentPackage.length) {
			var raw_css = currentPackage.join( "\n" );

			//Compress styles
			if (opts.compressCSS === true) {
				raw_css = steal.build.builders.styles.min(raw_css);
			}

			steal.print( "--> " + out );
			steal.File(out).save(raw_css);
		} else {
			steal.print( "no styles\n" );
		}

		return {
			name: out,
			dependencies: scriptsConverted
		};
	});

	//used to convert css referencs in one file so they will make sense from prodLocation
	var convert = function (css, cssLocation, prodLocation, resFolder, link) {
		//how do we go from prod to css
		var lessPath = 'seal/less';
		var cssLoc = new steal.File(cssLocation).dir(),
			newCSss = css.replace(/url\(['"]?([^'"\)]*)['"]?\)/g, function (whole, part) {

				//check if url is relative
				if (!isRelative(part) || isBinaryImage(part)) {
					return whole;
				}

				if (isSpriteRef(part)) {
					var parts = part.split("/");
					var basename = parts[parts.length - 1];
					fDest = steal.File(prodLocation + resFolder + '/' + basename);

					return "url(" + fDest.toReferenceFromSameDomain(prodLocation) + ")";
				}


				var path = getPath(part);
				var file, fin;

				if (link.type !== 'less') {
					file = steal.File(steal.File(path.file).joinFrom(cssLoc));
					fin = _filesBuffer[file.path];
				} else {
					file = steal.File(steal.File(path.file).joinFrom(lessPath));
					fin = _filesBuffer[file.path];
				}

				if (!fin) {
					if (file.exists()) {
						//the resource doesn't exist
						var fDest, i = 0, has = false;
						do {
							fDest = steal.File(prodLocation + resFolder + '/' + (i === 0 ? '' : i + '_') + file.basename()); i++;
						}
						while (fDest.exists());
						file.copyTo(fDest.path);
						fin = _filesBuffer[file.path] = fDest.toReferenceFromSameDomain(prodLocation);
					} else {
						fin = resFolder + '/blank.gif';
						steal.print("File '" + file.path + "' is not found");
					}
				}

				fin += path.hash;

				steal.print("  " + part + " > " + fin);
				return "url(" + fin + ")";
			});
		return newCSss;
	},
	getPath = function (path) {
		path = path || '';

		var sep = ['?', '#'];
		var pos = path.length;

		for (var i = 0; i < sep.length; i++) {
			var p = path.indexOf(sep[i]);
			if (p !== -1 && p < pos) {
				pos = p;
			}
		}

		return {
			'file': path.substr(0, pos),
			'hash': (pos !== path.length ? path.substr(pos) : '')
		};
	},
	isRelative = function (part) {
		// http://, https://, /
		return !/^(http:\/\/|https:\/\/|\/)/.test(part);
	},
	isBinaryImage = function (part) {
		return part.indexOf('base64') !== -1 || part.indexOf('data:') !== -1;
	},
	isSpriteRef = function (part) {
		return part.indexOf('sprites') !== -1;
	};
}).then(
	'./cssmin.js'
);