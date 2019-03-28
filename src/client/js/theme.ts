fetch('http://localhost:5000/infile.jpg', {
    method : "GET",
        headers: {
            "Content-Type": "application/json",
        },
    body : JSON.stringify({})
})
.then(s=>s.json())
.then(a=>{
   console.log(a);
});
