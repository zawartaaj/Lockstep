"use strict";

/*


*/

(class Simulation extends Base {
    initPrototype () {
        this.newSlot("app", null)
        this.newSlot("isRunning", false)

        // sim tick
        this.newSlot("simTimeout", 0)
        this.newSlot("simTick", 0)
        this.newSlot("syncTick", 0)
        this.newSlot("simTicksPerSyncTick", 30)
        this.newSlot("fps", 60) // desired frames per second


        // things 
        this.newSlot("things", null)
        this.newSlot("thingsToAdd", null)
        this.newSlot("thingsToRemove", null)

        // ui
        this.newSlot("size", null)
        this.newSlot("element", null)
        this.newSlot("statusElement", null)

        // connection
        this.newSlot("connection", null)
        this.newSlot("relayClient", null)
        this.newSlot("channel", null)
        //this.newSlot("clientsSet", null)

        // sim hash
        this.newSlot("currentSimHash", null)

        this.newSlot("rng", null) // RandomNumberGenerator

        // users
        this.newSlot("localUser", null) // User
        this.newSlot("users", null) // Array
        this.newSlot("usersToAdd", null) // Array
        //this.newSlot("usersToRemove", []) // Array
        this.newSlot("usersTimeout", null)  // timeout id
        this.newSlot("isWaitingForUserActions", false) // Boolean

        this.newSlot("stateRequestQueue", null) // Array of user ids
    }

    init () {
        super.init()

        this.setIsDebugging(true)
        // things
        this.setThings([]) // use an array to keep order the same across clients - not sure if this is necessary as Set may have consistent ordering
        this.setThingsToAdd([])
        this.setThingsToRemove([])

        // ui
        this.setSize(Vector.clone().setX(500).setY(500))
        this.setupView()

        this.setRng(RandomNumberGenerator.clone())

        // users
        this.setLocalUser(User.clone().setWorld(this))
        this.setUsers([])
        this.setUsersToAdd([])
        //this.setUsersToRemove([])
        this.addUser(this.localUser())
        this.localUser().userPointer().setElement(this.element()).startListening()
        this.setStateRequestQueue([])
    }

    addUser (aUser) {
        this.users().push(aUser)
        this.sortUsers()
        return this
    }

    sortUsers () {
        // is the "en" setting sufficient to make sure all locales do the same thing?
        this.users().sort((a, b) => a.id().localeCompare(b.id(), "en")) 
    }

    processAddQueue () {
        // add queue
        this.thingsToAdd().forEach(thing => this.addThing(thing))
        this.setThingsQueuedToAdd([])
    }

    processRemoveQueue () {
        // remove queue
        this.thingsToRemove().forEach(thing => thing.willDestroy())
        this.thingsToRemove().forEach(thing => this.things().remove(thing))
        this.thingsToRemove().clear()
    }

    destroyThing (thing) {
        if (this.thingsToRemove().indexOf(thing) === -1) {
            this.thingsToRemove().push(thing)
        }
        return this
    }

    setThings (things) {
        if (this._things) {
            this._things.forEach(thing => thing.willDestroy())
            things.forEach(thing => thing.setWorld(this))
        }
        this._things = things
        return this
    }

    updateCurrentSimHash () {
        this.setCurrentSimHash(this.things().simHash())
        return this
    }

    // --- run ---

    run () {
        this.connect()
    }

    pause () {
        if (this.isRunning()) {
            this.setIsRunning(false)
            this.cancelSimTimeout()
            this.appendStatus("paused")
        }
        return this
    }

    resume () {
        if (!this.isRunning()) {
            this.setIsRunning(true)
            this.appendStatus("running")
            this.timeStep()
        }
        return this
    }

    startSim () {
        this.resume()
    }

    stopSim () {
        this.appendStatus("stopped")
        this.setIsRunning(false)
    }

    // --- connect to server ---

    connect () {
        const conn = DOConnection.clone();
        conn.setRootObject(this)
        this.setConnection(conn)
        conn.setServerHost(window.location.hostname)
        //conn.setServerHost("z7762064.eero.online")
        conn.setServerPort(443)
        this.appendStatus("connecting...")
        conn.connectToServer()
        return this
    }

    // --- connection delgate methods ---

    onDOConnectionDidOpen (conn) {
        this.appendStatus("connection opened")
        this.getClientRelay()
    }

    onDOConnectionDidClose (conn) {
        this.setStatus("connection closed")
    }

    // --- get RelayClient ---

    getClientRelay () {
        this.appendStatus("getting relayClient")
        this.connection().proxy().self().setResponseTarget(this)
    }

    onComplete_self (future) {
        this.appendStatus("got relayClient")
        const client = future.result()
        this.localUser().setClient(client)
        this.setRelayClient(client)
        this.subscribeToChannel()
    }

    onError_self (future) {
        this.setStatus("error getting relayClient")
    }

    onTimeout_self (future) {
        this.setStatus("timeout getting relayClient")
    }

    // --- subscribeToChannel ---

    subscribeToChannel () {
        this.appendStatus("subscribing to channel")
        this.connection().proxy().addSubscription("test channel").setResponseTarget(this)
    }

    onComplete_addSubscription (future) {
        this.appendStatus("got channel")
        this.setChannel(future.result())
        this.getChannelClientsSet()
    }

    onError_addSubscription (future) {
        this.setStatus("remote error connecting to channel: " + future.error())
    }

    // --- getChannelClients --

    getChannelClientsSet () {
        this.channel().clientsSet().setResponseTarget(this)
    }

    onComplete_clientsSet (future) {
        const clientsSet = future.result()
        this.appendStatus("got clientsSet (" + clientsSet.size + " users)")
        clientsSet.forEach(client => this.addUserForClient(client))
        if (clientsSet.size === 1) {
            this.startSim()
        } else {
            this.requestStateFromNewUsers()
            // wait for setState
        }
    }

    onError_clientsSet (future) {
        this.setStatus("onError_clientsSet " + future.error())
    }

    onTimeout_clientsSet (future) {
        this.setStatus("onTimeout_clientsSet")
    }

    // --- tracking channel clients ---

    onRemoteMessage_onChannelDidAddClient(aClient) {
        this.addUserForClient(aClient)
    }

    addUserForClient (aClient) {
        const id = aClient.distantObjectForProxy().remoteId()
        const existingUser = this.userForId(id)
        console.log(" addUserForClient(" + id + ")")

        if (!existingUser) {
            const user = User.clone()
            user.setClient(aClient)
            user.setWorld(this)
            user.userPointer().setElement(this.element())
            this.usersToAdd().push(user)
            this.localUser().userPointer().sharePosition()          
        }
    }

    onRemoteMessage_onChannelDidRemoveClient (aClient) {
        //debugger;
        const id = aClient.distantObjectForProxy().remoteId()
        const user = this.userForId(id)
        console.log("removing client " + id)
        if (user) {
            console.log("removing user " + user.id())
            this.usersToAdd().remove(user)
            user.willDestroy()
            this.users().remove(user)
            this.completeSyncTickIfReady()
        }
    }

    processUserChanges () {
        this.usersToAdd().forEach(user => this.addUser(user))
        this.usersToAdd().clear()
    }

    // --- state ---

    getStateString () {
        const aString = this.connection().serializedValue(this.things())
        return aString
    }

    setStateString (aString) {
        const things = this.connection().unserializedValue(aString)
        this.setThings(things)
        return this
    }

    // --- syncing state ---

    requestStateFromNewUsers () {
        console.log(this.localUser().id() + " requestStateFromNewUsers()")
        const otherUser = this.usersToAdd().first()
        const aClient = otherUser.client()
        this.requestStateFromClient(aClient)
    }

    requestStateFromClient (aClient) {
        console.log(this.localUser().id() + " requestStateFromClient(" + aClient.distantObjectForProxy().remoteId() + ")")
        const rm = RemoteMessage.creationProxy().requestStateFor(this.localUser().id())
        aClient.asyncReceiveMessage(rm).ignoreResponse()
        this.users().forEach(user => user.sharePosition()) // TODO: only send to new client 
    }

    onRemoteMessage_requestStateFor (id) {
        console.log(this.localUser().id() + " onRemoteMessage_requestSendStateToClientId(" + id + ")")
        this.stateRequestQueue().push(id)
    }

    processStateRequestQueue () {
        const q = this.stateRequestQueue()
        while (q.length) {
            const id = q.pop()
            this.sendStateToClientId(id)
        }
    }

    sendStateToClientId (id) {
        console.log(" sendStateToClient(" + id + ") on syncTick:" + this.syncTick() + " simTick:" + this.simTick())
        const user = this.userForId(id)
        if (user) {
            const client = user.client()
            const rm = RemoteMessage.creationProxy().setThingsAtSyncTick(this.getStateString(), this.syncTick(), this.simTick())
            client.asyncReceiveMessage(rm).ignoreResponse()
        } else {
            console.log("user '" + id + "' removed before accepting response to state request")
        }
    }

    onRemoteMessage_setThingsAtSyncTick (serializedThings, syncTick, newSimTick) {
        this.setStateString(serializedThings)
        //syncTick = syncTick+1
        this.setSimTick(syncTick * this.simTicksPerSyncTick())
        this.setSyncTick(syncTick)
        console.log(this.localUser().shortDescription() + " onRemoteMessage_setThingsAtSyncTick(<things>, " + syncTick + ") simTick:", this.simTick())

        assert(!this.isRunning())
        //debugger;
        this.setIsRunning(true)
        this.processUserChanges()
        this.onSyncTick()
    }

    onRemoteMessage_updateUserPointer (userId, x, y) {
        const user = this.userForId(userId)
        //console.log("onRemoteMessage_updateUserPointer " + userId + " " + x + " " + y)

        if (user) {
            user.userPointer().setPosition(Vector.clone().setX(x).setY(y))
        } else {
            console.log("no user found for onRemoteMessage_updateUserPointer " + userId)
        }
    }

    // --- view ---------------------------------

    setupView () {
        this.setupBody()
        this.setupElement()
        this.setupStatusElement()
    }

    setupBody () {
        const s = document.body.style
        s.display = "flex";
        s.alignItems = "center";
        s.justifyContent = "center";
        s.backgroundColor = "#ccc";
        s.userSelect = "none";
        //s.cursor = "none";
    }
    
    setupElement () {
        const e = document.createElement('div');
        const s = e.style
        s.border = "1px solid #888"
        s.position = "absolute"
        s.backgroundColor = "#222"
        s.margin = "3px"
        s.padding = "3px"
        s.width = this.size().x() + "px"
        s.height = this.size().y() + "px"
        s.overflow = "visible";
        s.fontFamily = "monospace";
        s.fontSize = "1em";
        s.userSelect = "none";
        s.cursor = "none";

        this.setElement(e)
        document.body.appendChild(e)
    }

    // --- status ---

    setupStatusElement () {
        const e = document.createElement('div');
        const s = e.style
        s.position = "fixed"
        //s.backgroundColor = "#ccc"
        s.color = "#aaa"
        s.margin = "3px"
        s.padding = "3px"
        s.width = "100%"
        s.height = "1em"
        s.overflow = "visible";
        s.fontFamily = "monospace";
        s.fontSize = "1em";
        s.textAlign = "center"
        s.userSelect = "none";
        this.setStatusElement(e)
        document.body.appendChild(e)
    }

    setStatus (s) {
        console.log("STATUS: " + s)
        this.statusElement().innerText = s
        //console.log("status: ", s)
        return this
    }

    appendStatus (s) {
        console.log("STATUS:: " + s)
        //this.statusElement().innerHTML = this.statusElement().innerHTML + "<br>" + s
        return this
    }

    // --- things ---

    addThing (aThing) { 
        aThing.setWorld(this)
        this.things().push(aThing)
        return aThing
    }

    // --- time steps ---

    timeStep () {
        //console.log("simTick: " + this.simTick() + " syncTick:" + this.syncTick())
        this.processRemoveQueue()
        this.localUser().timeStep()
        this.things().forEach(thing => thing.timeStep())
        const newSyncTick = Math.floor(this.simTick() / this.simTicksPerSyncTick())
        if (newSyncTick !== this.syncTick()) {
            this.setSyncTick(newSyncTick)
            this.onSyncTick()
        } else {
            this.nextTimeStep()
        }
    }

    nextTimeStep () {
        if (this.isRunning()) {
            this.setSimTick(this.simTick() + 1)
            this.startSimTimeout()
        }
    }

    startSimTimeout () {
        if (!this.simTimeout()) {
            const to = setTimeout(() => {
                this.setSimTimeout(null)
                this.timeStep()
            }, 1000/this.fps())
            this.setSimTimeout(to)
        }
    }

    cancelSimTimeout () {
        if (this.simTimeout()) {
            cancelTimeout(this.simTimeout())
            this.setSimTimeout(null)
        }
    }


    // --- user actions ---

    userForId (id) {
        let matches = this.users().filter(user => user.id() === id)
        if (matches.length) {
            return matches[0]
        }
        matches = this.usersToAdd().filter(user => user.id() === id)
        return matches[0]
    }


    onRemoteMessage_addActionGroup (ag) {
        assert(typeof(ag) !== "string")

        const user = this.userForId(ag.clientId())
        if (user) {
            //console.log("got action group for user " + user.id())
            user.setActionGroup(ag)
        } else {
            console.log("got action group for missing user")
            debugger;
        }
        this.completeSyncTickIfReady()
    } 

    /*

        Every so many simTicks, we pause to do a "syncTick".
        This involves:
        
        - calc the current state hash
        - send state to any users who have requested it (since last simTick)
        - send other active users our actions (since last simTick)
        - wait to get actions from all other users before proceeding

        Once all actions are received, or users we were still waiting on leave:
        - apply all user actions locally
        - processes new user queue

        PROBLEMS:

        - lockup situation: new client requests state but existing client never sends it
        -- existing client is past processStateRequestQueue and waiting for user actions
        --- fix by sending state during wait for users
        ----- now we see non matching syncTick
    */

    onSyncTick () {
        this.setIsWaitingForUserActions(true)
        this.updateCurrentSimHash()
        this.processStateRequestQueue()
        this.processUserChanges()
        this.localUser().onSyncTick()
        this.localUser().prepareActionGroup().sendActionGroup()
        this.startUsersTimeout()
        this.completeSyncTickIfReady()
    }

    completeSyncTickIfReady () {
        if (this.isWaitingForUserActions() && this.hasAllUserActions()) {
            this.clearUsersTimeout()
            this.setIsWaitingForUserActions(false)
            this.applyUserActions()
            this.processUserChanges()
            this.nextTimeStep()
        }
    }

    // --- users timeout --- 

    startUsersTimeout () {
        assert(!this.usersTimeout())
        this.setUsersTimeout(setTimeout(() => {
            this.setUsersTimeout(null)
            this.onUsersTimeout()
        }, 1000))
    }

    clearUsersTimeout () {
        if (this.usersTimeout()) {
            clearTimeout(this.usersTimeout())
            this.setUsersTimeout(null)
        }
    }

    usersStillWaiting () {
        return this.users().filter(user => !user.hasActionGroup())
    }

    onUsersTimeout () {
        console.log("EXCEPTION: onUsersTimeout: syncTick:" + this.syncTick() + " still waiting on users: ", this.usersStillWaiting().map(user => user.id()))
        //throw new Error("onUsersTimeout")
        console.log("will wait for user actions or disconnect")
    }

    // ---

    hasAllUserActions () {
        return this.usersStillWaiting().length === 0
    }

    applyUserActions () {
        this.users().forEach(user => {
            user.applyActionGroup()
        })
    }

    // --- hash ---

    showHash () {
        console.log(this.localUser().id() + " syncTick:" +  this.syncTick() + " hash:" + this.currentSimHash() + " users:" + this.users().length)
    }

}.initThisClass());



