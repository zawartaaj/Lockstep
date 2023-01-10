"use strict";

class Boot extends Object {

  files () {
    return [
      "shared/Base/getGlobalThis.js",
      "shared/Base/Base.js",
      "shared/Base/Type.js",

      "shared/WebSockets/WebSocket-helpers.js",
      "shared/WebSockets/WsConnection.js",

      "shared/DistributedObjects/Serializable.js",
      "shared/DistributedObjects/Serializable-helpers.js",
      "shared/DistributedObjects/RemoteMessage.js",
      "shared/DistributedObjects/DOFuture.js",
      "shared/DistributedObjects/DORef.js",
      "shared/DistributedObjects/DOConnection.js",
      "shared/DistributedObjects/DistantObject.js",
      "shared/DistributedObjects/response/DOResponse.js",
      "shared/DistributedObjects/response/DOResultResponse.js",
      "shared/DistributedObjects/response/DOErrorResponse.js",

      "client/Vector.js",
      "client/Simulation.js",
      "client/SimHash-helpers.js",
      "client/Thing.js",
      "client/WebApp.js",
      "client/User.js",
      "client/UserPointer.js",
      "client/RandomNumberGenerator.js",
      "client/ActionGroup.js",
      "client/View.js",
      "client/UserPointerView.js",
      "client/BallView.js"
    ]
  }

  start () {
    this._queue = this.files().slice()
    this.loadNext()
  }

  loadNext () {
    if (this._queue.length) {
      const file = this._queue.shift()
      this.loadScript(file, () => this.loadNext())
    } else {
      this.didFinish()
    }
  }

  loadScript (url, callback) {
    //console.log("load url '" + url + "'")
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = (event) => {
      callback();
    }
    script.onload = callback;
    script.onerror = (error) => {
      console.log(error)
    }
    head.appendChild(script);
  }

  didFinish () {
    WebApp.launch();
  }
};

new Boot().start()
