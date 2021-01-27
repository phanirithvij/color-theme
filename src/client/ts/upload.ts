
declare var io: any;
declare var Nanobar: any;

document.addEventListener('DOMContentLoaded', fn, false);
function fn() {

  var filename = "";
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
    filename = files[0].name;
    var progressid = generateID('progress')
    formData.append('elementid', progressid)


    var nanobar = new Nanobar({
      bg: '#44f',
      target: document.getElementById(progressid),
    });

    nanobars[progressid] = nanobar;

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
  var nanobars = {};
  function generateID(baseStr) {
    var id =
      (baseStr + gIdCounter++);
    var progress = document.createElement('div');
    progress.id = id;
    document.querySelector('#progress').appendChild(progress);
    return id;
  }
  type Data = {
    elementid: string;
    status: string;
    userid: string;
    current: number;
    total: number;
  }
  function updateProgress(data: Data) {
    let percent = (data.current * 100 / data.total);
    nanobars[data.elementid].go(percent);
    // var ele = $('#'+data.elementid);
    // $(ele[0].childNodes[1]).text(percent + '%');
    // $(ele[0].childNodes[2]).text(data['status']);
    console.log(data, 'updateprogess')
    if (data.status == "DONE") {
      const el = document.getElementById(data.elementid);
      const par = el.parentElement;
      const d = document.createElement('a');
      d.href = `/?img=${filename}`;
      d.text = "open image";
      par.appendChild(d);
    }
    // if ('result' in data) {
    // show result
    //  $(ele[0].childNodes[3]).text('Result: ' + data['result']);
    // }
  }

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

  // event handler for server sent update status
  // the data is displayed in the "Received" section of the page
  socket.on('updatestatus', updateProgress);

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
