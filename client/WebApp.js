"use strict";

(class WebApp extends Base {
    initPrototype () {
        this.newSlot("simulation", null)
    }

    start () {
        this.setSimulation(Simulation.clone())
        this.simulation().setApp(this).run()
    }

    static launch () {
        getGlobalThis().app = WebApp.clone()
        app.start()
    }
    
}.initThisClass());
