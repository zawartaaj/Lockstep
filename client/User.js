"use strict";

/*
    
    User

*/

(class User extends Base {
    initPrototype () {
        this.newSlot("world", null)
        this.newSlot("client", null)
        this.newSlot("userPointer", null)
        this.newSlot("actions", null)
        this.newSlot("actionGroup", null)
    }

    id () {
        return this.client() ? this.client().distantObjectForProxy().remoteId() : null
    }

    init () {
        super.init()
        this.setActions([])
        this.setUserPointer(UserPointer.clone().setDelegate(this).setUser(this))
    }

    getName () {
        /*
        const hashName = window.location.hash
        if (hashName) {
            return hashName
        }
        */

        const clientIdName = this.id().split("_")[1].substring(0, 3)
        return clientIdName
    }

    setClient (aClient) {
        this._client = aClient

        this.userPointer().view().setName(this.getName())
        return this
    }

    shortDescription () {
        return this.type() + "_" + this.id()
    }

    addAction (anAction) {
        this.actions().push(anAction)
        return this
    }

    prepareActionGroup () {
        const hash = this.world().currentSimHash()
        const ag = ActionGroup.clone()
        ag.setClientId(this.id())
        ag.setSyncTick(this.world().syncTick())
        ag.setCurrentSimHash(hash)
        ag.setActions(this.actions())
        this.setActionGroup(ag)
        this.setActions([])
        return this
    }

    sendActionGroup () {
        const ag = this.actionGroup()
        //console.log("sending action group with simHash:" + hash + " syncTick:" + this.world().syncTick())
        const rm = RemoteMessage.creationProxy().addActionGroup(ag)
        this.world().channel().asyncRelayMessageFrom(rm, this.client()) //.ignoreResponse()
    }

    hasActionGroup () {
        return this.actionGroup() !== null
    }

    applyActionGroup () {
        const ag = this.actionGroup()
        const hash = this.world().currentSimHash()

        if (!this.world().isRunning()) {
            return
        }

        if (this.world().syncTick() !== ag.syncTick()) {
            console.warn("syncTicks don't match " + this.world().syncTick() + " !== " + ag.syncTick())
            debugger;
            throw new Error("syncTicks don't match")
            return
        }

        if (hash === null) {
            debugger;
            console.warn("simHash is null")
            throw new Error("simHash is null")
            return
        }

        if (hash !== ag.currentSimHash()) {
            console.warn("simHashs don't match local " + hash + " !== other " + ag.currentSimHash())
            throw new Error("simHashs don't match")
            return
        }

        const actions = ag.actions()
        actions.forEach(rm => rm.sendTo(this))
        this.setActionGroup(null)
    }

    // --- mouse down ---

    onMouseDown (event) {
        const thing = Thing.clone()
        thing.setPosition(this.userPointer().position())
        thing.pickVelocity()
        const rm = RemoteMessage.creationProxy().addThingString(JSON.stringify(thing.asJson()))
        this.addAction(rm)
        event.stopPropagation()
    }

    onRemoteMessage_addThingString (s) {
        const json = JSON.parse(s)
        const aThing = Thing.clone().fromJson(json)
        this.world().addThing(aThing)
    }

    // --- mouse move ---

    onMouseMove (event) {

    }

    timeStep () {
        this.userPointer().timeStep()
    }

    onSyncTick () {
        this.userPointer().onSyncTick()
    }

    sharePosition () {
        this.userPointer().sharePosition()
    }

    willDestroy () {
        this.userPointer().willDestroy()
    }

}.initThisClass());

