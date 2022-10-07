# Lockstep
Demo of lockstep networked multi-user simulation.

## Using the app

In this demo, multiple users can (from their web browsers) open a url to wherever the index.html is located. This will open a simple Javascript demo where the user can click on the box in the center of the browser window to add balls with random velocities which will bounce around the box (this is the "simulation"). If other users are currently using the app, each will see a colored mouse pointer for the other users and the state of the simulation (the balls bouncing around) will be kept in "lockstep" between them.

## how it works
As the number of objects in a multi-user networked simulation increases, network latency, bandwidth, and cost may make it impractical to use a primary server on which clients send their inputs to a server on which the simulation is run and the new state of the system is communicated to all the clients at each time step. To solve this problem, an alternative "lockstep" approach can be taken which runs the clients relay their inputs to one another via a server, and the simulation in parallel on each client. Getting this to work involves ensuring that all clients synchronize the action and ordering of simulation inputs, such as user inputs and the entry and removal of clients. To ensure client states are synchronized, a hash of the state of the simulation can be shared and verified periodically.

To keep the simulation running at a high frame rate, a number of simulation steps are carried out between each input syncing step. This ratio is currently fixed to a number which is reasonable for current typical use cases, but would ideally be dynamically optimized for the limitations of the current users.

## Development & how to develop and run locally

This demo project was written using the VSCode IDE and has launch scripts (the the .vscode folder)
that make developing/debugging it in VSCode convenient. 

To use it, you need:
- to run webserver to serve the files for the web client
- to run a node.js server to host the WebSockets server
- to open a web browser with the URL to the webserver page for the client

### Running a web server locally

Open a terminal, move to the project folder and run:

    node local-web-server/main.js

### Running the node websockets server locally

Open a terminal, move to the project folder and run:

    node server/main.js

Or to run in the VSCode debugger:

-  click the "Run & Debug" button 
    (it's on the left side of the VSCode window with a arrow+bug icon)
- select the "node: websocket server" from the "RUN AND DEBUG" pull down menu on the top
    left of the window
- click the run button (the right arrow icon button to the left of the pull down menu)
- select the "DEBUG CONSOLE" tab in the debugger pane, to see the output

### launching the client to use the local server

Open a web browser to the URL:

    https://localhost:9000/index.html

Or to run in the client in the VSCode debugger:

-  click the "Run & Debug" button 
    (it's on the left side of the VSCode window with a arrow+bug icon)
- select the "chrome: open client page" from the "RUN AND DEBUG" pull down menu on the top
    left of the window
- click the run button (the right arrow icon button to the left of the pull down menu)
- select the "DEBUG CONSOLE" tab in the debugger pane, to see the output

### Notes on VSCode

I've found it difficult to debug both the client and server in VSCode at the same time, 
so I usually only debug one at a time and run the other externally 
(the client in a browser, or the server from a terminal). 

