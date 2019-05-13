if (typeof process !== "undefined"){
    // nodejs
    fetch = require('node-fetch')
}

(async ()=>{
    const data = await fetch('http://localhost:5000/', {
        method: "POST",
        body : JSON.stringify({a:"a"})
    })
    const json_dat = await data.json()
    console.log(json_dat)
})()
