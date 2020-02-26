'use strict';
var path = require('path');
var fs = require('fs');
var supportsColor = require('supports-color');

var fallback = `
     _______       
    /       \\       
    |        |        
 ___|________|___     
(________________)    
  \\ ,,,    ,,, /     
   (   )/\\(   )      
    ’’’    ‘’’        
`;

module.exports = supportsColor && process.platform !== 'win32' ?
	fs.readFileSync(path.join(__dirname, 'whodunit.txt'), 'utf8') : fallback;
