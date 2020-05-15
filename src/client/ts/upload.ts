
declare var io: any

document.addEventListener('DOMContentLoaded', fn, false);
function fn() {
    const submit = document.querySelector('button')
    const input = document.querySelector('input')

    submit.onclick = () => {
        handleImageUpload()
    }


    const handleImageUpload = () => {
        const files = input.files
        const formData = new FormData()
        formData.append('file', files[0])
        formData.append('userid', userId)

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log(data)
            })
            .catch(error => {
                console.error(error)
            })
    }
    var gIdCounter = 0;
    var userId: string;
    // var nanobars = {};
    function generateID(baseStr) {
        return (baseStr + gIdCounter++);
    }
    function start_long_task() {
        // add task status elements
        var progressid = generateID('progress')
        // const div = $('<div id="' + progressid + '" class="progress"><div></div><div>0%</div><div>...</div><div>&nbsp;</div></div><hr>');
        // $('#progress').append(div);

        // create a progress bar
        // var nanobar = new Nanobar({
        //     bg: '#44f',
        //     target: div[0].childNodes[0]
        // });
        // nanobars[progressid] = nanobar;
        // send ajax POST request to start background job
        // $.ajax({
        //     type: 'POST',
        //     url: '/longtask',
        //     contentType: "application/json; charset=utf-8",
        //     dataType: "json",
        //     data: JSON.stringify({"elementid": progressid, "userid": userId}),
        //     success: function(data, status, request) {
        //     },
        //     error: function() {
        //         alert('Unexpected error');
        //     }
        // });
    }
    function update_progress(data) {
        // let percent = parseInt(data['current'] * 100 / data['total']);
        // nanobars[data.elementid].go(percent);
        // var ele = $('#'+data.elementid);
        // $(ele[0].childNodes[1]).text(percent + '%');
        // $(ele[0].childNodes[2]).text(data['status']);
        console.log(data, 'updateprogess')
        // if ('result' in data) {
        // show result
        //  $(ele[0].childNodes[3]).text('Result: ' + data['result']);
        // }
    }
    // $(function() {
    // $('#start-bg-job').click(start_long_task);
    // });

    // Setup socketio functions
    var namespace = '/events'; // change to an empty string to use the global namespace

    // the socket.io documentation recommends sending an explicit package upon connection
    // this is specially important when using the global namespace
    var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
    socket.on('connect', function () {
        socket.emit('status', { status: 'I\'m connected!' });
    });

    // event handler for userid.  On initial connection, the server
    // sends back a unique userid
    socket.on('userid', function (msg) {
        userId = msg.userid;
    });

    // event handler for server sent celery status
    // the data is displayed in the "Received" section of the page
    socket.on('celerystatus', function (msg) {
        console.log(msg, 'updateprogess')
        // update_progress(msg);
    });

    // event handler for server sent general status
    // the data is displayed in the "Received" section of the page
    socket.on('status', function (msg) {
        // $('#status').text(msg.status);
        console.log(msg, 'status')
    });

    socket.on('disconnect', function (da) {
        // $('#status').text('Lost server connection')
        console.log(da, 'dead server')
    });
};
