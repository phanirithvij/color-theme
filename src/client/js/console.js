function styledConsoleLog(...arguments) {
    arguments = arguments.map((x) => {
        dat = x.split('\n');
        return dat.map((d)=>d.trim()).join('');
    })
    var argArray = [];

    if (arguments.length) {
        var startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi;
        var endTagRe = /<\/span>/gi;

        var reResultArray;
        argArray.push(arguments[0].replace(startTagRe, '%c').replace(endTagRe, '%c'));
        while (reResultArray = startTagRe.exec(arguments[0])) {
            argArray.push(reResultArray[2]);
            argArray.push('');
        }

        // pass through subsequent args since chrome dev tools does not (yet) support console.log styling of the following form: console.log('%cBlue!', 'color: blue;', '%cRed!', 'color: red;');
        for (var j = 1; j < arguments.length; j++) {
            argArray.push(arguments[j]);
        }
        // argArray =  argArray.map(x=>x.replace(/\n/g,''))
        // console.log(argArray)
    }

    console.log.apply(console, argArray);
}

function addPalete(selector, data){
    const div = document.querySelector(selector);
    div.innerHTML += data;
}