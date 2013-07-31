steal(
	'steal/build'
).then(
	'steal/build/stealLess/scripts.js',
	'steal/build/stealLess/styles.js'
).then( function(s){
	'use strict';
	s.build.stealLess = function(plugin, opts){

		opts.path = opts.path || '';
		opts.fileName = opts.fileName || 'production';
		opts.resources = opts.resources || "resources";

		if (opts.path) {
			new steal.File( opts.path ).mkdir();
		}

		s.print( "stealLess: Building to " + opts.path + opts.fileName);

		var opener = s.build.open('steal/rhino/blank.html', {
				startFile: plugin
		}, function(opener){
			s.print( "stealLess: Launching compilers for " + plugin);
			//build scripts
			s.build.builders.scripts(opener, opts);
			//build styles
			s.build.builders.styles(opener, opts);

		}, true);
	};
});