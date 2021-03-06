declare var io: any;
declare var Nanobar: any;

document.addEventListener("DOMContentLoaded", fn, false);

import Uppy = require("@uppy/core");
import Dashboard = require("@uppy/dashboard");
import Tus = require("@uppy/tus");

function fn() {
  const uppy = Uppy<Uppy.StrictTypes>({
    restrictions: {
      allowedFileTypes: ["image/*"],
    },
    onBeforeUpload(files) {
      const updatedFiles: {
        [key: string]: Uppy.UppyFile<{}, {}>;
      } = {};
      Object.keys(files).forEach((fileID) => {
        updatedFiles[fileID] = {
          ...files[fileID],
        };
        const meta = prepareNanoBar();
        for (const key in meta) {
          updatedFiles[fileID].meta[key] = meta[key];
        }
      });
      return updatedFiles;
    },
    debug: true,
  });

  window["uppy"] = uppy;
  console.log("Uppy loaded");

  uppy
    .use(Dashboard, {
      inline: true,
      fileManagerSelectionType: "both",
      target: ".upload-box",
      proudlyDisplayPoweredByUppy: true,
      showLinkToFileUploadResult: true,
      showProgressDetails: true,
    })
    .use(Tus, {
      endpoint: "/tus_upload",
      limit: 10,
    });

  const prepareNanoBar = () => {
    var progressID = generateID("progress");

    var nanobar = new Nanobar({
      bg: "#44f",
      target: document.getElementById(progressID),
    });

    nanobars[progressID] = nanobar;
    return {
      progressID,
      userID,
    };
  };

  var gIdCounter = 0;
  var userID: string;
  var nanobars = {};
  function generateID(baseStr: string) {
    var id = baseStr + gIdCounter++;
    var progress = document.createElement("div");
    progress.id = id;
    document.querySelector("#progress").appendChild(progress);
    return id;
  }

  type Data = {
    elementid: string;
    status: string;
    userid: string;
    current: number;
    total: number;
    filename: string;
  };

  function updateProgress(data: Data) {
    let percent = (data.current * 100) / data.total;
    nanobars[data.elementid].go(percent);
    console.log(data, "updateprogess");
    if (data.status == "DONE") {
      const el = document.getElementById(data.elementid);
      const par = el.parentElement;
      const d = document.createElement("a");
      d.href = `/view/${data.filename}`;
      d.text = "open image";
      par.appendChild(d);
    }
  }

  // Setup socketio functions
  var namespace = "/events"; // change to an empty string to use the global namespace

  // the socket.io documentation recommends sending an explicit package upon connection
  // this is specially important when using the global namespace
  var socket = io.connect(
    "http://" + document.domain + ":" + location.port + namespace
  );
  socket.on("connect", function () {
    socket.emit("status", { status: "I'm connected!" });
  });

  // event handler for userid.  On initial connection, the server
  // sends back a unique userid
  socket.on("userid", function (msg) {
    userID = msg.userid;
  });

  // event handler for server sent update status
  // the data is displayed in the "Received" section of the page
  socket.on("updatestatus", updateProgress);

  // event handler for server sent general status
  // the data is displayed in the "Received" section of the page
  socket.on("status", function (msg) {
    // $('#status').text(msg.status);
    console.log(msg, "status");
  });

  socket.on("disconnect", function (da) {
    // $('#status').text('Lost server connection')
    console.log(da, "dead server");
  });
}
